# Local Setup Guide

A complete, step-by-step guide to running Coding Ducks on your machine. If you
just want the short version, the [README Quick Start](README.md#getting-started)
covers the happy path — come back here when something doesn't work.

## What you'll be running

| Process            | Where it runs              | Port | Started by                |
| ------------------ | -------------------------- | ---- | ------------------------- |
| Next.js web app    | host (`pnpm dev`)          | 3001 | `pnpm dev` / `dev:next`   |
| Hocuspocus server  | host (`pnpm dev`)          | 5000 | `pnpm dev`                |
| PostgreSQL 15      | Docker                     | 5433 | `make services`           |
| Redis 7            | Docker                     | 6380 | `make services`           |

Two things people trip on immediately:

- **The web app runs on port 3001**, not 3000. Auth callbacks and `BASE_URL`
  must use 3001.
- **Postgres is exposed on host port 5433**, not the default 5432, so it
  doesn't collide with a Postgres you may already have running.

> Redis is started by docker-compose but no app code currently depends on it —
> if the Redis container is unhealthy, nothing breaks.

## 1. Prerequisites

- **Node.js `^23`** — check with `node --version`. If you use a version
  manager: `nvm install 23 && nvm use 23` (or `fnm use 23`).
- **pnpm `10.19.x`** — easiest via corepack, which reads the version pinned in
  `package.json`:

  ```bash
  corepack enable
  corepack prepare --activate   # run inside the repo
  ```

- **Docker** with the compose plugin (`docker compose version` should work).

## 2. Clone and install

```bash
git clone <repo-url> coding_ducks
cd coding_ducks
pnpm install
```

`pnpm install` runs [`sherif`](https://github.com/QuiiBz/sherif) as a
postinstall workspace lint. If it fails, the install still happened — read its
output, it usually points at a dependency-version mismatch between packages.

## 3. Configure `.env`

All scripts in this repo load env from a **single `.env` file at the repo
root** (each package wraps its commands in `dotenv -e ../../.env`). Per-app
`.env.local` files are not used.

```bash
cp .env.example .env
```

The committed `.env.example` works out of the box for local dev **except** you
must set up OAuth for at least one provider to be able to sign in (next
section). Env vars are validated at startup with `@t3-oss/env`; here's what's
actually required:

| Variable | Required? | Local value / notes |
| --- | --- | --- |
| `POSTGRES_URL` | ✅ | `postgres://dev:dev@localhost:5433/codingducks` — matches docker-compose. Note port **5433**. |
| `BETTER_AUTH_SECRET` | ✅ | Any non-empty string locally (`openssl rand -base64 32` for real ones). The hocuspocus server refuses to start without it. |
| `BETTER_AUTH_GITHUB_ID` / `_SECRET` | ✅ non-empty | Real values only if you sign in with GitHub; placeholders otherwise. |
| `BETTER_AUTH_GOOGLE_ID` / `_SECRET` | ✅ non-empty | Real values only if you sign in with Google; placeholders otherwise. |
| `BASE_URL` | ✅ | `http://localhost:3001` — **must be 3001**, it's the auth base URL. |
| `PRODUCTION_URL` | ✅ | Any valid URL in dev, e.g. `https://example.com`. |
| `JUDGE_API_TOKEN` | ✅ non-empty | Placeholder is enough to boot; real token needed to actually run code submissions. |
| `JUDGE_API_URL` | ❌ | Defaults to the hosted judge (`https://judge.codingducks.xyz/api/v1`). |
| `R2_BUCKET`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` | ✅ non-empty | Placeholders are enough to boot (`R2_ENDPOINT` must look like a URL); real Cloudflare R2 credentials only needed for uploads/snapshots. |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | `http://localhost:5000` (the hocuspocus server). |
| `ALLOWED_WS_ORIGINS` | ❌ | Leave empty in dev (= allow all origins). |
| `MISTRAL_API_KEY` | ❌ | Unset = AI ghost-text completion is disabled; everything else works. |
| `NEXT_PUBLIC_UMAMI_SRC` / `_WEBSITE_ID` | ❌ | Analytics; leave empty. |

> **Why "non-empty placeholder"?** Several packages validate their env eagerly
> at import time and treat empty strings as missing. The app won't boot if
> `JUDGE_API_TOKEN` or the `R2_*` vars are empty — but it boots fine with
> dummy values, and only the corresponding feature fails at runtime.

### Setting up an OAuth provider (pick one)

Sign-in is OAuth-only (GitHub + Google), so you need at least one real app.

**GitHub** (fastest): [github.com/settings/developers](https://github.com/settings/developers)
→ *New OAuth App*:

- Homepage URL: `http://localhost:3001`
- Authorization callback URL: `http://localhost:3001/api/auth/callback/github`

Put the client ID/secret in `BETTER_AUTH_GITHUB_ID` / `BETTER_AUTH_GITHUB_SECRET`.

**Google**: [console.cloud.google.com](https://console.cloud.google.com/apis/credentials)
→ *Create credentials → OAuth client ID → Web application*:

- Authorized JavaScript origin: `http://localhost:3001`
- Authorized redirect URI: `http://localhost:3001/api/auth/callback/google`

Put the values in `BETTER_AUTH_GOOGLE_ID` / `BETTER_AUTH_GOOGLE_SECRET`.

## 4. Start Postgres + Redis

```bash
make services
docker compose ps    # both containers should become "healthy"
```

## 5. Create the schema and seed data

```bash
pnpm db:push   # applies the Drizzle schema to Postgres
pnpm db:seed   # optional: seeds the example problems from examples/
```

Notes:

- `db:push` may interactively ask you to confirm changes — that's normal for
  drizzle-kit push.
- The seed prints a warning like "No admin user found" on a fresh database;
  that's fine — problems are still seeded. (To make yourself admin later, flip
  `is_admin` on your user row via `pnpm db:studio`.)
- You do **not** need `pnpm auth:generate` for a fresh setup — the generated
  Better Auth schema is committed. Run it only after changing the auth config,
  then `pnpm db:push` again.

## 6. Run

```bash
pnpm dev        # full stack: web (3001) + hocuspocus (5000) via turbo watch
# or
pnpm dev:next   # only the web app — Ducklets realtime sync won't connect
```

The first compile of a page is slow (Next.js dev mode); subsequent loads are
fast.

## 7. Verify it works

1. Open <http://localhost:3001> — landing page renders.
2. Sign in with the OAuth provider you configured.
3. **Problems**: open a problem, see the editor and test cases. (Running code
   needs a real `JUDGE_API_TOKEN`.)
4. **Ducklets**: create a ducklet — the IDE should boot a WebContainer and the
   file tree should sync. Open the same ducklet in a second browser window to
   see realtime collaboration. If the preview/terminal doesn't boot, use a
   recent Chromium-based browser (WebContainer needs `SharedArrayBuffer`; the
   app already serves the required COOP/COEP headers).
5. **System Design**: open a level, drag blocks, run the simulation — fully
   client-side, needs no external services.

### What works without real credentials

| Feature | Needs |
| --- | --- |
| Browsing, auth, profiles, dashboard | nothing extra |
| Ducklets (collab editing, WebContainer, chat) | nothing extra |
| System Design game | nothing extra |
| Running code (Problems, Playground) | real `JUDGE_API_TOKEN` |
| File uploads / ducklet snapshots | real `R2_*` credentials |
| AI ghost-text completion | `MISTRAL_API_KEY` |

## Day-to-day commands

```bash
pnpm dev            # full stack
pnpm db:studio      # browse the database (Drizzle Studio)
pnpm lint:fix       # eslint
pnpm format:fix     # prettier
pnpm typecheck      # tsc across all packages
make logs           # follow Postgres/Redis container logs
make down           # stop containers (data preserved)
pnpm -F @acme/nextjs test:calibration   # System Design calibration tests
```

## Troubleshooting

**"Invalid environment variables" on startup**
The error names the offending vars. Remember empty strings count as *missing*
for `JUDGE_API_TOKEN`, the `R2_*` vars, and the hocuspocus server's
`POSTGRES_URL`/`BETTER_AUTH_SECRET` — use placeholders, not `""`. Also check
you edited the **root** `.env` (not a file inside `apps/web`).

**`ECONNREFUSED` / can't reach Postgres**
Services not running (`make services`), or your `POSTGRES_URL` uses port 5432
instead of **5433**. Check container health with `docker compose ps`.

**OAuth error / `redirect_uri_mismatch` / bounced back to sign-in**
`BASE_URL` must be exactly `http://localhost:3001`, and the callback URL
registered in your OAuth app must match
`http://localhost:3001/api/auth/callback/<provider>`.

**Port already in use (3001 / 5000 / 5433 / 6380)**
Find the holder with `lsof -i :<port>`. For 5433/6380, you may have stale
containers from another project: `docker ps`, then stop them.

**Hocuspocus crashes immediately / Ducklets won't sync**
The hocuspocus server hard-requires `POSTGRES_URL` and `BETTER_AUTH_SECRET`.
Also make sure you ran `pnpm dev` (not `dev:next`) so it's actually running,
and that `NEXT_PUBLIC_SOCKET_URL=http://localhost:5000`.

**`pnpm install` fails at `postinstall`**
That's `sherif`, the workspace lint — its output names the inconsistent
dependency. Fix the version mismatch it reports.

**Wrong Node/pnpm version errors**
The repo pins `node ^23` and `pnpm 10.19.0` in `package.json#engines`.
`corepack enable` inside the repo picks up the right pnpm automatically.

**Ducklet preview/terminal never boots**
WebContainer requires `SharedArrayBuffer`. Use a recent Chromium-based browser
and plain `http://localhost:3001` (not an IP or a tunnel that strips the
COOP/COEP headers).

## Resetting

```bash
make down                # stop containers, keep data
make dangerously-clean   # stop containers AND delete all Postgres/Redis data
pnpm clean               # nuke node_modules everywhere
```

After `dangerously-clean`, re-run `make services && pnpm db:push && pnpm db:seed`.
