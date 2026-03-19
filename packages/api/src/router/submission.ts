import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import type { FunctionSignature, TestCase } from "@acme/db/schema";
import { problem, submission } from "@acme/db/schema";

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

interface TestData {
  index: number;
  args: string[];
  expected: string;
  isPublic: boolean;
  paramTypes: string[];
  returnType: string;
}

/**
 * Generate type-aware driver code that embeds all test cases,
 * parses args to native types, and compares serialized results.
 */
function generateDriverWithTestCases(
  userCode: string,
  lang: string,
  signature: FunctionSignature,
  testCases: TestCase[],
  hidePrivate: boolean = false,
): string {
  const { fnName, params, returnType } = signature;

  const testData: TestData[] = testCases.map((tc, index) => ({
    index,
    args: tc.args || [],
    expected: tc.expected || tc.output || "",
    isPublic: hidePrivate ? tc.isPublic : true,
    paramTypes: params.map((p) => p.type),
    returnType,
  }));

  switch (lang) {
    case "py":
      return generatePythonDriver(userCode, fnName, testData);
    case "js":
      return generateJSDriver(userCode, fnName, testData);
    case "java":
      return generateJavaDriver(userCode, fnName, testData, params, returnType);
    case "cpp":
      return generateCppDriver(userCode, fnName, testData, params, returnType);
    case "c":
      return generateCDriver(userCode, fnName, testData, params, returnType);
    default:
      throw new Error(`Unsupported language: ${lang}`);
  }
}

function generatePythonDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
): string {
  return `
import sys, json

# User code
${userCode}

def parse_arg(value_str, type_name):
    if type_name == "integer":
        return int(value_str)
    elif type_name == "float":
        return float(value_str)
    elif type_name == "string":
        return json.loads(value_str)
    elif type_name == "boolean":
        return json.loads(value_str)
    elif type_name.endswith("[]"):
        return json.loads(value_str)
    else:
        return json.loads(value_str)

def serialize(val):
    return json.dumps(val, separators=(',', ':'))

if __name__ == "__main__":
    test_cases = json.loads(${JSON.stringify(JSON.stringify(testData))})

    results = []
    sol = Solution()

    for tc in test_cases:
        try:
            args = []
            for i, arg_str in enumerate(tc["args"]):
                args.append(parse_arg(arg_str, tc["paramTypes"][i]))
            expected_str = tc["expected"]
            actual = sol.${fnName}(*args)
            actual_str = serialize(actual)
            expected_parsed = json.loads(expected_str)
            expected_normalized = serialize(expected_parsed)
            passed = (actual_str == expected_normalized)
            results.append({
                "index": tc["index"],
                "passed": passed,
                "actual": actual_str if tc["isPublic"] else None,
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
}

function generateJSDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
): string {
  return `
const testCases = ${JSON.stringify(testData)};

// User code
${userCode}

function parseArg(valueStr, typeName) {
    if (typeName === "integer") return parseInt(valueStr, 10);
    if (typeName === "float") return parseFloat(valueStr);
    if (typeName === "string") return JSON.parse(valueStr);
    if (typeName === "boolean") return JSON.parse(valueStr);
    if (typeName.endsWith("[]")) return JSON.parse(valueStr);
    return JSON.parse(valueStr);
}

function serialize(val) {
    return JSON.stringify(val);
}

const results = [];
const sol = new Solution();

for (const tc of testCases) {
    try {
        const args = tc.args.map((argStr, i) => parseArg(argStr, tc.paramTypes[i]));
        const actual = sol.${fnName}(...args);
        const actualStr = serialize(actual);
        const expectedParsed = JSON.parse(tc.expected);
        const expectedStr = serialize(expectedParsed);
        const passed = actualStr === expectedStr;
        results.push({
            index: tc.index,
            passed,
            actual: tc.isPublic ? actualStr : undefined,
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
}

function generateJavaDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const javaReturnType = javaType(returnType);
  const paramDecls = params.map((p) => `${javaType(p.type)} ${p.name}`).join(", ");

  // Generate parse calls for each param
  const parseStatements = params
    .map(
      (p, i) =>
        `                ${javaType(p.type)} arg${i} = ${javaParseExpr(p.type, `args[${i}]`)};`,
    )
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");

  // Result serialization
  const serializeResult = javaSerialize("actual", returnType);

  return `
import java.util.*;

// User code
${userCode}

public class Main {
    // Inline JSON array/string helpers (no external deps)
    static int[] parseIntArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new int[0];
        s = s.substring(1, s.length() - 1);
        String[] parts = s.split(",");
        int[] arr = new int[parts.length];
        for (int i = 0; i < parts.length; i++) arr[i] = Integer.parseInt(parts[i].trim());
        return arr;
    }

    static String[] parseStringArray(String s) {
        s = s.trim();
        if (s.equals("[]")) return new String[0];
        s = s.substring(1, s.length() - 1);
        List<String> list = new ArrayList<>();
        boolean inStr = false;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"') {
                inStr = !inStr;
            } else if (c == ',' && !inStr) {
                list.add(sb.toString().trim());
                sb = new StringBuilder();
            } else {
                sb.append(c);
            }
        }
        if (sb.length() > 0) list.add(sb.toString().trim());
        return list.toArray(new String[0]);
    }

    static String stripQuotes(String s) {
        s = s.trim();
        if (s.length() >= 2 && s.charAt(0) == '"' && s.charAt(s.length()-1) == '"')
            return s.substring(1, s.length() - 1);
        return s;
    }

    static String serializeIntArray(int[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(arr[i]);
        }
        sb.append("]");
        return sb.toString();
    }

    static String serializeStringArray(String[] arr) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < arr.length; i++) {
            if (i > 0) sb.append(",");
            sb.append("\\"").append(arr[i]).append("\\"");
        }
        sb.append("]");
        return sb.toString();
    }

    public static void main(String[] mainArgs) {
        String[][] allArgs = ${javaStringArrayLiteral(testData.map((td) => td.args))};
        String[] allExpected = ${javaStringArrayLiteral1D(testData.map((td) => td.expected))};
        int[] allIndices = {${testData.map((td) => td.index).join(",")}};
        boolean[] allIsPublic = {${testData.map((td) => td.isPublic).join(",")}};

        StringBuilder jsonOut = new StringBuilder("[");
        Solution sol = new Solution();

        for (int t = 0; t < allArgs.length; t++) {
            String[] args = allArgs[t];
            if (t > 0) jsonOut.append(",");
            try {
${parseStatements}
                ${javaReturnType} actual = sol.${fnName}(${argList});
                String actualStr = ${serializeResult};
                // Normalize expected
                String expectedStr = allExpected[t].trim();
                boolean passed = actualStr.equals(expectedStr);
                jsonOut.append("{");
                jsonOut.append("\\"index\\":").append(allIndices[t]);
                jsonOut.append(",\\"passed\\":").append(passed);
                if (allIsPublic[t]) jsonOut.append(",\\"actual\\":\\"").append(actualStr.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"")).append("\\"");
                jsonOut.append(",\\"isPublic\\":").append(allIsPublic[t]);
                jsonOut.append("}");
            } catch (Exception e) {
                jsonOut.append("{");
                jsonOut.append("\\"index\\":").append(allIndices[t]);
                jsonOut.append(",\\"passed\\":false");
                jsonOut.append(",\\"error\\":\\"").append(e.getMessage() != null ? e.getMessage().replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") : "Runtime Error").append("\\"");
                jsonOut.append(",\\"isPublic\\":").append(allIsPublic[t]);
                jsonOut.append("}");
            }
        }

        jsonOut.append("]");
        System.out.println(jsonOut.toString());
    }
}
`;
}

function generateCppDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const cppRetType = cppType(returnType);

  const parseStatements = params
    .map((p, i) => `        ${cppType(p.type)} arg${i} = ${cppParseExpr(p.type, `args[${i}]`)};`)
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");
  const serializeResult = cppSerialize("actual", returnType);

  // Build args as C++ initializer
  const argsInit = testData
    .map((td) => `{${td.args.map((a) => cppStringLiteral(a)).join(", ")}}`)
    .join(",\n        ");

  return `
#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include <algorithm>

using namespace std;

// User code
${userCode}

vector<int> parseIntArray(const string& s) {
    vector<int> res;
    if (s.size() < 2) return res;
    string inner = s.substr(1, s.size() - 2);
    stringstream ss(inner);
    string token;
    while (getline(ss, token, ',')) {
        if (!token.empty()) res.push_back(stoi(token));
    }
    return res;
}

vector<string> parseStringArray(const string& s) {
    vector<string> res;
    if (s.size() < 2) return res;
    string inner = s.substr(1, s.size() - 2);
    bool inStr = false;
    string cur;
    for (char c : inner) {
        if (c == '"') { inStr = !inStr; }
        else if (c == ',' && !inStr) { res.push_back(cur); cur.clear(); }
        else { cur += c; }
    }
    if (!cur.empty()) res.push_back(cur);
    return res;
}

string stripQuotes(const string& s) {
    if (s.size() >= 2 && s.front() == '"' && s.back() == '"')
        return s.substr(1, s.size() - 2);
    return s;
}

string serializeIntArray(const vector<int>& arr) {
    string r = "[";
    for (size_t i = 0; i < arr.size(); i++) {
        if (i > 0) r += ",";
        r += to_string(arr[i]);
    }
    r += "]";
    return r;
}

string serializeStringArray(const vector<string>& arr) {
    string r = "[";
    for (size_t i = 0; i < arr.size(); i++) {
        if (i > 0) r += ",";
        r += "\\"" + arr[i] + "\\"";
    }
    r += "]";
    return r;
}

string escapeJson(const string& s) {
    string r;
    for (char c : s) {
        if (c == '"') r += "\\\\\\"";
        else if (c == '\\\\') r += "\\\\\\\\";
        else r += c;
    }
    return r;
}

int main() {
    vector<vector<string>> allArgs = {
        ${argsInit}
    };
    vector<string> allExpected = {${testData.map((td) => cppStringLiteral(td.expected)).join(", ")}};
    vector<int> allIndices = {${testData.map((td) => td.index).join(", ")}};
    vector<bool> allIsPublic = {${testData.map((td) => td.isPublic).join(", ")}};

    string jsonOut = "[";
    Solution sol;

    for (size_t t = 0; t < allArgs.size(); t++) {
        auto& args = allArgs[t];
        if (t > 0) jsonOut += ",";
        try {
${parseStatements}
            ${cppRetType} actual = sol.${fnName}(${argList});
            string actualStr = ${serializeResult};
            string expectedStr = allExpected[t];
            bool passed = (actualStr == expectedStr);
            jsonOut += "{\\"index\\":" + to_string(allIndices[t]);
            jsonOut += ",\\"passed\\":" + string(passed ? "true" : "false");
            if (allIsPublic[t]) jsonOut += ",\\"actual\\":\\"" + escapeJson(actualStr) + "\\"";
            jsonOut += ",\\"isPublic\\":" + string(allIsPublic[t] ? "true" : "false");
            jsonOut += "}";
        } catch (const exception& e) {
            jsonOut += "{\\"index\\":" + to_string(allIndices[t]);
            jsonOut += ",\\"passed\\":false";
            jsonOut += ",\\"error\\":\\"" + escapeJson(e.what()) + "\\"";
            jsonOut += ",\\"isPublic\\":" + string(allIsPublic[t] ? "true" : "false");
            jsonOut += "}";
        }
    }

    jsonOut += "]";
    cout << jsonOut << endl;
    return 0;
}
`;
}

function generateCDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  // C: bare function (no class), add size params for arrays
  const cRetType = cType(returnType);
  const isArrayReturn = returnType.endsWith("[]");

  // Build function call args - for array params, add size; for array return, add returnSize ptr
  const callArgs: string[] = [];
  const parseLines: string[] = [];

  params.forEach((p, i) => {
    if (p.type === "integer[]") {
      parseLines.push(`        int arg${i}Size = 0;`);
      parseLines.push(
        `        int* arg${i} = parseIntArray(args[${i}], &arg${i}Size);`,
      );
      callArgs.push(`arg${i}`);
      callArgs.push(`arg${i}Size`);
    } else if (p.type === "integer") {
      parseLines.push(`        int arg${i} = atoi(args[${i}]);`);
      callArgs.push(`arg${i}`);
    } else if (p.type === "string") {
      parseLines.push(`        char* arg${i} = stripQuotes(args[${i}]);`);
      callArgs.push(`arg${i}`);
    } else if (p.type === "boolean") {
      parseLines.push(
        `        int arg${i} = (strcmp(args[${i}], "true") == 0) ? 1 : 0;`,
      );
      callArgs.push(`arg${i}`);
    } else if (p.type === "float") {
      parseLines.push(`        double arg${i} = atof(args[${i}]);`);
      callArgs.push(`arg${i}`);
    } else {
      parseLines.push(`        // unsupported type for arg${i}`);
      callArgs.push(`args[${i}]`);
    }
  });

  if (isArrayReturn) {
    parseLines.push(`        int returnSize = 0;`);
    callArgs.push(`&returnSize`);
  }

  const callArgStr = callArgs.join(", ");

  // Serialization of return value
  let serializeBlock: string;
  if (returnType === "integer[]") {
    serializeBlock = `
            char actualBuf[4096] = "[";
            for (int ri = 0; ri < returnSize; ri++) {
                char num[32];
                sprintf(num, "%s%d", ri > 0 ? "," : "", actual[ri]);
                strcat(actualBuf, num);
            }
            strcat(actualBuf, "]");
            char* actualStr = actualBuf;`;
  } else if (returnType === "integer") {
    serializeBlock = `
            char actualBuf[64];
            sprintf(actualBuf, "%d", actual);
            char* actualStr = actualBuf;`;
  } else if (returnType === "boolean") {
    serializeBlock = `
            char* actualStr = actual ? "true" : "false";`;
  } else if (returnType === "string") {
    serializeBlock = `
            char actualBuf[4096];
            sprintf(actualBuf, "\\"%s\\"", actual);
            char* actualStr = actualBuf;`;
  } else if (returnType === "float") {
    serializeBlock = `
            char actualBuf[64];
            sprintf(actualBuf, "%g", actual);
            char* actualStr = actualBuf;`;
  } else {
    serializeBlock = `
            char actualBuf[64] = "null";
            char* actualStr = actualBuf;`;
  }

  const argsInit = testData
    .map(
      (td) =>
        `{${td.args.map((a) => cStringLiteral(a)).join(", ")}}`,
    )
    .join(",\n        ");

  const numParams = params.length;

  return `
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdbool.h>

int* parseIntArray(const char* s, int* size) {
    *size = 0;
    if (!s || strlen(s) < 2) return NULL;
    int cap = 16;
    int* arr = (int*)malloc(cap * sizeof(int));
    const char* p = s + 1; // skip [
    while (*p && *p != ']') {
        while (*p == ' ' || *p == ',') p++;
        if (*p == ']' || !*p) break;
        arr[(*size)++] = atoi(p);
        if (*size >= cap) { cap *= 2; arr = (int*)realloc(arr, cap * sizeof(int)); }
        while (*p && *p != ',' && *p != ']') p++;
    }
    return arr;
}

char* stripQuotes(const char* s) {
    int len = strlen(s);
    if (len >= 2 && s[0] == '"' && s[len-1] == '"') {
        char* r = (char*)malloc(len - 1);
        strncpy(r, s + 1, len - 2);
        r[len - 2] = '\\0';
        return r;
    }
    return strdup(s);
}

// User code
${userCode}

int main() {
    const char* allArgs[][${numParams}] = {
        ${argsInit}
    };
    const char* allExpected[] = {${testData.map((td) => cStringLiteral(td.expected)).join(", ")}};
    int allIndices[] = {${testData.map((td) => td.index).join(", ")}};
    int allIsPublic[] = {${testData.map((td) => (td.isPublic ? 1 : 0)).join(", ")}};
    int numTests = ${testData.length};

    printf("[");
    for (int t = 0; t < numTests; t++) {
        const char** args = (const char**)allArgs[t];
        if (t > 0) printf(",");

${parseLines.join("\n")}
        ${cRetType} actual = ${fnName}(${callArgStr});
${serializeBlock}

        int passed = (strcmp(actualStr, allExpected[t]) == 0);
        printf("{\\"index\\":%d,\\"passed\\":%s", allIndices[t], passed ? "true" : "false");
        if (allIsPublic[t]) printf(",\\"actual\\":\\"%s\\"", actualStr);
        printf(",\\"isPublic\\":%s}", allIsPublic[t] ? "true" : "false");
    }
    printf("]\\n");
    return 0;
}
`;
}

// --- Java helpers ---

function javaType(t: string): string {
  const map: Record<string, string> = {
    integer: "int",
    string: "String",
    boolean: "boolean",
    float: "double",
    "integer[]": "int[]",
    "string[]": "String[]",
  };
  return map[t] || "Object";
}

function javaParseExpr(type: string, argExpr: string): string {
  switch (type) {
    case "integer":
      return `Integer.parseInt(${argExpr}.trim())`;
    case "float":
      return `Double.parseDouble(${argExpr}.trim())`;
    case "string":
      return `stripQuotes(${argExpr})`;
    case "boolean":
      return `Boolean.parseBoolean(${argExpr}.trim())`;
    case "integer[]":
      return `parseIntArray(${argExpr})`;
    case "string[]":
      return `parseStringArray(${argExpr})`;
    default:
      return argExpr;
  }
}

function javaSerialize(varName: string, type: string): string {
  switch (type) {
    case "integer":
      return `String.valueOf(${varName})`;
    case "float":
      return `String.valueOf(${varName})`;
    case "string":
      return `"\\"" + ${varName} + "\\""`;
    case "boolean":
      return `String.valueOf(${varName})`;
    case "integer[]":
      return `serializeIntArray(${varName})`;
    case "string[]":
      return `serializeStringArray(${varName})`;
    default:
      return `String.valueOf(${varName})`;
  }
}

function javaStringArrayLiteral(arrays: string[][]): string {
  const rows = arrays.map(
    (arr) =>
      `{${arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)
        .join(", ")}}`,
  );
  return `new String[][] {${rows.join(", ")}}`;
}

function javaStringArrayLiteral1D(arr: string[]): string {
  return `new String[] {${arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(", ")}}`;
}

// --- C++ helpers ---

function cppType(t: string): string {
  const map: Record<string, string> = {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "double",
    "integer[]": "vector<int>",
    "string[]": "vector<string>",
  };
  return map[t] || "auto";
}

function cppParseExpr(type: string, argExpr: string): string {
  switch (type) {
    case "integer":
      return `stoi(${argExpr})`;
    case "float":
      return `stod(${argExpr})`;
    case "string":
      return `stripQuotes(${argExpr})`;
    case "boolean":
      return `(${argExpr} == "true")`;
    case "integer[]":
      return `parseIntArray(${argExpr})`;
    case "string[]":
      return `parseStringArray(${argExpr})`;
    default:
      return argExpr;
  }
}

function cppSerialize(varName: string, type: string): string {
  switch (type) {
    case "integer":
      return `to_string(${varName})`;
    case "float":
      return `to_string(${varName})`;
    case "string":
      return `"\\"" + ${varName} + "\\""`;
    case "boolean":
      return `(${varName} ? "true" : "false")`;
    case "integer[]":
      return `serializeIntArray(${varName})`;
    case "string[]":
      return `serializeStringArray(${varName})`;
    default:
      return `to_string(${varName})`;
  }
}

function cppStringLiteral(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// --- C helpers ---

function cType(t: string): string {
  const map: Record<string, string> = {
    integer: "int",
    string: "char*",
    boolean: "int",
    float: "double",
    "integer[]": "int*",
    "string[]": "char**",
  };
  return map[t] || "void*";
}

function cStringLiteral(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
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
