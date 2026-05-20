# Ducklets Audit

**Scope decision:** Ducklets is a **frontend playground** (HTML/CSS/JS only, CodePen-style) with real-time collaboration. Multi-language ambitions are dropped — schema enums and editor language switches that imply otherwise should be pruned.

**Guest mode:** `/ducklets/[id]/guest` is **kept** as a "try the snapshot" sandbox. Private ducklets must not be readable through it.

---

## TL;DR

Ducklets is conceptually sound and the realtime layer works end-to-end: Y.js documents persist as base64 in Postgres, Hocuspocus rehydrates them on load, chat replays from the doc, presence is wired. The membership state machine (invite / request / accept) is implemented in the tRPC router.

The feature is **not launch-ready**. Three classes of problem dominate:

1. **Authentication is honor-system.** The websocket trusts a `userId` query parameter; `ducklet.byId` is `publicProcedure`. Any private ducklet is readable by anyone who knows its numeric ID.
2. **The UI is a polished demo.** Pagination is broken at 50, viewers can type in 2 of 3 panels, the delete dropdown shows on every card regardless of ownership, the settings modal still says "Pen Settings."
3. **Operations are unfinished.** No graceful shutdown, no healthcheck, no Docker service, no horizontal scaling, no preview-image cleanup.

Below is the inventory and a prioritized ticket list.

---

## 1. Concept Validation

What works as a frontend playground:
- Y.js + Hocuspocus + DB persistence is the right architecture; documents survive restarts and reconnects.
- The chat-in-Y.js + audit-table-on-store pattern is clever and reduces a class of consistency bugs.
- Auto-preview screenshot for the listing page is a strong differentiator vs. CodePen.
- The invite / request-access / role state machine covers the cases that matter (private collab with hand-picked editors).

What needs to be cut now that scope is frozen to frontend-only:
- `duckletTypeEnum` with `["normal", "web"]` — collapse to a single type or drop the column.
- `CollabEditor`'s `language: "py" | "cpp" | "java" | ...` prop surface — remove.
- The dead `"owner"` value in `memberRoleEnum` (the owner is tracked via `ducklet.ownerId`, never inserted as a member row).
- The dead `language` switching code path in `settings-modal.tsx`.

What's still missing for a credible v1 launch as a frontend playground:
- Rename + fork + archive.
- Search / sort / filter on the list page.
- Mobile layout for the editor (currently unusable below ~600px).
- Light-mode editor theme.
- Reconnect / offline indicator.
- A real way to share with someone who isn't yet a member (a copyable link that lands them on a sensible page).

---

## 2. Code Inventory

**Backend / data**
- `packages/db/src/schema/ducklets.ts` — `ducklet` and `ducklet_member` tables.
- `packages/db/src/schema/ducklet-messages.ts` — `ducklet_message` table.
- `packages/db/src/schema/enums.ts` — `ducklet_type`, `member_role`, `member_status`.
- `packages/api/src/router/ducklet.ts` — 11 procedures: `list`, `byId`, `create`, `update`, `delete`, `addMember`, `removeMember`, `inviteUser`, `requestAccess`, `respondToInvite`, `respondToRequest`. No message-read procedure exists.

**Realtime**
- `apps/hocuspocus-server/src/index.ts` — Hocuspocus server, all hooks, DB persistence, chat extraction.
- `apps/hocuspocus-server/src/services/preview.ts` — Puppeteer screenshot pipeline writing to R2.
- `apps/hocuspocus-server/env.ts` — only validates `POSTGRES_URL`.

**Frontend**
- `apps/web/src/app/(main)/ducklets/page.tsx` — list page.
- `apps/web/src/app/(main)/ducklets/[id]/page.tsx` — live editor page.
- `apps/web/src/app/(main)/ducklets/[id]/guest/page.tsx` — snapshot sandbox.
- `apps/web/src/components/collab-editor/` — editor, layout manager, share modal, settings modal, console, preview, guest editor.
- `apps/web/src/hooks/use-socket.ts` — Hocuspocus client + awareness + chat.

---

## 3. Tickets

Tickets are ordered by priority. Each has: priority, size estimate, file:line refs, acceptance criteria.

