import { z } from "zod";

import { env } from "../../env";
import { createTRPCRouter, protectedProcedure } from "../trpc";

interface JudgeExecutionResult {
  verdict: "OK" | "CE" | "RE" | "SG" | "TO" | "XX";
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

export const playgroundRouter = createTRPCRouter({
  run: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50_000),
        lang: z.enum([
          "py",
          "js",
          "ts",
          "java",
          "cpp",
          "c",
          "rs",
          "go",
          "rb",
          "php",
        ]),
      }),
    )
    .mutation(async ({ input }) => {
      const response = await fetch(`${env.JUDGE_API_URL}/submissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.JUDGE_API_TOKEN}`,
        },
        body: JSON.stringify({ code: input.code, lang: input.lang }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Judge submission failed: ${text}`);
      }

      const data = (await response.json()) as { id: string };
      return { jobId: data.id };
    }),

  status: protectedProcedure
    .input(z.object({ jobId: z.string() }))
    .query(async ({ input }) => {
      const response = await fetch(
        `${env.JUDGE_API_URL}/submissions/${input.jobId}`,
        {
          headers: {
            Authorization: `Bearer ${env.JUDGE_API_TOKEN}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch job status: ${input.jobId}`);
      }

      const data = (await response.json()) as JudgeStatusResponse;

      return {
        id: data.id,
        status: data.status,
        result: data.result
          ? {
              verdict: data.result.verdict,
              stdout: data.result.stdout ?? "",
              stderr: data.result.stderr ?? "",
              time: data.result.time,
              memory: data.result.memory,
              exitCode: data.result.exitCode ?? 0,
              wallTime: data.result.wallTime,
              cgOomKilled: data.result.cgOomKilled,
            }
          : null,
      };
    }),
});
