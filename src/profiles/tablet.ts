/**
 * Tablet Profile - Tests iPad Pro (1024×1366) tablet viewport
 * Checks for tablet-specific layout, touch interactions, and orientation handling
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class TabletProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string, context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Check for tablet-specific meta tags
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
      if (!viewportContent?.includes('viewport-fit')) {
        findings.push({
          id: `${this.profileId}-viewport-fit`,
          profileId: this.profileId,
          severity: 'info',
          category: 'responsive-design',
          message: 'Missing viewport-fit for safe area handling on tablets',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for portrait/landscape orientation meta tag
      const orientationMeta = await page
        .locator('meta')
        .evaluateAll((metas: Element[]) =>
          metas.some((m) => m.getAttribute('name') === 'orientation')
        );
      if (!orientationMeta) {
        findings.push({
          id: `${this.profileId}-orientation-meta`,
          profileId: this.profileId,
          severity: 'info',
          category: 'responsive-design',
          message: 'No orientation meta tag for tablet landscape/portrait handling',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for double-tap zoom delay (important for tablets)
      const touchActionStyle = await page.evaluate(() => {
        const root = document.documentElement;
        return window.getComputedStyle(root).touchAction;
      });

      if (touchActionStyle === 'pan-x pan-y') {
        findings.push({
          id: `${this.profileId}-touch-action`,
          profileId: this.profileId,
          severity: 'info',
          category: 'touch-optimization',
          message: 'touch-action: pan-x pan-y enables double-tap zoom, consider optimization',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for buttons suitable for tablet touch
      const buttons = await page.locator('button, a, input[type="button"]').all();
      let smallTouchTargets = 0;

      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (await button.isVisible())) {
          const size = Math.min(box.width, box.height);
          if (size < 44) {
            // Apple's recommended minimum
            smallTouchTargets++;
          }
        }
      }

      if (smallTouchTargets > 0) {
        findings.push({
          id: `${this.profileId}-small-touch-targets`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'touch-targets',
          message: `${smallTouchTargets} interactive elements smaller than 44px Apple minimum for tablets`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for landscape width handling
      const landWidth = await page.evaluate(() => {
        if (window.matchMedia('(orientation: landscape)').matches) {
          return document.documentElement.scrollWidth;
        }
        return 0;
      });

      if (landWidth > context.viewport.width * 1.1) {
        findings.push({
          id: `${this.profileId}-landscape-overflow`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'responsive-design',
          message: 'Page may have horizontal scroll in landscape mode on tablets',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for modal/popover suitable sizing
      const modals = await page.locator('[role="dialog"], .modal, .popup').all();
      if (modals.length > 0) {
        for (const modal of modals) {
          const box = await modal.boundingBox();
          if (box && (await modal.isVisible())) {
            // On tablet, modals should not be > 90% of viewport
            if (box.width > context.viewport.width * 0.9) {
              findings.push({
                id: `${this.profileId}-modal-width`,
                profileId: this.profileId,
                severity: 'info',
                category: 'responsive-design',
                message: 'Modal/dialog width approaches screen edge on tablet',
                timestamp: Date.now(),
                isClassified: false,
              });
              break;
            }
          }
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `Tablet profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    }

    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();

    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === 'error').length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: 'webkit',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
