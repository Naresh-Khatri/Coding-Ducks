import type { TestData } from "../types";

export function generatePhpDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
): string {
  return `<?php

// User code
${userCode}

function parseArg($valueStr, $typeName) {
    if ($typeName === "integer") return intval($valueStr);
    if ($typeName === "float") return floatval($valueStr);
    if ($typeName === "string") return json_decode($valueStr);
    if ($typeName === "boolean") return json_decode($valueStr);
    if (str_ends_with($typeName, "[]")) return json_decode($valueStr, true);
    return json_decode($valueStr);
}

function serialize_val($val) {
    return json_encode($val, JSON_UNESCAPED_UNICODE);
}

$testCases = json_decode(${JSON.stringify(JSON.stringify(testData))}, true);

$results = [];
$sol = new Solution();

foreach ($testCases as $tc) {
    try {
        $args = [];
        foreach ($tc["args"] as $i => $argStr) {
            $args[] = parseArg($argStr, $tc["paramTypes"][$i]);
        }
        $actual = $sol->${fnName}(...$args);
        $actualStr = serialize_val($actual);
        $expectedParsed = json_decode($tc["expected"]);
        $expectedStr = serialize_val($expectedParsed);
        $passed = $actualStr === $expectedStr;
        $results[] = [
            "index" => $tc["index"],
            "passed" => $passed,
            "actual" => $tc["isPublic"] ? $actualStr : null,
            "isPublic" => $tc["isPublic"]
        ];
    } catch (\\Throwable $e) {
        $results[] = [
            "index" => $tc["index"],
            "passed" => false,
            "error" => $e->getMessage(),
            "isPublic" => $tc["isPublic"]
        ];
    }
}

echo json_encode($results) . "\\n";
`;
}

