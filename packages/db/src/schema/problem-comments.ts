import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { problem } from "./problems";

// A flat discussion thread per problem (no nesting — keep it simple).
export const problemComment = pgTable("problem_comment", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problemCommentRelations = relations(problemComment, ({ one }) => ({
  user: one(user, {
    fields: [problemComment.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [problemComment.problemId],
    references: [problem.id],
  }),
}));

export type ProblemComment = typeof problemComment.$inferSelect;
