/**
 * The shape of a single machine-coding problem. Problems are authored as
 * typed data modules under `./problems` (mirroring how `@acme/ducklet-fs` keeps
 * its starter templates as code) and updated via PRs — there is no DB seeding of
 * problem content. Only per-user *attempts* live in the database.
 *
 * This module is imported SERVER-SIDE ONLY (by `@acme/api`). Solution files and
 * editorials never reach the client except through the gated
 * `machineCoding.getSolution` procedure.
 */
// Mirrors `difficultyEnum` in `@acme/db` (kept inline so this content package
// has no dependency on the database layer).
export type MachineCodingDifficulty = "easy" | "medium" | "hard";

export type MachineCodingCategory = "ui-component" | "js-utility";

/**
 * A selectable alternative implementation of a problem — a different language
 * (js-utility problems offer `js` alongside the base `ts`) or a different
 * framework (ui-component problems offer `vue` / `svelte` alongside the base
 * React). Each variant is self-contained: its own template, starter, and
 * solution. The base (React / TypeScript) variant lives on the problem itself.
 */
export interface MachineCodingVariant {
  /** Stable id used in storage + the API, e.g. `js`, `vue`, `svelte`. */
  id: string;
  /** Selector label, e.g. `JavaScript`, `Vue`, `Svelte`. */
  label: string;
  /** Id of the `@acme/ducklet-fs` template the variant's files overlay. */
  templateId: string;
  starterFiles: Record<string, string>;
  solutionFiles: Record<string, string>;
  /**
   * Framework-specific test suite. Omit to reuse the problem's base `testFiles`
   * — fine for the language toggle (a JS util shares the TS tests, which import
   * the editable file extensionless), but framework variants must supply their
   * own (they render the component with a framework-specific Testing Library).
   */
  testFiles?: Record<string, string>;
}

export interface MachineCodingProblem {
  /** URL-safe stable identifier, e.g. `debounce`. Also the attempt key. */
  slug: string;
  title: string;
  difficulty: MachineCodingDifficulty;
  category: MachineCodingCategory;
  /** Soft, informational time budget shown as a countdown in the workspace. */
  durationMinutes: number;
  tags: string[];
  companies: string[];
  /** Id of a `@acme/ducklet-fs` template the starter files overlay onto. */
  templateId: string;
  /** Catalogue sort key (ascending). */
  displayOrder: number;
  /** Problem statement, GitHub-flavored markdown. */
  description: string;
  /** Reference write-up, markdown — revealed with the solution. */
  editorial: string;
  /** Files that overlay the template (e.g. a stubbed `src/debounce.ts`). */
  starterFiles: Record<string, string>;
  /** Reference solution files (same paths as the starter stubs). */
  solutionFiles: Record<string, string>;
  /** Vitest suite(s) seeded alongside the starter so the user can run tests. */
  testFiles: Record<string, string>;
  /**
   * Selectable alternatives beyond the base (React / TypeScript) implementation.
   * When non-empty the workspace shows a selector: a JS/TS language toggle for
   * `js-utility` problems, or a React/Vue/Svelte framework switch for
   * `ui-component` problems.
   */
  variants?: MachineCodingVariant[];
}

/** Catalogue-safe view of a problem — no solution / test / editorial content. */
export interface MachineCodingProblemSummary {
  slug: string;
  title: string;
  difficulty: MachineCodingDifficulty;
  category: MachineCodingCategory;
  durationMinutes: number;
  tags: string[];
  companies: string[];
  displayOrder: number;
  /**
   * The variants this problem can be solved in (base first) — a JS/TS toggle for
   * utilities, or React/Vue/Svelte for UI components. Drives the per-problem
   * tech-stack icons in the catalogue. Id + label only; no files.
   */
  variants: { id: string; label: string }[];
}
