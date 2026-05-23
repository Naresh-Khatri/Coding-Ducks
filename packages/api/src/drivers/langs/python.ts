import type { TestData } from "../types";

export function generatePythonDriver(
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
