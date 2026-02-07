import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { TestCase } from "@acme/db/schema";
import { problem, submission } from "@acme/db/schema";

import { createTRPCRouter, protectedProcedure } from "../trpc";

const JUDGE_API_URL =
  process.env.JUDGE_API_URL ?? "https://judge.codingducks.xyz/api/v1";
const JUDGE_API_TOKEN =
  process.env.JUDGE_API_TOKEN ??
  "sk_live_f132093395599bd810a8f8474bf8a96cbe6e50d9e3af655f51bcf22fec3d7774";

interface JudgeJobResponse {
  id: string;
}

interface JudgeStatusResponse {
  id: string;
  status: "waiting" | "active" | "completed" | "failed";
  result?: {
    verdict: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    time: number;
    memory: number;
  };
}

/**
 * Generate driver code that embeds all test cases and loops through them
 */
function generateDriverWithTestCases(
  userCode: string,
  lang: string,
  functionName: string,
  testCases: TestCase[],
  hidePrivate: boolean = false,
): string {
  // Prepare test case data
  const testData = testCases.map((tc, index) => {
    const args = tc.args || [];
    const expected = tc.expected || tc.output || "";
    const isPublic = tc.isPublic;

    return {
      index,
      args,
      expected,
      isPublic: hidePrivate ? isPublic : true, // For run mutation, all are public
    };
  });

  switch (lang) {
    case "py":
      return `
import sys, json

# User code
${userCode}

if __name__ == "__main__":
    test_cases = ${JSON.stringify(testData)}
    
    results = []
    sol = Solution()
    
    for tc in test_cases:
        try:
            args = tc["args"]
            expected = tc["expected"]
            actual = sol.${functionName}(*args)
            passed = (actual == expected)
            results.append({
                "index": tc["index"],
                "passed": passed,
                "actual": json.dumps(actual) if tc["isPublic"] else None,
                "isPublic": tc["isPublic"]
            })
        except Exception as e:
            results.append({
                "index": tc["index"],
                "passed": False,
                "error": str(e),
                "isPublic": tc["isPublic"]
            })
    
    print(json.dumps(results))
`;

    case "js":
      return `
const testCases = ${JSON.stringify(testData)};

// User code
${userCode}

const results = [];
const sol = new Solution();

for (const tc of testCases) {
    try {
        const args = tc.args;
        const expected = tc.expected;
        const actual = sol.${functionName}(...args);
        const passed = JSON.stringify(actual) === JSON.stringify(expected);
        results.push({
            index: tc.index,
            passed: passed,
            actual: tc.isPublic ? JSON.stringify(actual) : undefined,
            isPublic: tc.isPublic
        });
    } catch (e) {
        results.push({
            index: tc.index,
            passed: false,
            error: e.message,
            isPublic: tc.isPublic
        });
    }
}

console.log(JSON.stringify(results));
`;

    case "java":
      return `
import java.util.*;
import com.google.gson.*;

// User code
${userCode}

public class Main {
    public static void main(String[] args) {
        String testDataJson = ${JSON.stringify(JSON.stringify(testData))};
        Gson gson = new Gson();
        TestCase[] testCases = gson.fromJson(testDataJson, TestCase[].class);
        
        List<Map<String, Object>> results = new ArrayList<>();
        Solution sol = new Solution();
        
        for (TestCase tc : testCases) {
            Map<String, Object> result = new HashMap<>();
            result.put("index", tc.index);
            result.put("isPublic", tc.isPublic);
            
            try {
                // Note: This is simplified - real implementation needs proper type handling
                Object actual = sol.${functionName}(/* args */);
                boolean passed = actual.equals(tc.expected);
                result.put("passed", passed);
                if (tc.isPublic) {
                    result.put("actual", gson.toJson(actual));
                }
            } catch (Exception e) {
                result.put("passed", false);
                result.put("error", e.getMessage());
            }
            
            results.add(result);
        }
        
        System.out.println(gson.toJson(results));
    }
    
    static class TestCase {
        int index;
        Object[] args;
        Object expected;
        boolean isPublic;
    }
}
`;

    case "cpp":
      return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include "json.hpp"

using json = nlohmann::json;
using namespace std;

// User code
${userCode}

int main() {
    string testDataJson = R"(${JSON.stringify(testData)})";
    auto testCases = json::parse(testDataJson);
    
    json results = json::array();
    Solution sol;
    
    for (const auto& tc : testCases) {
        json result;
        result["index"] = tc["index"];
        result["isPublic"] = tc["isPublic"];
        
        try {
            // Note: Simplified - needs proper type handling
            auto args = tc["args"];
            auto expected = tc["expected"];
            // auto actual = sol.${functionName}(/* args */);
            // bool passed = (actual == expected);
            result["passed"] = false; // Placeholder
        } catch (const exception& e) {
            result["passed"] = false;
            result["error"] = e.what();
        }
        
        results.push_back(result);
    }
    
    cout << results.dump() << endl;
    return 0;
}
`;

    default:
      throw new Error(`Unsupported language: ${lang}`);
  }
}

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

function parseTestResults(stdout: string, testCases: TestCase[]) {
  try {
    const results = JSON.parse(stdout);
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
  } catch (e) {
    // If parsing fails, return error for all test cases
    return testCases.map(() => ({
      passed: false,
      error: "Failed to parse test results",
    }));
  }
}

export const submissionRouter = createTRPCRouter({
  submit: protectedProcedure
    .input(
      z.object({
        problemId: z.number(),
        code: z.string(),
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
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

      // Get function name from function signature or driver code
      const functionSig = (prob.functionSignature as any)?.[input.lang];
      const functionName = functionSig?.name || "solve";

      // Generate driver code with all test cases embedded
      const driverCode = generateDriverWithTestCases(
        input.code,
        input.lang,
        functionName,
        prob.testCases,
        true, // Hide private test case details
      );

      // Submit to judge
      const jobId = await submitToJudge(driverCode, input.lang);

      // Create submission record
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
        lang: z.enum(["py", "js", "java", "cpp", "c"]),
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

      const functionSig = (prob.functionSignature as any)?.[input.lang];
      const functionName = functionSig?.name || "solve";

      const driverCode = generateDriverWithTestCases(
        input.code,
        input.lang,
        functionName,
        publicTestCases,
        false, // All are public for run
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
          // Get problem to access test cases
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
          const parsedResults = parseTestResults(
            statusResponse.result?.stdout || "",
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
          if (
            statusResponse.status === "failed" ||
            statusResponse.result?.stderr
          ) {
            finalStatus = "runtime_error";
          } else if (testsPassed === testCases.length) {
            finalStatus = "accepted";
          }

          const [updatedSub] = await ctx.db
            .update(submission)
            .set({
              status: finalStatus,
              testsPassed,
              runtime: statusResponse.result?.time,
              results: parsedResults as any,
              errorMessage: statusResponse.result?.stderr || undefined,
            })
            .where(eq(submission.id, sub.id))
            .returning();

          return updatedSub;
        }
      } catch (error) {
        console.error("Error fetching job status:", error);
        // Keep status as running, frontend will retry
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
