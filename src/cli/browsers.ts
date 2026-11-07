/**
 * src/cli/browsers.ts
 *
 * First-run browser verification and installer for Chromium, Firefox, and WebKit.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { chromium, firefox, webkit } from 'playwright';
import { getCliConfigDir } from './config';

export interface BrowserStatus {
  name: 'chromium' | 'firefox' | 'webkit';
  installed: boolean;
  executablePath?: string;
}

/**
 * Returns the status of all 3 Playwright browsers
 */
export function getBrowsersStatus(): BrowserStatus[] {
  const browsers: BrowserStatus[] = [
    { name: 'chromium', installed: false },
    { name: 'firefox', installed: false },
    { name: 'webkit', installed: false },
  ];

  try {
    const p = chromium.executablePath();
    browsers[0].installed = fs.existsSync(p);
    browsers[0].executablePath = p;
  } catch {
    browsers[0].installed = false;
  }

  try {
    const p = firefox.executablePath();
    browsers[1].installed = fs.existsSync(p);
    browsers[1].executablePath = p;
  } catch {
    browsers[1].installed = false;
  }

  try {
    const p = webkit.executablePath();
    browsers[2].installed = fs.existsSync(p);
    browsers[2].executablePath = p;
  } catch {
    browsers[2].installed = false;
  }

  return browsers;
}

export function areAllBrowsersInstalled(): boolean {
  const status = getBrowsersStatus();
  return status.every((b) => b.installed);
}

/**
 * Marker file path to remember if first-run setup completed
 */
function getMarkerPath(): string {
  return path.join(getCliConfigDir(), 'browsers-installed.json');
}

/**
 * Ensures all required browsers are installed on the user machine.
 * Runs `npx playwright install chromium firefox webkit` if missing.
 */
export function ensureBrowsersInstalled(options?: { silent?: boolean }): void {
  const marker = getMarkerPath();
  const allInstalled = areAllBrowsersInstalled();

  if (allInstalled && fs.existsSync(marker)) {
    return;
  }

  if (!options?.silent) {
    console.log(
      '\n[haunt] First run detected — installing Playwright browsers (Chromium, Firefox, WebKit)...'
    );
    console.log(
      '[haunt] This is a one-time download (~350 MB) required for full website resilience rites.\n'
    );
  }

  try {
    execSync('npx playwright install chromium firefox webkit', {
      stdio: options?.silent ? 'pipe' : 'inherit',
    });

    const dir = getCliConfigDir();
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(
      marker,
      JSON.stringify({ installedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );

    if (!options?.silent) {
      console.log('\n✓ [haunt] All browsers installed successfully.\n');
    }
  } catch (err) {
    console.error('\n✗ [haunt] Failed to automatically install Playwright browsers:');
    console.error(`  ${(err as Error).message}\n`);

    if (process.platform === 'linux') {
      console.warn(
        '[haunt] Note: On Linux, system libraries may be required. You can install them by running:'
      );
      console.warn('  sudo npx playwright install-deps\n');
    }
  }
}
