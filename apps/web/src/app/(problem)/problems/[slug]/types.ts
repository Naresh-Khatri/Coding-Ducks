import type { RouterOutputs } from "@acme/api";

/** A fully-loaded problem as returned by `problem.bySlug` (sanitized). */
export type ProblemDetail = NonNullable<RouterOutputs["problem"]["bySlug"]>;

/** A single submission row (shared by the list and poll/result endpoints). */
export type SubmissionDetail = RouterOutputs["submission"]["list"][number];

/** One per-test result entry from a run/submission. */
export type ConsoleResult = NonNullable<SubmissionDetail["results"]>[number];
