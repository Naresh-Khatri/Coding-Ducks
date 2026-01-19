import { pgTable, serial, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { challengeDiffEnum } from "./enums";
import { user } from "./auth-schema";

export const challenge = pgTable("challenge", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  difficulty: challengeDiffEnum("difficulty").notNull(),

  // Target design code
  contentHTML: text("content_html").notNull(),
  contentCSS: text("content_css").notNull(),
  contentJS: text("content_js").default(""),

  // Preview images (stored in R2)
  desktopPreview: text("desktop_preview").notNull(),
  mobilePreview: text("mobile_preview"),
  ogImage: text("og_image"),

  // Scale for OG image generation
  ogImageScale: integer("og_image_scale").default(1),

  // Visibility
  isPublic: boolean("is_public").default(true).notNull(),

  // Creator
  creatorId: text("creator_id").references(() => user.id),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

export const challengeRelations = relations(challenge, ({ one }) => ({
  creator: one(user, {
    fields: [challenge.creatorId],
    references: [user.id],
  }),
}));

export type Challenge = typeof challenge.$inferSelect;
export type NewChallenge = typeof challenge.$inferInsert;
