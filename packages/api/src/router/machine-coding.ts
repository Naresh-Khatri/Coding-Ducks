import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { machineCodingAttempt } from "@acme/db/schema";
import {
  assembleStarterFiles,
  getEditablePaths,
  getProblem,
  listProblemSummaries,
  listVariants,
  solutionFilesFor,
} from "@acme/machine-coding-content";

import { createRoom } from "../services/room";
import { track } from "../telemetry";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

const slugInput = z.object({ slug: z.string().min(1).max(100) });
const slugVariantInput = slugInput.extend({
  variant: z.string().min(1).max(40).optional(),
});

const difficultyFilter = z.enum(["easy", "medium", "hard"]);
const categoryFilter = z.enum(["ui-component", "js-utility"]);

/**
 * Machine-coding catalogue + attempts. Problem *content* lives in code
 * (`@acme/machine-coding-content`); only per-user attempts touch the DB. Everything is
 * keyed by problem slug so the same procedures serve anonymous local solving and
 * signed-in / upgraded interview rooms alike.
 */
export const machineCodingRouter = createTRPCRouter({
  /** Catalogue listing with in-memory filters; merges the user's attempt state. */
  listProblems: publicProcedure
    .input(
      z
        .object({
          difficulty: difficultyFilter.optional(),
          category: categoryFilter.optional(),
          search: z.string().trim().max(100).optional(),
          durationMax: z.number().int().positive().optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const f = input ?? {};
      let items = listProblemSummaries();
      if (f.difficulty) items = items.filter((p) => p.difficulty === f.difficulty);
      if (f.category) items = items.filter((p) => p.category === f.category);
      const durationMax = f.durationMax;
      if (durationMax != null) {
        items = items.filter((p) => p.durationMinutes <= durationMax);
      }
      if (f.search) {
        const q = f.search.toLowerCase();
        items = items.filter(
          (p) =>
            p.title.toLowerCase().includes(q) ||
            p.tags.some((t) => t.toLowerCase().includes(q)) ||
            p.companies.some((c) => c.toLowerCase().includes(q)),
        );
      }

      const bySlug = new Map<
        string,
        { status: string; roomId: number | null }
      >();
      if (ctx.session?.user) {
        const rows = await ctx.db
          .select({
            problemSlug: machineCodingAttempt.problemSlug,
            status: machineCodingAttempt.status,
            roomId: machineCodingAttempt.roomId,
          })
          .from(machineCodingAttempt)
          .where(eq(machineCodingAttempt.userId, ctx.session.user.id));
        for (const r of rows) {
          bySlug.set(r.problemSlug, { status: r.status, roomId: r.roomId });
        }
      }

      return {
        items: items.map((p) => {
          const a = bySlug.get(p.slug);
          return {
            ...p,
            attemptStatus: a?.status ?? null,
            roomId: a?.roomId ?? null,
          };
        }),
      };
    }),

  /** Full problem detail (no solution / tests) + the user's attempt summary. */
  problemBySlug: publicProcedure
    .input(slugInput)
    .query(async ({ ctx, input }) => {
      const p = getProblem(input.slug);
      if (!p) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }

      let attempt = null;
      if (ctx.session?.user) {
        const [row] = await ctx.db
          .select()
          .from(machineCodingAttempt)
          .where(
            and(
              eq(machineCodingAttempt.userId, ctx.session.user.id),
              eq(machineCodingAttempt.problemSlug, input.slug),
            ),
          )
          .limit(1);
        if (row) {
          attempt = {
            status: row.status,
            roomId: row.roomId,
            solutionRevealed: row.solutionRevealed,
            testsLastPassed: row.testsLastPassed,
            testsLastTotal: row.testsLastTotal,
            startedAt: row.startedAt,
            completedAt: row.completedAt,
          };
        }
      }

      return {
        problem: {
          slug: p.slug,
          title: p.title,
          difficulty: p.difficulty,
          category: p.category,
          durationMinutes: p.durationMinutes,
          tags: p.tags,
          companies: p.companies,
          description: p.description,
          variants: listVariants(p),
        },
        attempt,
      };
    }),

  /** Files to seed the local workspace: template ⊕ starter ⊕ tests ⊕ harness. */
  getStarter: publicProcedure.input(slugVariantInput).query(({ input }) => {
    const p = getProblem(input.slug);
    if (!p) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
    }
    return {
      files: assembleStarterFiles(p, input.variant),
      editablePaths: getEditablePaths(p, input.variant),
      templateId: p.templateId,
      durationMinutes: p.durationMinutes,
    };
  }),

  /**
   * Reveal the reference solution + editorial. Public so the anonymous flow
   * stays frictionless; when signed in, it stamps the user's attempt.
   */
  getSolution: publicProcedure
    .input(slugVariantInput)
    .mutation(async ({ ctx, input }) => {
      const p = getProblem(input.slug);
      if (!p) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }
      if (ctx.session?.user) {
        await ctx.db
          .insert(machineCodingAttempt)
          .values({
            userId: ctx.session.user.id,
            problemSlug: input.slug,
            status: "revealed",
            solutionRevealed: true,
          })
          .onConflictDoUpdate({
            target: [machineCodingAttempt.userId, machineCodingAttempt.problemSlug],
            set: {
              solutionRevealed: true,
              // Don't demote an already-completed attempt.
              status: sql`case when ${machineCodingAttempt.status} = 'completed' then 'completed' else 'revealed' end`,
            },
          });
      }
      return {
        solutionFiles: solutionFilesFor(p, input.variant),
        editorial: p.editorial,
      };
    }),

  /** Record that a signed-in user started practicing (history sync). */
  startAttempt: protectedProcedure
    .input(slugInput)
    .mutation(async ({ ctx, input }) => {
      const p = getProblem(input.slug);
      if (!p) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }
      await ctx.db
        .insert(machineCodingAttempt)
        .values({
          userId: ctx.session.user.id,
          problemSlug: input.slug,
          status: "in-progress",
        })
        .onConflictDoNothing({
          target: [machineCodingAttempt.userId, machineCodingAttempt.problemSlug],
        });
      return { success: true };
    }),

  /** Persist the latest test-run summary; auto-completes when all tests pass. */
  recordTestRun: protectedProcedure
    .input(
      slugInput.extend({
        passed: z.number().int().min(0),
        total: z.number().int().min(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const allPass = input.total > 0 && input.passed >= input.total;
      const now = new Date();
      await ctx.db
        .insert(machineCodingAttempt)
        .values({
          userId: ctx.session.user.id,
          problemSlug: input.slug,
          status: allPass ? "completed" : "in-progress",
          testsLastPassed: input.passed,
          testsLastTotal: input.total,
          testsRunAt: now,
          completedAt: allPass ? now : null,
        })
        .onConflictDoUpdate({
          target: [machineCodingAttempt.userId, machineCodingAttempt.problemSlug],
          set: {
            testsLastPassed: input.passed,
            testsLastTotal: input.total,
            testsRunAt: now,
            // Only ever promote to completed; never demote on a failing run.
            ...(allPass ? { status: "completed", completedAt: now } : {}),
          },
        });
      return { allPass };
    }),

  /** Manual "mark complete". */
  completeAttempt: protectedProcedure
    .input(slugInput)
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      await ctx.db
        .insert(machineCodingAttempt)
        .values({
          userId: ctx.session.user.id,
          problemSlug: input.slug,
          status: "completed",
          completedAt: now,
        })
        .onConflictDoUpdate({
          target: [machineCodingAttempt.userId, machineCodingAttempt.problemSlug],
          set: { status: "completed", completedAt: now },
        });
      return { success: true };
    }),

  /**
   * The only auth-gated step: promote a (local) attempt into a private
   * collaborative interview room. The client encodes its local Y.Doc and ships
   * it as `yjsData`, exactly like `CreateDuckletDialog`.
   */
  createInterviewRoom: protectedProcedure
    .input(slugInput.extend({ yjsData: z.string().max(5_000_000).optional() }))
    .mutation(async ({ ctx, input }) => {
      const p = getProblem(input.slug);
      if (!p) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }
      const userId = ctx.session.user.id;

      const [existing] = await ctx.db
        .select()
        .from(machineCodingAttempt)
        .where(
          and(
            eq(machineCodingAttempt.userId, userId),
            eq(machineCodingAttempt.problemSlug, input.slug),
          ),
        )
        .limit(1);

      // Already upgraded — return the existing room rather than orphaning it.
      if (existing?.roomId) {
        return { roomId: existing.roomId, isExisting: true };
      }

      const room = await createRoom(ctx.db, {
        name: `${p.title} — Interview`,
        ownerId: userId,
        isPublic: false,
        yjsData: input.yjsData ?? null,
        kind: "machine-coding",
      });
      if (!room) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      }

      await ctx.db
        .insert(machineCodingAttempt)
        .values({
          userId,
          problemSlug: input.slug,
          roomId: room.id,
          status: existing?.status ?? "in-progress",
        })
        .onConflictDoUpdate({
          target: [machineCodingAttempt.userId, machineCodingAttempt.problemSlug],
          set: { roomId: room.id },
        });

      track("machine-coding.interview_room.created", {
        roomId: room.id,
        userId,
        slug: input.slug,
      });

      return { roomId: room.id, isExisting: false };
    }),

  /** The signed-in user's attempt history (for catalogue badges / profile). */
  myAttempts: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select()
      .from(machineCodingAttempt)
      .where(eq(machineCodingAttempt.userId, ctx.session.user.id))
      .orderBy(desc(machineCodingAttempt.startedAt));
    return rows.map((r) => ({
      slug: r.problemSlug,
      status: r.status,
      roomId: r.roomId,
      solutionRevealed: r.solutionRevealed,
      testsLastPassed: r.testsLastPassed,
      testsLastTotal: r.testsLastTotal,
      startedAt: r.startedAt,
      completedAt: r.completedAt,
    }));
  }),
});
