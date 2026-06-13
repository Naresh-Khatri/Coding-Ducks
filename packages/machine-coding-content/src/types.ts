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
}