Sizes: **XS** ≤ 30min, **S** ≤ 2h, **M** ≤ 1 day, **L** > 1 day.

### P0 — Security: do before exposing to any untrusted user

#### DUCK-001 — Verify Hocuspocus connections with a real session token
**P0 · M**
The websocket trusts a `userId` query parameter sent by the client (`apps/hocuspocus-server/src/index.ts:34`, `apps/web/src/hooks/use-socket.ts:79`). Any attacker can impersonate any user by passing their ID.

- Sign or fetch a short-lived session token in a Next.js route handler (e.g., `apps/web/src/app/api/ducklet/[id]/wsauth/route.ts`) that returns `{ token, userId, duckletId, role }` based on the Better Auth session and a membership check.
- Pass that token to `useSocketDucklet`; the hook attaches it via Hocuspocus's `token` field (not a query string).
- In `onAuthenticate`, verify the token (HMAC or stateless JWT signed with a server-only secret), and derive `userId`/`duckletId`/`role` from the verified payload — never from the request.
- Remove the `userId` query-param path entirely.

Acceptance: a websocket connection with no token, a forged token, or a token for a different ducklet is rejected with "Access denied."

#### DUCK-002 — Stop swallowing `onAuthenticate` errors
**P0 · XS**
`apps/hocuspocus-server/src/index.ts:107-109` catches any thrown exception and returns normally. A DB hiccup becomes free access.

- Replace `console.log(error)` with `console.error(error)` and `throw new Error("Access denied")` inside the catch.

Acceptance: forcing a DB error during auth produces a rejected connection, not a successful one.

#### DUCK-003 — Gate `ducklet.byId` with an authorization check
**P0 · S**
`packages/api/src/router/ducklet.ts:74` is `publicProcedure`. The handler does have visibility logic but `yjsData` is returned in the response (consumed by the guest page), so any caller who knows a numeric ID can fetch a private ducklet's full source.

- Keep `publicProcedure` but: if the ducklet is private, require an authenticated session AND an `ownerId === userId` or active membership row before returning `yjsData`. If unauthorized, either 403 or return the metadata without `yjsData`.
- Add a separate `ducklet.bySlug` or `ducklet.publicById` later if a clean read-only surface is needed.

Acceptance: an unauthenticated `trpc.ducklet.byId({ id: <private> })` call returns no `yjsData` (or 403).

#### DUCK-004 — Implement (or remove) the anonymous-user branch in `onAuthenticate`
**P0 · XS**
`apps/hocuspocus-server/src/index.ts:38-41` is a 4-line comment with no code. Once DUCK-001 lands, the entire branch is moot — delete it. Until then, replace the comment with an explicit `throw new Error("Anonymous connections not allowed")`.

Acceptance: the file has no skeleton TODO comment; behavior is explicit.

#### DUCK-005 — Validate awareness (presence) updates against the server-verified user
**P0 · S**
`apps/web/src/hooks/use-socket.ts:89-94` sets `awareness.user.id` / `name` from client state with no server check. Anyone can spoof another user's name in the presence list and chat attribution.

- In `onAuthenticate`, derive a `user` object from the verified token and stash it on `connection.context`.
- Add an `onAwarenessUpdate` (or similar Hocuspocus hook) that overwrites `awareness.user` with the verified context's user before broadcasting.

Acceptance: a malicious client setting `awareness.user.id = "someone-else"` has the value rewritten back to its real identity before other peers see it.

#### DUCK-006 — Sanitize `headScripts` in preview render
**P0 · S**
`apps/hocuspocus-server/src/services/preview.ts:29` interpolates `headScripts` directly into the rendered `<head>`. Any editor can inject arbitrary HTML/JS into the screenshotter.

- Either: render headScripts as `<script src="...">` only after URL-allowlist validation, or strip `<script>` tags entirely and only allow a small set of pre-approved `<link>` tags.
- Remove `--no-sandbox` from Puppeteer args in dev — accept the slightly more painful setup over the security hole.

Acceptance: a ducklet with `headScripts = "<script>fetch('//evil')</script>"` does not execute the script during screenshot generation.

---

### P1 — Bugs the next user will hit

#### DUCK-007 — Pass `readOnly` to CSS and JS editors
**P1 · XS**
`apps/web/src/components/collab-editor/layout-manager.tsx:135,150` — only the HTML panel receives `readOnly`. Viewers can type in CSS and JS until the server rejects.

