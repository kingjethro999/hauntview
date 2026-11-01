/**
 * Internationalization: CJK Language Profile (Japanese)
 * Tests CJK character rendering and support
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class I18nCJKProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string, _context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'language', { value: 'ja-JP', writable: false });
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check for lang attribute
      const lang = await page.locator('html').getAttribute('lang');
      if (!lang?.startsWith('ja')) {
        findings.push({
          id: `${this.profileId}-no-ja-lang`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'i18n',
          message: 'Page lang attribute not set to Japanese',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for appropriate font stack
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });

      const hasCJKFont =
        fontFamily.includes('Noto Sans CJK') ||
        fontFamily.includes('Source Han Sans') ||
        fontFamily.includes('HiraginoSans') ||
        fontFamily.includes('メイリオ');

      if (!hasCJKFont && !fontFamily.includes('system-ui')) {
        findings.push({
          id: `${this.profileId}-no-cjk-font`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: `Font stack "${fontFamily}" may not include CJK support`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for line-breaking support
      const lineBreaking = await page.evaluate(() => {
        return window.getComputedStyle(document.body).wordBreak;
      });

      if (lineBreaking === 'normal') {
        findings.push({
          id: `${this.profileId}-line-breaking`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Consider word-break properties for CJK text',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for Ruby annotations (furigana) support
      const hasRuby = await page.locator('ruby').count();
      if (hasRuby === 0) {
        findings.push({
          id: `${this.profileId}-no-ruby`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'No ruby annotations (furigana) found, consider adding for kanji',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for punctuation handling
      const cjkPunctuation = await page.evaluate(() => {
        const text = document.body.innerText;
        const cjkPunc = /[、。「」『』（）・]/g;
        return text.match(cjkPunc)?.length || 0;
      });

      if (cjkPunctuation === 0) {
        findings.push({
          id: `${this.profileId}-no-cjk-punct`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page contains no CJK-specific punctuation, may use ASCII substitutes',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for text-orientation
      const textOrientation = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="writing-mode"]');
        return elements.length > 0;
      });

      if (!textOrientation) {
        findings.push({
          id: `${this.profileId}-vertical-text`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page lacks vertical text support, common in Japanese',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for letter-spacing
      const letterSpacing = await page.evaluate(() => {
        return window.getComputedStyle(document.body).letterSpacing;
      });

      if (letterSpacing !== 'normal' && letterSpacing !== '0px') {
        findings.push({
          id: `${this.profileId}-letter-spacing`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: `Letter-spacing "${letterSpacing}" may distort CJK text`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for number/date formatting
      const hasNumbers = await page.evaluate(() => {
        const text = document.body.innerText;
        return /[0-9]/g.test(text);
      });

      if (hasNumbers) {
        findings.push({
          id: `${this.profileId}-number-format`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page contains numbers, verify proper locale-specific formatting',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for date formats
      const dates = await page.evaluate(() => {
        const text = document.body.innerText;
        const isoDate = /\d{4}-\d{2}-\d{2}/g;
        return text.match(isoDate)?.length || 0;
      });

      if (dates > 0) {
        findings.push({
          id: `${this.profileId}-date-format`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: `${dates} dates using ISO format, consider Japanese format`,
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
        message: `CJK profile error: ${error instanceof Error ? error.message : String(error)}`,
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
