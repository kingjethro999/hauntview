/**
 * Internationalization: RTL Language Profile (Arabic)
 * Tests right-to-left language support and layout
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';

export class I18nRTLProfile {
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
      // Set locale to RTL (Arabic)
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'language', { value: 'ar-SA', writable: false });
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check for dir attribute
      const dir = await page.locator('html').getAttribute('dir');
      if (!dir || dir !== 'rtl') {
        findings.push({
          id: `${this.profileId}-no-rtl-dir`,
          profileId: this.profileId,
          severity: 'error',
          category: 'i18n',
          message: 'Missing or incorrect dir="rtl" attribute on html element',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for text-align in CSS
      const textAlign = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).textAlign;
      });

      if (!['inherit', 'initial', 'auto', 'start'].includes(textAlign)) {
        findings.push({
          id: `${this.profileId}-hardcoded-text-align`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'i18n',
          message: `Text align hardcoded to "${textAlign}", should use logical properties or start/end`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for margin/padding using left/right instead of logical
      const stylesUseLR = await page.evaluate(() => {
        let count = 0;
        const elements = document.querySelectorAll('[style]');

        for (const el of elements) {
          const style = el.getAttribute('style') || '';
          if (
            style.includes('margin-left') ||
            style.includes('margin-right') ||
            style.includes('padding-left') ||
            style.includes('padding-right')
          ) {
            count++;
          }
        }

        return count;
      });

      if (stylesUseLR > 5) {
        findings.push({
          id: `${this.profileId}-physical-properties`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'i18n',
          message: `${stylesUseLR} elements use physical properties (left/right) instead of logical`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for images/icons orientation
      const images = await page.locator('img').all();
      let arrowImages = 0;

      for (const img of images) {
        const src = await img.getAttribute('src');
        const alt = await img.getAttribute('alt');

        if ((src?.includes('arrow') || src?.includes('chevron')) && !alt?.includes('rtl')) {
          arrowImages++;
        }
      }

      if (arrowImages > 0) {
        findings.push({
          id: `${this.profileId}-directional-images`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: `${arrowImages} directional images may need RTL-specific versions`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for border-radius
      const hasRounded = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="border-radius"]');
        return elements.length > 0;
      });

      if (hasRounded) {
        findings.push({
          id: `${this.profileId}-rounded-checks`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page uses border-radius, verify appearance in RTL context',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for flexbox direction
      const flexDir = await page.evaluate(() => {
        let hasExplicitDir = false;
        const elements = document.querySelectorAll('[style*="flex-direction"]');

        for (const el of elements) {
          const dir = el.getAttribute('style');
          if (dir?.includes('flex-direction: row')) {
            hasExplicitDir = true;
            break;
          }
        }

        return hasExplicitDir;
      });

      if (flexDir) {
        findings.push({
          id: `${this.profileId}-flexbox-direction`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Flexbox direction hardcoded, consider auto-direction in RTL',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for number formatting
      const numbers = await page.evaluate(() => {
        const text = document.body.innerText;
        const arabicNumbers = text.match(/٠|١|٢|٣|٤|٥|٦|٧|٨|٩/g);
        const latinNumbers = text.match(/0|1|2|3|4|5|6|7|8|9/g);

        return {
          hasArabic: !!arabicNumbers,
          hasLatin: !!latinNumbers,
        };
      });

      if (numbers.hasLatin && !numbers.hasArabic) {
        findings.push({
          id: `${this.profileId}-no-arabic-numerals`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page uses Latin numerals, consider Arabic numerals for RTL',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for form direction
      const formCount = await page.locator('form').count();
      if (formCount > 0) {
        const formDir = await page.locator('form').first().getAttribute('dir');
        if (!formDir) {
          findings.push({
            id: `${this.profileId}-form-no-dir`,
            profileId: this.profileId,
            severity: 'info',
            category: 'i18n',
            message: 'Form elements should inherit or explicitly set dir attribute',
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `RTL profile error: ${error instanceof Error ? error.message : String(error)}`,
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
