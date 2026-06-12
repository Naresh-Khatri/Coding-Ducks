import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { memberRoleEnum, memberStatusEnum, roomKindEnum } from "./enums";

// A collaborative coding room. The SQL table stays `ducklet` (the original
// product name) — only the code-level identifier is generalized to `room`,
// since machine-coding interview rooms are the same underlying entity.
export const room = pgTable(
  "ducklet",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description"),

    // Owner (creator)
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Visibility
    isPublic: boolean("is_public").default(true).notNull(),

    // "ducklet" (default) or "machine-coding" (an interview-machine-coding room spawned
    // from the /machine-coding catalogue). Machine-coding rooms are hidden from the public
    // listing and have AI features disabled.
    kind: roomKindEnum("kind").default("ducklet").notNull(),

    // Yjs Collaboration Data
    yjsData: text("yjs_data"), // Base64-encoded Yjs state
    yjsVersion: integer("yjs_version").default(1).notNull(), // Version for conflict detection
    lastClientsCount: integer("last_clients_count").default(0),

    // Preview image URL (stored in R2)
    previewImage: text("preview_image"),

    // Timestamps
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
  },
  (t) => [
    index("ducklet_owner_idx").on(t.ownerId),
    index("ducklet_is_public_idx").on(t.isPublic),
    index("ducklet_kind_idx").on(t.kind),
  ],
);

export const roomMember = pgTable(
  "ducklet_member",
  {
    roomId: integer("ducklet_id")
      .notNull()
      .references(() => room.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("viewer").notNull(),
    status: memberStatusEnum("status").default("active").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.userId] }),
    index("ducklet_member_user_idx").on(t.userId),
  ],
);

// Relations
export const roomRelations = relations(room, ({ one, many }) => ({
  owner: one(user, {
    fields: [room.ownerId],
    references: [user.id],
  }),
  members: many(roomMember),
}));

export const roomMemberRelations = relations(roomMember, ({ one }) => ({
  room: one(room, {
    fields: [roomMember.roomId],
    references: [room.id],
  }),
  user: one(user, {
    fields: [roomMember.userId],
    references: [user.id],
  }),
}));

export type Room = typeof room.$inferSelect;
export type NewRoom = typeof room.$inferInsert;
