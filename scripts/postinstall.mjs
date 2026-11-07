#!/usr/bin/env node
/**
 * postinstall.mjs
 *
 * Installs Playwright's Chromium browser in local development or global install,
 * only when it isn't already installed for the current Playwright version.
 * Supports Windows (npx.cmd, shell execution) and Unix (Linux, macOS, BSD).
 *
 * Safe: Wrapped in try/catch to ensure postinstall never fails npm install.
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

try {
  const isWin = process.platform === 'win32';
  const npxCmd = isWin ? 'npx.cmd' : 'npx';

  // Check if Chromium is already installed for this exact Playwright version.
  const dryRun = spawnSync(npxCmd, ['playwright', 'install', '--dry-run', 'chromium'], {
    encoding: 'utf8',
    shell: isWin,
  });

  const dryRunOutput = (dryRun.stdout ?? '').trim();
  const alreadyInstalled = dryRun.status === 0 && dryRunOutput === '';

  if (alreadyInstalled) {
    console.log('[postinstall] Playwright Chromium already installed — nothing to do.');
    process.exit(0);
  }

  console.log('[postinstall] Installing Playwright Chromium...');
  execSync(`${npxCmd} playwright install chromium`, {
    stdio: 'inherit',
    shell: isWin,
  });
} catch (err) {
  // Best-effort attempt: Never fail npm install
  console.warn(
    `[postinstall] Note: Automatic browser installation deferred to first run (${err.message})`
  );
  process.exit(0);
}
