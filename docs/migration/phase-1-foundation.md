# Phase 1: Foundation & Infrastructure

> **Context**: This is the first phase of migrating Coding Ducks. Complete this before starting any feature work.

---

## Goals

1. ✅ Set up complete Drizzle schema for all features
2. ✅ Extend Better Auth with user profiles
3. ✅ Create base tRPC routers structure
4. ✅ Set up R2 storage utilities
5. ✅ Establish design system with shadcn

---

## Prerequisites

- Turborepo already set up at `/home/naresh/Desktop/projects-next/coding_ducks/new`
- Better Auth configured with Google/GitHub
- PostgreSQL database accessible
- R2 bucket created (or S3-compatible storage)

---

## Ticket 1.1: Database Schema Setup

### Files to Create/Modify

```
packages/db/src/
├── schema/
│   ├── index.ts           # MODIFY - re-export all schemas
│   ├── auth-schema.ts     # EXISTS - Better Auth tables
│   ├── enums.ts           # NEW - shared enums
│   ├── users.ts           # NEW - extended user profile
│   ├── problems.ts        # NEW - problems & tags
│   ├── submissions.ts     # NEW - user submissions
│   ├── rooms.ts           # NEW - ducklets/rooms
│   ├── challenges.ts      # NEW - UI challenges
│   └── attempts.ts        # NEW - challenge attempts
└── index.ts               # MODIFY - export schemas
```

### Schema: `enums.ts`

```typescript
import { pgEnum } from "drizzle-orm/pg-core";

export const difficultyEnum = pgEnum("difficulty", ["easy", "medium", "hard"]);
export const langEnum = pgEnum("lang", ["py", "js", "java", "cpp", "c"]);
export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "running",
  "accepted",
  "wrong_answer",
  "runtime_error",
  "time_limit",
  "compile_error",
]);
export const roomTypeEnum = pgEnum("room_type", ["normal", "web"]);
export const memberRoleEnum = pgEnum("member_role", ["owner", "editor", "viewer"]);
export const challengeDiffEnum = pgEnum("challenge_diff", [
  "newbie",
  "junior",
  "intermediate",
  "advanced",
  "master",
]);
export const attemptStatusEnum = pgEnum("attempt_status", ["draft", "submitted"]);
```

### Schema: `users.ts`

```typescript
import { pgTable, text, varchar, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema"; // Better Auth user table

export const userProfile = pgTable("user_profile", {
  // Foreign key to Better Auth user
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Profile fields
  username: varchar("username", { length: 30 }).unique().notNull(),
  fullname: varchar("fullname", { length: 100 }),
  bio: text("bio"),
  photoURL: text("photo_url"),
  
  // Gamification
  points: integer("points").default(0).notNull(),
  
  // Admin flag
  isAdmin: boolean("is_admin").default(false).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

// Type exports
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
```

### Schema: `problems.ts`

```typescript
import { pgTable, serial, text, varchar, boolean, timestamp, jsonb, integer } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { difficultyEnum } from "./enums";

export const problem = pgTable("problem", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description").notNull(), // Markdown content
  difficulty: difficultyEnum("difficulty").notNull(),
  
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

export const problemTag = pgTable("problem_tag", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).unique().notNull(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
});

// Many-to-many junction table
export const problemToTag = pgTable("problem_to_tag", {
  problemId: integer("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => problemTag.id, { onDelete: "cascade" }),
});

// Relations
export const problemRelations = relations(problem, ({ many }) => ({
  tags: many(problemToTag),
}));

export const problemTagRelations = relations(problemTag, ({ many }) => ({
  problems: many(problemToTag),
}));

// Types
export interface TestCase {
  input: string;
  output: string;
  isPublic: boolean;
}

export type Problem = typeof problem.$inferSelect;
export type NewProblem = typeof problem.$inferInsert;
```

### Schema: `submissions.ts`

```typescript
import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { langEnum, submissionStatusEnum } from "./enums";
import { user } from "./auth-schema";
import { problem } from "./problems";

export const submission = pgTable("submission", {
  id: serial("id").primaryKey(),
  
  // Foreign keys
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  problemId: integer("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  
  // Submission data
  code: text("code").notNull(),
  lang: langEnum("lang").notNull(),
  
  // Results
  status: submissionStatusEnum("status").default("pending").notNull(),
  testsPassed: integer("tests_passed").default(0),
  testsTotal: integer("tests_total").default(0),
  runtime: integer("runtime"), // milliseconds
  memory: integer("memory"), // KB
  
  // Detailed results: [{passed, input, expected, actual, runtime}]
  results: jsonb("results").$type<TestResult[]>(),
  
  // Error message if compilation/runtime error
  errorMessage: text("error_message"),
  
  // Timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const submissionRelations = relations(submission, ({ one }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [submission.problemId],
    references: [problem.id],
  }),
}));

// Types
export interface TestResult {
  passed: boolean;
  input?: string; // Only for public test cases
  expected?: string;
  actual?: string;
  runtime?: number;
  error?: string;
}

export type Submission = typeof submission.$inferSelect;
export type NewSubmission = typeof submission.$inferInsert;
```

