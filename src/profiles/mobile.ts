/**
 * Mobile Profile - Tests on mobile viewports (iPhone 15 & Android)
 * Checks for responsive design, touch targets, and mobile-specific issues
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

export class MobileProfile {
  private profileId: string;
  private profileName: string;
  private minTouchTargetSize: number = 48; // WCAG recommended

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute mobile testing profile
   */
  async execute(page: Page, url: string): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      // Navigate to page safely without stalling on streaming/websockets
      await navigateResilient(page, url);

      // Check for viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').count();
      if (viewportMeta === 0) {
        const canonical = buildFinding({
          ruleId: 'mobile.viewport-meta-missing',
          rite: 'mobile',
          severity: 'serious',
          confidence: 'observed',
          title: 'Missing viewport meta tag',
          summary:
            'The page has no <meta name="viewport"> tag, so mobile browsers render it at desktop width and users must zoom and pan to read content.',
          where: { selector: 'meta[name="viewport"]', url },
          evidence: [
            {
              kind: 'metric',
              name: 'viewportMetaCount',
              value: viewportMeta,
              unit: 'elements',
            },
            {
              kind: 'dom',
              selector: 'head',
              snippet: sanitizeUntrusted('no meta[name="viewport"] element present'),
            },
          ],
          investigate: [
            'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-viewport-missing`,
            profileId: this.profileId,
            severity: 'error',
            category: 'responsive-design',
            message: canonical.title,
            location: { file: url, line: 1 },
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check touch target sizes
      const interactiveElements = await page.locator('button, a, input, select, textarea').all();
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box) {
          const size = Math.min(box.width, box.height);
          if (size > 1 && size < this.minTouchTargetSize && (await element.isVisible())) {
            const tagName = await element
              .evaluate((el: Element) => el.tagName.toLowerCase())
              .catch(() => 'element');
            const elementId = await element.getAttribute('id');
            const classAttr = await element.getAttribute('class');
            const textContent = await element
              .evaluate((el: Element) => (el.textContent || '').trim().slice(0, 30))
              .catch(() => '');

            const selector = elementId
              ? `#${elementId}`
              : classAttr
                ? `${tagName}.${classAttr.split(/\s+/).filter(Boolean).slice(0, 2).join('.')}`
                : `${tagName}${textContent ? `[text="${textContent}"]` : ''}`;

            const canonical = buildFinding({
              ruleId: 'mobile.touch-target-too-small',
              rite: 'mobile',
              severity: 'warning',
              confidence: 'measured',
              title: `Touch target ${Math.round(box.width)}×${Math.round(box.height)}px below ${this.minTouchTargetSize}px minimum`,
              summary: `An interactive element renders at ${Math.round(box.width)}×${Math.round(box.height)}px, below the WCAG-recommended ${this.minTouchTargetSize}px minimum touch target size. Users may mis-tap on touch devices.`,
              where: { selector, url },
              evidence: [
                {
                  kind: 'metric',
                  name: 'touchTargetMinDimension',
                  value: Math.round(size),
                  unit: 'px',
                  threshold: this.minTouchTargetSize,
                },
                {
                  kind: 'dom',
                  selector,
                  snippet: sanitizeUntrusted(
                    `<${tagName}>${textContent ? ` "${textContent}"` : ''}`
                  ),
                },
              ],
              investigate: [
                "Increase the element's padding or min-width/min-height so its smallest dimension is at least 48px.",
              ],
            });
            findings.push(
              buildProfileFinding({
                id: `${this.profileId}-small-touch-target-${findings.length + 1}`,
                profileId: this.profileId,
                severity: 'warning',
                category: 'touch-targets',
                message: canonical.title,
                location: { selector },
                details: {
                  canonicalFinding: canonical,
                  actualSize: `${Math.round(box.width)}x${Math.round(box.height)}px`,
                  recommendedSize: `${this.minTouchTargetSize}x${this.minTouchTargetSize}px`,
                  element: `<${tagName}>${textContent ? ` "${textContent}"` : ''}`,
                },
                evidence: [...canonical.evidence],
              })
            );
          }
        }
      }

      // Check for horizontal scrolling (common mobile issue)
      const scrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });

      if (scrollWidth > 5) {
        const canonical = buildFinding({
          ruleId: 'mobile.horizontal-overflow',
          rite: 'mobile',
          severity: 'warning',
          confidence: 'measured',
          title: `Horizontal overflow of ${scrollWidth}px on mobile viewport`,
          summary: `The document scroll width exceeds the viewport by ${scrollWidth}px, forcing horizontal scrolling on mobile devices.`,
          where: { selector: 'html', url },
          evidence: [
            {
              kind: 'metric',
              name: 'horizontalOverflowPx',
              value: scrollWidth,
              unit: 'px',
              threshold: 5,
            },
          ],
          investigate: [
            'Find the widest element (e.g. via document.elementFromPoint or devtools) and constrain it with max-width or overflow rules.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-horizontal-scroll`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical, overflowPx: scrollWidth },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for unoptimized images
      const images = await page.locator('img').all();
      for (const img of images) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        const displayWidth = await img.evaluate((el: HTMLImageElement) => el.offsetWidth);

        if (naturalWidth > 0 && displayWidth > 0 && naturalWidth > displayWidth * 1.5) {
          const oversizePercent = Math.round((naturalWidth / displayWidth) * 100);
          const canonical = buildFinding({
            ruleId: 'mobile.oversized-image',
            rite: 'mobile',
            severity: 'info',
            confidence: 'measured',
            title: `Image rendered at ${oversizePercent}% of its natural size`,
            summary: `An <img> is displayed at ${Math.round(displayWidth)}px but its natural width is ${naturalWidth}px — downloading roughly ${oversizePercent}% more pixels than needed on mobile.`,
            where: { url },
            evidence: [
              {
                kind: 'metric',
                name: 'imageOversizePercent',
                value: oversizePercent,
                unit: 'percent',
                threshold: 150,
              },
            ],
            investigate: ['Serve a responsively sized image (srcset/sizes) or compress the asset.'],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-oversized-image`,
              profileId: this.profileId,
              severity: 'info',
              category: 'performance',
              message: canonical.title,
              details: {
                canonicalFinding: canonical,
                naturalWidth,
                displayWidth,
              },
              evidence: [...canonical.evidence],
            })
          );
        }
      }

      // Check for readable font sizes on mobile
      const bodyFontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });

      const fontSizeValue = parseInt(bodyFontSize);
      if (fontSizeValue < 16) {
        const canonical = buildFinding({
          ruleId: 'mobile.base-font-too-small',
          rite: 'mobile',
          severity: 'warning',
          confidence: 'measured',
          title: `Base font size ${bodyFontSize} below 16px readability minimum`,
          summary: `The computed body font size is ${bodyFontSize}, below the 16px minimum recommended for readable text on mobile devices.`,
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'metric',
              name: 'baseFontSizePx',
              value: fontSizeValue,
              unit: 'px',
              threshold: 16,
            },
          ],
          investigate: ['Increase the base font size to at least 16px (1rem) for body text.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-small-font`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, computedFontSize: bodyFontSize },
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
          message: `Mobile profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
