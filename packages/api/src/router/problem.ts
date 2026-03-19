import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, like, sql } from "drizzle-orm";
import { z } from "zod/v4"; // Ensure we use the same zod version as trpc.ts if needed, but usually standard import works. api/trpc.ts uses "zod/v4"? let's check imports again.

import { problem, submission } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

// trpc.ts imports "zod/v4". I should use standard "zod" or check if "zod/v4" is required.
// Actually trpc.ts had `import { z, ZodError } from "zod/v4";`
// I will reuse `z` from "zod" if it works, or "zod/v4" to be safe. "zod/v4" sounds like a specific subpath wrapper maybe?
// Let's look at `packages/api/package.json` if I could, but I'll stick to `zod` for now as it's standard.
// Wait, looking at trpc.ts content again:
// `import { z, ZodError } from "zod/v4";`
// I should probably follow that.

export const problemRouter = createTRPCRouter({
  /**
   * List problems with optional filters
   */
  list: publicProcedure
    .input(
      z
        .object({
          difficulty: z.enum(["easy", "medium", "hard"]).optional(),
          tags: z.array(z.string()).optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().default(0),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 20;
      const offset = input?.offset ?? 0;
      const { difficulty, tags, search } = input ?? {};

      const conditions = [eq(problem.isActive, true)];

      if (difficulty) {
        conditions.push(eq(problem.difficulty, difficulty));
      }

      if (search) {
        conditions.push(like(problem.title, `%${search}%`));
      }

      if (tags && tags.length > 0) {
        conditions.push(sql`${problem.tags} && ${tags}`);
      }

      // Get problems with filters
      const problems = await ctx.db
        .select({
          id: problem.id,
          slug: problem.slug,
          title: problem.title,
          difficulty: problem.difficulty,
          tags: problem.tags,
          displayOrder: problem.displayOrder,
          createdAt: problem.createdAt,
        })
        .from(problem)
        .where(and(...conditions))
        .orderBy(problem.displayOrder, problem.id)
        .limit(limit)
        .offset(offset);

      // Get total count for pagination
      const countResult = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(problem)
        .where(and(...conditions));

      const total = Number(countResult[0]?.count ?? 0);

      // If user is logged in, get their submission status for each problem
      let userStatuses: Record<number, "solved" | "attempted" | null> = {};

      if (ctx.session?.user) {
        const problemIds = problems.map((p) => p.id);

        if (problemIds.length > 0) {
          const userSubmissions = await ctx.db
            .select({
              problemId: submission.problemId,
              status: submission.status,
            })
            .from(submission)
            .where(
              and(
                eq(submission.userId, ctx.session.user.id),
                inArray(submission.problemId, problemIds),
              ),
            );

          for (const sub of userSubmissions) {
            const current = userStatuses[sub.problemId];
            if ((sub.status as string) === "accepted") {
              userStatuses[sub.problemId] = "solved";
            } else if (
              (sub.status as string) !== "accepted" &&
              current !== "solved"
            ) {
              userStatuses[sub.problemId] = "attempted";
            }
          }
        }
      }

      return {
        items: problems.map((p) => ({
          ...p,
          userStatus: userStatuses[p.id] ?? null,
        })),
        total,
        hasMore: offset + problems.length < total,
      };
    }),

  /**
   * Get problem by slug
   */
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.slug, input.slug))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Problem not found",
        });
      }

      const prob = result[0];

      // Hide private test cases
      const sanitizedTestCases = prob.testCases.map((tc) =>
        tc.isPublic
          ? tc
          : { ...tc, input: "[Hidden]", output: "[Hidden]", isPublic: false },
      );

      // Get user's best submission if logged in
      let bestSubmission = null;
      if (ctx.session?.user) {
        const subs = await ctx.db
          .select()
          .from(submission)
          .where(
            and(
              eq(submission.userId, ctx.session.user.id),
              eq(submission.problemId, prob.id),
            ),
          )
          .orderBy(
            desc(submission.status),
            desc(submission.testsPassed),
            desc(submission.createdAt),
          )
          .limit(1);

        const accepted = await ctx.db
          .select()
          .from(submission)
          .where(
            and(
              eq(submission.userId, ctx.session.user.id),
              eq(submission.problemId, prob.id),
              eq(submission.status, "accepted"),
            ),
          )
          .limit(1);

        if (accepted.length > 0) bestSubmission = accepted[0];
        else if (subs.length > 0) bestSubmission = subs[0];
      }

      return {
        ...prob,
        testCases: sanitizedTestCases,
        bestSubmission,
      };
    }),

  /**
   * Get all tags
   */
  tags: publicProcedure.query(async ({ ctx }) => {
    // Unnest tags/array and get distinct
    // Postgres specific: SELECT DISTINCT unnest(tags) FROM problem
    const result = await ctx.db.execute(
      sql`SELECT DISTINCT unnest(${problem.tags}) as tag FROM ${problem} WHERE ${problem.isActive} = true ORDER BY tag`,
    );

    // Result rows will be [{tag: "string"}]
    return result.rows.map((r: any) => ({
      name: r.tag as string,
      slug: r.tag as string,
    }));
  }),

  /**
   * Create problem (Admin only)
   */
  create: protectedProcedure
    .input(
      z.object({
        slug: z.string().min(1).max(100),
        title: z.string().min(1).max(256),
        description: z.string().min(1),
        editorial: z.string().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]),
        testCases: z.array(
          z.object({
            input: z.string().optional(),
            output: z.string().optional(),
            args: z.array(z.string()).optional(),
            expected: z.string().optional(),
            isPublic: z.boolean(),
          }),
        ),
        starterCode: z.record(z.string(), z.string()).optional(),
        functionSignature: z
          .object({
            fnName: z.string(),
            params: z.array(z.object({ name: z.string(), type: z.string() })),
            returnType: z.string(),
          })
          .optional(),
        tags: z.array(z.string()).default([]),
        displayOrder: z.number().default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check admin
      if (!(ctx.session.user as any).isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const [newProblem] = await ctx.db
        .insert(problem)
        .values({
          ...input,
          tags: input.tags as string[],
          starterCode: input.starterCode as Record<string, string> | undefined,
          functionSignature: input.functionSignature as any,
          testCases: input.testCases as any,
        })
        .returning();

      return newProblem;
    }),

  /**
   * Update problem (Admin only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        slug: z.string().min(1).max(100).optional(),
        title: z.string().min(1).max(256).optional(),
        description: z.string().min(1).optional(),
        editorial: z.string().nullable().optional(),
        difficulty: z.enum(["easy", "medium", "hard"]).optional(),
        testCases: z
          .array(
            z.object({
              input: z.string().optional(),
              output: z.string().optional(),
              args: z.array(z.string()).optional(),
              expected: z.string().optional(),
              isPublic: z.boolean(),
            }),
          )
          .optional(),
        starterCode: z.record(z.string(), z.string()).optional(),
        functionSignature: z
          .object({
            fnName: z.string(),
            params: z.array(z.object({ name: z.string(), type: z.string() })),
            returnType: z.string(),
          })
          .optional(),
        tags: z.array(z.string()).optional(),
        isActive: z.boolean().optional(),
        displayOrder: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check admin
      if (!(ctx.session.user as any).isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const { id, ...updates } = input;

      const [updated] = await ctx.db
        .update(problem)
        .set({
          ...updates,
          tags: updates.tags as string[] | undefined,
          starterCode: updates.starterCode as
            | Record<string, string>
            | undefined,
          functionSignature: updates.functionSignature as any,
        })
        .where(eq(problem.id, id))
        .returning();

      return updated;
    }),

  /**
   * Get problem by ID (Admin only - returns full data including private test cases)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Check admin
      if (!(ctx.session.user as any).isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      const result = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.id))
        .limit(1);

      if (!result[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Problem not found",
        });
      }

      return result[0];
    }),

  /**
   * Delete problem (Admin only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check admin
      if (!(ctx.session.user as any).isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Delete the problem (submissions will cascade delete due to FK constraint)
      const [deleted] = await ctx.db
        .delete(problem)
        .where(eq(problem.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Problem not found",
        });
      }

      return { success: true };
    }),

  /**
   * Duplicate problem (Admin only)
   */
  duplicate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Check admin
      if (!(ctx.session.user as any).isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin access required",
        });
      }

      // Get the original problem
      const [original] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.id))
        .limit(1);

      if (!original) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Problem not found",
        });
      }

      // Create a copy with modified slug and title
      const [duplicated] = await ctx.db
        .insert(problem)
        .values({
          slug: `${original.slug}-copy-${Date.now()}`,
          title: `${original.title} (Copy)`,
          description: original.description,
          difficulty: original.difficulty,
          tags: original.tags,
          testCases: original.testCases,
          starterCode: original.starterCode,
          displayOrder: original.displayOrder,
          isActive: false, // Start as draft
        })
        .returning();

      return duplicated;
    }),
});
