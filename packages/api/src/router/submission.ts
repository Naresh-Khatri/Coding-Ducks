import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { FunctionSignature } from "@acme/db/schema";
import { problem, submission } from "@acme/db/schema";
import { enqueueSubmissionReconcile, reconcileSubmission } from "@acme/jobs";

import { env } from "../../env";
import { generateDriverWithTestCases, SUPPORTED_LANGS } from "../drivers";
import { createTRPCRouter, protectedProcedure } from "../trpc";

interface JudgeJobResponse {
  id: string;
}

// --- Judge API helpers ---

async function submitToJudge(code: string, lang: string): Promise<string> {
  const response = await fetch(`${env.JUDGE_API_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.JUDGE_API_TOKEN}`,
    },
    body: JSON.stringify({ code, lang }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Judge submission failed: ${text}`);
  }

  const data = (await response.json()) as JudgeJobResponse;
  return data.id;
}

// --- tRPC Router ---

export const submissionRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(SUPPORTED_LANGS),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.problemId))
        .limit(1);

      if (!prob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Problem not found",
        });
      }

      const signature = prob.functionSignature as FunctionSignature;
      if (!signature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Problem has no function signature configured",
        });
      }

      const driverCode = generateDriverWithTestCases(
        input.code,
        input.lang,
        signature,
        prob.testCases,
        true,
      );

      const jobId = await submitToJudge(driverCode, input.lang);

      const [newSubmission] = await ctx.db
        .insert(submission)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          code: input.code,
          lang: input.lang,
          kind: "submit",
          status: "running",
          testsTotal: prob.testCases.length,
          results: [{ jobId }] as any,
        })
        .returning();

      if (!newSubmission) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create submission",
        });
      }

      // Server-side safety net: result is persisted even if the tab closes.
      await enqueueSubmissionReconcile(newSubmission.id);

      return { id: newSubmission.id, jobId };
    }),

  run: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(SUPPORTED_LANGS),
        customArgs: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.problemId))
        .limit(1);

      if (!prob) throw new TRPCError({ code: "NOT_FOUND" });

      const publicTestCases = input.customArgs
        ? [{ args: input.customArgs, expected: undefined, isPublic: true }]
        : prob.testCases.filter((tc) => tc.isPublic);

      if (publicTestCases.length === 0) {
        return { id: 0, jobId: null, results: [] };
      }

      const signature = prob.functionSignature as FunctionSignature;
      if (!signature) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Problem has no function signature configured",
        });
      }

      const driverCode = generateDriverWithTestCases(
        input.code,
        input.lang,
        signature,
        publicTestCases,
        false,
      );

      const jobId = await submitToJudge(driverCode, input.lang);

      const [newSubmission] = await ctx.db
        .insert(submission)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          code: input.code,
          lang: input.lang,
          kind: "run",
          status: "running",
          testsTotal: publicTestCases.length,
          results: [{ jobId }] as any,
        })
        .returning();

      if (!newSubmission) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create submission",
        });
      }

      // Server-side safety net: result is persisted even if the tab closes.
      await enqueueSubmissionReconcile(newSubmission.id);

      return { id: newSubmission.id, jobId };
    }),

  getResults: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Ownership check stays here (the reconciler is session-agnostic so
      // it can be shared with the background worker).
      const [sub] = await ctx.db
        .select()
        .from(submission)
        .where(
          and(
            eq(submission.id, input.id),
            eq(submission.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!sub) throw new TRPCError({ code: "NOT_FOUND" });
      if (sub.status !== "running") return sub;

      // Single source of truth for the judge fetch + atomic finalize +
      // streak. The background reconcile worker calls the same function,
      // so a closed tab no longer orphans the row; concurrent calls race
      // safely on the conditional UPDATE.
      const reconciled = await reconcileSubmission(input.id);
      return reconciled ?? sub;
    }),

  list: protectedProcedure
    .input(
      z.object({
        problemId: z.number().optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(submission.userId, ctx.session.user.id),
        eq(submission.kind, "submit"),
      ];

      if (input.problemId) {
        conditions.push(eq(submission.problemId, input.problemId));
      }

      const submissions = await ctx.db
        .select()
        .from(submission)
        .where(and(...conditions))
        .orderBy(desc(submission.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      return submissions;
    }),

  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [sub] = await ctx.db
        .select()
        .from(submission)
        .where(
          and(
            eq(submission.id, input.id),
            eq(submission.userId, ctx.session.user.id),
          ),
        )
        .limit(1);

      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return sub;
    }),
});
