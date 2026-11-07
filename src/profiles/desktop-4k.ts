/**
 * Desktop 4K Profile - Tests on ultra-high-resolution viewports (3840×2160)
 * Validates 4K responsiveness, image scaling/quality, typography scaling, and layout containment
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

export class Desktop4KProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string = 'desktop-4k', profileName: string = 'Desktop - 4K') {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute desktop 4K testing profile
   */
  async execute(page: Page, url: string, context?: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const viewportWidth = context?.viewport?.width ?? 3840;

    try {
      await navigateResilient(page, url);

      // 1. Image scaling & high-DPI quality checks
      const imageQualityIssues = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'));
        let upscaledImages = 0;
        let missingSrcset = 0;

        for (const img of images) {
          // If image is visible
          const rect = img.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Check if raster image is significantly upscaled beyond natural resolution
            if (img.naturalWidth > 0 && rect.width > img.naturalWidth * 1.5) {
              upscaledImages++;
            }

            // Check if large images lack srcset for high-DPI/4K assets
            if (rect.width > 500 && !img.srcset && !img.closest('picture')) {
              missingSrcset++;
            }
          }
        }

        return { upscaledImages, missingSrcset };
      });

      if (imageQualityIssues.upscaledImages > 0) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.upscaled-images',
          rite: 'desktop',
          severity: 'warning',
          confidence: 'measured',
          title: `${imageQualityIssues.upscaledImages} images upscaled beyond natural resolution`,
          summary: `${imageQualityIssues.upscaledImages} visible <img> elements render wider than 1.5× their natural pixel width on the 4K viewport, producing blurry upscaling.`,
          where: { selector: 'img', url },
          evidence: [
            {
              kind: 'metric',
              name: 'upscaledImageCount',
              value: imageQualityIssues.upscaledImages,
              unit: 'elements',
            },
          ],
          investigate: [
            'Provide higher-resolution sources via srcset or replace the assets with 2x/3x artwork.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-upscaled-images`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: imageQualityIssues.upscaledImages },
            evidence: [...canonical.evidence],
          })
        );
      }

      if (imageQualityIssues.missingSrcset > 0) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.missing-srcset',
          rite: 'desktop',
          severity: 'info',
          confidence: 'measured',
          title: `${imageQualityIssues.missingSrcset} large images lack srcset/<picture>`,
          summary: `${imageQualityIssues.missingSrcset} images wider than 500px have no srcset or <picture> wrapper, so 4K/high-DPI displays cannot fetch appropriately sized assets.`,
          where: { selector: 'img', url },
          evidence: [
            {
              kind: 'metric',
              name: 'imagesMissingSrcset',
              value: imageQualityIssues.missingSrcset,
              unit: 'elements',
            },
          ],
          investigate: [
            'Add srcset with 2x/3x candidates or wrap images in <picture> with media/density sources.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-missing-highdpi-images`,
            profileId: this.profileId,
            severity: 'info',
            category: 'responsive-design',
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              count: imageQualityIssues.missingSrcset,
            },
            evidence: [...canonical.evidence],
          })
        );
      }

      // 2. Typography scaling and legibility at 4K
      const typographyChecks = await page.evaluate(() => {
        const textElements = Array.from(
          document.querySelectorAll('p, span, li, a, h1, h2, h3, h4, h5, h6')
        );
        let tinyTextCount = 0;
        let excessiveLineLengthCount = 0;

        for (const el of textElements) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const rect = el.getBoundingClientRect();

          if (rect.width > 0 && rect.height > 0 && el.textContent?.trim()) {
            // Font sizes < 12px appear excessively small and illegible on large 4K displays
            if (fontSize < 12) {
              tinyTextCount++;
            }

            // Line length ergonomics: paragraphs with reading width > 1600px or > 120 chars without wrapping
            if (el.tagName === 'P' && rect.width > 1600 && (el.textContent?.length ?? 0) > 120) {
              excessiveLineLengthCount++;
            }
          }
        }

        return { tinyTextCount, excessiveLineLengthCount };
      });

      if (typographyChecks.tinyTextCount > 0) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.tiny-text',
          rite: 'desktop',
          severity: 'warning',
          confidence: 'measured',
          title: `${typographyChecks.tinyTextCount} text elements below 12px font size`,
          summary: `${typographyChecks.tinyTextCount} visible text elements compute a font size under 12px, which is hard to read even on a large 4K display.`,
          where: { selector: 'p, span, li, a, h1, h2, h3, h4, h5, h6', url },
          evidence: [
            {
              kind: 'metric',
              name: 'sub12pxTextElements',
              value: typographyChecks.tinyTextCount,
              unit: 'elements',
              threshold: 12,
            },
          ],
          investigate: [
            'Raise font sizes below 12px; consider rem-based sizing so text scales with user settings.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-tiny-text`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: typographyChecks.tinyTextCount },
            evidence: [...canonical.evidence],
          })
        );
      }

      if (typographyChecks.excessiveLineLengthCount > 0) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.excessive-line-length',
          rite: 'desktop',
          severity: 'info',
          confidence: 'measured',
          title: `${typographyChecks.excessiveLineLengthCount} paragraphs exceed readable line length`,
          summary: `${typographyChecks.excessiveLineLengthCount} <p> elements render wider than 1600px at 4K, producing line lengths far beyond the ~75-character ergonomic reading measure.`,
          where: { selector: 'p', url },
          evidence: [
            {
              kind: 'metric',
              name: 'overlongParagraphs',
              value: typographyChecks.excessiveLineLengthCount,
              unit: 'elements',
              threshold: 1600,
            },
          ],
          investigate: [
            'Constrain text columns with max-width (~65–75ch) so lines stay within a comfortable measure.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-excessive-line-length`,
            profileId: this.profileId,
            severity: 'info',
            category: 'responsive-design',
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              count: typographyChecks.excessiveLineLengthCount,
            },
            evidence: [...canonical.evidence],
          })
        );
      }

      // 3. Layout containment & extreme width overflow
      const layoutChecks = await page.evaluate((vpWidth: number) => {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
        const hasHorizontalOverflow = scrollWidth > vpWidth + 5;

        // Check if main content container lacks max-width constraint
        const main = document.querySelector('main, #root, #__next, .container, body');
        let unconstrainedContent = false;
        if (main) {
          const style = window.getComputedStyle(main);
          const rect = main.getBoundingClientRect();
          if (style.maxWidth === 'none' && rect.width >= vpWidth * 0.95) {
            unconstrainedContent = true;
          }
        }

        // Check for heavy repaints with fixed background attachments on 4K
        const fixedBackgrounds = Array.from(document.querySelectorAll('*')).filter((el) => {
          const s = window.getComputedStyle(el);
          return s.backgroundAttachment === 'fixed' && s.backgroundImage !== 'none';
        }).length;

        return { scrollWidth, hasHorizontalOverflow, unconstrainedContent, fixedBackgrounds };
      }, viewportWidth);

      if (layoutChecks.hasHorizontalOverflow) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.horizontal-overflow',
          rite: 'desktop',
          severity: 'serious',
          confidence: 'measured',
          title: `Horizontal overflow at 4K: ${layoutChecks.scrollWidth}px > ${viewportWidth}px viewport`,
          summary: `The document scroll width (${layoutChecks.scrollWidth}px) exceeds the ${viewportWidth}px 4K viewport width, forcing horizontal scrolling.`,
          where: { selector: 'html', url },
          evidence: [
            {
              kind: 'metric',
              name: 'horizontalOverflowPx',
              value: layoutChecks.scrollWidth - viewportWidth,
              unit: 'px',
              threshold: 5,
            },
          ],
          investigate: [
            'Identify the widest element and constrain it; check for fixed-width grids or non-wrapping content.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-horizontal-overflow`,
            profileId: this.profileId,
            severity: 'error',
            category: 'responsive-design',
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              scrollWidth: layoutChecks.scrollWidth,
              viewportWidth,
            },
            evidence: [...canonical.evidence],
          })
        );
      }

      if (layoutChecks.unconstrainedContent) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.unconstrained-layout',
          rite: 'desktop',
          severity: 'info',
          confidence: 'heuristic',
          title: 'Main content lacks max-width constraint at 4K',
          summary:
            'The primary content container has no max-width and spans ~the full 3840px viewport, producing excessively long lines and stretched layouts.',
          where: { selector: 'main, #root, #__next, .container, body', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'main, #root, #__next, .container, body',
              snippet: sanitizeUntrusted('max-width: none computed on main container'),
            },
          ],
          investigate: ['Add a max-width container (e.g. 1200–1400px) around primary content.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-unconstrained-layout`,
            profileId: this.profileId,
            severity: 'info',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      if (layoutChecks.fixedBackgrounds > 0) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.fixed-backgrounds',
          rite: 'desktop',
          severity: 'info',
          confidence: 'measured',
          title: `${layoutChecks.fixedBackgrounds} elements use background-attachment: fixed`,
          summary: `${layoutChecks.fixedBackgrounds} elements paint a fixed background image, which forces re-compositing on scroll and can degrade frame rates on large 4K canvases.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'fixedBackgroundCount',
              value: layoutChecks.fixedBackgrounds,
              unit: 'elements',
            },
          ],
          investigate: [
            'Prefer background-attachment: scroll or a dedicated fixed layer; test scroll performance on 4K.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-fixed-background-performance`,
            profileId: this.profileId,
            severity: 'info',
            category: 'performance',
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              count: layoutChecks.fixedBackgrounds,
            },
            evidence: [...canonical.evidence],
          })
        );
      }

      // 4. Cumulative Layout Shift on 4K
      const clsValue = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let cls = 0;
          try {
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
            }, 1500);
          } catch {
            resolve(0);
          }
        });
      });

      if (clsValue > 0.1) {
        const canonical = buildFinding({
          ruleId: 'desktop-4k.cumulative-layout-shift',
          rite: 'desktop',
          severity: 'warning',
          confidence: 'measured',
          title: `Cumulative Layout Shift ${clsValue.toFixed(3)} on 4K exceeds 0.1`,
          summary: `The page accumulated a CLS of ${clsValue.toFixed(3)} at the 4K viewport, above the 0.1 "good" threshold.`,
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
            'Reserve space for images/embeds and avoid injecting content above existing content.',
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
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: 'error',
          category: 'execution',
          message: `Desktop 4K profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
        browserEngine: 'chromium',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
