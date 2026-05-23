import type { AnyPgColumn } from "drizzle-orm/pg-core";
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

// Per-problem discussion thread. Top-level posts (parentId null) may
// optionally carry a shared accepted solution (title + code + lang);
// replies (parentId set) are plain text, one level of nesting only.
export const problemComment = pgTable("problem_comment", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  parentId: integer("parent_id").references(
    (): AnyPgColumn => problemComment.id,
    { onDelete: "cascade" },
  ),
  title: varchar("title", { length: 200 }),
  body: text("body").notNull(),
  code: text("code"),
  lang: langEnum("lang"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const problemCommentRelations = relations(
  problemComment,
  ({ one, many }) => ({
    user: one(user, {
      fields: [problemComment.userId],
      references: [user.id],
    }),
    problem: one(problem, {
      fields: [problemComment.problemId],
      references: [problem.id],
    }),
    parent: one(problemComment, {
      fields: [problemComment.parentId],
      references: [problemComment.id],
      relationName: "replies",
    }),
    replies: many(problemComment, { relationName: "replies" }),
  }),
);

export type ProblemComment = typeof problemComment.$inferSelect;
