import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { eq } from "drizzle-orm";

import { db } from "./index";
import { problem, user } from "./schema";

import type { NewProblem } from "./schema/problems";

interface ExampleProblem {
  title: string;
  slug: string;
  description: string;
  editorial?: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  displayOrder: number;
  isActive: boolean;
  functionSignature: {
    fnName: string;
    params: Array<{ name: string; type: string }>;
    returnType: string;
  };
  testCases: Array<{
    args?: string[];
    expected?: string;
    isPublic: boolean;
  }>;
}

// Maps generic types to language-specific types
const TYPE_MAP: Record<string, Record<string, string>> = {
  py: {
    integer: "int",
    string: "str",
    boolean: "bool",
    float: "float",
    "integer[]": "list[int]",
    "string[]": "list[str]",
  },
  js: {
    integer: "number",
    string: "string",
    boolean: "boolean",
    float: "number",
    "integer[]": "number[]",
    "string[]": "string[]",
  },
  ts: {
    integer: "number",
    string: "string",
    boolean: "boolean",
    float: "number",
    "integer[]": "number[]",
    "string[]": "string[]",
  },
  java: {
    integer: "int",
    string: "String",
    boolean: "boolean",
    float: "double",
    "integer[]": "int[]",
    "string[]": "String[]",
  },
  cpp: {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "double",
    "integer[]": "vector<int>",
    "string[]": "vector<string>",
  },
  c: {
    integer: "int",
    string: "char*",
    boolean: "int",
    float: "double",
    "integer[]": "int*",
    "string[]": "char**",
  },
  rs: {
    integer: "i32",
    string: "String",
    boolean: "bool",
    float: "f64",
    "integer[]": "Vec<i32>",
    "string[]": "Vec<String>",
  },
  go: {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "float64",
    "integer[]": "[]int",
    "string[]": "[]string",
  },
  rb: {
    integer: "Integer",
    string: "String",
    boolean: "Boolean",
    float: "Float",
    "integer[]": "Array<Integer>",
    "string[]": "Array<String>",
  },
  php: {
    integer: "int",
    string: "string",
    boolean: "bool",
    float: "float",
    "integer[]": "array",
    "string[]": "array",
  },
};

