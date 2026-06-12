"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import type { MachineCodingContext } from "./types";
import type { WebContainerRuntime } from "~/lib/webcontainer/use-runtime";
import { patchLocalAttempt } from "~/lib/machine-coding/local-store";
import { useTRPC } from "~/trpc/react";

/** One line of a parsed expected/received diff. */
export interface MachineCodingDiffLine {
  kind: "expected" | "received" | "context";
  text: string;
}

/** A single spec result parsed out of vitest's JSON reporter. */
export interface MachineCodingTestCase {
  /** Leaf test title (the `it`/`test` name). */
  title: string;
  /** Enclosing `describe` titles, outermost first. */
  ancestors: string[];
  passed: boolean;
  /** Assertion summary (the text before the diff), when failed. */
  message: string | null;
  /** Expected-vs-received diff parsed from the failure, when present. */
  diff: MachineCodingDiffLine[] | null;
  /**
   * Captured input / expected / received values for the case, emitted by the
   * `cases()` test harness (see assemble.ts). Present (and shown as value
   * blocks) for problems authored with that harness, whether the case passes or
   * fails; null for ad-hoc `it(...)` specs, which fall back to `source`.
   */
  input: string | null;
  expected: string | null;
  received: string | null;
  /**
   * Fallback: the spec's body source (the `expect(...)` calls) extracted from
   * the test file, shown when a case has no captured values.
   */
  source: string | null;
}

export interface MachineCodingTestRun {
  passed: number;
  total: number;
  cases: MachineCodingTestCase[];
}

/** One `console.*` line captured while the suite ran (see the setup harness). */
export interface MachineCodingConsoleEntry {
  level: "log" | "info" | "warn" | "error" | "debug";
  text: string;
}

interface MachineCodingTestsValue {
  /** WebContainer is booted and able to run the suite. */
  ready: boolean;
  running: boolean;
  /** Latest run, or null before the first run. */
  run: MachineCodingTestRun | null;
  /** Non-assertion failure (couldn't run / parse the suite). */
  error: string | null;
  /** `console.*` output captured from the latest run, oldest first. */
  consoleEntries: MachineCodingConsoleEntry[];
  /** Drop the captured console output (manual clear). */
  clearConsole: () => void;
  runTests: () => Promise<void>;
  revealed: boolean;
  reveal: () => void;
  revealPending: boolean;
  editorial: string | null;
}

const Ctx = createContext<MachineCodingTestsValue | null>(null);

export function useMachineCodingTests(): MachineCodingTestsValue {
  const value = useContext(Ctx);
  if (!value) {
    throw new Error(
      "useMachineCodingTests must be used within a MachineCodingTestsProvider",
    );
  }
  return value;
}

/**
 * Split a vitest failure into a human assertion message and a parsed
 * expected/received diff (stack trace dropped). Non-comparison failures (thrown
 * errors, etc.) come back as a message with no diff.
 */
function parseFailure(messages: string[]): {
  message: string | null;
  diff: MachineCodingDiffLine[] | null;
} {
  if (messages.length === 0) return { message: null, diff: null };

  // Drop the stack-trace tail ("    at …" / "  ❯ …").
  const lines: string[] = [];
  for (const line of messages.join("\n").split("\n")) {
    if (/^\s*(at\s|❯)/.test(line)) break;
    lines.push(line);
  }

  // vitest prints "- Expected" / "+ Received" headers (optionally with counts).
  const isExpected = (l: string) => /^-\s*Expected/.test(l.trim());
  const isReceived = (l: string) => /^\+\s*Received/.test(l.trim());
  const expIdx = lines.findIndex(isExpected);
  const recIdx = lines.findIndex(isReceived);

  if (expIdx === -1 || recIdx === -1) {
    const msg = lines.join("\n").trim();
    return { message: msg || null, diff: null };
  }

  const message = lines.slice(0, Math.min(expIdx, recIdx)).join("\n").trim();
  const body = lines.slice(Math.max(expIdx, recIdx) + 1);

  const diff: MachineCodingDiffLine[] = [];
  for (const line of body) {
    if (line.trim() === "") {
      if (diff.length > 0) diff.push({ kind: "context", text: "" });
      continue;
    }
    if (line.startsWith("- "))
      diff.push({ kind: "expected", text: line.slice(2) });
    else if (line.startsWith("+ "))
      diff.push({ kind: "received", text: line.slice(2) });
    else if (line.startsWith("  "))
      diff.push({ kind: "context", text: line.slice(2) });
    else diff.push({ kind: "context", text: line });
  }
  while (diff.length > 0 && diff[diff.length - 1]?.text === "") diff.pop();

  return { message: message || null, diff: diff.length > 0 ? diff : null };
}

interface VitestAssertion {
  title?: string;
  ancestorTitles?: string[];
  status?: string;
  failureMessages?: string[];
}
interface VitestJson {
  numPassedTests?: number;
  numTotalTests?: number;
  testResults?: { assertionResults?: VitestAssertion[] }[];
}

