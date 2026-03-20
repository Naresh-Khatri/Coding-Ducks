import type { TestData } from "../types";

export function generateRubyDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
): string {
  return `
require 'json'

# User code
${userCode}

def parse_arg(value_str, type_name)
  if type_name == "integer"
    value_str.to_i
  elsif type_name == "float"
    value_str.to_f
  elsif type_name == "string"
    JSON.parse(value_str)
  elsif type_name == "boolean"
    JSON.parse(value_str)
  elsif type_name.end_with?("[]")
    JSON.parse(value_str)
  else
    JSON.parse(value_str)
  end
end

def serialize(val)
  JSON.generate(val)
end

test_cases = JSON.parse(${JSON.stringify(JSON.stringify(testData))})

results = []
sol = Solution.new

test_cases.each do |tc|
  begin
    args = tc["args"].each_with_index.map { |arg_str, i| parse_arg(arg_str, tc["paramTypes"][i]) }
    actual = sol.${fnName}(*args)
    actual_str = serialize(actual)
    expected_parsed = JSON.parse(tc["expected"])
    expected_normalized = serialize(expected_parsed)
    passed = actual_str == expected_normalized
    results << {
      "index" => tc["index"],
      "passed" => passed,
      "actual" => tc["isPublic"] ? actual_str : nil,
      "isPublic" => tc["isPublic"]
    }
  rescue => e
    results << {
      "index" => tc["index"],
      "passed" => false,
      "error" => e.message,
      "isPublic" => tc["isPublic"]
    }
  end
end

puts JSON.generate(results)
`;
}

