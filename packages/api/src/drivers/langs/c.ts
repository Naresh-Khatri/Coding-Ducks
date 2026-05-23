import type { FunctionSignature } from "@acme/db/schema";

import type { TestData } from "../types";

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

export function generateCDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const cRetType = cType(returnType);
  const isArrayReturn = returnType.endsWith("[]");

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
    .map((td) => `{${td.args.map((a) => cStringLiteral(a)).join(", ")}}`)
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
