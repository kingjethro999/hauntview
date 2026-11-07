/**
 * src/profiles/navigation.ts
 *
 * Resilient, high-performance page navigation utility for HauntView profiles.
 *
 * Why this exists:
 * Modern web applications and frameworks (Next.js HMR/WebSocket, ChatGPT SSE/WebSockets,
 * analytics beacons, single page apps) maintain persistent background network connections.
 * Using Playwright's `waitUntil: 'networkidle'` forces the browser to wait for 500ms of
 * ZERO network traffic, which frequently triggers full 30-second timeouts and causes
 * séance runs to take 6+ minutes (300s+) or fail completely.
 *
 * `navigateResilient`:
 * 1. Navigates with `waitUntil: 'domcontentloaded'` (guarantees HTML parsing and DOM tree is ready).
 * 2. Attempts a brief settle wait for `'load'` (external CSS/images) capped at a short timeout (default 2500ms).
 * 3. Never throws on persistent background network activity or streaming connections.
 */

import { Page } from 'playwright';

export interface NavigateOptions {
  /** Maximum milliseconds to wait for domcontentloaded (default: 15000) */
  timeout?: number;
  /** Maximum milliseconds to wait for full load event before proceeding (default: 2500) */
  settleTimeout?: number;
}

export async function navigateResilient(
  page: Page,
  url: string,
  options: NavigateOptions = {}
): Promise<void> {
  const timeout = options.timeout ?? 15000;
  const settleTimeout = options.settleTimeout ?? 2500;

  // 1. Wait for domcontentloaded - fast, deterministic, guarantees DOM is ready for inspection
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout });

  // 2. Allow initial scripts, images, and fonts to settle up to settleTimeout without stalling
  if (typeof page.waitForLoadState === 'function') {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        page.waitForLoadState('load', { timeout: settleTimeout }),
        new Promise((resolve) => {
          timer = setTimeout(resolve, settleTimeout);
        }),
      ]);
    } catch {
      // Settle period elapsed or load state failed; DOM is interactive so we proceed
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}
