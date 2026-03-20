import type { FunctionSignature } from "@acme/db/schema";

import type { TestData } from "../types";

function rustType(t: string): string {
  const map: Record<string, string> = {
    integer: "i32",
    string: "String",
    boolean: "bool",
    float: "f64",
    "integer[]": "Vec<i32>",
    "string[]": "Vec<String>",
  };
  return map[t] || "i32";
}

function rustParseExpr(type: string, argExpr: string): string {
  switch (type) {
    case "integer":
      return `${argExpr}.trim().parse::<i32>().unwrap()`;
    case "float":
      return `${argExpr}.trim().parse::<f64>().unwrap()`;
    case "string":
      return `strip_quotes(${argExpr})`;
    case "boolean":
      return `${argExpr}.trim() == "true"`;
    case "integer[]":
      return `parse_int_array(${argExpr})`;
    case "string[]":
      return `parse_string_array(${argExpr})`;
    default:
      return `${argExpr}.to_string()`;
  }
}

function rustSerialize(varName: string, type: string): string {
  switch (type) {
    case "integer":
      return `format!("{}", ${varName})`;
    case "float":
      return `format!("{}", ${varName})`;
    case "string":
      return `format!("\\\"{}\\\"", ${varName})`;
    case "boolean":
      return `format!("{}", ${varName})`;
    case "integer[]":
      return `serialize_int_array(&${varName})`;
    case "string[]":
      return `serialize_string_array(&${varName})`;
    default:
      return `format!("{}", ${varName})`;
  }
}

function rustStringLiteral(s: string): string {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

export function generateRustDriver(
  userCode: string,
  fnName: string,
  testData: TestData[],
  params: FunctionSignature["params"],
  returnType: string,
): string {
  const rustRetType = rustType(returnType);

  const parseStatements = params
    .map(
      (p, i) =>
        `        let arg${i}: ${rustType(p.type)} = ${rustParseExpr(p.type, `args[${i}]`)};`,
    )
    .join("\n");

  const argList = params.map((_, i) => `arg${i}`).join(", ");
  const serializeResult = rustSerialize("actual", returnType);

  const argsInit = testData
    .map(
      (td) =>
        `vec![${td.args.map((a) => `${rustStringLiteral(a)}.to_string()`).join(", ")}]`,
    )
    .join(",\n        ");

  return `
// User code
${userCode}

fn parse_int_array(s: &str) -> Vec<i32> {
    let s = s.trim();
    if s.len() < 2 { return vec![]; }
    let inner = &s[1..s.len()-1];
    if inner.trim().is_empty() { return vec![]; }
    inner.split(',').map(|x| x.trim().parse::<i32>().unwrap()).collect()
}

fn parse_string_array(s: &str) -> Vec<String> {
    let s = s.trim();
    if s.len() < 2 { return vec![]; }
    let inner = &s[1..s.len()-1];
    if inner.trim().is_empty() { return vec![]; }
    let mut result = vec![];
    let mut in_str = false;
    let mut cur = String::new();
    for c in inner.chars() {
        if c == '"' { in_str = !in_str; }
        else if c == ',' && !in_str { result.push(cur.clone()); cur.clear(); }
        else { cur.push(c); }
    }
    if !cur.is_empty() { result.push(cur); }
    result
}

fn strip_quotes(s: &str) -> String {
    let s = s.trim();
    if s.len() >= 2 && s.starts_with('"') && s.ends_with('"') {
        s[1..s.len()-1].to_string()
    } else {
        s.to_string()
    }
}

fn serialize_int_array(arr: &[i32]) -> String {
    let parts: Vec<String> = arr.iter().map(|x| x.to_string()).collect();
    format!("[{}]", parts.join(","))
}

fn serialize_string_array(arr: &[String]) -> String {
    let parts: Vec<String> = arr.iter().map(|x| format!("\\\"{}\\\"", x)).collect();
    format!("[{}]", parts.join(","))
}

fn escape_json(s: &str) -> String {
    s.replace('\\\\', "\\\\\\\\").replace('"', "\\\\\\\"")
}

fn main() {
    let all_args: Vec<Vec<String>> = vec![
        ${argsInit}
    ];
    let all_expected: Vec<&str> = vec![${testData.map((td) => rustStringLiteral(td.expected)).join(", ")}];
    let all_indices: Vec<usize> = vec![${testData.map((td) => td.index).join(", ")}];
    let all_is_public: Vec<bool> = vec![${testData.map((td) => td.isPublic).join(", ")}];

    let mut json_out = String::from("[");
    let sol = Solution;

    for t in 0..all_args.len() {
        let args = &all_args[t];
        if t > 0 { json_out.push(','); }

        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
${parseStatements}
            let actual: ${rustRetType} = sol.${fnName}(${argList});
            ${serializeResult}
        }));

        match result {
            Ok(actual_str) => {
                let expected_str = all_expected[t].trim();
                let passed = actual_str == expected_str;
                json_out.push_str(&format!("{{\\"index\\":{},\\"passed\\":{}", all_indices[t], passed));
                if all_is_public[t] {
                    json_out.push_str(&format!(",\\"actual\\":\\"{}\\\"", escape_json(&actual_str)));
                }
                json_out.push_str(&format!(",\\"isPublic\\":{}}}", all_is_public[t]));
            }
            Err(e) => {
                let msg = if let Some(s) = e.downcast_ref::<&str>() {
                    s.to_string()
                } else if let Some(s) = e.downcast_ref::<String>() {
                    s.clone()
                } else {
                    "Runtime Error".to_string()
                };
                json_out.push_str(&format!(
                    "{{\\"index\\":{},\\"passed\\":false,\\"error\\":\\"{}\\",\\"isPublic\\":{}}}",
                    all_indices[t], escape_json(&msg), all_is_public[t]
                ));
            }
        }
    }

    json_out.push(']');
    println!("{}", json_out);
}
`;
}

