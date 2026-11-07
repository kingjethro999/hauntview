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

        function getContrast(rgb1: string, rgb2: string): number {
          const parse = (rgb: string) => {
            const match = rgb.match(/\d+/g);
            return match
              ? [parseInt(match[0], 10), parseInt(match[1], 10), parseInt(match[2], 10)]
              : [0, 0, 0];
          };
          const [r1, g1, b1] = parse(rgb1);
          const [r2, g2, b2] = parse(rgb2);
          const l1 = getLuminance(r1, g1, b1);
          const l2 = getLuminance(r2, g2, b2);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }

        const textElements = document.querySelectorAll(
          'p, span, a, button, label, h1, h2, h3, h4, h5, h6'
        );

        function getEffectiveBg(element: Element): string {
          let current: Element | null = element;
          while (current) {
            const bg = window.getComputedStyle(current).backgroundColor;
            if (bg && bg !== 'transparent' && !bg.match(/rgba\([^)]+,\s*0\)/)) {
              return bg;
            }
            current = current.parentElement;
          }
          return 'rgb(10, 7, 17)';
        }

        for (const el of textElements) {
          const style = window.getComputedStyle(el);
          const bgColor = getEffectiveBg(el);
          const color = style.color;

          if (bgColor && color && (el as HTMLElement).offsetHeight > 0) {
            const contrast = getContrast(color, bgColor);

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
        const elements = document.querySelectorAll(
          '[style*="background-image"], [style*="background"]'
        );

        for (const el of elements) {
          if (el.textContent?.trim().length ?? 0 > 0) {
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
