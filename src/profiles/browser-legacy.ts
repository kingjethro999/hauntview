/**
 * Browser Compatibility: Legacy Profile (IE11 & Legacy Fallback Detection)
 * Validates ES5/ES6 compatibility, modern CSS fallbacks (variables, grid), polyfills, and legacy browser warnings
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class BrowserLegacyProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string = 'browser-legacy', profileName: string = 'Browser - Legacy') {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute legacy browser fallback detection profile
   */
  async execute(page: Page, url: string, _context?: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // 1. Check for X-UA-Compatible meta tag
      const xUaCompatible = await page
        .locator('meta[http-equiv="X-UA-Compatible"]')
        .getAttribute('content');
      if (!xUaCompatible || !xUaCompatible.includes('IE=edge')) {
        findings.push({
          id: `${this.profileId}-missing-x-ua-compatible`,
          profileId: this.profileId,
          severity: 'info',
          category: 'browser-compatibility',
          message:
            'Missing <meta http-equiv="X-UA-Compatible" content="IE=edge"> tag to prevent IE compatibility view mode',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 2. Check for modern CSS features without legacy fallbacks
      const cssAudit = await page.evaluate(() => {
        let cssVarCount = 0;
        let cssGridCount = 0;
        let cssClampCount = 0;

        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              const cssText = rule.cssText || '';

              if (cssText.includes('var(--')) {
                cssVarCount++;
              }
              if (cssText.includes('display: grid') || cssText.includes('display: inline-grid')) {
                cssGridCount++;
              }
              if (
                cssText.includes('clamp(') ||
                cssText.includes('min(') ||
                cssText.includes('max(')
              ) {
                cssClampCount++;
              }
            }
          } catch {
            // Cross-origin stylesheet access restriction
          }
        }

        return { cssVarCount, cssGridCount, cssClampCount };
      });

      if (cssAudit.cssVarCount > 0) {
        findings.push({
          id: `${this.profileId}-css-variables`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'browser-compatibility',
          message: `CSS Custom Properties (var(--*)) detected in ${cssAudit.cssVarCount} rules; unsupported in IE11 and legacy browsers without build-time post-processing`,
          details: { count: cssAudit.cssVarCount },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (cssAudit.cssGridCount > 0) {
        findings.push({
          id: `${this.profileId}-css-grid`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'browser-compatibility',
          message: `Modern CSS Grid detected in ${cssAudit.cssGridCount} rules; IE11 requires -ms-grid prefixes or flexbox/float fallbacks`,
          details: { count: cssAudit.cssGridCount },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (cssAudit.cssClampCount > 0) {
        findings.push({
          id: `${this.profileId}-css-clamp-min-max`,
          profileId: this.profileId,
          severity: 'info',
          category: 'browser-compatibility',
          message: `CSS clamp(), min(), or max() functions used in ${cssAudit.cssClampCount} rules; ignored in IE11 and legacy browsers`,
          details: { count: cssAudit.cssClampCount },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 3. Check for untranspiled modern ES6+ JavaScript in inline scripts
      const esCheck = await page.evaluate(() => {
        const scripts = Array.from(
          document.querySelectorAll('script:not([type="application/ld+json"])')
        );
        const inlineCode = scripts.map((s) => s.textContent || '').join('\n');
        const detectedFeatures: string[] = [];

        // Check for arrow functions in inline scripts
        if (/(=>\s*\{|=>\s*[a-zA-Z0-9_\$])/g.test(inlineCode)) {
          detectedFeatures.push('arrow-functions');
        }

        // Check for optional chaining or nullish coalescing
        if (/\?\.\w+|\?\?/g.test(inlineCode)) {
          detectedFeatures.push('optional-chaining-or-nullish-coalescing');
        }

        // Check for async/await
        if (/\basync\s+function|\basync\s*\(/g.test(inlineCode)) {
          detectedFeatures.push('async-await');
        }

        return detectedFeatures;
      });

      for (const feature of esCheck) {
        findings.push({
          id: `${this.profileId}-untranspiled-${feature}`,
          profileId: this.profileId,
          severity: 'error',
          category: 'browser-compatibility',
          message: `Untranspiled modern JavaScript syntax ("${feature}") detected in inline script; causes fatal syntax errors in legacy browsers / IE11`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 4. Check for legacy browser notification or fallback page
      const fallbackAudit = await page.evaluate(() => {
        const hasNoscript = Boolean(document.querySelector('noscript'));
        const bodyText = document.body.textContent?.toLowerCase() || '';
        const hasUnsupportedBrowserWarning =
          bodyText.includes('browser is not supported') ||
          bodyText.includes('unsupported browser') ||
          bodyText.includes('please update your browser') ||
          bodyText.includes('outdated browser');

        return { hasNoscript, hasUnsupportedBrowserWarning };
      });

      if (!fallbackAudit.hasUnsupportedBrowserWarning && !fallbackAudit.hasNoscript) {
        findings.push({
          id: `${this.profileId}-no-unsupported-browser-warning`,
          profileId: this.profileId,
          severity: 'info',
          category: 'browser-compatibility',
          message:
            'No unsupported browser warning banner or <noscript> tag detected to gracefully notify legacy browser users',
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
        message: `Legacy browser profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
        browserEngine: 'trident-emulation',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
