import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { langEnum, submissionKindEnum, submissionStatusEnum } from "./enums";
import { user } from "./auth-schema";
import { problem } from "./problems";

export const submission = pgTable("submission", {
  id: serial("id").primaryKey(),

  // Foreign keys
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),

  // Distinguishes a real "submit" (run against all tests, counts toward
  // history/stats/streak) from an ephemeral "run" (public tests only).
  kind: submissionKindEnum("kind").default("submit").notNull(),

  // Submission data
  code: text("code").notNull(),
  lang: langEnum("lang").notNull(),

  // Results
  status: submissionStatusEnum("status").default("pending").notNull(),
  testsPassed: integer("tests_passed").default(0),
  testsTotal: integer("tests_total").default(0),
  runtime: integer("runtime"), // milliseconds
  memory: integer("memory"), // KB

  // Detailed results: [{passed, input, expected, actual, runtime}]
  results: jsonb("results").$type<TestResult[]>(),

  // Error message if compilation/runtime error
  errorMessage: text("error_message"),

  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const submissionRelations = relations(submission, ({ one }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [submission.problemId],
    references: [problem.id],
  }),
}));

// Types
export interface TestResult {
  passed: boolean;
  input?: string; // Only for public test cases
  expected?: string;
  actual?: string;
  runtime?: number;
  error?: string;
}

export type Submission = typeof submission.$inferSelect;
export type NewSubmission = typeof submission.$inferInsert;
