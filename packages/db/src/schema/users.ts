import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export const userProfile = pgTable("user_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  username: varchar("username", { length: 30 }).unique().notNull(),
  fullname: varchar("fullname", { length: 100 }),
  bio: text("bio"),
  photoURL: text("photo_url"),
  points: integer("points").default(0),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});
