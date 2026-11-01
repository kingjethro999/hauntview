/**
 * Desktop Profile - Tests on desktop viewports (1080p & 4K)
 * Checks for layout, responsiveness at desktop sizes, and high-resolution support
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

interface PerformanceEntryWithHadRecentInput extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

export class DesktopProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute desktop testing profile
   */
  async execute(page: Page, url: string, _context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Check for layout stability (Cumulative Layout Shift)
      const clsValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cls = 0;
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const anyEntry = entry as Record<string, unknown>;
              if (anyEntry.hadRecentInput) continue;
              cls += (anyEntry.value as number) || 0;
            }
          });

          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 3000);
        });
      });

      // CLS should be less than 0.1 for good experience
      if (clsValue > 0.1) {
        findings.push({
          id: `${this.profileId}-cls-poor`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'performance',
          message: `Cumulative Layout Shift (${clsValue.toFixed(3)}) exceeds WCAG threshold of 0.1`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for unused CSS (simple heuristic)
      const stylesheets = await page.locator('link[rel="stylesheet"]').count();
      if (stylesheets > 0) {
        const unusedStyles = await page.evaluate(() => {
          let count = 0;
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules || []) {
                const cssRule = rule as CSSStyleRule;
                if (cssRule.selectorText) {
                  const matches = document.querySelectorAll(cssRule.selectorText).length;
                  if (matches === 0) {
                    count++;
                  }
                }
              }
            } catch {
              // Cross-origin or other CORS issues
            }
          }
          return count;
        });

        if (unusedStyles > 10) {
          findings.push({
            id: `${this.profileId}-unused-css`,
            profileId: this.profileId,
            severity: 'info',
            category: 'performance',
            message: `Found approximately ${unusedStyles} unused CSS rules`,
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }

      // Check content width constraints
      const maxWidth = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return Math.max(body.scrollWidth, html.scrollWidth);
      });

      const viewportWidth = context.viewport.width;
      if (maxWidth > viewportWidth * 0.9) {
        findings.push({
          id: `${this.profileId}-wide-content`,
          profileId: this.profileId,
          severity: 'info',
          category: 'responsive-design',
          message: `Content width (${maxWidth}px) is near or exceeds viewport width (${viewportWidth}px)`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for images without width/height attributes (CLS trigger)
      const imagesWithoutDimensions = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(
          (img) =>
            !img.getAttribute('width') &&
            !img.getAttribute('height') &&
            !window.getComputedStyle(img).width
        ).length;
      });

      if (imagesWithoutDimensions > 0) {
        findings.push({
          id: `${this.profileId}-images-no-dimensions`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'performance',
          message: `${imagesWithoutDimensions} images lack width/height attributes, may cause layout shift`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check viewport meta tag strictness
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
      if (viewportContent && viewportContent.includes('user-scalable=no')) {
        findings.push({
          id: `${this.profileId}-no-user-zoom`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Viewport disables user zoom, violates accessibility guidelines',
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
        message: `Desktop profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    }

    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();

    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.length === 0,
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