Acceptance: a viewer-role user sees a disabled cursor in all three panels.

#### DUCK-008 — Wire `onVisibilityChange` from share modal
**P1 · XS**
`apps/web/src/app/(main)/ducklets/[id]/page.tsx:199` — `onVisibilityChange` prop is never passed, so toggling public/private in the modal does not update the parent's `isPublic` state mid-session.

Acceptance: toggling visibility in the modal updates the parent's state without a full reload.

#### DUCK-009 — Return `ownerId` from `ducklet.list` and gate the Delete dropdown
**P1 · XS**
`packages/api/src/router/ducklet.ts:44-68` omits `ownerId` in the list response. `apps/web/src/app/(main)/ducklets/page.tsx` shows the Delete option on every card.

Acceptance: Delete only appears on cards the current user owns.

#### DUCK-010 — Fix list pagination
**P1 · S**
`apps/web/src/app/(main)/ducklets/page.tsx:88` hardcodes `limit: 50` with no "load more." The 51st ducklet is invisible.

- Add `useInfiniteQuery` with `cursor` (offset) and an intersection-observer "load more" sentinel, or a simple Load More button.

Acceptance: scrolling past 50 cards fetches the next page.

#### DUCK-011 — Handle the "private + non-member" navigation case
**P1 · S**
`apps/web/src/app/(main)/ducklets/[id]/page.tsx:122-148` — a non-member visiting a private ducklet URL gets stuck on "Connecting to room..." with no error. The redirect to `/guest` only happens when `isPublic` is true.

- If the user is not a member and the ducklet is private, render an explicit "You don't have access to this ducklet" screen with a Request Access button (only if logged in) or a Sign In CTA.

Acceptance: a non-member visitor sees a clear page, never an infinite spinner.

#### DUCK-012 — Add the `ducklet_member` primary key + UNIQUE(duckletId, userId)
**P1 · S**
`packages/db/src/schema/ducklets.ts:46` — the table has neither a PK nor a uniqueness constraint. Concurrent invites / joins can produce duplicate rows that downstream `.limit(1)` checks resolve non-deterministically.

- Add `primaryKey({ columns: [duckletId, userId] })`.
- Migration: deduplicate existing rows first (`DELETE … USING …`).

Acceptance: `pnpm db:push` succeeds; trying to insert a duplicate throws a unique violation.

#### DUCK-013 — Remove the `context.getConnections()` call in `onStoreDocument`
**P1 · S**
`apps/hocuspocus-server/src/index.ts:215` — `context` in `onStoreDocument` is the document context, not a connection registry. This API likely does not exist on the Hocuspocus 2.x `StoreDocumentPayload` and could throw at runtime.

- Replace with `payload.document.getConnectionsCount?.() ?? 0` or track connection counts via `onConnect`/`onDisconnect` and pass through `documentName` to a local map.

Acceptance: `lastClientsCount` is computed without using a nonexistent API, verified by a unit test or a manual server run.

---

### P2 — Ops & durability

#### DUCK-014 — Graceful shutdown
**P2 · S**
`apps/hocuspocus-server/src/index.ts` has no SIGTERM/SIGINT handler. On deploy, in-flight edits are lost.

- Add `process.on("SIGTERM", async () => { await server.destroy(); process.exit(0); })`.
- Verify Hocuspocus's `destroy()` flushes pending stores; if not, iterate the document map and force-store first.

Acceptance: kicking the server with SIGTERM during an active edit results in the edit being persisted in `ducklet.yjsData`.

#### DUCK-015 — Add a Docker service for hocuspocus
**P2 · S**
`docker-compose.yml` provisions Postgres + Redis but no hocuspocus service. There is no production deployment spec.

- Add a `hocuspocus` service with build context `apps/hocuspocus-server`, exposed port `5000`, and `depends_on: postgres`.
- Add a healthcheck (see DUCK-016).

Acceptance: `make dev` starts hocuspocus alongside Postgres/Redis.

#### DUCK-016 — Healthcheck endpoint
**P2 · XS**
No HTTP endpoint exists. Container orchestrators have nothing to probe.

