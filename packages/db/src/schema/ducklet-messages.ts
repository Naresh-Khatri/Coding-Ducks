import { relations } from "drizzle-orm";
import {
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { ducklet } from "./ducklets";

export const duckletMessage = pgTable("ducklet_message", {
  id: varchar("id", { length: 100 }).primaryKey(), // Using client-generated ID (timestamp-userid)
  duckletId: integer("ducklet_id")
    .notNull()
    .references(() => ducklet.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const duckletMessageRelations = relations(duckletMessage, ({ one }) => ({
  ducklet: one(ducklet, {
    fields: [duckletMessage.duckletId],
    references: [ducklet.id],
  }),
  user: one(user, {
    fields: [duckletMessage.userId],
    references: [user.id],
  }),
}));
