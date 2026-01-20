import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { submission, problem } from "@acme/db/schema";
import { eq, desc, and, ne, sql } from "drizzle-orm";

// cd-judge-api client
const JUDGE_API_URL = process.env.JUDGE_API_URL ?? "http://localhost:3001";

interface JudgeResult {
  results: Array<{
    passed: boolean;
    stdout: string;
    stderr: string;
    runtime: number; // ms
    memory: number; // KB
  }>;
  totalRuntime: number;
  passedCount: number;
  totalCount: number;
}

// Helper to call judge API
async function executeCode(
  code: string,
  lang: string,
  testCases: Array<{ input?: string; output?: string; args?: string[]; expected?: string }>
): Promise<JudgeResult> {
  // Convert test cases to the format expected by judge API
  const formattedTestCases = testCases.map(tc => {
    // For structured test cases (args/expected), convert to input/output format
    if (tc.args && tc.expected !== undefined) {
      return {
        input: tc.args.join('\n'),
        output: tc.expected
      };
    }
    // For legacy test cases (input/output)
    return {
      input: tc.input ?? '',
      output: tc.output ?? ''
    };
  });
  const response = await fetch(`${JUDGE_API_URL}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      lang,
      inputs: formattedTestCases.map((tc) => tc.input),
      expectedOutputs: formattedTestCases.map((tc) => tc.output),
    }),
  });

  if (!response.ok) {
    // Try to get error text
    const text = await response.text();
    console.error("Judge API Error:", text);
    throw new Error(`Judge API error: ${response.statusText}`);
  }

  return response.json() as Promise<JudgeResult>;
}

export const submissionRouter = createTRPCRouter({
  /**
   * Submit code for a problem
   */
  submit: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get problem with test cases
      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.problemId))
        .limit(1);

      if (!prob) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }

      // Create pending submission
      const [newSubmission] = await ctx.db
        .insert(submission)
        .values({
          userId: ctx.session.user.id,
          problemId: input.problemId,
          code: input.code,
          lang: input.lang,
          status: "running",
          testsTotal: prob.testCases.length,
          createdAt: undefined, // Let defaultNow() handle it
        })
        .returning();

      if (!newSubmission) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create submission" });
      }

      try {
        // FIX: do later
        // Execute code against test cases - in background? 
        // For simple setup, we await. Phase 2 goal is simple.

        const result = await executeCode(
          input.code,
          input.lang,
          prob.testCases
        );

        // Determine status
        const status =
          result.passedCount === result.totalCount
            ? "accepted"
            : "wrong_answer"; // Or runtime_error if any? Judge usually reports simple passed/failed. We can refine logic.
        // If any result has error, it might be runtime error. 
        // Simplified logic as per plan.

        // Prepare results (hide private test case details)
        const results = result.results.map((r, i) => {
          const tc = prob.testCases[i];
          return {
            passed: r.passed,
            runtime: r.runtime,
            // Only show input/expected for public tests
            ...(tc?.isPublic
              ? {
                input: tc.input ?? (tc.args ? tc.args.join(', ') : ''),
                expected: tc.output ?? tc.expected ?? '',
                actual: r.stdout || r.stderr, // Show stderr as actual if failed? usually stdout. 
              }
              : {}),
            error: r.stderr || undefined,
          };
        });

        // Helper to map string to enum
        let dbStatus: "accepted" | "wrong_answer" | "runtime_error" = "wrong_answer";
        if (result.passedCount === result.totalCount) dbStatus = "accepted";
        // Check if any error exists to maybe call it runtime_error?
        // Optional refinement.

        // Update submission
        const [updated] = await ctx.db
          .update(submission)
          .set({
            status: dbStatus,
            testsPassed: result.passedCount,
            runtime: result.totalRuntime, // Total valid? Or max? Usually max or sum. Schema says integer.
            results: results as any, // Cast to any or helper type if schema is strict
          })
          .where(eq(submission.id, newSubmission.id))
          .returning();

        // Award points logic (optional for basic ticket, but good to have)
        /*
        if (status === "accepted") {
             // ... logic to verify if previously accepted ...
        }
        */

        return updated;
      } catch (error) {
        // Update submission with error
        await ctx.db
          .update(submission)
          .set({
            status: "runtime_error",
            errorMessage: error instanceof Error ? error.message : "Unknown error",
          })
          .where(eq(submission.id, newSubmission.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Code execution failed",
        });
      }
    }),

  /**
   * Run code without submitting (just for testing)
   */
  run: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, input.problemId))
        .limit(1);

      if (!prob) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Only run against public test cases
      const publicTestCases = prob.testCases.filter((tc) => tc.isPublic);

      if (publicTestCases.length === 0) {
        return { results: [], passedCount: 0, totalCount: 0 };
      }

      const result = await executeCode(input.code, input.lang, publicTestCases);

      return {
        results: result.results.map((r, i) => {
          const tc = publicTestCases[i];
          return {
            passed: r.passed,
            input: tc?.input ?? (tc?.args ? tc.args.join(', ') : ''),
            expected: tc?.output ?? tc?.expected ?? '',
            actual: r.stdout,
            error: r.stderr || undefined,
            runtime: r.runtime,
          };
        }),
        passedCount: result.passedCount,
        totalCount: result.totalCount,
      };
    }),

  /**
   * List submissions for a problem
   */
  list: protectedProcedure
    .input(
      z.object({
        problemId: z.number().optional(),
        limit: z.number().min(1).max(50).default(10),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(submission.userId, ctx.session.user.id)];

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

  /**
   * Get submission by ID
   */
  byId: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const [sub] = await ctx.db
        .select()
        .from(submission)
        .where(
          and(
            eq(submission.id, input.id),
            eq(submission.userId, ctx.session.user.id)
          )
        )
        .limit(1);

      if (!sub) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return sub;
    }),
});
