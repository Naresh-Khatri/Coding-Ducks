/**
 * Server-side submission reconciliation.
 *
 * The client polls `submission.getResults` for snappy feedback, but that
 * path only runs while a tab is open. This module is the source of truth
 * for moving a submission out of `running`: it is called both by the live
 * client poll (via the tRPC router) and by a BullMQ worker enqueued on
 * submit, so a closed/abandoned tab can no longer orphan a row.
 *
 * The transition is an atomic compare-and-swap (`UPDATE ... WHERE
 * status = 'running'`), so the worker and a still-open client poll can
 * race freely — exactly one wins and runs the streak side effect.
 */
import { and, db, desc, eq, problem, submission, userProfile } from "@acme/db";
import type { TestCase } from "@acme/db/schema";

/** How long a submission may stay `running` before we give up on the judge. */
export const JUDGE_TIMEOUT_MS = 120_000;

const JUDGE_API_URL =
  process.env.JUDGE_API_URL ?? "https://judge.codingducks.xyz/api/v1";
const JUDGE_API_TOKEN = process.env.JUDGE_API_TOKEN ?? "";

type JudgeVerdict = "OK" | "CE" | "RE" | "SG" | "TO" | "XX";

interface JudgeExecutionResult {
  verdict: JudgeVerdict;
  time: number;
  memory: number;
  stdout?: string;
  stderr?: string;
  errorType?: string;
}

interface JudgeStatusResponse {
  id: string;
  status: string;
  result: JudgeExecutionResult | null;
}

async function getJobStatus(jobId: string): Promise<JudgeStatusResponse> {
  const response = await fetch(`${JUDGE_API_URL}/submissions/${jobId}`, {
    headers: { Authorization: `Bearer ${JUDGE_API_TOKEN}` },
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
    const results = JSON.parse(stdout) as unknown;
    if (!Array.isArray(results)) {
      throw new Error("Invalid results format");
    }
    return (results as Record<string, unknown>[]).map((r, i) => ({
      passed: Boolean(r.passed),
      runtime: r.runtime as number | undefined,
      memory: r.memory as number | undefined,
      input:
        r.isPublic && testCases[i]
          ? testCases[i]!.args?.join(", ") || testCases[i]!.input
          : undefined,
      expected:
        r.isPublic && testCases[i]
          ? testCases[i]!.expected || testCases[i]!.output
          : undefined,
      actual: r.isPublic ? (r.actual as string | undefined) : undefined,
      error: r.error as string | undefined,
    }));
  } catch (e: unknown) {
    const errorMessage =
      stderr || (e instanceof Error ? e.message : "Runtime Error");
    return testCases.map(() => ({ passed: false, error: errorMessage }));
  }
}

type FinalStatus =
  | "accepted"
  | "wrong_answer"
  | "runtime_error"
  | "time_limit"
  | "compile_error"
  | "judge_error";

/**
 * Reconcile one submission against the judge. Idempotent and safe to call
 * concurrently. Returns the current row (terminal once finalized).
 */
export async function reconcileSubmission(submissionId: number) {
  const [sub] = await db
    .select()
    .from(submission)
    .where(eq(submission.id, submissionId))
    .limit(1);

  if (!sub) return null;
  if (sub.status !== "running") return sub;

  const resultsData = sub.results as { jobId?: string }[] | null;
  const jobId = resultsData?.[0]?.jobId;
  if (!jobId) return sub;

  /**
   * Atomic transition out of `running`. Only one concurrent caller wins
   * (Postgres serializes the UPDATE and re-checks the predicate); the
   * streak side effect is gated on `won` so it cannot run twice.
   */
  const finalize = async (patch: Partial<typeof submission.$inferInsert>) => {
    const [updated] = await db
      .update(submission)
      .set(patch)
      .where(
        and(eq(submission.id, sub.id), eq(submission.status, "running")),
      )
      .returning();

    if (updated) return { row: updated, won: true as const };

    const [current] = await db
      .select()
      .from(submission)
      .where(eq(submission.id, sub.id))
      .limit(1);
    return { row: current!, won: false as const };
  };

  const elapsed = Date.now() - sub.createdAt.getTime();

  let statusResponse: JudgeStatusResponse;
  try {
    statusResponse = await getJobStatus(jobId);
  } catch (error) {
    console.error("reconcileSubmission: judge fetch failed", error);
    if (elapsed > JUDGE_TIMEOUT_MS) {
      const { row } = await finalize({
        status: "judge_error",
        errorMessage: "Judge unreachable",
      });
      return row;
    }
    return sub; // transient within the timeout window
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

  const [prob] = await db
    .select()
    .from(problem)
    .where(eq(problem.id, sub.problemId))
    .limit(1);
  if (!prob) {
    const { row } = await finalize({
      status: "judge_error",
      errorMessage: "Problem not found",
    });
    return row;
  }

  const testCases = prob.testCases;
  const verdict = statusResponse.result?.verdict;
  const parsedResults = parseTestResults(
    statusResponse.result?.stdout || "",
    statusResponse.result?.stderr || "",
    testCases,
  );
  const testsPassed = parsedResults.filter((r) => r.passed).length;

  let finalStatus: FinalStatus = "wrong_answer";
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

  const { row: updatedSub, won } = await finalize({
    status: finalStatus,
    testsPassed,
    runtime: statusResponse.result?.time,
    memory: statusResponse.result?.memory,
    results: parsedResults,
    errorMessage:
      statusResponse.result?.stderr ||
      statusResponse.result?.errorType ||
      undefined,
  });

  // Streak only when THIS call performed the transition, and only for
  // accepted real submissions ("run" is ephemeral).
  if (won && finalStatus === "accepted" && sub.kind === "submit") {
    const today = new Date().toISOString().split("T")[0]!;
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split("T")[0]!;

    const [profile] = await db
      .select()
      .from(userProfile)
      .where(eq(userProfile.userId, sub.userId))
      .limit(1);

    if (profile) {
      let newStreak = profile.currentStreak;
      if (profile.lastSolveDate === today) {
        // already solved today, no-op
      } else if (profile.lastSolveDate === yesterday) {
        newStreak = profile.currentStreak + 1;
      } else {
        newStreak = 1;
      }
      const newLongest = Math.max(profile.longestStreak, newStreak);

      await db
        .update(userProfile)
        .set({
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastSolveDate: today,
        })
        .where(eq(userProfile.userId, sub.userId));
    }
  }

  return updatedSub;
}
