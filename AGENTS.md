# AGENTS.md

Canonical guidance for AI coding agents (Claude Code, Cursor, Copilot, etc.) working in this repository. `CLAUDE.md` is a symlink to this file — keep all agent guidance here so every tool reads one source of truth.

## What this is

Coding Ducks — a real-time coding platform in a Turborepo + pnpm monorepo. Four product surfaces: **Problems** (LeetCode-style multi-language judging), **Ducklets** (real-time collaborative coding rooms with an in-browser WebContainer IDE), **System Design** (drag-and-drop architecture puzzle game with client-side traffic simulation), and **Playground** (scratchpad runner).

> ⚠️ The `.agents/*.md` files and `.cursorrules` are **generic, partly-stale boilerplate** (they describe a Hono e-commerce SaaS with `@repo/` packages — none of that is true here). Trust this file, the `README.md`, and the actual code instead. The API is **tRPC v11**, not Hono; internal packages use the **`@acme/`** prefix; web app is **Next.js 16 / React 19**.

## Commands

Run from repo root unless noted. Node `^23`, pnpm `^10.19.0`.

```bash
pnpm install                 # install; postinstall runs `sherif` workspace lint
make services                # local Postgres (:5433) + Redis (:6380) via Docker
pnpm db:push                 # apply Drizzle schema to Postgres
pnpm auth:generate           # regenerate Better Auth schema types (@acme/auth)
pnpm db:seed                 # seed data
pnpm db:studio               # Drizzle Studio GUI

pnpm dev                     # full stack (web + hocuspocus + watchers) via turbo watch
pnpm dev:next                # only Next.js (web on :3001); requires services running
# hocuspocus realtime server runs on :5000

pnpm build                   # turbo build all
pnpm lint        / lint:fix  # eslint across packages (cached)
pnpm format:fix              # prettier write (cached)
pnpm typecheck               # tsc --noEmit across packages
```

Per-package filtering uses turbo/pnpm `-F`, e.g. `pnpm -F @acme/nextjs dev`, `pnpm -F @acme/db push`.

### Tests

