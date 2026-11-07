/**
 * src/cli/browsers.ts
 *
 * First-run browser verification and installer for Chromium, Firefox, WebKit, and Microsoft Edge.
 * Includes cross-platform execution (Windows .cmd and Unix) and OS-specific diagnostics.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { chromium, firefox, webkit } from 'playwright';
import { getCliConfigDir } from './config';
import {
  getNpxCommand,
  getPlatformTroubleshootingAdvice,
  detectEdgeBrowser,
} from '../core/platform';

export interface BrowserStatus {
  name: 'chromium' | 'firefox' | 'webkit' | 'msedge';
  installed: boolean;
  executablePath?: string;
  isNative?: boolean;
}

/**
 * Returns the status of the 3 core Playwright browsers (chromium, firefox, webkit)
 * with optional Microsoft Edge detection.
 */
export function getBrowsersStatus(options?: { includeEdge?: boolean }): BrowserStatus[] {
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

  if (options?.includeEdge) {
    const edge = detectEdgeBrowser();
    browsers.push({
      name: 'msedge',
      installed: edge.installed,
      executablePath: edge.executablePath,
      isNative: edge.isNativeToPlatform,
    });
  }

  return browsers;
}

/**
 * Returns the status of all 4 browser engines including Microsoft Edge.
 */
export function getAllBrowsersStatus(): BrowserStatus[] {
  return getBrowsersStatus({ includeEdge: true });
}

/**
 * Returns true if the three core Playwright engines (Chromium, Firefox, WebKit) are installed.
 */
export function areAllBrowsersInstalled(): boolean {
  const status = getBrowsersStatus();
  // Core rites require chromium, firefox, webkit
  return status.slice(0, 3).every((b) => b.installed);
}

/**
 * Marker file path to remember if first-run setup completed
 */
function getMarkerPath(): string {
  return path.join(getCliConfigDir(), 'browsers-installed.json');
}

/**
 * Ensures all required browsers are installed on the user machine.
 * Runs `npx playwright install chromium firefox webkit` using OS-specific shell wrappers.
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
    const { command, options: execOptions } = getNpxCommand(
      'playwright install chromium firefox webkit'
    );

    execSync(command, {
      stdio: options?.silent ? 'pipe' : 'inherit',
      shell: execOptions.shell,
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

    const advice = getPlatformTroubleshootingAdvice();
    for (const line of advice) {
      console.warn(line);
    }
    console.log();
  }
}
