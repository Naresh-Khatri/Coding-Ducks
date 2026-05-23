import type { FunctionSignature, TestCase } from "@acme/db/schema";

import type { DriverGenerator, TestData } from "./types";
import { generateCDriver } from "./langs/c";
import { generateCppDriver } from "./langs/cpp";
import { generateGoDriver } from "./langs/go";
import { generateJavaDriver } from "./langs/java";
import { generateJSDriver } from "./langs/javascript";
import { generatePhpDriver } from "./langs/php";
import { generatePythonDriver } from "./langs/python";
import { generateRubyDriver } from "./langs/ruby";
import { generateRustDriver } from "./langs/rust";
import { generateTSDriver } from "./langs/typescript";

export type { TestData } from "./types";

export const SUPPORTED_LANGS = [
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
] as const;

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

const drivers: Record<string, DriverGenerator["generate"]> = {
  py: generatePythonDriver,
  js: generateJSDriver,
  ts: generateTSDriver,
  java: generateJavaDriver,
  cpp: generateCppDriver,
  c: generateCDriver,
  rs: generateRustDriver,
  go: generateGoDriver,
  rb: generateRubyDriver,
  php: generatePhpDriver,
};

/**
 * Generate type-aware driver code that embeds all test cases,
 * parses args to native types, and compares serialized results.
 */
export function generateDriverWithTestCases(
  userCode: string,
  lang: string,
  signature: FunctionSignature,
  testCases: TestCase[],
  hidePrivate = false,
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

  const generate = drivers[lang];
  if (!generate) {
    throw new Error(`Unsupported language: ${lang}`);
  }
  return generate(userCode, fnName, testData, params, returnType);
}
