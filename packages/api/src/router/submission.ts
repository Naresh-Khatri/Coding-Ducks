import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { FunctionSignature, TestCase } from "@acme/db/schema";
import { problem, submission } from "@acme/db/schema";

import { generateDriverWithTestCases, SUPPORTED_LANGS } from "../drivers";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const JUDGE_API_URL =
  process.env.JUDGE_API_URL ?? "https://judge.codingducks.xyz/api/v1";
const JUDGE_API_TOKEN =
  process.env.JUDGE_API_TOKEN ??
  "sk_live_f132093395599bd810a8f8474bf8a96cbe6e50d9e3af655f51bcf22fec3d7774";

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
  const response = await fetch(`${JUDGE_API_URL}/submissions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(JUDGE_API_TOKEN
        ? { Authorization: `Bearer ${JUDGE_API_TOKEN}` }
        : {}),
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
  const response = await fetch(`${JUDGE_API_URL}/submissions/${jobId}`, {
    headers: {
      ...(JUDGE_API_TOKEN
        ? { Authorization: `Bearer ${JUDGE_API_TOKEN}` }
        : {}),
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

      return { id: newSubmission.id, jobId };
    }),

  run: protectedProcedure
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

      if (!prob) throw new TRPCError({ code: "NOT_FOUND" });

      const publicTestCases = prob.testCases.filter((tc) => tc.isPublic);

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

      return { id: newSubmission.id, jobId };
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

      try {
        const statusResponse = await getJobStatus(jobId);

        if (
          statusResponse.status === "completed" ||
          statusResponse.status === "failed"
        ) {
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
            | "compile_error" = "wrong_answer";

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

          const [updatedSub] = await ctx.db
            .update(submission)
            .set({
              status: finalStatus,
              testsPassed,
              runtime,
              memory,
              results: parsedResults as any,
              errorMessage:
                statusResponse.result?.stderr ||
                statusResponse.result?.errorType ||
                undefined,
            })
            .where(eq(submission.id, sub.id))
            .returning();

          return updatedSub;
        }
      } catch (error) {
        console.error("Error fetching job status:", error);
      }

      return sub;
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
