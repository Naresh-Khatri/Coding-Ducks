import { pgTable, serial, text, varchar, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { difficultyEnum } from "./enums";

export const problem = pgTable("problem", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(), // Markdown content
  difficulty: difficultyEnum("difficulty").notNull(),

  // Tags array as text[]
  tags: text("tags").array().notNull().default(sql`'{}'::text[]`),

  // Test cases: [{input: string, output: string, isPublic: boolean}]
  testCases: jsonb("test_cases").notNull().$type<TestCase[]>(),

  // Starter code: {py: string, js: string, cpp: string, java: string}
  starterCode: jsonb("starter_code").$type<Record<string, string>>(),

  // Display order (for sorting)
  displayOrder: integer("display_order").default(0),

  // Status
  isActive: boolean("is_active").default(true).notNull(),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

// Types
export interface TestCase {
  input: string;
  output: string;
  isPublic: boolean;
}

export type Problem = typeof problem.$inferSelect;
export type NewProblem = typeof problem.$inferInsert;
