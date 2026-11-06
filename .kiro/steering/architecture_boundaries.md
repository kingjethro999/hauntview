---
inclusion: always
---

# Architecture Boundaries — HauntView

This steering document locks the strict separation of concerns across HauntView's layers.
Kiro **must not** generate code that crosses these boundaries without explicit approval.

## Layer Map

```
┌─────────────────────────────────────────────────────────┐
│  FACES  (Web UI, CLI, MCP server)                        │
│  ─ no business logic, no direct DB access               │
│  ─ call Core only through documented contracts           │
├─────────────────────────────────────────────────────────┤
│  CORE  (src/core/, packages/core/)                       │
│  ─ orchestrator, rites, findings, diff, storage          │
│  ─ owns Zod schemas and TypeScript types                 │
│  ─ may use Playwright, axe-core, pixelmatch, SQLite      │
│  ─ must NOT import from app/, packages/web/              │
├─────────────────────────────────────────────────────────┤
│  STORAGE  (SQLite, file system)                          │
│  ─ accessed only through CryptService                    │
│  ─ no raw SQL outside CryptService                       │
└─────────────────────────────────────────────────────────┘
```

## Non-Negotiable Rules

1. **Faces contain zero business logic.** Any logic needed by two faces belongs in Core.
2. **One source of truth for contracts.** All shared types are Zod schemas in
   `src/core/contracts/` (or `packages/core/src/contracts/`). TypeScript types are
   derived from Zod schemas with `z.infer<>`. Never define a type twice.
3. **Evidence is never manufactured.** A finding without populated `evidence[]` must
   not be returned by any rite. The Core enforces this invariant at runtime.
4. **UntrustedText wrapping.** Any string that originates from a tested page
   (console messages, DOM text, headers, alt text) **must** be wrapped in
   `{ untrusted: true, text: truncated }` before it reaches the UI, MCP response,
   or a report. Control characters are stripped; length is capped at 300 chars.
5. **No cross-layer imports.** `packages/web` must not import from `packages/core`
   directly — it calls the local HTTP API. `packages/mcp` calls Core directly (same
   process). CLI calls Core directly.
6. **SQLite is synchronous and local.** Use `better-sqlite3`. No async SQLite wrappers.
   All writes are wrapped in a transaction when modifying more than one table.
7. **Playwright contexts are ephemeral.** Each rite runs in a fresh `BrowserContext`
   that is closed after the rite completes, regardless of success or failure.

## Directory Ownership

| Directory                       | Owner layer | May import from                                       |
| ------------------------------- | ----------- | ----------------------------------------------------- |
| `app/` or `packages/web/`       | Web UI      | local HTTP API only                                   |
| `packages/mcp/`                 | MCP face    | Core contracts, Core service                          |
| `packages/cli/`                 | CLI face    | Core contracts, Core service                          |
| `src/core/` or `packages/core/` | Core        | Node stdlib, Playwright, axe, pixelmatch, SQLite, Zod |
| `packages/report/`              | Report face | Core contracts (read-only)                            |

## Rite Isolation

Each rite:

- Receives a `BrowserContext` from the Core orchestrator.
- Returns a `RiteResult` (defined in contracts).
- Does **not** write to the database directly.
- Does **not** call other rites.
- Does **not** throw unhandled exceptions — catches and returns `status: 'error'`.

## Security Boundary

- Server binds to `127.0.0.1` only.
- Host header is validated against an allowlist.
- Private RFC 1918 / link-local ranges are blocked unless `HAUNT_ALLOW_PRIVATE=1`.
- `stdout` in `packages/mcp` is reserved for the MCP protocol. All logging goes to
  `stderr` or a log file.
