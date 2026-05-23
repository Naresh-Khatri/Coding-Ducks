import type { TestData } from "../types";

export function generateJSDriver(
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
