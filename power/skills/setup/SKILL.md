---
name: setup
description: Verify the environment, Node.js version, Playwright browser binaries, and MCP connectivity for HauntView.
---

# HauntView Setup

Verify the environment is ready to run HauntView rites before any testing work.

## Prerequisites

- Node.js `>= 22.12.0` (`node -v`)
- pnpm installed
- Playwright browser binaries (Chromium required; WebKit for the default engine)

## Steps

1. **Node version** — run `node -v`. If below 22.12.0, tell the user to upgrade;
   do not proceed with installs they didn't ask for.
2. **Dependencies** — if `node_modules` is missing, run `pnpm install`.
3. **Playwright browsers** — check binaries exist; if not, run
   `pnpm exec playwright install chromium` (add `webkit` if the engine needs it).
   First launch may be slow — that's normal.
4. **MCP registration** — confirm `.kiro/settings/mcp.json` registers the
   HauntView server (`power/mcp.json` is the source config).
5. **Smoke test** — call `list-test-profiles`. A healthy server returns all 25
   profiles. If the call fails, check that the MCP server process started and
   that stdout is reserved for protocol traffic (logs must go to stderr).
6. **Optional sanity rite** — run `run-test-profile` against a simple public
   page (e.g. `https://example.com`) with the `console-errors` rite to confirm
   end-to-end execution.

## Reporting

Report status plainly, one line per check: pass / fail / skipped, with the fix
command for anything that failed. Do not claim readiness until `list-test-profiles`
responds successfully.

## Common failures

- `browserType.launch: Executable doesn't exist` → step 3.
- MCP tool calls time out → server not registered or crashed on startup; check
  stderr logs for the MCP process.
- `INVALID_URL` on a valid-looking URL → the SSRF guard rejected a private or
  non-http(s) address; use a public http(s) URL.
