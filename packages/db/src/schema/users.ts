import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 30 }).unique().notNull(),
  fullname: varchar("fullname", { length: 100 }),
  bio: text("bio"),
  photoURL: text("photo_url"),
  avatarSeed: text("avatar_seed"),
  points: integer("points").default(0),
  isAdmin: boolean("is_admin").default(false),

  // Social links
  githubUrl: text("github_url"),
  twitterUrl: text("twitter_url"),
  linkedinUrl: text("linkedin_url"),
  websiteUrl: text("website_url"),

  // Streak tracking
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastSolveDate: date("last_solve_date", { mode: "string" }),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});
