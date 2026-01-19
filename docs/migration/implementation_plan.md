# Coding Ducks Migration Plan

A comprehensive plan to migrate the legacy Coding Ducks platform to a modern turborepo-based architecture using Next.js, tRPC, Drizzle, shadcn, and Better Auth.

---

## User Review Required

> [!IMPORTANT]
> **Real-time Infrastructure Decision**: We haven't finalized the real-time solution for Ducklets. Options include:
> - **PartyKit** - Serverless, built on Cloudflare Workers, great DX
> - **Liveblocks** - Managed Yjs, presence, comments (has free tier)
> - **Pusher** - Simple pub/sub, cheap for low volume
> - **Ably** - Similar to Pusher, better free tier
>
> Recommend **Liveblocks** for collaborative editing or **PartyKit** for custom logic.

> [!IMPORTANT]
> **Code Execution API**: Based on "low maintenance, cheaper" criteria:
> - **Judge0** - Self-hosted or cloud ($10-50/mo), most popular
> - **Piston** - Free, self-hosted, simpler
> - **OneCompiler API** - Cheap, managed
>
> Recommend **Judge0 CE (self-hosted)** or **Piston** for cost savings.

> [!WARNING]
> **Image Comparison for UI Challenges**: Current Python approach works but requires maintaining a Python service. Alternatives:
> - Keep Python as microservice (Docker container)
> - Use **Pixelmatch** (JS library) for simpler comparison
> - Use **Resemble.js** for more features
>
> Recommend trying **Pixelmatch** first (pure JS), fallback to Python if needed.

---

## Proposed Changes

### Package: `@acme/db` - Database Schema

Clean, normalized schema design with only essential tables.

#### [MODIFY] [schema/index.ts](file:///home/naresh/Desktop/projects-next/coding_ducks/new/packages/db/src/schema/index.ts)

Add new schema files for each feature:

```
packages/db/src/schema/
├── index.ts          # Re-exports all schemas
├── auth-schema.ts    # Better Auth tables (exists)
├── users.ts          # Extended user profile
├── problems.ts       # Problems, tags, starter codes
├── submissions.ts    # User submissions
├── rooms.ts          # Ducklets/Rooms
├── challenges.ts     # UI Challenges
└── attempts.ts       # Challenge attempts
```

**Schema Design:**

```typescript
// users.ts - Extended profile (Better Auth handles core auth)
export const userProfile = pgTable("user_profile", {
  userId: text().primaryKey().references(() => user.id),
  username: varchar({ length: 30 }).unique().notNull(),
  fullname: varchar({ length: 100 }),
  bio: text(),
  photoURL: text(),
  points: integer().default(0),
  isAdmin: boolean().default(false),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => sql`now()`),
});

// problems.ts
export const problem = pgTable("problem", {
  id: serial().primaryKey(),
  slug: varchar({ length: 100 }).unique().notNull(),
  title: varchar({ length: 256 }).notNull(),
  description: text().notNull(),
  difficulty: difficultyEnum().notNull(), // 'easy' | 'medium' | 'hard'
  testCases: jsonb().notNull(), // [{input, output, isPublic}]
  starterCode: jsonb(), // {py, js, cpp, java}
  isActive: boolean().default(true),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => sql`now()`),
});

export const problemTag = pgTable("problem_tag", {
  id: serial().primaryKey(),
  name: varchar({ length: 50 }).unique().notNull(),
});

export const problemToTag = pgTable("problem_to_tag", {
  problemId: integer().references(() => problem.id),
  tagId: integer().references(() => problemTag.id),
}, (t) => [primaryKey({ columns: [t.problemId, t.tagId] })]);

// submissions.ts
export const submission = pgTable("submission", {
  id: serial().primaryKey(),
  userId: text().references(() => user.id).notNull(),
  problemId: integer().references(() => problem.id).notNull(),
  code: text().notNull(),
  lang: langEnum().notNull(),
  status: submissionStatusEnum().notNull(), // 'pending' | 'accepted' | 'wrong' | 'error'
  testsPassed: integer().default(0),
  testsTotal: integer().default(0),
  runtime: integer(), // ms
  memory: integer(), // KB
  results: jsonb(), // detailed test results
  createdAt: timestamp().defaultNow(),
});

// rooms.ts (Ducklets)
export const room = pgTable("room", {
  id: serial().primaryKey(),
  name: varchar({ length: 100 }).notNull(),
  description: text(),
  ownerId: text().references(() => user.id).notNull(),
  isPublic: boolean().default(true),
  roomType: roomTypeEnum().default('normal'), // 'normal' | 'web'
  // For web-type rooms (HTML/CSS/JS playground)
  contentHTML: text(),
  contentCSS: text(),
  contentJS: text(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => sql`now()`),
});

export const roomMember = pgTable("room_member", {
  roomId: integer().references(() => room.id),
  userId: text().references(() => user.id),
  role: memberRoleEnum().default('viewer'), // 'owner' | 'editor' | 'viewer'
}, (t) => [primaryKey({ columns: [t.roomId, t.userId] })]);

// challenges.ts (UI Challenges)
export const challenge = pgTable("challenge", {
  id: serial().primaryKey(),
  slug: varchar({ length: 100 }).unique().notNull(),
  title: varchar({ length: 256 }).notNull(),
  description: text(),
  difficulty: challengeDiffEnum().notNull(),
  contentHTML: text().notNull(),
  contentCSS: text().notNull(),
  contentJS: text().default(''),
  desktopPreview: text().notNull(), // ImageKit URL
  mobilePreview: text(),
  isPublic: boolean().default(true),
  creatorId: text().references(() => user.id),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => sql`now()`),
});

// attempts.ts
export const challengeAttempt = pgTable("challenge_attempt", {
  id: serial().primaryKey(),
  challengeId: integer().references(() => challenge.id).notNull(),
  userId: text().references(() => user.id).notNull(),
  contentHTML: text().notNull(),
  contentCSS: text().notNull(),
  contentJS: text().default(''),
  screenshotURL: text(),
  score: integer().default(0), // 0-1000
  status: attemptStatusEnum().default('draft'), // 'draft' | 'submitted'
  submittedAt: timestamp(),
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp().$onUpdateFn(() => sql`now()`),
});
```