- Mount a minimal `http.createServer` on `PORT+1` (or use Hocuspocus's `extensions: [new Webhook(...)]` story) that returns `200 { uptime, connections }`.

Acceptance: `curl localhost:5001/health` returns `200`.

#### DUCK-017 — Add the missing indexes
**P2 · S**
- `ducklet(ownerId)` — for `list` with `onlyMine`.
- `ducklet(isPublic)` — for the public filter.
- `ducklet_member(duckletId)` — for `byId`'s member fetch.
- `ducklet_member(userId)` — for "my invites/memberships" lookups.
- `ducklet_message(duckletId, createdAt)` — for future message read endpoint.

Acceptance: `EXPLAIN ANALYZE` on each query shows index usage.

#### DUCK-018 — Stop accumulating R2 preview keys
**P2 · S**
`apps/hocuspocus-server/src/services/preview.ts:80-82` writes a new `preview/<duckletId>/<timestamp>.png` on every save without deleting the old one.

- Either: write to a stable key `preview/<duckletId>.png` (overwrite), or delete the previous `previewImage` after a successful new upload.

Acceptance: R2 has one preview per ducklet, not N.

#### DUCK-019 — Move preview generation off the store path
**P2 · M**
Preview screenshot runs synchronously inside `onStoreDocument` via `void generateAndStorePreview(...)` (`index.ts:205`). Under collab load, every keystroke debounce triggers a Puppeteer launch.

- Push a job to `packages/jobs` (BullMQ) with the ducklet ID; debounce server-side (e.g., 60s per ducklet) and run Puppeteer in a worker process.

Acceptance: rapid edits produce at most one screenshot per ducklet per 60s window.

#### DUCK-020 — Bump `updatedAt` on Hocuspocus writes
**P2 · XS**
`updatedAt` uses Drizzle's `$onUpdateFn` which only fires on Drizzle update queries. The hocuspocus `onStoreDocument` writes directly and never bumps it.

- Set `updatedAt: new Date()` explicitly in the `update().set({...})` payload at `apps/hocuspocus-server/src/index.ts:162`.

Acceptance: editing a ducklet bumps its `updatedAt` and it moves to the top of "recent" lists.

#### DUCK-021 — CORS / origin restriction on the websocket
**P2 · S**
No origin allowlist anywhere. Any page on any domain can open a websocket.

- In `onAuthenticate`, check `request.headers.origin` against an allowlist from env.

Acceptance: a websocket connection from an unlisted origin is rejected.

---

### P3 — Scope cleanup (now that "frontend playground only" is the decision)

#### DUCK-022 — Drop multi-language scaffolding from the editor
**P3 · S**
`apps/web/src/components/collab-editor/index.tsx:22` declares `language: "py" | "cpp" | "java" | "html" | "css" | "js"`. Settings modal exposes a switcher that does nothing useful for the locked HTML/CSS/JS layout.

- Narrow the type to `"html" | "css" | "js"`.
- Remove unused language imports.
- Remove the language switcher from `settings-modal.tsx`.

Acceptance: `grep -r "language: \"py\"" apps/` returns no matches.

#### DUCK-023 — Collapse the `ducklet_type` enum or drop the column
**P3 · S**
`packages/db/src/schema/enums.ts` has `ducklet_type: ["normal", "web"]`. With scope frozen to frontend, the column is dead weight.

- Either drop the column (migration) or collapse the enum to a single value and remove the input from `create`.

Acceptance: `ducklet.type` is no longer in the create/update tRPC inputs.

#### DUCK-024 — Remove the dead `"owner"` value from `memberRoleEnum`
**P3 · XS**
The owner is tracked only via `ducklet.ownerId`. The hocuspocus check `member.role === "owner"` (`index.ts:72`) can never match.

- Drop `"owner"` from the enum, replace the dead check with `ducklet.ownerId === userId`.

Acceptance: enum has `["editor", "viewer"]` only; auth check is updated.

#### DUCK-025 — Rename "Pen Settings" to "Ducklet Settings"
**P3 · XS**
`apps/web/src/components/collab-editor/settings-modal.tsx:57` — CodePen artifact.

Acceptance: title reads "Ducklet Settings."

#### DUCK-026 — Remove the `console.log("hi")` and other dev noise
**P3 · XS**
- `apps/hocuspocus-server/src/index.ts:16` — `console.log("hi")`.
- `apps/web/src/components/collab-editor/layout-manager.tsx:52,53` — debug `console.log`.

Acceptance: no stray logs in the diff.

#### DUCK-027 — Fix `any` usages
**P3 · S**
- `apps/web/src/hooks/use-socket.ts:125` (`state: any`).
- `apps/web/src/components/collab-editor/share-modal.tsx:208` (`val: any`).
- `apps/web/src/components/collab-editor/console.tsx:8,30`.
- `apps/hocuspocus-server/src/index.ts:173` (`messages` as `any[]`).
- `apps/hocuspocus-server/src/services/preview.ts:74-76`.

Acceptance: `grep -n "any" …` only finds legitimate library-imposed cases (if any).

---

### P3 — Missing-feature backlog (post-launch, ordered by user impact)

| ID | Title | Size | Notes |
|---|---|---|---|
| DUCK-028 | Rename in list dropdown + editor header | S | Add a `rename` mutation or extend `update` UI. |
| DUCK-029 | Fork / duplicate a ducklet | S | New mutation that clones name + `yjsData` under the caller's ownership. |
| DUCK-030 | Search + sort on list page | M | Server-side `name ILIKE` + sort by `updatedAt` / `createdAt`. |
| DUCK-031 | Reconnect / offline indicator | XS | Surface `isConnected` from `use-socket.ts:59` as a chip in the header. |
| DUCK-032 | Mobile layout for the editor | M | Stack panels vertically below `md:`; collapse chat into a sheet. |
| DUCK-033 | Light-mode editor theme | S | Swap `oneDark` based on `useTheme()`. |
| DUCK-034 | Lazy-load CodeMirror + Y.js | S | `dynamic(() => import(...), { ssr: false })` around the editor. |
| DUCK-035 | Change member role after invite | S | New `updateMemberRole` mutation + UI in share modal. |
| DUCK-036 | Rate-limit `requestAccess` | S | Add a per-user-per-ducklet cooldown (Redis counter). |
| DUCK-037 | Chat history read endpoint + pagination | M | New tRPC `ducklet.messages.list` reading `ducklet_message` ordered by `createdAt` with keyset pagination. Depends on DUCK-017 index. |
| DUCK-038 | Snapshot / version history | L | Add `ducklet_snapshot(id, duckletId, yjsData, createdAt, label)` and periodic snapshotting in `onStoreDocument`. |
| DUCK-039 | Replace `window.confirm` delete with `AlertDialog` | XS | Match the rest of the app's shadcn-driven UX. |
| DUCK-040 | Don't cascade-delete chat messages when a user is deleted | S | Change `onDelete: cascade` to `onDelete: set null` on `ducklet_message.userId`, render "deleted user" tombstone in chat. |
| DUCK-041 | Reduce N+1 in `byId` | S | Use a Drizzle relation query to fetch ducklet + members + owner in one trip. |
| DUCK-042 | Reduce N+1 in `onStoreDocument` membership re-check | S | Cache membership per connection in `connection.context` from `onAuthenticate`. |
| DUCK-043 | Length caps on `description`, `yjsData`, message `content` | S | Add zod `.max(...)` and DB `varchar(N)` where appropriate. |
| DUCK-044 | a11y: aria-labels on Send, presence overflow, layout toggles | S | One pass through the editor and list pages. |
| DUCK-045 | Telemetry events (created, opened, edited, invited, deleted) | M | Whatever analytics layer the rest of the app uses. |

---

## 4. Suggested execution order

1. **Security sprint (P0):** DUCK-001 → DUCK-006. Until DUCK-001/003 land, do not allow private ducklets to contain anything sensitive.
2. **Bug sweep (P1):** DUCK-007 → DUCK-013. Fast wins that materially improve trust in the feature.
3. **Ops sprint (P2):** DUCK-014 → DUCK-021. Required before production.
4. **Scope cleanup (P3 first batch):** DUCK-022 → DUCK-027. Reduces surface area to maintain.
5. **Feature backlog (P3 second batch):** prioritize DUCK-028, DUCK-030, DUCK-031, DUCK-032 for v1.
