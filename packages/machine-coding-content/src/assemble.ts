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

import type {
  MachineCodingCategory,
  MachineCodingProblem,
  MachineCodingVariant,
} from "./types";

/** The base (React / TypeScript) implementation, modelled as a variant. */
function baseVariant(p: MachineCodingProblem): MachineCodingVariant {
  const ui = p.category === "ui-component";
  return {
    id: ui ? "react" : "ts",
    label: ui ? "React" : "TypeScript",
    templateId: p.templateId,
    starterFiles: p.starterFiles,
    solutionFiles: p.solutionFiles,
    testFiles: p.testFiles,
  };
}

/** Every selectable variant of a problem, base first. */
export function allVariants(p: MachineCodingProblem): MachineCodingVariant[] {
  return [baseVariant(p), ...(p.variants ?? [])];
}

/** Selector options (id + label) for the workspace, base first. */
export function listVariants(
  p: MachineCodingProblem,
): { id: string; label: string }[] {
  return allVariants(p).map((v) => ({ id: v.id, label: v.label }));
}

/** Resolve a variant by id, falling back to the base when absent/unknown. */
export function resolveVariant(
  p: MachineCodingProblem,
  variantId?: string,
): MachineCodingVariant {
  const base = baseVariant(p);
  if (!variantId) return base;
  return (p.variants ?? []).find((v) => v.id === variantId) ?? base;
}

/** Reference solution files for the chosen variant (falls back to base). */
export function solutionFilesFor(
  p: MachineCodingProblem,
  variantId?: string,
): Record<string, string> {
  return resolveVariant(p, variantId).solutionFiles;
}

/** UI frameworks supported by the test harness. */
type Framework = "react" | "vue" | "svelte" | "none";

/** Which framework a template targets — drives the vitest plugin + test deps. */
function frameworkOf(templateId: string): Framework {
  if (templateId.startsWith("react")) return "react";
  if (templateId.startsWith("vue")) return "vue";
  if (templateId.startsWith("svelte")) return "svelte";
  return "none";
}

// Pinned to versions that play nicely with the Vite 6 templates and boot
// reliably inside the WebContainer.
const VITEST_DEP = { vitest: "^3.0.0" } as const;
// Shared DOM test tooling; the framework's own Testing Library is added on top.
const DOM_DEPS = {
  jsdom: "^25.0.1",
  "@testing-library/jest-dom": "^6.6.3",
  "@testing-library/user-event": "^14.5.2",
} as const;
const TESTING_LIBRARY_DEP: Record<Framework, Record<string, string>> = {
  react: { "@testing-library/react": "^16.1.0" },
  vue: { "@testing-library/vue": "^8.1.0" },
  svelte: { "@testing-library/svelte": "^5.2.4" },
  none: {},
};

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
    throw new Error(
      "machine-coding-content: template package.json is not valid JSON",
    );
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

/** The vite plugin import + call for a framework's vitest config. */
const FRAMEWORK_PLUGIN: Record<Framework, { import: string; call: string }> = {
  react: { import: `import react from "@vitejs/plugin-react";`, call: "react()" },
  vue: { import: `import vue from "@vitejs/plugin-vue";`, call: "vue()" },
  svelte: {
    import: `import { svelte } from "@sveltejs/vite-plugin-svelte";`,
    call: "svelte()",
  },
  none: { import: "", call: "" },
};

