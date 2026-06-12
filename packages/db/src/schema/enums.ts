import { pgEnum } from "drizzle-orm/pg-core";

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "invited",
  "requested",
]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const langEnum = pgEnum("lang", [
  "py",
  "js",
  "ts",
  "java",
  "cpp",
  "c",
  "rs",
  "go",
  "rb",
  "php",
]);
export const submissionKindEnum = pgEnum("submission_kind", ["run", "submit"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "running",
  "accepted",
  "wrong_answer",
  "runtime_error",
  "time_limit",
  "compile_error",
  "judge_error",
]);
export const memberRoleEnum = pgEnum("member_role", ["editor", "viewer"]);
// Distinguishes free-form ducklets from interview-machine-coding rooms (so machine-coding
// rooms can be excluded from the public listing and have AI disabled).
export const duckletKindEnum = pgEnum("ducklet_kind", ["ducklet", "machine-coding"]);
export const machineCodingAttemptStatusEnum = pgEnum("machine_coding_attempt_status", [
  "in-progress",
  "completed",
  "revealed",
]);
export const challengeDiffEnum = pgEnum("challenge_diff", [
  "newbie",
  "junior",
  "intermediate",
  "advanced",
  "master",
]);
export const attemptStatusEnum = pgEnum("attempt_status", [
  "draft",
  "submitted",
]);
