import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

export const systemDesignAttempt = pgTable("system_design_attempt", {
  id: serial("id").primaryKey(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  levelSlug: varchar("level_slug", { length: 100 }).notNull(),

  graph: jsonb("graph")
    .notNull()
    .$type<{ nodes: unknown[]; edges: unknown[] }>(),

  uptimePercent: integer("uptime_percent"),
  avgLatencyMs: integer("avg_latency_ms"),
  totalCost: integer("total_cost"),
  stars: integer("stars").default(0),
  passed: integer("passed").default(0),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemDesignAttemptRelations = relations(
  systemDesignAttempt,
  ({ one }) => ({
    user: one(user, {
      fields: [systemDesignAttempt.userId],
      references: [user.id],
    }),
  }),
);

export type SystemDesignAttempt = typeof systemDesignAttempt.$inferSelect;
export type NewSystemDesignAttempt = typeof systemDesignAttempt.$inferInsert;
