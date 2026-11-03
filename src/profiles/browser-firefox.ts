/**
 * Browser Compatibility: Firefox Profile (Gecko Engine)
 * Validates Firefox/Gecko-specific CSS support, standard vs webkit API usage, and rendering quirks
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class BrowserFirefoxProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string = 'browser-firefox', profileName: string = 'Browser - Firefox') {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute Firefox compatibility testing profile
   */
  async execute(page: Page, url: string, context?: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const consoleErrors: string[] = [];

    // Capture console errors
    const onConsole = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };
    page.on('console', onConsole);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // 1. Check for webkit-only CSS properties missing standard Firefox/Gecko equivalents
      const cssPrefixIssues = await page.evaluate(() => {
        const issues: string[] = [];
        let hasWebkitScrollbar = false;
        let hasStandardScrollbar = false;
        let hasWebkitBackdrop = false;
        let hasStandardBackdrop = false;
        let hasWebkitClipText = false;

        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              const cssText = rule.cssText || '';

              if (cssText.includes('::-webkit-scrollbar')) {
                hasWebkitScrollbar = true;
              }
              if (cssText.includes('scrollbar-width') || cssText.includes('scrollbar-color')) {
                hasStandardScrollbar = true;
              }

              if (cssText.includes('-webkit-backdrop-filter')) {
                hasWebkitBackdrop = true;
              }
              if (
                cssText.includes('backdrop-filter') &&
                !cssText.includes('-webkit-backdrop-filter')
              ) {
                hasStandardBackdrop = true;
              }

              if (cssText.includes('-webkit-background-clip: text')) {
                hasWebkitClipText = true;
              }
            }
          } catch {
            // Cross-origin stylesheet access restriction
          }
        }

        if (hasWebkitScrollbar && !hasStandardScrollbar) {
          issues.push('custom-scrollbar');
        }
        if (hasWebkitBackdrop && !hasStandardBackdrop) {
          issues.push('backdrop-filter');
        }
        if (hasWebkitClipText) {
          issues.push('background-clip-text');
        }

        return issues;
      });

      if (cssPrefixIssues.includes('custom-scrollbar')) {
        findings.push({
          id: `${this.profileId}-webkit-scrollbar`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'browser-compatibility',
          message:
            'Page uses ::-webkit-scrollbar without standard scrollbar-width / scrollbar-color, ignored in Firefox',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (cssPrefixIssues.includes('backdrop-filter')) {
        findings.push({
          id: `${this.profileId}-webkit-backdrop`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'browser-compatibility',
          message:
            'Page uses -webkit-backdrop-filter without standard backdrop-filter, will not render blur in Firefox',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (cssPrefixIssues.includes('background-clip-text')) {
        findings.push({
          id: `${this.profileId}-background-clip-text`,
          profileId: this.profileId,
          severity: 'info',
          category: 'browser-compatibility',
          message:
            'Page uses -webkit-background-clip: text; verify text fill color fallback is defined for Firefox',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 2. Check for Chromium/WebKit-only JavaScript API dependencies
      const jsCompatibility = await page.evaluate(() => {
        const issues: string[] = [];

        // Check if scripts attempt to read navigator.userAgentData (not supported in Firefox)
        const scripts = Array.from(document.querySelectorAll('script'));
        const inlineScriptContent = scripts.map((s) => s.textContent || '').join('\n');

        if (
          inlineScriptContent.includes('navigator.userAgentData') &&
          !inlineScriptContent.includes('navigator.userAgent')
        ) {
          issues.push('userAgentData-without-fallback');
        }

        if (
          inlineScriptContent.includes('webkitSpeechRecognition') &&
          !inlineScriptContent.includes('SpeechRecognition')
        ) {
          issues.push('webkitSpeechRecognition-only');
        }

        if (
          inlineScriptContent.includes('webkitAudioContext') &&
          !inlineScriptContent.includes('AudioContext')
        ) {
          issues.push('webkitAudioContext-only');
        }

        return issues;
      });

      for (const issue of jsCompatibility) {
        findings.push({
          id: `${this.profileId}-${issue}`,
          profileId: this.profileId,
          severity: 'error',
          category: 'browser-compatibility',
          message: `Script relies on WebKit-specific API "${issue}" without standard fallback, breaks in Firefox`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 3. Check for Gecko form styling and appearance differences
      const formAppearanceIssues = await page.evaluate(() => {
        let unstyledAppearance = 0;
        const selectsAndButtons = Array.from(
          document.querySelectorAll('select, button, input[type="button"]')
        );

        for (const el of selectsAndButtons) {
          const style = window.getComputedStyle(el);
          const hasWebkitAppearance = (style as unknown as Record<string, string>)[
            '-webkit-appearance'
          ];
          const hasMozAppearance = (style as unknown as Record<string, string>)['-moz-appearance'];
          if (
            hasWebkitAppearance === 'none' &&
            hasMozAppearance !== 'none' &&
            style.appearance !== 'none'
          ) {
            unstyledAppearance++;
          }
        }

        return unstyledAppearance;
      });

      if (formAppearanceIssues > 0) {
        findings.push({
          id: `${this.profileId}-appearance-property`,
          profileId: this.profileId,
          severity: 'info',
          category: 'browser-compatibility',
          message: `${formAppearanceIssues} controls use -webkit-appearance without standard appearance or -moz-appearance`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 4. Record captured console errors
      if (consoleErrors.length > 0) {
        findings.push({
          id: `${this.profileId}-console-errors`,
          profileId: this.profileId,
          severity: 'error',
          category: 'console-errors',
          message: `${consoleErrors.length} JavaScript console errors encountered in Firefox engine`,
          details: { errors: consoleErrors.slice(0, 5) },
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
        message: `Firefox profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    } finally {
      page.off('console', onConsole);
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
        browserEngine: 'firefox',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
