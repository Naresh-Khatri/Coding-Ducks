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
import { ducklet } from "./ducklets";

export const duckletSnapshot = pgTable(
  "ducklet_snapshot",
  {
    id: serial("id").primaryKey(),
    duckletId: integer("ducklet_id")
      .notNull()
      .references(() => ducklet.id, { onDelete: "cascade" }),
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
    index("ducklet_snapshot_room_created_idx").on(t.duckletId, t.createdAt),
  ],
);

export const duckletSnapshotRelations = relations(
  duckletSnapshot,
  ({ one }) => ({
    ducklet: one(ducklet, {
      fields: [duckletSnapshot.duckletId],
      references: [ducklet.id],
    }),
    creator: one(user, {
      fields: [duckletSnapshot.createdBy],
      references: [user.id],
    }),
  }),
);

export type DuckletSnapshot = typeof duckletSnapshot.$inferSelect;
export type NewDuckletSnapshot = typeof duckletSnapshot.$inferInsert;
