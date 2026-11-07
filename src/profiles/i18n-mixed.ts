/**
 * Internationalization: Mixed Scripts Profile (Devanagari/Hindi)
 * Tests complex script rendering and support
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { navigateResilient } from './navigation';

export class I18nMixedProfile {
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
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'language', { value: 'hi-IN', writable: false });
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check for lang attribute
      const lang = await page.locator('html').getAttribute('lang');
      if (!lang?.startsWith('hi')) {
        findings.push({
          id: `${this.profileId}-no-hi-lang`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'i18n',
          message: 'Page lang attribute not set to Hindi',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for complex script font support
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });

      const hasDevanagariFont =
        fontFamily.includes('Noto Sans Devanagari') ||
        fontFamily.includes('Noto Serif Devanagari') ||
        fontFamily.includes('Mangal') ||
        fontFamily.includes('Kokila');

      if (!hasDevanagariFont && !fontFamily.includes('system-ui')) {
        findings.push({
          id: `${this.profileId}-no-devanagari-font`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'i18n',
          message: `Font stack "${fontFamily}" may not support Devanagari script`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for diacritic rendering
      const diacritics = await page.evaluate(() => {
        const text = document.body.innerText;
        // Devanagari vowel signs
        const devanagariDiacritics = text.match(/[\u093E-\u0944]/g);
        return devanagariDiacritics?.length || 0;
      });

      if (diacritics === 0) {
        findings.push({
          id: `${this.profileId}-no-diacritics`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page contains no Devanagari diacritics/vowel signs',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for ligature support
      const ligatures = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontVariantLigatures;
      });

      if (ligatures === 'none') {
        findings.push({
          id: `${this.profileId}-no-ligatures`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Ligatures disabled (font-variant-ligatures: none), needed for complex scripts',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for line-height for complex scripts
      const lineHeight = await page.evaluate(() => {
        return window.getComputedStyle(document.body).lineHeight;
      });

      if (lineHeight === 'normal') {
        findings.push({
          id: `${this.profileId}-line-height`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Consider explicit line-height > 1.2 for complex script readability',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for text-rendering
      const textRendering = await page.evaluate(() => {
        return window.getComputedStyle(document.body).textRendering;
      });

      if (textRendering !== 'geometricPrecision' && textRendering !== 'optimizeLegibility') {
        findings.push({
          id: `${this.profileId}-text-rendering`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: `text-rendering: "${textRendering}", consider optimizeLegibility for complex scripts`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for word-spacing
      const wordSpacing = await page.evaluate(() => {
        return window.getComputedStyle(document.body).wordSpacing;
      });

      if (wordSpacing !== 'normal' && wordSpacing !== '0px') {
        findings.push({
          id: `${this.profileId}-word-spacing`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: `word-spacing: "${wordSpacing}" may distort complex script rendering`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for script mixing
      const scriptMix = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasDevanagari = /[\u0900-\u097F]/.test(text);
        const hasLatin = /[a-zA-Z]/.test(text);
        const hasNumbers = /[0-9]/.test(text);

        return { hasDevanagari, hasLatin, hasNumbers };
      });

      if (scriptMix.hasLatin && scriptMix.hasDevanagari) {
        findings.push({
          id: `${this.profileId}-script-mixing`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page mixes Latin and Devanagari scripts, verify rendering',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for currency formatting
      const currency = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasRupeSymbol: text.includes('₹'),
          hasNumbers: /[0-9]/.test(text),
        };
      });

      if (currency.hasNumbers && !currency.hasRupeSymbol) {
        findings.push({
          id: `${this.profileId}-currency`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Page has numbers but no rupee symbol (₹), verify currency formatting',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for vowel rendering
      const vowelRendering = await page.evaluate(() => {
        const elements = document.querySelectorAll('body *');
        let count = 0;

        for (const el of elements) {
          const text = el.textContent || '';
          // Check for improper vowel placement
          if (/[\u093F\u0940][\u0915-\u0939]/.test(text)) {
            count++;
          }
        }

        return count;
      });

      if (vowelRendering > 0) {
        findings.push({
          id: `${this.profileId}-vowel-order`,
          profileId: this.profileId,
          severity: 'info',
          category: 'i18n',
          message: 'Verify vowel sign placement in complex script rendering',
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
        message: `Mixed scripts profile error: ${error instanceof Error ? error.message : String(error)}`,
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
