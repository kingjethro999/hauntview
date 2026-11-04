/**
 * Reduced Motion Profile (canonical RiteId: reduced-motion)
 * Tests the page with prefers-reduced-motion: reduce and checks for running animations.
 */

import { Browser } from 'playwright';
import { ScreenshotManager } from '../core/screenshot-manager';
import { buildFinding } from '../types/finding-utils';
import { Finding, ProfileResult, ProfileContext, ScreenshotMetadata } from '../types';

export class ReducedMotionProfile {
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
      reducedMotion: 'reduce',
      forcedColors: 'none',
      viewport: { width: viewport.width, height: viewport.height },
    });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const captureId = `reduced-motion-${Date.now()}`;
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

      const runningCount = await page.evaluate(() => {
        return document.getAnimations().filter((a) => a.playState === 'running').length;
      });

      if (runningCount > 0) {
        const canonical = buildFinding({
          ruleId: 'reduced-motion.animations-persist',
          rite: 'reduced-motion',
          severity: 'warning',
          confidence: 'observed',
          title: `${runningCount} animation(s) still running under prefers-reduced-motion: reduce`,
          summary: `Users who request reduced motion via OS/browser settings may still see ${runningCount} running animation(s). This can cause discomfort or harm for users with vestibular disorders.`,
          evidence: [
            {
              kind: 'metric',
              name: 'runningAnimationsUnderReducedMotion',
              value: runningCount,
              unit: 'count',
              threshold: 0,
            },
            { kind: 'screenshot', captureId },
          ],
          investigate: [
            'Wrap animation CSS in `@media (prefers-reduced-motion: no-preference)` blocks.',
            'Alternatively use `@media (prefers-reduced-motion: reduce)` to set animation-duration to 0.001ms.',
            `${runningCount} animation(s) detected via document.getAnimations() with playState === 'running'.`,
          ],
        });

        findings.push({
          id: `${this.profileId}-animations-persist`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: canonical.title,
          details: { canonicalFinding: canonical, runningAnimations: runningCount },
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
        message: `Reduced motion profile error: ${error instanceof Error ? error.message : String(error)}`,
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
