/**
 * Network Resilience Profile (canonical RiteId: network-resilience)
 * Records baseline XHR/fetch requests, then aborts them all and checks for page errors.
 */

import { Browser } from 'playwright';
import { ScreenshotManager } from '../core/screenshot-manager';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding } from '../types/finding-utils';
import { Finding, ProfileResult, ProfileContext, ScreenshotMetadata } from '../types';

export class NetworkResilienceProfile {
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

    // --- Baseline pass: record XHR/fetch URLs ---
    const baselineContext = await browser.newContext();
    const baselinePage = await baselineContext.newPage();
    const baselineApiUrls: string[] = [];

    try {
      baselinePage.on('requestfinished', (req) => {
        const rt = req.resourceType();
        if (rt === 'xhr' || rt === 'fetch') {
          baselineApiUrls.push(req.url());
        }
      });
      await baselinePage.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    } finally {
      await baselineContext.close();
    }

    // No API requests — skip (return success with no findings)
    if (baselineApiUrls.length === 0) {
      const endTime = Date.now();
      const browserVersion = browser.version();
      return {
        profileId: this.profileId,
        profileName: this.profileName,
        success: true,
        startTime,
        endTime,
        duration: endTime - startTime,
        findings: [],
        screenshots: [],
        metadata: {
          browserEngine: 'chromium',
          browserVersion,
          nodeVersion: process.version,
        },
      };
    }

    // --- Scenario A: abort all XHR/fetch ---
    const failContext = await browser.newContext();
    const failPage = await failContext.newPage();
    const pageErrors: string[] = [];
    const failedUrls: string[] = [];

    try {
      failPage.on('pageerror', (err) => {
        pageErrors.push(err.message);
      });

      await failPage.route('**/*', (route) => {
        const rt = route.request().resourceType();
        if (rt === 'xhr' || rt === 'fetch') {
          failedUrls.push(route.request().url());
          route.abort();
        } else {
          route.continue();
        }
      });

      await failPage.goto(url, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {
        // navigation errors are noted via pageerror
      });

      const captureId = `network-resilience-${Date.now()}`;
      if (screenshotManager) {
        try {
          screenshotMeta = await screenshotManager.captureScreenshot(
            failPage,
            this.profileId,
            url,
            viewport,
            { fullPage: false }
          );
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
        }
      } else {
        await failPage.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
      }

      const visibleLen = await failPage
        .evaluate(() => (document.body?.innerText ?? '').length)
        .catch(() => 0);

      const hasIssues = pageErrors.length > 0 || visibleLen < 50;

      if (hasIssues) {
        const firstFailedUrl = failedUrls[0] ?? url;
        const canonical = buildFinding({
          ruleId: 'network-resilience.api-failure',
          rite: 'network-resilience',
          severity: 'warning',
          confidence: 'observed',
          title: `Page shows errors or blank content when API requests are blocked`,
          summary: `When all XHR/fetch requests are aborted, the page ${pageErrors.length > 0 ? 'throws JavaScript errors' : 'renders minimal content'}. The page does not degrade gracefully when the network is unreliable.`,
          evidence: [
            {
              kind: 'request',
              url: sanitizeUntrusted(firstFailedUrl).text,
              method: 'GET',
              failure: 'aborted by network-resilience rite',
            },
            { kind: 'screenshot', captureId },
          ],
          investigate: [
            'Add error boundaries or loading/error states for each API call.',
            'Show a meaningful fallback UI when requests fail.',
            `${failedUrls.length} API request(s) were blocked: ${failedUrls.slice(0, 3).join(', ')}`,
            ...(pageErrors.length > 0
              ? [`Page errors observed: ${pageErrors.slice(0, 2).join('; ')}`]
              : []),
          ],
        });

        findings.push({
          id: `${this.profileId}-api-failure`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'resilience',
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            blockedRequests: failedUrls.length,
            pageErrors: pageErrors.slice(0, 5),
            visibleContentLength: visibleLen,
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
        message: `Network resilience profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    } finally {
      await failContext.close();
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