### Schema: `rooms.ts`

```typescript
import { pgTable, serial, text, varchar, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { roomTypeEnum, memberRoleEnum } from "./enums";
import { user } from "./auth-schema";

export const room = pgTable("room", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  
  // Owner (creator)
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // Visibility
  isPublic: boolean("is_public").default(true).notNull(),
  
  // Room type
  roomType: roomTypeEnum("room_type").default("normal").notNull(),
  
  // For 'web' type rooms - stores HTML/CSS/JS directly
  contentHTML: text("content_html").default(""),
  contentCSS: text("content_css").default(""),
  contentJS: text("content_js").default(""),
  
  // Preview image URL (stored in R2)
  previewImage: text("preview_image"),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

export const roomMember = pgTable("room_member", {
  roomId: integer("room_id")
    .notNull()
    .references(() => room.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  role: memberRoleEnum("role").default("viewer").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

// Relations
export const roomRelations = relations(room, ({ one, many }) => ({
  owner: one(user, {
    fields: [room.ownerId],
    references: [user.id],
  }),
  members: many(roomMember),
}));

export type Room = typeof room.$inferSelect;
export type NewRoom = typeof room.$inferInsert;
```

### Schema: `challenges.ts`

```typescript
import { pgTable, serial, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { challengeDiffEnum } from "./enums";
import { user } from "./auth-schema";

export const challenge = pgTable("challenge", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  difficulty: challengeDiffEnum("difficulty").notNull(),
  
  // Target design code
  contentHTML: text("content_html").notNull(),
  contentCSS: text("content_css").notNull(),
  contentJS: text("content_js").default(""),
  
  // Preview images (stored in R2)
  desktopPreview: text("desktop_preview").notNull(),
  mobilePreview: text("mobile_preview"),
  ogImage: text("og_image"),
  
  // Scale for OG image generation
  ogImageScale: integer("og_image_scale").default(1),
  
  // Visibility
  isPublic: boolean("is_public").default(true).notNull(),
  
  // Creator
  creatorId: text("creator_id").references(() => user.id),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

export const challengeRelations = relations(challenge, ({ one }) => ({
  creator: one(user, {
    fields: [challenge.creatorId],
    references: [user.id],
  }),
}));

export type Challenge = typeof challenge.$inferSelect;
export type NewChallenge = typeof challenge.$inferInsert;
```

### Schema: `attempts.ts`

```typescript
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { attemptStatusEnum } from "./enums";
import { user } from "./auth-schema";
import { challenge } from "./challenges";

export const challengeAttempt = pgTable("challenge_attempt", {
  id: serial("id").primaryKey(),
  
  // Foreign keys
  challengeId: integer("challenge_id")
    .notNull()
    .references(() => challenge.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  // User's attempt code
  contentHTML: text("content_html").default("").notNull(),
  contentCSS: text("content_css").default("").notNull(),
  contentJS: text("content_js").default(""),
  
  // Generated screenshots (stored in R2)
  screenshotURL: text("screenshot_url"),
  diffImageURL: text("diff_image_url"),
  
  // Score (0-1000, represents 0-100% with 1 decimal)
  score: integer("score").default(0).notNull(),
  
  // Status
  status: attemptStatusEnum("status").default("draft").notNull(),
  
  // Timestamps
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => sql`now()`),
});

export const challengeAttemptRelations = relations(challengeAttempt, ({ one }) => ({
  challenge: one(challenge, {
    fields: [challengeAttempt.challengeId],
    references: [challenge.id],
  }),
  user: one(user, {
    fields: [challengeAttempt.userId],
    references: [user.id],
  }),
}));

export type ChallengeAttempt = typeof challengeAttempt.$inferSelect;
export type NewChallengeAttempt = typeof challengeAttempt.$inferInsert;
```

### Update `schema/index.ts`

```typescript
// Re-export all schemas
export * from "./auth-schema";
export * from "./enums";
export * from "./users";
export * from "./problems";
export * from "./submissions";
export * from "./rooms";
export * from "./challenges";
export * from "./attempts";
```

### Commands to Run

```bash
cd /home/naresh/Desktop/projects-next/coding_ducks/new

# Generate migrations
pnpm db:generate

# Push to database
pnpm db:push

# Open Drizzle Studio to verify
pnpm db:studio
```

