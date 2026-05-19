import { TRPCError } from "@trpc/server";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";

import type { db } from "@acme/db";
import type { FunctionSignature, TestCase } from "@acme/db/schema";
import { problem, submission, userProfile } from "@acme/db/schema";

import { env } from "../../env";
import { generateDriverWithTestCases, SUPPORTED_LANGS } from "../drivers";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../trpc";

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

async function submitToJudge(
  code: string,
  lang: string,
  limits?: { timeLimit?: number | null; memoryLimit?: number | null },
  stdin?: string,
): Promise<string> {
  const response = await fetch(`${env.JUDGE_API_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.JUDGE_API_TOKEN}`,
    },
    body: JSON.stringify({
      code,
      lang,
      ...(limits?.timeLimit != null && { timeLimit: limits.timeLimit }),
      ...(limits?.memoryLimit != null && { memoryLimit: limits.memoryLimit }),
      ...(stdin != null && { stdin }),
    }),
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
 * One entry per pending judge job stored on `submission.results` while a
 * submission is `running`. Function-signature problems use a single driver
 * job (`{ jobId }`); stdin problems fan out to one job per test case and
 * carry the expected output so polling can grade each independently.
 */
interface PendingJob {
  jobId: string;
  // Present only for the stdin (one-job-per-test) path.
  expected?: string;
  input?: string;
  isPublic?: boolean;
}

/**
 * Shared tail for `submit`/`run`: dispatch to the judge and persist a
 * `running` submission row. Function-signature problems get a single
 * type-aware driver job; stdin problems (no signature) fan out to one
 * raw-code job per test case, each fed that test's input on stdin.
 */
async function dispatchSubmission(
  database: typeof db,
  userId: string | null,
  prob: typeof problem.$inferSelect,
  opts: {
    code: string;
    lang: (typeof SUPPORTED_LANGS)[number];
    kind: "run" | "submit";
    testCases: TestCase[];
    hidePrivate: boolean;
  },
): Promise<{ id: number; jobId: string }> {
  const signature = prob.functionSignature as FunctionSignature | null;
  const limits = { timeLimit: prob.timeLimit, memoryLimit: prob.memoryLimit };

  let pendingJobs: PendingJob[];

  if (signature) {
    const driverCode = generateDriverWithTestCases(
      opts.code,
      opts.lang,
      signature,
      opts.testCases,
      opts.hidePrivate,
    );
    pendingJobs = [{ jobId: await submitToJudge(driverCode, opts.lang, limits) }];
  } else {
    // stdin problem: one job per test case, raw user code, input on stdin.
    pendingJobs = await Promise.all(
      opts.testCases.map(async (tc) => ({
        jobId: await submitToJudge(opts.code, opts.lang, limits, tc.input ?? ""),
        expected: tc.output ?? "",
        input: tc.isPublic || !opts.hidePrivate ? (tc.input ?? "") : undefined,
        isPublic: opts.hidePrivate ? tc.isPublic : true,
      })),
    );
  }

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
      results: pendingJobs as any,
    })
    .returning();

  if (!newSubmission) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to create submission",
    });
  }

  return { id: newSubmission.id, jobId: pendingJobs[0]!.jobId };
}

/** Normalise program output for comparison: trim trailing space per line. */
function normalizeOutput(s: string): string {
  return s
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/\n+$/, "");
}