function vitestConfig(
  category: MachineCodingCategory,
  framework: Framework,
): string {
  if (needsDom(category)) {
    const plugin = FRAMEWORK_PLUGIN[framework];
    // Svelte testing resolves the component's browser build under jsdom.
    const resolve =
      framework === "svelte" ? `\n  resolve: { conditions: ["browser"] },` : "";
    return `import { defineConfig } from "vitest/config";
${plugin.import}

export default defineConfig({
  plugins: [${plugin.call}],${resolve}
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
    setupFiles: ["./vitest.setup.ts"],
  },
});
`;
}

/** DOM problems also need jest-dom matchers; prepended to the setup file. */
const JEST_DOM_SETUP = `import "@testing-library/jest-dom/vitest";
`;

/**
 * Console capture injected into every problem's vitest setup. Patches the
 * `console.*` methods so anything the user's code logs while the suite runs is
 * mirrored to `.mc-console.json`, which the workspace's Console tab reads to
 * show a GreatFrontend-style log view. Patching here (a setup file) rather than
 * inside `cases()` means logs from anywhere in the user's code are captured,
 * not just those emitted inside a harness case.
 */
const CONSOLE_CAPTURE = `import { afterAll } from "vitest";
import { writeFileSync } from "node:fs";

type McConsoleEntry = { level: string; text: string };
const __mcConsole: McConsoleEntry[] = [];

// Compact, single-line rendering so logged values stay readable in the panel.
function __mcFmt(value: unknown, depth = 0): string {
  if (value === null) return "null";
  const t = typeof value;
  if (t === "undefined") return "undefined";
  if (t === "string") return depth === 0 ? (value as string) : JSON.stringify(value);
  if (t === "number" || t === "boolean" || t === "bigint") return String(value);
  if (t === "symbol") return (value as symbol).toString();
  if (t === "function")
    return "\\u0192 " + ((value as { name?: string }).name || "anonymous") + "()";
  if (value instanceof Error)
    return value.stack || value.name + ": " + value.message;
  if (depth >= 4) return Array.isArray(value) ? "[Array]" : "[Object]";
  try {
    if (Array.isArray(value)) {
      const items = value.slice(0, 100).map((v) => __mcFmt(v, depth + 1));
      return "[" + items.join(", ") + (value.length > 100 ? ", \\u2026" : "") + "]";
    }
    const keys = Object.keys(value as object).slice(0, 100);
    const body = keys
      .map((k) => k + ": " + __mcFmt((value as Record<string, unknown>)[k], depth + 1))
      .join(", ");
    const name = (value as { constructor?: { name?: string } }).constructor?.name;
    const prefix = name && name !== "Object" ? name + " " : "";
    return prefix + "{" + body + "}";
  } catch {
    return String(value);
  }
}

for (const level of ["log", "info", "warn", "error", "debug"] as const) {
  const original = console[level].bind(console);
  console[level] = (...args: unknown[]) => {
    __mcConsole.push({ level, text: args.map((a) => __mcFmt(a)).join(" ") });
    original(...args);
  };
}

afterAll(() => {
  try {
    writeFileSync(".mc-console.json", JSON.stringify(__mcConsole));
  } catch {
    // best-effort — the Console tab simply shows nothing
  }
});
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
  variantId?: string,
): Record<string, string> {
  // Each variant brings its own template + starter files; tests come from the
  // variant when it supplies them (framework variants must), otherwise the
  // problem's shared base tests (the JS/TS toggle reuses one suite).
  const variant = resolveVariant(problem, variantId);
  const testFiles = variant.testFiles ?? problem.testFiles;
  const framework = frameworkOf(variant.templateId);

  const template = getTemplate(variant.templateId);
  if (!template) {
    throw new Error(
      `machine-coding-content: unknown templateId "${variant.templateId}" for problem "${problem.slug}"`,
    );
  }

  const files: Record<string, string> = {
    ...template.files,
    ...variant.starterFiles,
    ...testFiles,
    // Always available for tests to import from "./mc-test".
    "src/mc-test.ts": MC_TEST_HARNESS,
  };

  const dom = needsDom(problem.category);
  const extraDeps = dom
    ? { ...VITEST_DEP, ...DOM_DEPS, ...TESTING_LIBRARY_DEP[framework] }
    : { ...VITEST_DEP };

  files["package.json"] = mergePackageJson(
    files["package.json"] ?? template.files["package.json"] ?? "{}",
    extraDeps,
    { test: "vitest run" },
  );

  // Author-provided config wins; otherwise generate one from the framework.
  if (!files["vitest.config.ts"] && !files["vitest.config.js"]) {
    files["vitest.config.ts"] = vitestConfig(problem.category, framework);
  }
  // Every problem gets a setup file that mirrors console output to the Console
  // tab; DOM problems also pull in jest-dom matchers.
  files["vitest.setup.ts"] ??= dom
    ? JEST_DOM_SETUP + CONSOLE_CAPTURE
    : CONSOLE_CAPTURE;

  return files;
}
