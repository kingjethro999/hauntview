/**
 * Mobile Profile - Tests on mobile viewports (iPhone 15 & Android)
 * Checks for responsive design, touch targets, and mobile-specific issues
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';

export class MobileProfile {
  private profileId: string;
  private profileName: string;
  private minTouchTargetSize: number = 48; // WCAG recommended

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute mobile testing profile
   */
  async execute(page: Page, url: string): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Wait for page to be interactive
      await page.waitForLoadState('domcontentloaded');

      // Check for viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').count();
      if (viewportMeta === 0) {
        findings.push({
          id: `${this.profileId}-viewport-missing`,
          profileId: this.profileId,
          severity: 'error',
          category: 'responsive-design',
          message: 'Missing viewport meta tag for responsive design',
          location: { file: url, line: 1 },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check touch target sizes
      const interactiveElements = await page.locator('button, a, input, select, textarea').all();
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box) {
          const size = Math.min(box.width, box.height);
          if (size < this.minTouchTargetSize && (await element.isVisible())) {
            const tagName = await element
              .evaluate((el: Element) => el.tagName.toLowerCase())
              .catch(() => 'element');
            const elementId = await element.getAttribute('id');
            const classAttr = await element.getAttribute('class');
            const textContent = await element
              .evaluate((el: Element) => (el.textContent || '').trim().slice(0, 30))
              .catch(() => '');

            const selector = elementId
              ? `#${elementId}`
              : classAttr
                ? `${tagName}.${classAttr.split(/\s+/).filter(Boolean).slice(0, 2).join('.')}`
                : `${tagName}${textContent ? `[text="${textContent}"]` : ''}`;

            findings.push({
              id: `${this.profileId}-small-touch-target-${findings.length + 1}`,
              profileId: this.profileId,
              severity: 'warning',
              category: 'touch-targets',
              message: `Touch target ${Math.round(box.width)}x${Math.round(box.height)}px is smaller than WCAG recommended ${this.minTouchTargetSize}px`,
              location: {
                selector,
              },
              details: {
                actualSize: `${Math.round(box.width)}x${Math.round(box.height)}px`,
                recommendedSize: `${this.minTouchTargetSize}x${this.minTouchTargetSize}px`,
                element: `<${tagName}>${textContent ? ` "${textContent}"` : ''}`,
              },
              timestamp: Date.now(),
              isClassified: false,
            });
          }
        }
      }

      // Check for horizontal scrolling (common mobile issue)
      const scrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });

      if (scrollWidth > 5) {
        findings.push({
          id: `${this.profileId}-horizontal-scroll`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'responsive-design',
          message: `Page causes horizontal scrolling on mobile (${scrollWidth}px overflow)`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for unoptimized images
      const images = await page.locator('img').all();
      for (const img of images) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const displayWidth = await img.evaluate((el: HTMLImageElement) => el.offsetWidth);

        if (naturalWidth > 0 && displayWidth > 0 && naturalWidth > displayWidth * 1.5) {
          findings.push({
            id: `${this.profileId}-oversized-image`,
            profileId: this.profileId,
            severity: 'info',
            category: 'performance',
            message: `Image is ${Math.round((naturalWidth / displayWidth) * 100)}% larger than displayed size`,
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }

      // Check for readable font sizes on mobile
      const bodyFontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });

      const fontSizeValue = parseInt(bodyFontSize);
      if (fontSizeValue < 16) {
        findings.push({
          id: `${this.profileId}-small-font`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `Base font size ${bodyFontSize} is smaller than WCAG recommended 16px`,
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
        message: `Mobile profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