---

### Package: `@acme/api` - tRPC Routers

#### [NEW] Router Structure

```
packages/api/src/router/
├── auth.ts        # Auth routes (exists)
├── user.ts        # User profile (exists, extend)
├── problem.ts     # Problems CRUD + filtering
├── submission.ts  # Submit code, get results
├── room.ts        # Ducklets CRUD
├── challenge.ts   # UI Challenges CRUD
├── attempt.ts     # Challenge attempts
```

**Key Procedures:**

```typescript
// problem.ts
- problem.list({ difficulty?, tags?, search?, cursor? })
- problem.bySlug({ slug })
- problem.create({ ... }) // Admin only
- problem.update({ id, ... }) // Admin only

// submission.ts
- submission.submit({ problemId, code, lang })
- submission.list({ problemId?, userId? })
- submission.byId({ id })

// room.ts
- room.list({ userId?, isPublic? })
- room.create({ name, description, isPublic, roomType })
- room.byId({ id })
- room.update({ id, ... })
- room.delete({ id })
- room.addMember({ roomId, userId, role })
- room.removeMember({ roomId, userId })

// challenge.ts
- challenge.list({ difficulty? })
- challenge.bySlug({ slug })
- challenge.create({ ... }) // Admin only
- challenge.leaderboard({ challengeId })

// attempt.ts
- attempt.start({ challengeId }) // Create draft
- attempt.save({ id, html, css, js })
- attempt.submit({ id }) // Takes screenshot, calculates score
- attempt.byId({ id })
- attempt.myAttempts({ challengeId? })
```

---

### App: `@acme/web` - Frontend Pages

#### [NEW] Page Structure

```
apps/web/src/app/
├── (auth)/
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (main)/
│   ├── layout.tsx          # Navbar, footer
│   ├── page.tsx            # Landing page
│   ├── problems/
│   │   ├── page.tsx        # Problems list
│   │   └── [slug]/
│   │       └── page.tsx    # Problem detail + editor
│   ├── ducklets/
│   │   ├── page.tsx        # Ducklets list
│   │   └── [id]/
│   │       └── page.tsx    # Collaborative editor
│   ├── challenges/
│   │   ├── page.tsx        # Challenges gallery
│   │   └── [slug]/
│   │       ├── page.tsx    # Challenge detail
│   │       └── attempt/
│   │           └── page.tsx # Attempt editor
│   └── u/
│       └── [username]/
│           └── page.tsx    # User profile
└── api/
    └── [...]/              # API routes
```

