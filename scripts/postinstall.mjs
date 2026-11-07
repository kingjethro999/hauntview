#!/usr/bin/env node
/**
 * postinstall.mjs
 *
 * Installs Playwright's Chromium browser in local development only,
 * and only when it isn't already installed for the current Playwright version.
 *
 * Skip conditions:
 *   - RENDER=true   → Render build/runtime (uses @sparticuz/chromium instead)
 *   - CI=true       → GitHub Actions and most hosted CI (no browsers needed for lint/build)
 *   - SKIP_PLAYWRIGHT_INSTALL=1 → manual opt-out
 *
 * Idempotency:
 *   We ask `playwright install --dry-run chromium` first. If it exits 0 with
 *   no output (nothing to install), we skip. This avoids re-downloading on
 *   every `pnpm install` when the binary is already cached.
 */

import { execSync, spawnSync } from 'node:child_process';

const isRender = process.env.RENDER === 'true';
const isCI = process.env.CI === 'true';
const isSkipped = process.env.SKIP_PLAYWRIGHT_INSTALL === '1';

if (isRender || isCI || isSkipped) {
  const reason = isRender ? 'RENDER=true' : isCI ? 'CI=true' : 'SKIP_PLAYWRIGHT_INSTALL=1';
  console.log(`[postinstall] Skipping Playwright install (${reason}).`);
  process.exit(0);
}

// Check if Chromium is already installed for this exact Playwright version.
// `playwright install --dry-run` prints what *would* be downloaded.
// If stdout is empty (or only whitespace), everything is already cached.
const dryRun = spawnSync('pnpm', ['exec', 'playwright', 'install', '--dry-run', 'chromium'], {
  encoding: 'utf8',
});

const dryRunOutput = (dryRun.stdout ?? '').trim();
const alreadyInstalled = dryRun.status === 0 && dryRunOutput === '';

if (alreadyInstalled) {
  console.log('[postinstall] Playwright Chromium already installed — nothing to do.');
  process.exit(0);
}

console.log('[postinstall] Installing Playwright Chromium...');
execSync('pnpm exec playwright install chromium', { stdio: 'inherit' });