/** Roll the daily solve streak forward for an accepted real submission. */
async function applyStreak(database: typeof db, userId: string) {
  const today = new Date().toISOString().split("T")[0]!;
  const yesterday = new Date(Date.now() - 86400000)
    .toISOString()
    .split("T")[0]!;

  const [profile] = await database
    .select()
    .from(userProfile)
    .where(eq(userProfile.userId, userId))
    .limit(1);

  if (!profile) return;

  let newStreak = profile.currentStreak;
  if (profile.lastSolveDate === today) {
    // Already solved today, no-op
  } else if (profile.lastSolveDate === yesterday) {
    newStreak = profile.currentStreak + 1;
  } else {
    newStreak = 1;
  }

  await database
    .update(userProfile)
    .set({
      currentStreak: newStreak,
      longestStreak: Math.max(profile.longestStreak, newStreak),
      lastSolveDate: today,
    })
    .where(eq(userProfile.userId, userId));
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

  run: publicProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(SUPPORTED_LANGS),
        customArgs: z.array(z.string()).optional(),
        customInput: z.string().optional(),
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
        : input.customInput != null
          ? [{ input: input.customInput, output: "", isPublic: true }]
          : prob.testCases.filter((tc) => tc.isPublic);

      if (publicTestCases.length === 0) {
        return { id: 0, jobId: null, results: [] };
      }

      return dispatchSubmission(ctx.db, ctx.session?.user?.id ?? null, prob, {
        code: input.code,
        lang: input.lang,
        kind: "run",
        testCases: publicTestCases,
        hidePrivate: false,
      });
    }),

  getResults: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      // Logged-in callers may only read their own rows; anonymous
      // callers may only read ownerless (anonymous "run") rows.
      const userId = ctx.session?.user?.id;
      const [sub] = await ctx.db
        .select()
        .from(submission)
        .where(
          and(
            eq(submission.id, input.id),
            userId
              ? eq(submission.userId, userId)
              : isNull(submission.userId),
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

      // stdin problems fan out to one job per test case (entries carry
      // `expected`). Poll them all and grade by comparing stdout.
      const pending = resultsData as PendingJob[];
      if (
        Array.isArray(pending) &&
        pending.length > 0 &&
        pending[0]?.expected !== undefined
      ) {
        const STDIN_TIMEOUT_MS = 120_000;
        const age = Date.now() - sub.createdAt.getTime();

        const statuses = await Promise.all(
          pending.map((p) => getJobStatus(p.jobId).catch(() => null)),
        );

        const allDone = statuses.every(
          (s) => s?.status === "completed" || s?.status === "failed",
        );

        if (!allDone) {
          if (age > STDIN_TIMEOUT_MS) {
            const { row } = await finalize({
              status: "judge_error",
              errorMessage: "Judging timed out",
            });
            return row;
          }
          return sub; // keep polling
        }

        const verdicts = statuses.map((s) => s?.result?.verdict);
        const parsed = pending.map((p, i) => {
          const res = statuses[i]?.result;
          const verdict = res?.verdict;
          const ok =
            verdict === "OK" &&
            normalizeOutput(res?.stdout ?? "") ===
              normalizeOutput(p.expected ?? "");
          return {
            passed: ok,
            runtime: res?.time,
            memory: res?.memory,
            input: p.isPublic ? p.input : undefined,
            expected: p.isPublic ? p.expected : undefined,
            actual: p.isPublic ? res?.stdout : undefined,
            error:
              verdict && verdict !== "OK"
                ? res?.stderr || res?.errorType || verdict
                : undefined,
          };
        });

        const testsPassed = parsed.filter((r) => r.passed).length;
        let stdinStatus:
          | "accepted"
          | "wrong_answer"
          | "runtime_error"
          | "time_limit"
          | "compile_error" = "wrong_answer";
        if (verdicts.includes("CE")) stdinStatus = "compile_error";
        else if (verdicts.includes("TO")) stdinStatus = "time_limit";
        else if (
          verdicts.some((v) => v === "RE" || v === "SG" || v === "XX")
        )
          stdinStatus = "runtime_error";
        else if (testsPassed === parsed.length) stdinStatus = "accepted";

        const { row, won } = await finalize({
          status: stdinStatus,
          testsPassed,
          runtime: Math.max(0, ...parsed.map((r) => r.runtime ?? 0)),
          memory: Math.max(0, ...parsed.map((r) => r.memory ?? 0)),
          results: parsed as any,
          errorMessage: parsed.find((r) => r.error)?.error ?? undefined,
        });

        if (
          won &&
          stdinStatus === "accepted" &&
          sub.kind === "submit" &&
          sub.userId
        ) {
          await applyStreak(ctx.db, sub.userId);
        }

        return row;
      }

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
      if (
        won &&
        finalStatus === "accepted" &&
        sub.kind === "submit" &&
        sub.userId
      ) {
        await applyStreak(ctx.db, sub.userId);
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

  // "Beats X%" of accepted submissions for the same problem + language.
  percentile: protectedProcedure
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

      if (!sub || sub.status !== "accepted") return null;

      const peers = and(
        eq(submission.problemId, sub.problemId),
        eq(submission.lang, sub.lang),
        eq(submission.kind, "submit"),
        eq(submission.status, "accepted"),
      );

      const [agg] = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          runtimeTotal: sql<number>`count(${submission.runtime})::int`,
          runtimeSlower: sql<number>`count(*) filter (where ${submission.runtime} > ${sub.runtime})::int`,
          memoryTotal: sql<number>`count(${submission.memory})::int`,
          memorySlower: sql<number>`count(*) filter (where ${submission.memory} > ${sub.memory})::int`,
        })
        .from(submission)
        .where(peers);

      if (!agg || agg.total === 0) return null;

      const pct = (slower: number, total: number) =>
        total > 0 ? Math.round((slower / total) * 1000) / 10 : null;

      return {
        runtime:
          sub.runtime != null ? pct(agg.runtimeSlower, agg.runtimeTotal) : null,
        memory:
          sub.memory != null ? pct(agg.memorySlower, agg.memoryTotal) : null,
        sampleSize: agg.total,
      };
    }),
});
