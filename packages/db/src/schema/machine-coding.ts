import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { machineCodingAttemptStatusEnum } from "./enums";
import { room } from "./rooms";

/**
 * A signed-in user's attempt at a machine-coding problem. Problem *content* lives in
 * code (`@acme/machine-coding-content`), so this table only references a problem by
 * its `slug` — there is no `machine-coding_problem` table. Anonymous machine-coding keeps
 * its state client-side (IndexedDB + localStorage) and creates no rows here.
 *
 * One row per (user, problem): re-practicing updates the existing row. The row
 * gains a `roomId` only when the attempt is upgraded into a collaborative
 * interview room via `machineCoding.createInterviewRoom`.
 */
export const machineCodingAttempt = pgTable(
  "machine_coding_attempt",
  {
    id: serial("id").primaryKey(),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Slug into the code-defined catalogue (no FK — content isn't in the DB).
    problemSlug: varchar("problem_slug", { length: 100 }).notNull(),

    // Set when the attempt is promoted to a collaborative interview room.
    roomId: integer("ducklet_id").references(() => room.id, {
      onDelete: "set null",
    }),

    status: machineCodingAttemptStatusEnum("status")
      .default("in-progress")
      .notNull(),
    solutionRevealed: boolean("solution_revealed").default(false).notNull(),

    // Last vitest run summary.
    testsLastPassed: integer("tests_last_passed"),
    testsLastTotal: integer("tests_last_total"),
    testsRunAt: timestamp("tests_run_at"),

    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
  },
  (t) => [
    // One attempt row per user per problem — upsert target for the API.
    unique("machine_coding_attempt_user_problem_uniq").on(t.userId, t.problemSlug),
    // One attempt per upgraded room.
    unique("machine_coding_attempt_ducklet_uniq").on(t.roomId),
  ],
);

export const machineCodingAttemptRelations = relations(machineCodingAttempt, ({ one }) => ({
  user: one(user, {
    fields: [machineCodingAttempt.userId],
    references: [user.id],
  }),
  room: one(room, {
    fields: [machineCodingAttempt.roomId],
    references: [room.id],
  }),
}));

export type MachineCodingAttempt = typeof machineCodingAttempt.$inferSelect;
export type NewMachineCodingAttempt = typeof machineCodingAttempt.$inferInsert;
