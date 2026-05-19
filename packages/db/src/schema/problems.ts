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

  // Editorial (Markdown content explaining the solution)
  editorial: text("editorial"),

  // Progressive hints (revealed one at a time in the UI)
  hints: text("hints").array().notNull().default(sql`'{}'::text[]`),

  // Constraints (Markdown, e.g. input bounds)
  constraints: text("constraints"),

  // Companies that have asked this problem
  companies: text("companies").array().notNull().default(sql`'{}'::text[]`),

  // Follow-up prompt (Markdown)
  followUp: text("follow_up"),

  // Function signature definition (language-agnostic)
  functionSignature: jsonb("function_signature").$type<FunctionSignature>(),

  // Per-problem judge limits; null = judge defaults.
  // timeLimit in seconds, memoryLimit in KB (matches the judge runner).
  timeLimit: integer("time_limit"),
  memoryLimit: integer("memory_limit"),

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
  input?: string;
  output?: string;
  // Structured arguments for function-based problems
  args?: string[];
  expected?: string;
  isPublic: boolean;
}

export interface FunctionSignature {
  fnName: string;
  params: Array<{
    name: string;
    type: string;
  }>;
  returnType: string;
}

export type Problem = typeof problem.$inferSelect;
export type NewProblem = typeof problem.$inferInsert;
