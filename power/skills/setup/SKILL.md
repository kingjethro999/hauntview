---
name: setup
description: Verify the environment, Node.js version, Playwright browser binaries, and MCP connectivity for HauntView.
---

# HauntView Setup

## Steps

1. Verify Node.js version is `>= 22.12.0` (`node -v`).
2. Verify Playwright Chromium binary is installed (`npx playwright install chromium`).
3. Check that HauntView MCP server is registered in Kiro settings (`.kiro/settings/mcp.json`).
4. Run `list-test-profiles` to verify the tool server responds with all 25 test profiles.
5. Report status plainly to the user.
