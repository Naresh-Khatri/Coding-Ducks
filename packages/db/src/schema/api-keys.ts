import { relations, sql } from "drizzle-orm";
import { index, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import * as z from "zod";

import { user } from "./auth-schema";

export const apiKey = pgTable(
  "api_key",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: t.varchar({ length: 256 }).notNull(),
    keyHash: t.text("key_hash").notNull(),
    prefix: t.varchar({ length: 32 }).notNull(),
    status: t.text().$type<"active" | "revoked">().notNull().default("active"),
    lastUsedAt: t.timestamp("last_used_at"),
    totalRequests: t.integer("total_requests").default(0).notNull(),
    successfulRequests: t.integer("successful_requests").default(0).notNull(),
    failedRequests: t.integer("failed_requests").default(0).notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at", { mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (table) => [index("api_key_user_id_idx").on(table.userId)],
);

export const apiKeyRelations = relations(apiKey, ({ one, many }) => ({
  user: one(user, {
    fields: [apiKey.userId],
    references: [user.id],
  }),
  usage: many(apiKeyUsage),
}));

export const apiKeyUsage = pgTable(
  "api_key_usage",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    apiKeyId: t
      .uuid("api_key_id")
      .notNull()
      .references(() => apiKey.id, { onDelete: "cascade" }),
    day: t.date("day").notNull(),
    language: t.varchar({ length: 64 }).notNull(),
    count: t.integer("count").default(0).notNull(),
    successful: t.integer("successful").default(0).notNull(),
    failed: t.integer("failed").default(0).notNull(),
    createdAt: t.timestamp("created_at").defaultNow().notNull(),
    updatedAt: t
      .timestamp("updated_at", { mode: "date", withTimezone: true })
      .$onUpdateFn(() => sql`now()`),
  }),
  (table) => [
    index("api_key_usage_api_key_id_idx").on(table.apiKeyId),
    index("api_key_usage_day_idx").on(table.day),
    uniqueIndex("api_key_usage_key_day_lang_idx").on(
      table.apiKeyId,
      table.day,
      table.language,
    ),
  ],
);

export const apiKeyUsageRelations = relations(apiKeyUsage, ({ one }) => ({
  apiKey: one(apiKey, {
    fields: [apiKeyUsage.apiKeyId],
    references: [apiKey.id],
  }),
}));

export const CreateApiKeySchema = createInsertSchema(apiKey, {
  name: z.string().min(1).max(256),
}).omit({
  id: true,
  userId: true,
  keyHash: true,
  prefix: true,
  status: true,
  lastUsedAt: true,
  createdAt: true,
  updatedAt: true,
});
