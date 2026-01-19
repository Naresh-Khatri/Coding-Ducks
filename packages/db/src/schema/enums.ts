import { pgEnum } from "drizzle-orm/pg-core";

export const memberStatusEnum = pgEnum("member_status", [
  "active",
  "invited",
  "requested",
]);

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const langEnum = pgEnum("lang", ["py", "js", "java", "cpp", "c"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "running",
  "accepted",
  "wrong_answer",
  "runtime_error",
  "time_limit",
  "compile_error",
]);
export const duckletTypeEnum = pgEnum("ducklet_type", ["normal", "web"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "editor", "viewer"]);
export const challengeDiffEnum = pgEnum("challenge_diff", [
  "newbie",
  "junior",
  "intermediate",
  "advanced",
  "master",
]);
export const attemptStatusEnum = pgEnum("attempt_status", ["draft", "submitted"]);
