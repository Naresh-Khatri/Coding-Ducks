import { relations, sql } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { challenge } from "./challenges";
import { attemptStatusEnum } from "./enums";

export const challengeAttempt = pgTable("challenge_attempt", {
  id: serial("id").primaryKey(),

  // Foreign keys
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenge.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // User's attempt code
  contentHTML: text("content_html").default("").notNull(),
  contentCSS: text("content_css").default("").notNull(),
  contentJS: text("content_js").default(""),

  // Generated screenshots (stored in R2)
  screenshotURL: text("screenshot_url"),
  diffImageURL: text("diff_image_url"),

  // Score (0-1000, represents 0-100% with 1 decimal)
  score: integer("score").default(0).notNull(),

  // Status
  status: attemptStatusEnum("status").default("draft").notNull(),

  // Timestamps
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

export const challengeAttemptRelations = relations(
  challengeAttempt,
  ({ one }) => ({
    challenge: one(challenge, {
      fields: [challengeAttempt.challengeId],
      references: [challenge.id],
    }),
    user: one(user, {
      fields: [challengeAttempt.userId],
      references: [user.id],
    }),
  }),
);

export type ChallengeAttempt = typeof challengeAttempt.$inferSelect;
export type NewChallengeAttempt = typeof challengeAttempt.$inferInsert;
