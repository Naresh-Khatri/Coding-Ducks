import type { FunctionSignature } from "@acme/db/schema";

import type { TestData } from "../types";

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

export function generateCppDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const cppRetType = cppType(returnType);

  const parseStatements = params
    .map(
      (p, i) =>
        `        ${cppType(p.type)} arg${i} = ${cppParseExpr(p.type, `args[${i}]`)};`,
    )
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");
  const serializeResult = cppSerialize("actual", returnType);

  const argsInit = testData
    .map(
      (td) =>
        `{${td.args.map((a) => cppStringLiteral(a)).join(", ")}}`,
    )
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

