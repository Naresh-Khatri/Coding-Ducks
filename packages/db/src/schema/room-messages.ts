import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { room } from "./rooms";

export const roomMessage = pgTable(
  "ducklet_message",
  {
    id: varchar("id", { length: 100 }).primaryKey(),
    roomId: integer("ducklet_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    // userId becomes null when the author is deleted — the row itself
    // stays so chat history isn't punched full of holes. authorUsername
    // is the snapshot of the username at send-time so we can still render
    // who said what.
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    authorUsername: varchar("author_username", { length: 100 }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ducklet_message_room_created_idx").on(t.roomId, t.createdAt),
  ],
);

export const roomMessageRelations = relations(roomMessage, ({ one }) => ({
  room: one(room, {
    fields: [roomMessage.roomId],
    references: [room.id],
  }),
  user: one(user, {
    fields: [roomMessage.userId],
    references: [user.id],
  }),
}));
