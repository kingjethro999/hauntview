/**
 * Accessibility: Visual Impairment Profile
 * Validates color contrast and visual accessibility
 */

import { Page } from 'playwright';
import { sanitizeUntrusted } from '../types/contracts';
import { Finding, ProfileResult } from '../types';
import { navigateResilient } from './navigation';

export class AccessibilityVisualProfile {
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
      await navigateResilient(page, url);

      // Calculate contrast ratio
      const contrastIssues = await page.evaluate(() => {
        interface ContrastIssue {
          text?: string;
          contrast: string;
          level: string;
        }
        const issues: ContrastIssue[] = [];

        function getLuminance(r: number, g: number, b: number): number {
          const [rs, gs, bs] = [r, g, b].map((x) => {
            x = x / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        }

        function parseRgba(str: string): [number, number, number, number] {
          const match = str.match(
            /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/
          );
          if (!match) return [0, 0, 0, 1];
          return [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            match[4] !== undefined ? parseFloat(match[4]) : 1,
          ];
        }

        function composite(
          fgRgba: [number, number, number, number],
          bgRgb: [number, number, number]
        ): [number, number, number] {
          const [r, g, b, a] = fgRgba;
          return [
            Math.round(r * a + bgRgb[0] * (1 - a)),
            Math.round(g * a + bgRgb[1] * (1 - a)),
            Math.round(b * a + bgRgb[2] * (1 - a)),
          ];
        }

        function getContrast(
          rgb1: [number, number, number],
          rgb2: [number, number, number]
        ): number {
          const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
          const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        const textElements = document.querySelectorAll(
          'p, span, a, button, label, h1, h2, h3, h4, h5, h6'
        );

        function getEffectiveBg(element: Element): [number, number, number] {
          const layers: [number, number, number, number][] = [];
          let current: Element | null = element;
          while (current) {
            const style = window.getComputedStyle(current);
            const bg = style.backgroundColor;
            if (bg && bg !== 'transparent') {
              const rgba = parseRgba(bg);
              if (rgba[3] > 0) {
                layers.unshift(rgba);
                if (rgba[3] >= 0.99) break;
              }
            }
            const bgImg = style.backgroundImage;
            if (bgImg && bgImg.includes('gradient')) {
              const m = bgImg.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/);
              if (m) {
                const rgba = parseRgba(m[0]);
                if (rgba[3] > 0) {
                  layers.unshift(rgba);
                  if (rgba[3] >= 0.99) break;
                }
              }
            }
            current = current.parentElement;
          }
          let acc: [number, number, number] = [10, 7, 17];
          for (const layer of layers) {
            acc = composite(layer, acc);
          }
          return acc;
        }

        for (const el of textElements) {
          const style = window.getComputedStyle(el);
          const bgRgb = getEffectiveBg(el);
          const fgRgba = parseRgba(style.color);
          const fgRgb: [number, number, number] = [fgRgba[0], fgRgba[1], fgRgba[2]];

          if ((el as HTMLElement).offsetHeight > 0 && (el.textContent?.trim().length ?? 0) > 0) {
            const contrast = getContrast(fgRgb, bgRgb);

            // WCAG AA: 4.5:1 for normal text, 3:1 for large text
            if (contrast < 4.5) {
              issues.push({
                text: el.textContent?.substring(0, 50),
                contrast: contrast.toFixed(2),
                level: contrast >= 3 ? 'AA-large' : 'fail',
              });
            }
          }
        }

        return issues;
      });

      if (contrastIssues.length > 0) {
        const failCount = contrastIssues.filter((i) => i.level === 'fail').length;
        findings.push({
          id: `${this.profileId}-contrast-ratio`,
          profileId: this.profileId,
          severity: failCount > 0 ? 'error' : 'warning',
          category: 'accessibility',
          message: `${contrastIssues.length} text elements have insufficient color contrast (< 4.5:1)`,
          evidence: [
            { kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('contrast ratio') },
          ],
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for color-only information
      const colorOnlyInfo = await page.evaluate(() => {
        const issues: string[] = [];

        // Check for elements that use color alone to convey info
        const elements = document.querySelectorAll(
          '[style*="color"], [class*="red"], [class*="green"], [class*="error"], [class*="success"]'
        );

        for (const el of elements) {
          const text = el.textContent?.trim();
          if (
            text &&
            text.length < 10 &&
            !text.includes('•') &&
            !text.includes('✓') &&
            !text.includes('×')
          ) {
            issues.push(text);
          }
        }

        return issues;
      });

      if (colorOnlyInfo.length > 0) {
        findings.push({
          id: `${this.profileId}-color-only`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `Found ${colorOnlyInfo.length} elements that may use color alone to convey meaning`,
          evidence: [{ kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('color only') }],
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for high contrast mode support
      const highContrastSupport = await page.evaluate(() => {
        return window.matchMedia('(prefers-contrast: more)').matches;
      });

      if (!highContrastSupport) {
        findings.push({
          id: `${this.profileId}-high-contrast`,
          profileId: this.profileId,
          severity: 'info',
          category: 'accessibility',
          message: 'Consider adding high-contrast mode support with prefers-contrast media query',
          evidence: [
            { kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('high contrast') },
          ],
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for forced colors mode support
      const forcedColorsSupport = await page.evaluate(() => {
        return window.matchMedia('(forced-colors: active)').matches;
      });

      if (!forcedColorsSupport) {
        findings.push({
          id: `${this.profileId}-forced-colors`,
          profileId: this.profileId,
          severity: 'info',
          category: 'accessibility',
          message: 'Consider testing with forced colors mode (Windows High Contrast)',
          evidence: [
            { kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('forced colors') },
          ],
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for background images with text
      const bgImageText = await page.evaluate(() => {
        let count = 0;
        const allElements = document.querySelectorAll('*');

        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const bgImg = style.backgroundImage || '';
          if (bgImg.includes('url(') && (el.textContent?.trim().length ?? 0) > 0) {
            count++;
          }
        }

        return count;
      });

      if (bgImageText > 0) {
        findings.push({
          id: `${this.profileId}-bg-image-text`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `${bgImageText} elements have text over background images, verify contrast`,
          evidence: [
            { kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('bg image text') },
          ],
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for text resizing
      const allowsZoom = await page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const content = viewport?.getAttribute('content') || '';
        return !content.includes('user-scalable=no');
      });

      if (!allowsZoom) {
        findings.push({
          id: `${this.profileId}-no-zoom`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Page disables user zoom, violates visual accessibility guidelines',
          evidence: [{ kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('no zoom') }],
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
        message: `Visual profile error: ${error instanceof Error ? error.message : String(error)}`,
        evidence: [
          { kind: 'dom', selector: 'body', snippet: sanitizeUntrusted('execution error') },
        ],
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
