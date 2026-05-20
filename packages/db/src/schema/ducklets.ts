import { relations, sql } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";
import { duckletTypeEnum, memberRoleEnum, memberStatusEnum } from "./enums";

export const ducklet = pgTable("ducklet", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),

  // Owner (creator)
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Visibility
  isPublic: boolean("is_public").default(true).notNull(),

  // Ducklet type
  type: duckletTypeEnum("type").default("normal").notNull(),



  // Yjs Collaboration Data
  yjsData: text("yjs_data"), // Base64-encoded Yjs state
  yjsVersion: integer("yjs_version").default(1).notNull(), // Version for conflict detection
  lastClientsCount: integer("last_clients_count").default(0),

  // Preview image URL (stored in R2)
  previewImage: text("preview_image"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

export const duckletMember = pgTable(
  "ducklet_member",
  {
    duckletId: integer("ducklet_id")
      .notNull()
      .references(() => ducklet.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").default("viewer").notNull(),
    status: memberStatusEnum("status").default("active").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.duckletId, t.userId] })],
);

// Relations
export const duckletRelations = relations(ducklet, ({ one, many }) => ({
  owner: one(user, {
    fields: [ducklet.ownerId],
    references: [user.id],
  }),
  members: many(duckletMember),
}));

export const duckletMemberRelations = relations(duckletMember, ({ one }) => ({
  ducklet: one(ducklet, {
    fields: [duckletMember.duckletId],
    references: [ducklet.id],
  }),
  user: one(user, {
    fields: [duckletMember.userId],
    references: [user.id],
  }),
}));

export type Ducklet = typeof ducklet.$inferSelect;
export type NewDucklet = typeof ducklet.$inferInsert;