/** Parse vitest `--reporter=json` output into a structured per-spec run. */
export function parseTestRun(raw: string): MachineCodingTestRun | null {
  const tryParse = (s: string): VitestJson | null => {
    try {
      return JSON.parse(s) as VitestJson;
    } catch {
      return null;
    }
  };
  let json = tryParse(raw);
  if (!json) {
    // The reporter can be preceded by npm/install noise — grab the JSON object.
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) json = tryParse(raw.slice(start, end + 1));
  }
  if (!json || typeof json.numTotalTests !== "number") return null;

  const cases: MachineCodingTestCase[] = [];
  for (const file of json.testResults ?? []) {
    for (const a of file.assertionResults ?? []) {
      const passed = a.status === "passed";
      const failure = passed
        ? { message: null, diff: null }
        : parseFailure(a.failureMessages ?? []);
      cases.push({
        title: a.title ?? "(unnamed test)",
        ancestors: a.ancestorTitles ?? [],
        passed,
        message: failure.message,
        diff: failure.diff,
        input: null,
        expected: null,
        received: null,
        source: null,
      });
    }
  }
  return { passed: json.numPassedTests ?? 0, total: json.numTotalTests, cases };
}

/** Strip the common leading indentation from a block of lines. */
function dedent(text: string): string {
  const lines = text.split("\n");
  const indents = lines
    .filter((l) => l.trim() !== "")
    .map((l) => /^\s*/.exec(l)?.[0].length ?? 0);
  const min = indents.length > 0 ? Math.min(...indents) : 0;
  return lines
    .map((l) => l.slice(min))
    .join("\n")
    .trim();
}

/** Capture a brace-delimited block body starting at the first `{` in `s`. */
function captureBlock(s: string): string | null {
  const open = s.indexOf("{");
  if (open === -1) return null;
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    if (s[i] === "{") depth++;
    else if (s[i] === "}" && --depth === 0) {
      return dedent(s.slice(open + 1, i));
    }
  }
  return null;
}

/** Capture an expression up to the `)` that closes the enclosing call. */
function captureExpr(s: string): string | null {
  let depth = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "(") depth++;
    else if (s[i] === ")") {
      if (depth === 0) return s.slice(0, i).trim();
      depth--;
    }
  }
  return null;
}

/**
 * Map each `it`/`test` title to its callback body source. A light brace-matched
 * scan (not a full parser) — good enough to surface the assertion code; it
 * tolerates string-literal titles and block or implicit-return callbacks, and
 * simply omits anything it can't parse.
 */