---

## Implementation Phases

### Phase 1: Foundation (Tickets #1-4)

| Ticket | Description | Effort |
|--------|-------------|--------|
| #1 | Database schema setup with Drizzle | 2h |
| #2 | Extend Better Auth with user profiles | 1h |
| #3 | Base tRPC routers (problem, submission) | 2h |
| #4 | shadcn component setup + design system | 1h |

### Phase 2: Problems Feature (Tickets #5-10)

| Ticket | Description | Effort |
|--------|-------------|--------|
| #5 | Problems list page with filtering | 3h |
| #6 | Problem detail page (statement, examples) | 2h |
| #7 | Code editor component (Monaco) | 3h |
| #8 | Code execution integration (Judge0/Piston) | 4h |
| #9 | Submissions panel + history | 2h |
| #10 | Admin: Problem create/edit | 3h |

### Phase 3: Ducklets Feature (Tickets #11-16)

| Ticket | Description | Effort |
|--------|-------------|--------|
| #11 | Real-time infrastructure setup | 4h |
| #12 | Rooms list + create modal | 2h |
| #13 | Collaborative code editor (Yjs/Liveblocks) | 6h |
| #14 | Room settings + member management | 2h |
| #15 | Chat + presence indicators | 3h |
| #16 | Web playground mode (HTML/CSS/JS preview) | 3h |

### Phase 4: UI Challenges (Tickets #17-21)

| Ticket | Description | Effort |
|--------|-------------|--------|
| #17 | Challenges gallery page | 2h |
| #18 | Challenge detail + preview | 2h |
| #19 | Attempt editor (live preview) | 4h |
| #20 | Image comparison + scoring service | 4h |
| #21 | Leaderboard + submissions | 2h |

### Phase 5: User Features (Tickets #22-24)

| Ticket | Description | Effort |
|--------|-------------|--------|
| #22 | User profile page | 2h |
| #23 | Activity calendar + stats | 3h |
| #24 | Dashboard (recent activity, progress) | 2h |

### Phase 6: Polish (Tickets #25-27)

| Ticket | Description | Effort |
|--------|-------------|--------|
| #25 | Landing page redesign | 3h |
| #26 | SEO + Open Graph | 1h |
| #27 | Error boundaries + loading states | 2h |

---

## Verification Plan

### Automated Tests

Since this is a new project, we'll establish testing patterns as we build:

1. **Database**: Run `pnpm db:push` and verify schema creation
2. **tRPC**: Test procedures with tRPC panel or Postman
3. **Frontend**: Manual verification + Playwright for critical flows later

### Manual Verification

For each phase, verify:

1. **Phase 1**: 
   - [ ] Run `pnpm db:push` - schema applied successfully
   - [ ] Login with Google/GitHub works
   - [ ] User profile created on first login

2. **Phase 2**:
   - [ ] Problems list loads with correct data
   - [ ] Problem page shows description, examples
   - [ ] Code editor loads with starter code
   - [ ] Run code → results displayed
   - [ ] Submit → shows in history

3. **Phase 3**:
   - [ ] Create room works
   - [ ] Join room with another browser
   - [ ] Edits sync in real-time
   - [ ] Chat messages appear for all users

4. **Phase 4**:
   - [ ] Challenge gallery displays correctly
   - [ ] Attempt editor has live preview
   - [ ] Submit calculates score
   - [ ] Leaderboard updates

---

## Technology Decisions Summary

| Concern | Decision | Rationale |
|---------|----------|-----------|
| Auth | Better Auth | Already set up, modern, type-safe |
| ORM | Drizzle | Already set up, great DX, fast |
| API | tRPC | Type-safety, already configured |
| UI | shadcn/ui | Consistent, accessible, customizable |
| Editor | Monaco | Feature-rich, VSCode-like |
| Code Exec | Judge0/Piston API | Low maintenance, no infra |
| Real-time | TBD (Liveblocks/PartyKit) | Need to evaluate |
| Image CDN | ImageKit | Already using in old project |
| Image Comparison | Pixelmatch (try first) | JS-native, simple |

---

## Next Steps

After approval:
1. Start with Ticket #1 (Database Schema)
2. Work through phases sequentially
3. Get user feedback after each phase
