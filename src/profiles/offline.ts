/**
 * Offline Profile (canonical RiteId: offline)
 * Navigates online, then goes offline and reloads to test offline resilience.
 */

import { Browser } from 'playwright';
import { ScreenshotManager } from '../core/screenshot-manager';
import { buildFinding, executionErrorEvidence } from '../types/finding-utils';
import { Finding, ProfileResult, ProfileContext, ScreenshotMetadata } from '../types';
import { navigateResilient } from './navigation';

export class OfflineProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(
    browser: Browser,
    url: string,
    profileContext?: ProfileContext,
    screenshotManager?: ScreenshotManager
  ): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    };
    let screenshotMeta: ScreenshotMetadata | null = null;

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    try {
      // Online navigation first
      await navigateResilient(page, url);

      // Check service worker registration while online
      const swRegistered = await page.evaluate(async () => {
        if (!('serviceWorker' in navigator)) return false;
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          return regs.length > 0;
        } catch {
          return false;
        }
      });

      // Go offline and reload
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {
        // reload may fail when offline — that's the finding
      });

      const captureId = `offline-${Date.now()}`;
      if (screenshotManager) {
        try {
          screenshotMeta = await screenshotManager.captureScreenshot(
            page,
            this.profileId,
            url,
            viewport,
            { fullPage: false }
          );
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
        }
      } else {
        await page.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
      }

      const visibleTextLen = await page
        .evaluate(() => (document.body?.innerText ?? '').length)
        .catch(() => 0);

      const hasMinimalContent = visibleTextLen < 50;

      if (!swRegistered && hasMinimalContent) {
        const canonical = buildFinding({
          ruleId: 'offline.no-sw-fallback',
          rite: 'offline',
          severity: 'info',
          confidence: 'observed',
          title: 'No service worker or offline fallback detected',
          summary:
            'When the network is unavailable the page shows no content and no service worker is registered to provide an offline fallback.',
          evidence: [
            {
              kind: 'metric',
              name: 'serviceWorkerRegistered',
              value: 0,
              unit: 'boolean',
            },
            { kind: 'screenshot', captureId },
          ],
          investigate: [
            'Register a service worker with a cache-first or stale-while-revalidate strategy.',
            'Add an offline fallback page (e.g. /offline.html) to improve resilience.',
          ],
        });

        findings.push({
          id: `${this.profileId}-no-sw-fallback`,
          profileId: this.profileId,
          severity: 'info',
          category: 'resilience',
          message: canonical.title,
          evidence: [...canonical.evidence],
          details: {
            canonicalFinding: canonical,
            serviceWorkerRegistered: swRegistered,
            visibleTextLength: visibleTextLen,
          },
          timestamp: Date.now(),
          isClassified: false,
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `Offline profile error: ${error instanceof Error ? error.message : String(error)}`,
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
        timestamp: Date.now(),
        isClassified: false,
      });
    } finally {
      await context.close();
    }

    const endTime = Date.now();
    const browserVersion = browser.version();

    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }

    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === 'error').length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: 'chromium',
        browserVersion,
        nodeVersion: process.version,
      },
    };
  }
}