function generateStarterCode(sig: ExampleProblem["functionSignature"]): Record<string, string> {
  const goRetType = TYPE_MAP.go?.[sig.returnType] || "interface{}";
  const goParams = sig.params.map((p) => `${p.name} ${TYPE_MAP.go?.[p.type] || "interface{}"}`).join(", ");
  const rsRetType = TYPE_MAP.rs?.[sig.returnType] || "i32";
  const rsParams = sig.params.map((p) => `${p.name}: ${TYPE_MAP.rs?.[p.type] || "i32"}`).join(", ");
  const phpRetType = TYPE_MAP.php?.[sig.returnType] || "mixed";
  const phpParams = sig.params.map((p) => `${TYPE_MAP.php?.[p.type] || "mixed"} $${p.name}`).join(", ");

  return {
    py: `class Solution:\n    def ${sig.fnName}(self, ${sig.params.map((p) => `${p.name}: ${TYPE_MAP.py?.[p.type] || "Any"}`).join(", ")}) -> ${TYPE_MAP.py?.[sig.returnType] || "Any"}:\n        # Your code here\n        pass`,
    js: `class Solution {\n    /**\n${sig.params.map((p) => `     * @param {${TYPE_MAP.js?.[p.type] || "any"}} ${p.name}`).join("\n")}\n     * @return {${TYPE_MAP.js?.[sig.returnType] || "any"}}\n     */\n    ${sig.fnName}(${sig.params.map((p) => p.name).join(", ")}) {\n        // Your code here\n    }\n}`,
    ts: `class Solution {\n    ${sig.fnName}(${sig.params.map((p) => `${p.name}: ${TYPE_MAP.ts?.[p.type] || "any"}`).join(", ")}): ${TYPE_MAP.ts?.[sig.returnType] || "any"} {\n        // Your code here\n    }\n}`,
    java: `class Solution {\n    public ${TYPE_MAP.java?.[sig.returnType] || "void"} ${sig.fnName}(${sig.params.map((p) => `${TYPE_MAP.java?.[p.type] || "Object"} ${p.name}`).join(", ")}) {\n        // Your code here\n        return ${sig.returnType.includes("[]") && TYPE_MAP.java?.[sig.returnType] ? "new " + (TYPE_MAP.java[sig.returnType] ?? "Object[]").replace("[]", "[0]") : sig.returnType === "boolean" ? "false" : "0"};\n    }\n}`,
    cpp: `class Solution {\npublic:\n    ${TYPE_MAP.cpp?.[sig.returnType] || "void"} ${sig.fnName}(${sig.params.map((p) => `${TYPE_MAP.cpp?.[p.type] || "auto"} ${p.name}`).join(", ")}) {\n        // Your code here\n    }\n};`,
    c: `${TYPE_MAP.c?.[sig.returnType] || "void"} ${sig.fnName}(${sig.params.map((p) => `${TYPE_MAP.c?.[p.type] || "void*"} ${p.name}`).join(", ")}) {\n    // Your code here\n}`,
    rs: `struct Solution;\n\nimpl Solution {\n    pub fn ${sig.fnName}(&self, ${rsParams}) -> ${rsRetType} {\n        todo!()\n    }\n}`,
    go: `func ${sig.fnName}(${goParams}) ${goRetType} {\n\t// Your code here\n\treturn ${goRetType === "int" ? "0" : goRetType === "bool" ? "false" : goRetType === "float64" ? "0.0" : goRetType === "string" ? `""` : "nil"}\n}`,
    rb: `class Solution\n    def ${sig.fnName}(${sig.params.map((p) => p.name).join(", ")})\n        # Your code here\n    end\nend`,
    php: `class Solution {\n    public function ${sig.fnName}(${phpParams}): ${phpRetType} {\n        // Your code here\n    }\n}`,
  };
}

function transformProblem(example: ExampleProblem): NewProblem {
  const starterCode = generateStarterCode(example.functionSignature);

  return {
    slug: example.slug,
    title: example.title,
    description: example.description,
    editorial: example.editorial ?? null,
    difficulty: example.difficulty,
    tags: example.tags,
    testCases: example.testCases,
    functionSignature: example.functionSignature,
    starterCode,
    displayOrder: example.displayOrder,
    isActive: example.isActive,
  };
}

async function seed() {
  console.log("Starting seed...\n");

  // Find first admin user
  const [admin] = await db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .where(eq(user.isAdmin, true))
    .limit(1);

  if (!admin) {
    console.warn("No admin user found. Seeding problems without admin context.");
  } else {
    console.log(`Found admin: ${admin.name} (${admin.email})\n`);
  }

  // Read all example JSON files
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const examplesDir = resolve(__dirname, "../../../examples");
  const files = await readdir(examplesDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort();

  console.log(`Found ${jsonFiles.length} example problems:\n`);

  let inserted = 0;

  for (const file of jsonFiles) {
    const content = await readFile(resolve(examplesDir, file), "utf-8");
    const example = JSON.parse(content) as ExampleProblem;
    const data = transformProblem(example);

    // Upsert: insert or update on slug conflict
    const [result] = await db
      .insert(problem)
      .values(data)
      .onConflictDoUpdate({
        target: problem.slug,
        set: {
          title: data.title,
          description: data.description,
          editorial: data.editorial,
          difficulty: data.difficulty,
          tags: data.tags,
          testCases: data.testCases,
          functionSignature: data.functionSignature,
          starterCode: data.starterCode,
          displayOrder: data.displayOrder,
          isActive: data.isActive,
        },
      })
      .returning({ id: problem.id, slug: problem.slug });

    if (result) {
      console.log(`  ${result.slug} (id: ${result.id})`);
      inserted++;
    }
  }

  console.log(`\nDone! Upserted ${inserted} problems.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
