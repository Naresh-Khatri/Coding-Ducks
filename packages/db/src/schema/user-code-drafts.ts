import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { langEnum } from "./enums";
import { user } from "./auth-schema";
import { problem } from "./problems";

export const userCodeDraft = pgTable(
  "user_code_draft",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: integer("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    lang: langEnum("lang").notNull(),
    code: text("code").notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdateFn(() => sql`now()`),
  },
  (t) => [unique().on(t.userId, t.problemId, t.lang)],
);

export const userCodeDraftRelations = relations(userCodeDraft, ({ one }) => ({
  user: one(user, {
    fields: [userCodeDraft.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [userCodeDraft.problemId],
    references: [problem.id],
  }),
}));

export type UserCodeDraft = typeof userCodeDraft.$inferSelect;
export type NewUserCodeDraft = typeof userCodeDraft.$inferInsert;
