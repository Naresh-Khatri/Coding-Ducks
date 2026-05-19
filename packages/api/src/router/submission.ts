import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { db } from "@acme/db";
import type { FunctionSignature, TestCase } from "@acme/db/schema";
import { problem, submission, userProfile } from "@acme/db/schema";

import { env } from "../../env";
import { generateDriverWithTestCases, SUPPORTED_LANGS } from "../drivers";
import { createTRPCRouter, protectedProcedure } from "../trpc";

/** Verdict codes returned by the CD Judge API */
type JudgeVerdict = "OK" | "CE" | "RE" | "SG" | "TO" | "XX";

interface JudgeJobResponse {
  id: string;
}

interface JudgeExecutionResult {
  verdict: JudgeVerdict;
  time: number;
  memory: number;
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  exitSignal?: number;
  errorType?: string;
  lineNumber?: number | null;
  cgMemory?: number;
  wallTime?: number;
  cswForced?: number;
  cswVoluntary?: number;
  cgOomKilled?: boolean;
}

interface JudgeStatusResponse {
  id: string;
  status: string;
  result: JudgeExecutionResult | null;
  submittedAt: number | null;
  processedAt: number | null;
  finishedAt: number | null;
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

async function getJobStatus(jobId: string): Promise<JudgeStatusResponse> {
  const response = await fetch(`${env.JUDGE_API_URL}/submissions/${jobId}`, {
    headers: {
      Authorization: `Bearer ${env.JUDGE_API_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch job status: ${jobId}`);
  }

  return response.json() as Promise<JudgeStatusResponse>;
}

function parseTestResults(
  stdout: string,
  stderr: string,
  testCases: TestCase[],
) {
  try {
    if (!stdout || stdout.trim() === "") {
      throw new Error("Empty stdout");
    }
    const results = JSON.parse(stdout);
    if (!Array.isArray(results)) {
      throw new Error("Invalid results format");
    }
    return results.map((r: any, i: number) => ({
      passed: r.passed || false,
      runtime: r.runtime as number | undefined,
      memory: r.memory as number | undefined,
      input:
        r.isPublic && testCases[i]
          ? testCases[i].args?.join(", ") || testCases[i].input
          : undefined,
      expected:
        r.isPublic && testCases[i]
          ? testCases[i].expected || testCases[i].output
          : undefined,
      actual: r.isPublic ? (r.actual as string | undefined) : undefined,
      error: r.error as string | undefined,
    }));
  } catch (e: any) {
    const errorMessage = stderr || e.message || "Runtime Error";
    return testCases.map(() => ({
      passed: false,
      error: errorMessage,
    }));
  }
}

/**
 * Shared tail for `submit`/`run`: validate the function signature, generate
 * driver code, dispatch to the judge, and persist a `running` submission row.
 * The two mutations only differ in which test cases they feed in and the
 * `kind` they record.
 */
async function dispatchSubmission(
  database: typeof db,
  userId: string,
  prob: typeof problem.$inferSelect,
  opts: {
    code: string;
    lang: (typeof SUPPORTED_LANGS)[number];
    kind: "run" | "submit";
    testCases: TestCase[];
    hidePrivate: boolean;
  },
): Promise<{ id: number; jobId: string }> {
  const signature = prob.functionSignature as FunctionSignature;
  if (!signature) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Problem has no function signature configured",
    });
  }

  const driverCode = generateDriverWithTestCases(
    opts.code,
    opts.lang,
    signature,
    opts.testCases,
    opts.hidePrivate,
  );

  const jobId = await submitToJudge(driverCode, opts.lang);

  const [newSubmission] = await database
    .insert(submission)
    .values({
      userId,
      problemId: prob.id,
      code: opts.code,
      lang: opts.lang,
      kind: opts.kind,
      status: "running",
      testsTotal: opts.testCases.length,
      results: [{ jobId }] as any,
    })
    .returning();

  if (!newSubmission) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create submission",
    });
  }

  return { id: newSubmission.id, jobId };
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

      return dispatchSubmission(ctx.db, ctx.session.user.id, prob, {
        code: input.code,
        lang: input.lang,
        kind: "submit",
        testCases: prob.testCases,
        hidePrivate: true,
      });
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

      return dispatchSubmission(ctx.db, ctx.session.user.id, prob, {
        code: input.code,
        lang: input.lang,
        kind: "run",
        testCases: publicTestCases,
        hidePrivate: false,
      });
    }),

  getResults: protectedProcedure
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

      if (!sub) throw new TRPCError({ code: "NOT_FOUND" });
      if (sub.status !== "running") return sub;

      const resultsData = sub.results as any;
      const jobId = resultsData?.[0]?.jobId;

      if (!jobId) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No job ID found",
        });
      }

      /**
       * Atomically move the row out of `running`. The `WHERE status =
       * 'running'` makes the transition idempotent: only one concurrent
       * poll wins (Postgres serializes the UPDATE), the rest get `won:
       * false` and the already-finalized row. Streak side effects are
       * gated on `won` so they can't run twice.
       */
      const finalize = async (
        patch: Partial<typeof submission.$inferInsert>,
      ) => {
        const [updated] = await ctx.db
          .update(submission)
          .set(patch)
          .where(
            and(eq(submission.id, sub.id), eq(submission.status, "running")),
          )
          .returning();

        if (updated) return { row: updated, won: true as const };

        const [current] = await ctx.db
          .select()
          .from(submission)
          .where(eq(submission.id, sub.id))
          .limit(1);
        return { row: current!, won: false as const };
      };

      // Bound how long a submission may stay `running` before we give up
      // on the judge and surface a terminal error (no infinite polling).
      const JUDGE_TIMEOUT_MS = 120_000;
      const elapsed = Date.now() - sub.createdAt.getTime();

      let statusResponse: JudgeStatusResponse;
      try {
        statusResponse = await getJobStatus(jobId);
      } catch (error) {
        console.error("Error fetching job status:", error);
        if (elapsed > JUDGE_TIMEOUT_MS) {
          const { row } = await finalize({
            status: "judge_error",
            errorMessage: "Judge unreachable",
          });
          return row;
        }
        // Transient failure within the timeout window — keep polling.
        return sub;
      }

      if (
        statusResponse.status !== "completed" &&
        statusResponse.status !== "failed"
      ) {
        if (elapsed > JUDGE_TIMEOUT_MS) {
          const { row } = await finalize({
            status: "judge_error",
            errorMessage: "Judging timed out",
          });
          return row;
        }
        return sub;
      }

      const [prob] = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.id, sub.problemId))
        .limit(1);

      if (!prob) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Problem not found",
        });
      }

      const testCases = prob.testCases;
      const verdict = statusResponse.result?.verdict;
      const parsedResults = parseTestResults(
        statusResponse.result?.stdout || "",
        statusResponse.result?.stderr || "",
        testCases,
      );
      const testsPassed = parsedResults.filter(
        (r: { passed: boolean }) => r.passed,
      ).length;

      let finalStatus:
        | "pending"
        | "running"
        | "accepted"
        | "wrong_answer"
        | "runtime_error"
        | "time_limit"
        | "compile_error"
        | "judge_error" = "wrong_answer";

      if (verdict === "OK") {
        finalStatus =
          testsPassed === testCases.length ? "accepted" : "wrong_answer";
      } else if (verdict === "CE") {
        finalStatus = "compile_error";
      } else if (verdict === "RE" || verdict === "SG") {
        finalStatus = "runtime_error";
      } else if (verdict === "TO") {
        finalStatus = "time_limit";
      } else if (verdict === "XX" || statusResponse.status === "failed") {
        finalStatus = "runtime_error";
      }

      const runtime = statusResponse.result?.time;
      const memory = statusResponse.result?.memory;

      const { row: updatedSub, won } = await finalize({
        status: finalStatus,
        testsPassed,
        runtime,
        memory,
        results: parsedResults as any,
        errorMessage:
          statusResponse.result?.stderr ||
          statusResponse.result?.errorType ||
          undefined,
      });

      // Update streak only when THIS call performed the transition, and
      // only for accepted real submissions ("run" is ephemeral).
      if (won && finalStatus === "accepted" && sub.kind === "submit") {
        const today = new Date().toISOString().split("T")[0]!;
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0]!;

        const [profile] = await ctx.db
          .select()
          .from(userProfile)
          .where(eq(userProfile.userId, ctx.session.user.id))
          .limit(1);

        if (profile) {
          let newStreak = profile.currentStreak;
          if (profile.lastSolveDate === today) {
            // Already solved today, no-op
          } else if (profile.lastSolveDate === yesterday) {
            newStreak = profile.currentStreak + 1;
          } else {
            newStreak = 1;
          }
          const newLongest = Math.max(profile.longestStreak, newStreak);

          await ctx.db
            .update(userProfile)
            .set({
              currentStreak: newStreak,
              longestStreak: newLongest,
              lastSolveDate: today,
            })
            .where(eq(userProfile.userId, ctx.session.user.id));
        }
      }

      return updatedSub;
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
