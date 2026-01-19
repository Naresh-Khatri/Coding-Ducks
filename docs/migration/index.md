# Coding Ducks Migration - Phase Index

> **How to use**: Each phase is a standalone document with complete context. Open one phase at a time in your LLM to avoid context exhaustion.

---

## Finalized Technology Decisions

| Concern | Decision | Notes |
|---------|----------|-------|
| **Auth** | Better Auth | Google + GitHub providers |
| **ORM** | Drizzle | PostgreSQL |
| **API** | tRPC | Type-safe end-to-end |
| **UI** | shadcn/ui | All components |
| **Editor** | CodeMirror (primary) | Fallback to Monaco if needed |
| **Code Execution** | [cd-judge-api](https://github.com/naresh-khatri/cd-judge-api) | Your own API |
| **Real-time** | PartyKit | Cloudflare Workers based |
| **Storage** | R2 (via S3 client) | For images/screenshots |
| **Image Comparison** | Python (existing) | Keep as microservice |

---

## Phases Overview

| Phase | Document | Description | Est. Time |
|-------|----------|-------------|-----------|
| 1 | [phase-1-foundation.md](./phases/phase-1-foundation.md) | Schema, auth, base setup | 6h |
| 2 | [phase-2-problems.md](./phases/phase-2-problems.md) | Problems feature end-to-end | 12h |
| 3 | [phase-3-ducklets.md](./phases/phase-3-ducklets.md) | Collaborative rooms | 16h |
| 4 | [phase-4-ui-challenges.md](./phases/phase-4-ui-challenges.md) | UI design battles | 12h |
| 5 | [phase-5-user-features.md](./phases/phase-5-user-features.md) | Profiles, dashboard | 6h |
| 6 | [phase-6-polish.md](./phases/phase-6-polish.md) | Landing, SEO, polish | 6h |

---

## Migration Order

```
Phase 1 (Foundation) ──────────────────────────────────────────►
                      │
                      ├─► Phase 2 (Problems) ─► Phase 5 (User Features)
                      │                              │
                      ├─► Phase 3 (Ducklets) ────────┤
                      │                              │
                      └─► Phase 4 (UI Challenges) ───┴─► Phase 6 (Polish)
```

**Note**: Phases 2, 3, 4 can be worked on in parallel after Phase 1 is complete.
