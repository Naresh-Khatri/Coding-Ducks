import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { langEnum } from "./enums";
import { problem } from "./problems";

// A user-published writeup of their accepted solution. Code + optional
// markdown explanation; verified at create time against an accepted submit.
export const problemSolution = pgTable("problem_solution", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 200 }).notNull(),
  body: text("body"),
  code: text("code").notNull(),
  lang: langEnum("lang").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problemSolutionRelations = relations(
  problemSolution,
  ({ one }) => ({
    user: one(user, {
      fields: [problemSolution.userId],
      references: [user.id],
    }),
    problem: one(problem, {
      fields: [problemSolution.problemId],
      references: [problem.id],
    }),
  }),
);

export type ProblemSolution = typeof problemSolution.$inferSelect;
