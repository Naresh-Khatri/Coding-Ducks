import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { room } from "./rooms";

export const roomSnapshot = pgTable(
  "ducklet_snapshot",
  {
    id: serial("id").primaryKey(),
    roomId: integer("ducklet_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    // Base64-encoded Yjs state at snapshot time.
    yjsData: text("yjs_data").notNull(),
    label: varchar("label", { length: 200 }),
    // User who took the snapshot — kept for attribution. Set null if they
    // are later deleted so we don't lose the historical row.
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ducklet_snapshot_room_created_idx").on(t.roomId, t.createdAt),
  ],
);

export const roomSnapshotRelations = relations(roomSnapshot, ({ one }) => ({
  room: one(room, {
    fields: [roomSnapshot.roomId],
    references: [room.id],
  }),
  creator: one(user, {
    fields: [roomSnapshot.createdBy],
    references: [user.id],
  }),
}));

export type RoomSnapshot = typeof roomSnapshot.$inferSelect;
export type NewRoomSnapshot = typeof roomSnapshot.$inferInsert;
