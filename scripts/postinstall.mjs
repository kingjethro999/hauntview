#!/usr/bin/env node
/**
 * postinstall.mjs
 *
 * Installs Playwright browsers in local development only.
 * On Render (or any CI/production environment) we use @sparticuz/chromium
 * instead of full browser binaries, so we skip the install entirely.
 *
 * The RENDER env var is set automatically by Render on all build and runtime
 * containers. CI=true covers most other hosted environments.
 */

import { execSync } from 'node:child_process';

const isRender = process.env.RENDER === 'true';
const isCI = process.env.CI === 'true';
const isProd = process.env.NODE_ENV === 'production';

if (isRender || isCI || isProd) {
  console.log(
    '[postinstall] Hosted/production environment detected — skipping playwright install.',
    `(RENDER=${process.env.RENDER ?? 'unset'}, CI=${process.env.CI ?? 'unset'}, NODE_ENV=${process.env.NODE_ENV ?? 'unset'})`
  );
  process.exit(0);
}

console.log('[postinstall] Local environment — installing Playwright browsers...');
execSync('pnpm exec playwright install chromium', { stdio: 'inherit' });
