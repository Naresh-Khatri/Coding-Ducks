import type { FunctionSignature } from "@acme/db/schema";

import type { TestData } from "../types";

function goType(t: string): string {
  const map: Record<string, string> = {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "float64",
    "integer[]": "[]int",
    "string[]": "[]string",
  };
  return map[t] || "interface{}";
}

function goParseExpr(type: string, argExpr: string): string {
  switch (type) {
    case "integer":
      return `func() int { v, _ := strconv.Atoi(strings.TrimSpace(${argExpr})); return v }()`;
    case "float":
      return `func() float64 { v, _ := strconv.ParseFloat(strings.TrimSpace(${argExpr}), 64); return v }()`;
    case "string":
      return `stripQuotes(${argExpr})`;
    case "boolean":
      return `(strings.TrimSpace(${argExpr}) == "true")`;
    case "integer[]":
      return `parseIntArray(${argExpr})`;
    case "string[]":
      return `parseStringArray(${argExpr})`;
    default:
      return argExpr;
  }
}

function goSerialize(varName: string, type: string): string {
  switch (type) {
    case "integer":
      return `strconv.Itoa(${varName})`;
    case "float":
      return `strconv.FormatFloat(${varName}, 'f', -1, 64)`;
    case "string":
      return `"\\\"" + ${varName} + "\\\"" `;
    case "boolean":
      return `strconv.FormatBool(${varName})`;
    case "integer[]":
      return `serializeIntArray(${varName})`;
    case "string[]":
      return `serializeStringArray(${varName})`;
    default:
      return `fmt.Sprintf("%v", ${varName})`;
  }
}

function goStringLiteral(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Determine which imports Go needs based on the types used */
function goImports(
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const allTypes = [...params.map((p) => p.type), returnType];
  const needs = {
    fmt: true, // always need fmt for Println
    strings: true, // always need for TrimSpace/parsing
    strconv: allTypes.some((t) =>
      ["integer", "float", "boolean", "integer[]"].includes(t),
    ),
  };

  const imports = ["fmt", "strings"];
  if (needs.strconv) imports.push("strconv");

  return imports.map((i) => `\t"${i}"`).join("\n");
}

export function generateGoDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const goRetType = goType(returnType);

  const parseStatements = params
    .map(
      (p, i) =>
        `\t\targ${i} := ${goParseExpr(p.type, `args[${i}]`)}`,
    )
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");
  const serializeResult = goSerialize("actual", returnType);

  const argsInit = testData
    .map(
      (td) =>
        `{${td.args.map((a) => goStringLiteral(a)).join(", ")}}`,
    )
    .join(",\n\t\t");

  return `package main

import (
${goImports(params, returnType)}
)

// User code
${userCode}

func parseIntArray(s string) []int {
\ts = strings.TrimSpace(s)
\tif len(s) < 2 { return []int{} }
\tinner := s[1 : len(s)-1]
\tif strings.TrimSpace(inner) == "" { return []int{} }
\tparts := strings.Split(inner, ",")
\tresult := make([]int, len(parts))
\tfor i, p := range parts {
\t\tresult[i], _ = strconv.Atoi(strings.TrimSpace(p))
\t}
\treturn result
}

func parseStringArray(s string) []string {
\ts = strings.TrimSpace(s)
\tif len(s) < 2 { return []string{} }
\tinner := s[1 : len(s)-1]
\tif strings.TrimSpace(inner) == "" { return []string{} }
\tvar result []string
\tinStr := false
\tcur := ""
\tfor _, c := range inner {
\t\tif c == '"' { inStr = !inStr } else if c == ',' && !inStr { result = append(result, cur); cur = "" } else { cur += string(c) }
\t}
\tif cur != "" { result = append(result, cur) }
\treturn result
}

func stripQuotes(s string) string {
\ts = strings.TrimSpace(s)
\tif len(s) >= 2 && s[0] == '"' && s[len(s)-1] == '"' {
\t\treturn s[1 : len(s)-1]
\t}
\treturn s
}

func serializeIntArray(arr []int) string {
\tr := "["
\tfor i, v := range arr {
\t\tif i > 0 { r += "," }
\t\tr += strconv.Itoa(v)
\t}
\tr += "]"
\treturn r
}

func serializeStringArray(arr []string) string {
\tr := "["
\tfor i, v := range arr {
\t\tif i > 0 { r += "," }
\t\tr += "\\"" + v + "\\""
\t}
\tr += "]"
\treturn r
}

func escapeJson(s string) string {
\ts = strings.ReplaceAll(s, "\\\\", "\\\\\\\\")
\ts = strings.ReplaceAll(s, "\\"", "\\\\\\"")
\treturn s
}

func main() {
\tallArgs := [][]string{
\t\t${argsInit},
\t}
\tallExpected := []string{${testData.map((td) => goStringLiteral(td.expected)).join(", ")}}
\tallIndices := []int{${testData.map((td) => td.index).join(", ")}}
\tallIsPublic := []bool{${testData.map((td) => td.isPublic).join(", ")}}

\tjsonOut := "["

\tfor t := 0; t < len(allArgs); t++ {
\t\targs := allArgs[t]
\t\tif t > 0 { jsonOut += "," }

\t\tfunc() {
\t\t\tdefer func() {
\t\t\t\tif r := recover(); r != nil {
\t\t\t\t\tmsg := fmt.Sprintf("%v", r)
\t\t\t\t\tjsonOut += fmt.Sprintf("{\\"index\\":%d,\\"passed\\":false,\\"error\\":\\"%s\\",\\"isPublic\\":%t}",
\t\t\t\t\t\tallIndices[t], escapeJson(msg), allIsPublic[t])
\t\t\t\t}
\t\t\t}()

${parseStatements}
\t\t\tvar actual ${goRetType} = ${fnName}(${argList})
\t\t\tactualStr := ${serializeResult}
\t\t\texpectedStr := strings.TrimSpace(allExpected[t])
\t\t\tpassed := actualStr == expectedStr

\t\t\tjsonOut += fmt.Sprintf("{\\"index\\":%d,\\"passed\\":%t", allIndices[t], passed)
\t\t\tif allIsPublic[t] {
\t\t\t\tjsonOut += fmt.Sprintf(",\\"actual\\":\\"%s\\"", escapeJson(actualStr))
\t\t\t}
\t\t\tjsonOut += fmt.Sprintf(",\\"isPublic\\":%t}", allIsPublic[t])
\t\t}()
\t}

\tjsonOut += "]"
\tfmt.Println(jsonOut)
}
`;
}

