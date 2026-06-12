/**
 * Assembles the files a learner actually gets when they start a problem, and
 * injects a vitest harness so every problem is runnable without each problem
 * file repeating the same boilerplate.
 *
 * Layering (later wins):
 *   template files  ⊕  problem.starterFiles  ⊕  problem.testFiles  ⊕  harness
 *
 * The harness (a `package.json` with the right test deps, a `vitest.config.ts`,
 * and — for DOM problems — a jest-dom setup file) is generated from the
 * problem's `category`, so authors only write the stub, the solution, and the
 * test suite.
 */
import { getTemplate } from "@acme/ducklet-fs";

import type { MachineCodingCategory, MachineCodingProblem } from "./types";

// Pinned to versions that play nicely with the React 19 + Vite 6 templates and
// boot reliably inside the WebContainer.
const VITEST_DEP = { vitest: "^3.0.0" } as const;
const DOM_DEPS = {
  jsdom: "^25.0.1",
  "@testing-library/react": "^16.1.0",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.5.2",
} as const;

/** UI work needs a DOM + Testing Library; pure utilities run in plain Node. */
function needsDom(category: MachineCodingCategory): boolean {
  return category !== "js-utility";
}

/** Merge extra devDependencies + scripts into a package.json source string. */
function mergePackageJson(
  raw: string,
  extraDevDeps: Record<string, string>,
  extraScripts: Record<string, string>,
): string {
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("machine-coding-content: template package.json is not valid JSON");
  }
  const devDependencies = {
    ...(parsed.devDependencies as Record<string, string> | undefined),
    ...extraDevDeps,
  };
  const scripts = {
    ...(parsed.scripts as Record<string, string> | undefined),
    ...extraScripts,
  };
  return (
    JSON.stringify({ ...parsed, scripts, devDependencies }, null, 2) + "\n"
  );
}

function vitestConfig(category: MachineCodingCategory): string {
  if (needsDom(category)) {
    return `import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    css: false,
  },
});
`;
  }
  return `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
  },
});
`;
}

const VITEST_SETUP = `import "@testing-library/jest-dom/vitest";
`;

/**
 * Shared test harness injected into every problem. `cases()` runs a table of
 * input → expected checks and records each case's actual values to
 * `.mc-cases.json`, which the Tests panel reads to show Input / Expected /
 * Received per case. Authors opt in by importing it from "./mc-test"; ad-hoc
 * \`it(...)\` specs keep working and just don't get value capture.
 */
const MC_TEST_HARNESS = `import { afterAll, describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";

type Case = {
  name: string;
  /** Shown as "Input" — a value, or a short description of the actions. */
  input: unknown;
  /** Shown as "Expected output" and asserted against the received value. */
  expected: unknown;
  /** Produces the received value (may be async). Defaults to fn(input). */
  run?: (input: unknown) => unknown | Promise<unknown>;
};

type CaseRecord = {
  name: string;
  input: string;
  expected: string;
  received: string;
  passed: boolean;
};

const collected: CaseRecord[] = [];

// Compact, single-line rendering (\`[1, [2, [3, [4]], 5]]\`) — the Tests panel
// wraps long lines, so values stay readable without exploding vertically.
function fmt(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  const t = typeof value;
  if (t === "string") return JSON.stringify(value);
  if (t !== "object") return String(value);
  try {
    if (Array.isArray(value)) {
      return "[" + value.map((v) => fmt(v)).join(", ") + "]";
    }
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => JSON.stringify(k) + ": " + fmt(v),
    );
    return "{" + entries.join(", ") + "}";
  } catch {
    return String(value);
  }
}

/**
 * Run a table of input -> expected cases. Two forms:
 *   cases(suite, fn, list)  // received defaults to fn(input)
 *   cases(suite, list)      // each case supplies its own run()
 * Every case may provide run() to override (and it can be async).
 */
export function cases(
  suite: string,
  fnOrList: ((input: unknown) => unknown) | Case[],
  maybeList?: Case[],
): void {
  const fn = Array.isArray(fnOrList) ? undefined : fnOrList;
  const list = Array.isArray(fnOrList) ? fnOrList : (maybeList ?? []);

  describe(suite, () => {
    for (const c of list) {
      it(c.name, async () => {
        const runner = c.run ?? (fn ? (input: unknown) => fn(input) : null);
        if (!runner) {
          throw new Error(
            'cases(): "' + c.name + '" needs a run() (or pass a suite function)',
          );
        }
        let received: unknown;
        try {
          received = await runner(c.input);
        } catch (err) {
          // The run itself threw (e.g. an element wasn't found) — record the
          // error as the received value so the panel still shows the case.
          collected.push({
            name: c.name,
            input: fmt(c.input),
            expected: fmt(c.expected),
            received:
              "Error: " + (err instanceof Error ? err.message : String(err)),
            passed: false,
          });
          throw err;
        }
        const record: CaseRecord = {
          name: c.name,
          input: fmt(c.input),
          expected: fmt(c.expected),
          received: fmt(received),
          passed: true,
        };
        try {
          expect(received).toEqual(c.expected);
        } catch (err) {
          record.passed = false;
          collected.push(record);
          throw err;
        }
        collected.push(record);
      });
    }
  });

  afterAll(() => {
    try {
      writeFileSync(".mc-cases.json", JSON.stringify(collected));
    } catch {
      // best-effort — the Tests panel falls back to spec source if absent
    }
  });
}
`;

/**
 * Files seeded into the room for an attempt: template + starter overlay + tests
 * + a generated vitest harness. Never includes solution files.
 */
export function assembleStarterFiles(
  problem: MachineCodingProblem,
): Record<string, string> {
  const template = getTemplate(problem.templateId);
  if (!template) {
    throw new Error(
      `machine-coding-content: unknown templateId "${problem.templateId}" for problem "${problem.slug}"`,
    );
  }

  const files: Record<string, string> = {
    ...template.files,
    ...problem.starterFiles,
    ...problem.testFiles,
    // Always available for tests to import from "./mc-test".
    "src/mc-test.ts": MC_TEST_HARNESS,
  };

  const dom = needsDom(problem.category);
  const extraDeps = dom ? { ...VITEST_DEP, ...DOM_DEPS } : { ...VITEST_DEP };

  files["package.json"] = mergePackageJson(
    files["package.json"] ?? template.files["package.json"] ?? "{}",
    extraDeps,
    { test: "vitest run" },
  );

  // Author-provided config wins; otherwise generate one from the category.
  if (!files["vitest.config.ts"] && !files["vitest.config.js"]) {
    files["vitest.config.ts"] = vitestConfig(problem.category);
  }
  if (dom && !files["vitest.setup.ts"]) {
    files["vitest.setup.ts"] = VITEST_SETUP;
  }

  return files;
}
