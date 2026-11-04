/**
 * Accessibility: Screen Reader Profile
 * Validates ARIA, semantic HTML, and screen reader compatibility
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';

export class AccessibilityScreenReaderProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check for page language
      const langAttr = await page.locator('html').getAttribute('lang');
      if (!langAttr) {
        findings.push({
          id: `${this.profileId}-no-lang`,
          profileId: this.profileId,
          severity: 'error',
          category: 'accessibility',
          message: 'Missing lang attribute on html element',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for main landmark
      const hasMain = await page.locator('main, [role="main"]').count();
      if (hasMain === 0) {
        findings.push({
          id: `${this.profileId}-no-main`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Page missing <main> or role="main" landmark',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for heading hierarchy
      const headings = await page.evaluate(() => {
        const h = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return h.map((el: Element) => parseInt(el.tagName[1]));
      });

      if (headings.length === 0) {
        findings.push({
          id: `${this.profileId}-no-headings`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Page contains no heading elements',
          timestamp: Date.now(),
          isClassified: false,
        });
      } else if (headings[0] !== 1) {
        findings.push({
          id: `${this.profileId}-h1-missing`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Page should start with <h1> element',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for heading order violations
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i - 1] + 1) {
          findings.push({
            id: `${this.profileId}-heading-order`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: `Heading order skips level (h${headings[i - 1]} to h${headings[i]})`,
            timestamp: Date.now(),
            isClassified: false,
          });
          break;
        }
      }

      // Check for images without alt text
      const imgsNoAlt = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(
          (img: Element) =>
            !(img as HTMLImageElement).getAttribute('alt') ||
            ((img as HTMLImageElement).getAttribute('alt') || '').trim() === ''
        ).length;
      });

      if (imgsNoAlt > 0) {
        findings.push({
          id: `${this.profileId}-img-alt`,
          profileId: this.profileId,
          severity: 'error',
          category: 'accessibility',
          message: `${imgsNoAlt} images missing alt text`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for form labels
      const inputs = await page.locator('input, textarea, select').all();
      let missingLabels = 0;

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (!ariaLabel && !ariaLabelledBy && id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          if (label === 0) {
            missingLabels++;
          }
        }
      }

      if (missingLabels > 0) {
        findings.push({
          id: `${this.profileId}-form-labels`,
          profileId: this.profileId,
          severity: 'error',
          category: 'accessibility',
          message: `${missingLabels} form inputs missing associated labels`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for skip to main link
      const skipLink = await page.locator('a[href="#main"], a[href="#content"]').count();
      if (skipLink === 0) {
        findings.push({
          id: `${this.profileId}-skip-link`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Missing skip-to-main-content link',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for ARIA attributes on interactive elements
      const ariaErrors = await page.evaluate(() => {
        const errors: string[] = [];
        const elements = document.querySelectorAll('[role]');

        for (const el of elements) {
          const role = el.getAttribute('role');
          // Check for conflicting ARIA roles
          if (['button', 'link', 'tab'].includes(role || '')) {
            const actualTag = el.tagName.toLowerCase();
            if (
              actualTag !== 'button' &&
              actualTag !== 'a' &&
              !el.getAttribute('aria-pressed') &&
              !el.getAttribute('aria-selected')
            ) {
              errors.push(`Semantic <${actualTag}> with role="${role}"`);
            }
          }
        }

        return errors;
      });

      if (ariaErrors.length > 0) {
        findings.push({
          id: `${this.profileId}-aria-conflicts`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `Found ${ariaErrors.length} potential ARIA/semantic conflicts`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for focus management
      const focusableCount = await page
        .locator('a, button, input, select, textarea, [tabindex]')
        .count();
      if (focusableCount === 0) {
        findings.push({
          id: `${this.profileId}-no-focusable`,
          profileId: this.profileId,
          severity: 'info',
          category: 'accessibility',
          message: 'Page has no focusable elements',
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
        message: `Screen reader profile error: ${error instanceof Error ? error.message : String(error)}`,
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
