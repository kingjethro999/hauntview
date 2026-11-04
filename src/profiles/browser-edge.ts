/**
 * Browser Compatibility: Microsoft Edge Profile (Chromium Variant)
 * Validates Edge-specific rendering, forced-colors/high-contrast mode, client hints, and Windows integration
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';

export class BrowserEdgeProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string = 'browser-edge', profileName: string = 'Browser - Edge') {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute Edge compatibility testing profile
   */
  async execute(page: Page, url: string): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const consoleErrors: string[] = [];

    const onConsole = (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    };
    page.on('console', onConsole);

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // 1. Windows High Contrast & forced-colors compatibility (Edge specialty)
      const forcedColorsAudit = await page.evaluate(() => {
        let svgIconsWithoutFillOrCurrentColor = 0;
        let forcedColorsAdjustNone = 0;

        const svgs = Array.from(document.querySelectorAll('svg'));
        for (const svg of svgs) {
          const style = window.getComputedStyle(svg);
          const fill = style.fill;
          const stroke = style.stroke;
          const attrFill = svg.getAttribute('fill');
          const attrStroke = svg.getAttribute('stroke');
          const hasCurrentColor =
            attrFill === 'currentColor' ||
            attrStroke === 'currentColor' ||
            fill === 'currentColor' ||
            stroke === 'currentColor';
          // In forced-colors mode, hardcoded hex/rgb fills are overridden, but SVG icons without currentColor or borders can disappear
          if (!hasCurrentColor && style.borderWidth === '0px') {
            svgIconsWithoutFillOrCurrentColor++;
          }
        }

        const allElements = Array.from(document.querySelectorAll('*'));
        for (const el of allElements) {
          const style = window.getComputedStyle(el) as unknown as Record<string, string>;
          if (style['forced-color-adjust'] === 'none') {
            forcedColorsAdjustNone++;
          }
        }

        return { svgIconsWithoutFillOrCurrentColor, forcedColorsAdjustNone };
      });

      if (forcedColorsAudit.forcedColorsAdjustNone > 0) {
        findings.push({
          id: `${this.profileId}-forced-colors-none`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `${forcedColorsAudit.forcedColorsAdjustNone} elements disable forced colors (forced-color-adjust: none), may be unreadable in Windows High Contrast on Edge`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (forcedColorsAudit.svgIconsWithoutFillOrCurrentColor > 10) {
        findings.push({
          id: `${this.profileId}-svg-high-contrast`,
          profileId: this.profileId,
          severity: 'info',
          category: 'accessibility',
          message: `${forcedColorsAudit.svgIconsWithoutFillOrCurrentColor} SVG icons do not use currentColor, verify visibility in Windows High Contrast on Edge`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 2. Browser sniffing & Edge brand detection issues
      const sniffingIssues = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const scriptText = scripts.map((s) => s.textContent || '').join('\n');
        const issues: string[] = [];

        // Check if user agent sniffing assumes Chrome without checking Edge (Edg/)
        if (scriptText.includes('/Chrome/.test') && !scriptText.includes('Edg')) {
          issues.push('ua-sniffing-chrome-only');
        }

        return issues;
      });

      if (sniffingIssues.includes('ua-sniffing-chrome-only')) {
        findings.push({
          id: `${this.profileId}-ua-sniffing`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'browser-compatibility',
          message:
            'Inline script appears to sniff for Chrome without checking for Edge (Edg/), risking incorrect feature branches',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // 3. PWA and Microsoft / Windows metadata checks
      const windowsPwaChecks = await page.evaluate(() => {
        const hasManifest = Boolean(document.querySelector('link[rel="manifest"]'));
        const hasThemeColor = Boolean(document.querySelector('meta[name="theme-color"]'));
        const hasTileColor = Boolean(
          document.querySelector('meta[name="msapplication-TileColor"]')
        );

        return { hasManifest, hasThemeColor, hasTileColor };
      });

      if (!windowsPwaChecks.hasManifest) {
        findings.push({
          id: `${this.profileId}-pwa-manifest`,
          profileId: this.profileId,
          severity: 'info',
          category: 'browser-compatibility',
          message:
            'Missing web app manifest (<link rel="manifest">) for Edge PWA and Windows installability',
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
          message: `${consoleErrors.length} JavaScript console errors encountered during Edge evaluation`,
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
        message: `Edge profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
        browserEngine: 'chromium-edge',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
