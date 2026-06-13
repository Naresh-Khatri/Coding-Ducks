/**
 * `@acme/machine-coding-content` — the machine-coding problem catalogue, authored
 * as code. SERVER-SIDE ONLY: import this from `@acme/api`, never from the
 * client, so solution files and editorials stay off the wire except through the
 * gated `machineCoding.getSolution` procedure.
 */
import type {
  MachineCodingProblem,
  MachineCodingProblemSummary,
} from "./types";
import { MACHINE_CODING_PROBLEMS } from "./problems";

export type {
  MachineCodingCategory,
  MachineCodingDifficulty,
  MachineCodingProblem,
  MachineCodingProblemSummary,
} from "./types";
export { assembleStarterFiles } from "./assemble";
export { MACHINE_CODING_PROBLEMS };

/** Look up a single problem by its slug. */
export function getProblem(slug: string): MachineCodingProblem | undefined {
  return MACHINE_CODING_PROBLEMS.find((p) => p.slug === slug);
}

/**
 * Paths the candidate is meant to edit: the files the reference solution
 * changes. Everything else seeded into the workspace (demo entry, tests,
 * config) is locked read-only so it can't be tampered with.
 */
export function getEditablePaths(p: MachineCodingProblem): string[] {
  return Object.keys(p.solutionFiles);
}

/** Drop solution / test / editorial content from a problem for catalogue use. */
export function toSummary(
  p: MachineCodingProblem,
): MachineCodingProblemSummary {
  return {
    slug: p.slug,
    title: p.title,
    difficulty: p.difficulty,
    category: p.category,
    durationMinutes: p.durationMinutes,
    tags: p.tags,
    companies: p.companies,
    displayOrder: p.displayOrder,
  };
}

/** All problems as catalogue summaries, ordered by `displayOrder`. */
export function listProblemSummaries(): MachineCodingProblemSummary[] {
  return [...MACHINE_CODING_PROBLEMS]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(toSummary);
}