function extractSpecBodies(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re =
    /\b(?:it|test)\b\s*(?:\.\w+)?\s*\(\s*(['"`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null) {
    const rawTitle = m[2];
    if (rawTitle === undefined) continue;
    const title = rawTitle.replace(/\\(['"`])/g, "$1");
    const rest = source.slice(re.lastIndex);
    const arrow = rest.indexOf("=>");
    let body: string | null = null;
    if (arrow !== -1) {
      let j = arrow + 2;
      while (j < rest.length && /\s/.test(rest.charAt(j))) j++;
      body =
        rest.charAt(j) === "{"
          ? captureBlock(rest.slice(j))
          : captureExpr(rest.slice(j));
    } else {
      body = captureBlock(rest);
    }
    if (body) out[title] = body;
  }
  return out;
}

/** Attach each case's spec source, read from the workspace's test files. */
function withSpecSources(
  run: MachineCodingTestRun,
  files: Record<string, string>,
): MachineCodingTestRun {
  const sources: Record<string, string> = {};
  for (const [path, content] of Object.entries(files)) {
    if (/\.(test|spec)\.[jt]sx?$/.test(path)) {
      Object.assign(sources, extractSpecBodies(content));
    }
  }
  return {
    ...run,
    cases: run.cases.map((c) => ({ ...c, source: sources[c.title] ?? null })),
  };
}

interface CaseValue {
  name: string;
  input?: string;
  expected?: string;
  received?: string;
}

/**
 * Attach captured input/expected/received values emitted by the `cases()`
 * harness into `.mc-cases.json`, joined to each spec by its title.
 */
function withCaseValues(
  run: MachineCodingTestRun,
  raw: string,
): MachineCodingTestRun {
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return run;
  }
  if (!Array.isArray(arr)) return run;
  const byName = new Map((arr as CaseValue[]).map((c) => [c.name, c] as const));
  return {
    ...run,
    cases: run.cases.map((c) => {
      const v = byName.get(c.title);
      if (!v) return c;
      return {
        ...c,
        input: v.input ?? null,
        expected: v.expected ?? null,
        received: v.received ?? null,
      };
    }),
  };
}

const CONSOLE_LEVELS = ["log", "info", "warn", "error", "debug"] as const;

/** Parse the `.mc-console.json` written by the setup harness into entries. */
function parseConsole(raw: string): MachineCodingConsoleEntry[] {
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const isLevel = (v: unknown): v is MachineCodingConsoleEntry["level"] =>
    (CONSOLE_LEVELS as readonly string[]).includes(v as string);
  return arr.flatMap((e) => {
    if (typeof e !== "object" || e === null) return [];
    const { level, text } = e as { level?: unknown; text?: unknown };
    return [
      {
        level: isLevel(level) ? level : "log",
        text: typeof text === "string" ? text : "",
      },
    ];
  });
}

/**
 * Owns machine-coding action state (running the suite, revealing the solution)
 * so the Problem side panel and the Tests bottom drawer share one source of
 * truth. Completion isn't a manual action — it's derived automatically when all
 * tests pass (see `runTests`). Mounted by the Workspace via the machine-coding
 * extension's `renderProvider`, so it sits above both panels.
 */
export function MachineCodingTestsProvider({
  runtime,
  context,
  onShowSolution,
  readFiles,
  children,
}: {
  runtime: WebContainerRuntime;
  context: MachineCodingContext;
  /** Loads the revealed solution into the editor as reviewable diffs. */
  onShowSolution: (files: Record<string, string>) => void;
  /** Snapshot of current files, used to read test sources for each spec. */
  readFiles: () => Record<string, string>;
  children: ReactNode;
}) {
  const { slug, isSignedIn } = context;
  const trpc = useTRPC();

  const [running, setRunning] = useState(false);
  const [run, setRun] = useState<MachineCodingTestRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consoleEntries, setConsoleEntries] = useState<
    MachineCodingConsoleEntry[]
  >([]);
  const [revealed, setRevealed] = useState(context.solutionRevealed);
  const [editorial, setEditorial] = useState<string | null>(null);

  const clearConsole = () => setConsoleEntries([]);

  const recordTestRun = useMutation(
    trpc.machineCoding.recordTestRun.mutationOptions(),
  );
  const getSolution = useMutation(
    trpc.machineCoding.getSolution.mutationOptions(),
  );

  const ready = runtime.status === "running" && !!runtime.previewUrl;

  const runTests = async () => {
    const container = runtime.container;
    if (!container || running) return;
    setRunning(true);
    setError(null);
    setConsoleEntries([]);
    try {
      // Clear last run's captured values + console so a crashed suite can't show
      // stale data (each `vitest run` rewrites them via the test harnesses).
      for (const f of [".mc-cases.json", ".mc-console.json"]) {
        try {
          await container.fs.rm(f, { force: true });
        } catch {
          // no-op — file may not exist / fs.rm unavailable
        }
      }
      const proc = await container.spawn("npx", [
        "vitest",
        "run",
        "--reporter=json",
        "--outputFile=.vitest-result.json",
      ]);
      let out = "";
      void proc.output.pipeTo(
        new WritableStream({
          write(chunk) {
            out += chunk;
          },
        }),
      );
      await proc.exit;

      let parsed: MachineCodingTestRun | null = null;
      try {
        parsed = parseTestRun(
          await container.fs.readFile(".vitest-result.json", "utf-8"),
        );
      } catch {
        // file missing — fall back to stdout
      }
      parsed ??= parseTestRun(out);

      if (!parsed) {
        setError(
          "Couldn't read the test results. The environment may still be installing — try again in a moment.",
        );
        return;
      }

      // Prefer real captured values (cases() harness); fall back to spec source.
      let enriched = withSpecSources(parsed, readFiles());
      try {
        enriched = withCaseValues(
          enriched,
          await container.fs.readFile(".mc-cases.json", "utf-8"),
        );
      } catch {
        // problem doesn't use the cases() harness — spec source stays the view
      }
      setRun(enriched);

      // Surface anything the user's code logged while the suite ran.
      try {
        setConsoleEntries(
          parseConsole(
            await container.fs.readFile(".mc-console.json", "utf-8"),
          ),
        );
      } catch {
        // no logs captured (or file unavailable) — leave the console empty
      }

      const allPass = enriched.total > 0 && enriched.passed >= enriched.total;
      // Completion is implicit: all green marks the attempt complete.
      patchLocalAttempt(slug, {
        testsPassed: enriched.passed,
        testsTotal: enriched.total,
        ...(allPass ? { completed: true } : {}),
      });
      if (isSignedIn) {
        recordTestRun.mutate({
          slug,
          passed: enriched.passed,
          total: enriched.total,
        });
      }
      if (allPass) {
        toast.success("All tests passed! 🎉");
      } else {
        toast.message(`${enriched.passed}/${enriched.total} tests passing`);
      }
    } catch {
      setError(
        "Couldn't run the tests. Make sure the environment finished booting.",
      );
    } finally {
      setRunning(false);
    }
  };

  const reveal = () => {
    getSolution.mutate(
      { slug },
      {
        onSuccess: (data) => {
          onShowSolution(data.solutionFiles);
          setEditorial(data.editorial);
          setRevealed(true);
          patchLocalAttempt(slug, { revealed: true });
          toast.message("Solution loaded as diffs in the editor for review.");
        },
        onError: (e) => toast.error(e.message),
      },
    );
  };

  const value: MachineCodingTestsValue = {
    ready,
    running,
    run,
    error,
    consoleEntries,
    clearConsole,
    runTests,
    revealed,
    reveal,
    revealPending: getSolution.isPending,
    editorial,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
