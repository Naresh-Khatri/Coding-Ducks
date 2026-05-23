# Coding Ducks

A real-time coding platform for solving problems, pair-programming, and learning systems by building them. Bundles a LeetCode-style judge, collaborative coding sessions (Ducklets), a drag-and-drop System Design puzzle game, and an in-browser playground in a single Turborepo monorepo.

## Features

- **Problems** — LeetCode-style coding challenges with multi-language judging (Python, JS, Java, C++) and per-problem submission history.
- **Ducklets** — real-time collaborative coding rooms powered by Y.js CRDTs and a Hocuspocus server. Includes role-based access, forking, snapshots, chat history, and signed session tokens.
- **System Design** — 10 progressively harder levels where you build an architecture from typed blocks on a React Flow canvas and run it through a client-side traffic simulation. Three-star scoring on reliability / performance / efficiency; each level is empirically calibrated and locked by a `node --test` suite.
- **Playground** — quick scratchpad to run snippets in any supported language without creating a submission.
- **Dashboard** — solved-problem stats, streaks, contribution heatmap, recent submissions, and account settings.

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19
- **Language**: TypeScript (strict, no `any`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Better Auth (GitHub + Google OAuth, sessions)
- **API**: tRPC v11 with SuperJSON + Zod
- **Realtime**: Y.js + Hocuspocus (separate Node service)
- **Jobs**: BullMQ on Redis
- **Storage**: AWS S3 (file uploads, attachments)
- **UI**: Tailwind CSS v4, shadcn/ui, Lucide icons, Motion
- **Canvas**: React Flow (`@xyflow/react`)
- **Editor**: CodeMirror 6 (with Vim mode)
- **Monorepo**: Turborepo + pnpm

## Project Structure

```
.
├── apps
│   ├── web                # Next.js app — UI, tRPC server, REST endpoints
│   └── hocuspocus-server  # Realtime Y.js collaboration server for Ducklets
├── packages
│   ├── api                # tRPC routers (problem, ducklet, submission, system-design, …)
│   ├── auth               # Better Auth server config, client hooks, middleware
│   ├── db                 # Drizzle schemas + Postgres client (backend-only)
│   ├── jobs               # BullMQ queues and workers
│   ├── storage            # S3 client
│   └── validators         # Shared Zod schemas
└── tooling                # Shared eslint / prettier / tailwind / tsconfig
```

**Dependency rule:** apps depend on packages; packages never depend on apps.

## Getting Started

### Prerequisites

- Node.js `^23`
- pnpm `^10.19.0`
- Docker (for local Postgres + Redis)

### Install

```bash
pnpm install
cp .env.example .env       # fill in OAuth + auth secrets
make services              # Postgres on :5433, Redis on :6380
pnpm db:push               # apply Drizzle schema
pnpm auth:generate         # regenerate Better Auth types
```

### Run

```bash
pnpm dev                   # full stack (web + hocuspocus + watchers)
pnpm dev:next              # only Next.js (needs services running)
```

Web app: <http://localhost:3001>. Hocuspocus: <http://localhost:5000>.

### Common Scripts

| Command                  | What it does                              |
| ------------------------ | ----------------------------------------- |
| `pnpm build`             | Build every package via Turborepo         |
| `pnpm lint` / `lint:fix` | ESLint check / autofix                    |
| `pnpm format:fix`        | Prettier write                            |
| `pnpm typecheck`         | TypeScript check across all packages      |
| `pnpm db:push`           | Push Drizzle schema to Postgres           |
| `pnpm db:studio`         | Open Drizzle Studio GUI                   |
| `make services`          | Start Postgres + Redis only               |
| `make dev`               | Full dev environment in Docker            |
| `make down`              | Stop all containers                       |

### System-Design Calibration Tests

The simulation levels ship with a test suite that runs reference designs through the real engine and asserts each level stays beatable-but-hard (optimal ⇒ 3★, naive ⇒ ≤2★, broken ⇒ fails):

```bash
pnpm -F @acme/nextjs test:calibration
```

## Code Execution

Submissions are dispatched to an external Judge service (`JUDGE_API_URL`) over tRPC — there is no public REST API. The in-app Playground and Problem pages call `trpc.submission.create` and poll for the verdict by ID.

## Code Style

- `kebab-case` for files, `camelCase` for vars/functions, `PascalCase` for types/components.
- Named exports preferred over default exports.
- No `any` — use `unknown` with narrowing.
- Async/await everywhere; no raw promises.
- Dark mode first; shadcn/ui components; Tailwind v4.

See `.agents/` for the full code-style, UI, API, and monorepo guidelines.