There is **no general test runner**. The only test suite is the System Design calibration suite (Node's built-in `node --test` with a custom TS loader):

```bash
pnpm -F @acme/nextjs test:calibration
# single test: append the file glob, e.g.
pnpm -F @acme/nextjs exec node --test --import ./src/lib/system-design/__tests__/_loader.mjs 'src/lib/system-design/__tests__/level-3.test.ts'
```

It runs reference designs through the real simulation engine and asserts each level stays "beatable-but-hard" (optimal ⇒ 3★, naive ⇒ ≤2★, broken ⇒ fails).

## Architecture

### Monorepo layout

```
apps/web              Next.js 16 app — UI, tRPC server mount, REST route handlers (@acme/nextjs)
apps/hocuspocus-server Standalone Node Y.js/Hocuspocus server for Ducklet collaboration
packages/api          tRPC v11 routers + the code-driver generation system
packages/auth         Better Auth config, client hooks, session middleware
packages/db           Drizzle schema + Postgres client — BACKEND ONLY, never import client-side
packages/ducklet-fs   Shared model/paths/template for the Ducklet virtual filesystem
packages/storage      S3 / R2 client
packages/validators   Shared Zod schemas
tooling/              Shared eslint / prettier / tailwind / tsconfig configs
```

**Dependency rule:** apps depend on packages; packages never depend on apps. `packages/db` must stay out of frontend bundles. Internal packages are imported via `@acme/*` and exported as raw `src` TS (no build step — only `apps/*` have `build`).

### API: tRPC, not REST

The backend is tRPC v11 (SuperJSON transformer, Zod v4, SSE subscriptions). The only real REST route handlers in `apps/web/src/app/api/` are: `trpc/[trpc]` (the mount), `auth/[...all]` (Better Auth), `ai/complete` (ghost-text completion), and `health`.

- Routers live in `packages/api/src/router/*` and compose in `root.ts` as `appRouter` (`auth`, `problem`, `submission`, `codeDraft`, `playground`, `storage`, `ducklet`, `profile`, `bookmark`, `comment`, `systemDesign`).
- `packages/api/src/trpc.ts` builds context (`{ authApi, session, db }`) and procedure helpers. You rarely edit this file — add routers under `router/`.
- Client wiring: `apps/web/src/trpc/{react.tsx,server.tsx,query-client.ts}` (TanStack Query integration, server + RSC clients).
- Realtime app events (chat, member/visibility changes) use an **in-process `EventEmitter`** bus (`packages/api/src/realtime.ts`) streamed over tRPC SSE. This is **single-instance only**; scaling out requires swapping the emitter for Postgres LISTEN/NOTIFY or Redis.

### Code judging (the "driver" system)

`packages/api/src/drivers/` — how user code reaches a verdict across 10 languages (`py, js, ts, java, cpp, c, rs, go, rb, php`). Read `docs/driver-architecture.md` before touching this.

Key idea: the server generates a **self-contained driver program** in the target language that embeds the user's code + all test data as literals, runs comparisons internally, and prints a JSON results array. The external Judge service (`JUDGE_API_URL`) is a dumb executor — it only compiles/runs and returns stdout/stderr; **no test data is ever sent to the client or the judge separately**. Per-language generators are in `drivers/langs/*.ts`; submission flow polls by ID and parses results server-side.

### Ducklets (collaborative IDE)

- Realtime sync: Y.js CRDTs over **Hocuspocus** (`apps/hocuspocus-server`, separate Node service, signed session tokens validated against `@acme/auth` + `@acme/db`). Frontend uses `@hocuspocus/provider`.
- Editor + IDE UI: `apps/web/src/components/code-workspace/` — the **generic, domain-agnostic** Monaco multi-file IDE shell (`monaco/file-editor.tsx`, file explorer/tabs, preview + terminal panels; `workspace.tsx` ties it together). It's **shared by both Ducklets and Machine coding** via a `provider`/`sidePanel`/`bottomPanel`/`renderProvider` extension API — Ducklets passes a live `HocuspocusProvider`, Machine coding passes `provider={null}` + a local Y.Doc. Feature-specific UI lives in sibling folders `components/ducklets/` (dialogs, share) and `components/machine-coding/` (problem panel, tests). Not to be confused with `components/code-editor/`, the separate **CodeMirror** single-file editor used by Problems + Playground.
- In-browser runtime: **WebContainer** (`apps/web/src/lib/webcontainer/`) boots a Node environment in the browser to actually run projects; the runtime + preview/terminal/console panels are generic (driven by a `WebContainerRuntime`, not ducklet-specific).
- AI ghost-text completion: `code-workspace/monaco/use-ai-inline-completion.ts`, backed by `app/api/ai/complete/route.ts` (Codestral FIM via Mistral). This layer is **independent of any LSP layer** (see pending task below).

### System Design game

`apps/web/src/lib/system-design/` — typed block registry, connection validator, a deterministic client-side `simulation-engine.ts`, scoring, and a Zustand-style `store.ts`. Levels are calibration-locked by the test suite above. Canvas UI uses React Flow (`@xyflow/react`). See `docs/system-design-feature.md` and `docs/system-design-solutions.md`.

### Auth

Better Auth (`packages/auth`) with GitHub + Google OAuth and sessions. After changing auth config/tables, run `pnpm auth:generate`, then `pnpm db:push`.

## Conventions

- **Strict TypeScript, no `any`** — use `unknown` + narrowing. No bare `@ts-ignore`.
- Files: `kebab-case`. Vars/funcs: `camelCase`. Types/components: `PascalCase`. Prefer named exports and `async/await`.
- Env vars are validated via `@t3-oss/env-*` (`apps/web/src/env.ts`, `apps/hocuspocus-server/src/env.ts`). The full allow-list is in `turbo.json` `globalEnv`. Local dev loads the root `.env` (scripts wrap commands in `dotenv -e ../../.env`).
- Styling: Tailwind CSS v4 + shadcn/ui; dark-mode-first. Add shadcn components with `pnpm ui-add`.
