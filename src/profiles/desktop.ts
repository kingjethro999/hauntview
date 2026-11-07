/**
 * Desktop Profile - Tests on desktop viewports (1080p & 4K)
 * Checks for layout, responsiveness at desktop sizes, and high-resolution support
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

interface PerformanceEntryWithHadRecentInput extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

export class DesktopProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute desktop testing profile
   */
  async execute(page: Page, url: string, context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      // Navigate to page safely without stalling on streaming/websockets
      await navigateResilient(page, url);

      // Check for layout stability (Cumulative Layout Shift)
      const clsValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cls = 0;
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const anyEntry = entry as unknown as PerformanceEntryWithHadRecentInput;
              if (anyEntry.hadRecentInput) continue;
              cls += anyEntry.value || 0;
            }
          });

          observer.observe({ type: 'layout-shift', buffered: true });

          setTimeout(() => {
            observer.disconnect();
            resolve(cls);
          }, 3000);
        });
      });

      // CLS should be less than 0.1 for good experience
      if (clsValue > 0.1) {
        const canonical = buildFinding({
          ruleId: 'desktop.cumulative-layout-shift',
          rite: 'desktop',
          severity: 'warning',
          confidence: 'measured',
          title: `Cumulative Layout Shift ${clsValue.toFixed(3)} exceeds 0.1 threshold`,
          summary: `The page accumulated a CLS of ${clsValue.toFixed(3)} during load, above the 0.1 "good" threshold. Layout shifts degrade readability and can cause mis-clicks.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'cumulativeLayoutShift',
              value: Number(clsValue.toFixed(4)),
              unit: 'score',
              threshold: 0.1,
            },
          ],
          investigate: [
            'Reserve space for images/embeds with width/height attributes and avoid injecting content above existing content.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-cls-poor`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, cls: clsValue },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for unused CSS (simple heuristic)
      const stylesheets = await page.locator('link[rel="stylesheet"]').count();
      if (stylesheets > 0) {
        const unusedStyles = await page.evaluate(() => {
          let count = 0;
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules || []) {
                const cssRule = rule as CSSStyleRule;
                if (cssRule.selectorText) {
                  const matches = document.querySelectorAll(cssRule.selectorText).length;
                  if (matches === 0) {
                    count++;
                  }
                }
              }
            } catch {
              // Cross-origin or other CORS issues
            }
          }
          return count;
        });

        if (unusedStyles > 10) {
          const canonical = buildFinding({
            ruleId: 'desktop.unused-css-rules',
            rite: 'desktop',
            severity: 'info',
            confidence: 'heuristic',
            title: `Approximately ${unusedStyles} CSS rules match no elements`,
            summary: `A heuristic scan found ~${unusedStyles} CSS rules whose selectors match nothing in the DOM. Unused CSS increases parse and render cost.`,
            where: { url },
            evidence: [
              {
                kind: 'metric',
                name: 'unusedCssRuleCount',
                value: unusedStyles,
                unit: 'rules',
                threshold: 10,
              },
            ],
            investigate: [
              'Audit stylesheets with DevTools coverage or a PurgeCSS-style build step.',
            ],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-unused-css`,
              profileId: this.profileId,
              severity: 'info',
              category: 'performance',
              message: canonical.title,
              details: { canonicalFinding: canonical, unusedStyles },
              evidence: [...canonical.evidence],
            })
          );
        }
      }

      // Check content width constraints
      const maxWidth = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return Math.max(body.scrollWidth, html.scrollWidth);
      });

      const viewportWidth = context.viewport.width;
      if (maxWidth > viewportWidth * 0.9) {
        const canonical = buildFinding({
          ruleId: 'desktop.content-fills-viewport',
          rite: 'desktop',
          severity: 'info',
          confidence: 'measured',
          title: `Content width ${maxWidth}px fills ${Math.round((maxWidth / viewportWidth) * 100)}% of viewport`,
          summary: `The document's scroll width (${maxWidth}px) is at or beyond 90% of the ${viewportWidth}px viewport width, suggesting content stretches edge-to-edge with little breathing room.`,
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'metric',
              name: 'contentWidthPx',
              value: maxWidth,
              unit: 'px',
              threshold: Math.round(viewportWidth * 0.9),
            },
          ],
          investigate: [
            'Consider constraining main content with a max-width container for readability.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-wide-content`,
            profileId: this.profileId,
            severity: 'info',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical, maxWidth, viewportWidth },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for images without width/height attributes (CLS trigger)
      const imagesWithoutDimensions = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        return images.filter(
          (img) =>
            !img.getAttribute('width') &&
            !img.getAttribute('height') &&
            !window.getComputedStyle(img).width
        ).length;
      });

      if (imagesWithoutDimensions > 0) {
        const canonical = buildFinding({
          ruleId: 'desktop.images-missing-dimensions',
          rite: 'desktop',
          severity: 'warning',
          confidence: 'measured',
          title: `${imagesWithoutDimensions} images lack width/height attributes`,
          summary: `${imagesWithoutDimensions} <img> elements have no width/height attributes or computed width, so the browser cannot reserve space before load — a common cause of layout shift.`,
          where: { selector: 'img', url },
          evidence: [
            {
              kind: 'metric',
              name: 'imagesMissingDimensions',
              value: imagesWithoutDimensions,
              unit: 'elements',
            },
          ],
          investigate: [
            'Add explicit width and height attributes (or aspect-ratio CSS) to every <img>.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-images-no-dimensions`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: imagesWithoutDimensions },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check viewport meta tag strictness
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
      if (viewportContent && viewportContent.includes('user-scalable=no')) {
        const canonical = buildFinding({
          ruleId: 'desktop.user-zoom-disabled',
          rite: 'desktop',
          severity: 'warning',
          confidence: 'observed',
          title: 'Viewport meta disables user zoom',
          summary:
            'The viewport meta tag contains user-scalable=no, preventing pinch-zoom. This violates WCAG 1.4.4 (Resize Text) and harms low-vision users.',
          where: { selector: 'meta[name="viewport"]', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'meta[name="viewport"]',
              snippet: sanitizeUntrusted(viewportContent),
            },
          ],
          investigate: [
            'Remove user-scalable=no and maximum-scale restrictions from the viewport meta tag.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-user-zoom`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, viewportContent },
            evidence: [...canonical.evidence],
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: 'error',
          category: 'execution',
          message: `Desktop profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
        })
      );
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