---

## Ticket 1.2: Extend Better Auth with User Profiles

### Goal

When a user signs up via Better Auth, automatically create a `user_profile` record with a generated username.

### Files to Modify

```
packages/auth/src/index.ts   # Add hooks for profile creation
apps/web/src/auth/index.ts   # Update client if needed
```

### Implementation in `packages/auth/src/index.ts`

Add after user creation hook:

```typescript
import { db } from "@acme/db/client";
import { userProfile } from "@acme/db/schema";

// Inside initAuth function, add to config:
const config = {
  // ... existing config
  
  user: {
    additionalFields: {
      username: {
        type: "string",
        required: false,
      },
    },
  },
  
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Generate username from email or name
          const baseUsername = user.email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
          const username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
          
          await db.insert(userProfile).values({
            userId: user.id,
            username,
            fullname: user.name,
            photoURL: user.image,
          });
        },
      },
    },
  },
} satisfies BetterAuthOptions;
```

---

## Ticket 1.3: Base tRPC Router Structure

### Files to Create

```
packages/api/src/router/
├── auth.ts          # EXISTS
├── user.ts          # MODIFY - add profile queries
├── problem.ts       # NEW - problems CRUD
├── submission.ts    # NEW - submissions
├── room.ts          # NEW - rooms/ducklets
├── challenge.ts     # NEW - UI challenges
└── attempt.ts       # NEW - challenge attempts
```

### Create `problem.ts` Router

```typescript
import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { problem, problemTag, problemToTag } from "@acme/db/schema";
import { eq, desc, and, like, inArray } from "drizzle-orm";

export const problemRouter = createTRPCRouter({
  // Get all problems (public)
  list: publicProcedure
    .input(z.object({
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
      tagIds: z.array(z.number()).optional(),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).default(20),
      cursor: z.number().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { difficulty, tagIds, search, limit, cursor } = input ?? {};
      
      // Build query with filters
      const conditions = [eq(problem.isActive, true)];
      
      if (difficulty) {
        conditions.push(eq(problem.difficulty, difficulty));
      }
      if (search) {
        conditions.push(like(problem.title, `%${search}%`));
      }
      if (cursor) {
        conditions.push(gt(problem.id, cursor));
      }
      
      const problems = await ctx.db
        .select()
        .from(problem)
        .where(and(...conditions))
        .orderBy(desc(problem.displayOrder), desc(problem.id))
        .limit(limit + 1);
      
      // Check if there are more results
      const hasMore = problems.length > limit;
      if (hasMore) problems.pop();
      
      return {
        items: problems,
        nextCursor: hasMore ? problems[problems.length - 1]?.id : undefined,
      };
    }),

  // Get problem by slug (public)
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(problem)
        .where(eq(problem.slug, input.slug))
        .limit(1);
      
      if (!result[0]) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Problem not found" });
      }
      
      // Hide private test cases for non-admin users
      const testCases = result[0].testCases.map((tc) => 
        tc.isPublic ? tc : { isPublic: false }
      );
      
      return { ...result[0], testCases };
    }),

  // Get all tags
  tags: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(problemTag);
  }),
});
```

### Update `root.ts`

```typescript
import { problemRouter } from "./router/problem";
import { submissionRouter } from "./router/submission";
// ... other imports

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  problem: problemRouter,
  submission: submissionRouter,
  // Add more as you create them
});
```

---

## Ticket 1.4: R2 Storage Setup

### Create Storage Package

```
packages/storage/
├── package.json
├── src/
│   └── index.ts
└── tsconfig.json
```

### `packages/storage/package.json`

```json
{
  "name": "@acme/storage",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.500.0",
    "@aws-sdk/s3-request-presigner": "^3.500.0"
  }
}
```

### `packages/storage/src/index.ts`

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Configure for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT, // https://<account-id>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export async function uploadFile(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<string> {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
  
  // Return public URL (configure R2 for public access or use custom domain)
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function getSignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });
  
  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export { s3Client, BUCKET };
```

### Environment Variables to Add

```env
# R2 Configuration
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=coding-ducks
R2_PUBLIC_URL=https://cdn.codingducks.xyz
```

---

## Verification Checklist

- [ ] All schema files created in `packages/db/src/schema/`
- [ ] `pnpm db:push` runs without errors
- [ ] `pnpm db:studio` shows all tables
- [ ] User signup creates both `user` and `user_profile` records
- [ ] `problem.list` tRPC procedure returns empty array
- [ ] `problem.tags` tRPC procedure returns empty array
- [ ] R2 upload test works (create a test script)

---

## Next Phase

After completing Phase 1, proceed to [Phase 2: Problems Feature](./phase-2-problems.md).
