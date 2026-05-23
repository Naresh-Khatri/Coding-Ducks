import type { FunctionSignature } from "@acme/db/schema";

import type { TestData } from "../types";

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
      `{${arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(", ")}}`,
  );
  return `new String[][] {${rows.join(", ")}}`;
}

function javaStringArrayLiteral1D(arr: string[]): string {
  return `new String[] {${arr.map((s) => `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`).join(", ")}}`;
}

export function generateJavaDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const javaReturnType = javaType(returnType);
  const parseStatements = params
    .map(
      (p, i) =>
        `                ${javaType(p.type)} arg${i} = ${javaParseExpr(p.type, `args[${i}]`)};`,
    )
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");
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
