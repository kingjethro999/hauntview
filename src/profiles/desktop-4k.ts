/**
 * Desktop 4K Profile - Tests on ultra-high-resolution viewports (3840×2160)
 * Validates 4K responsiveness, image scaling/quality, typography scaling, and layout containment
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

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
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

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
        findings.push({
          id: `${this.profileId}-upscaled-images`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'responsive-design',
          message: `${imageQualityIssues.upscaledImages} images are upscaled beyond their natural resolution on 4K, resulting in blurriness`,
          details: { count: imageQualityIssues.upscaledImages },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (imageQualityIssues.missingSrcset > 0) {
        findings.push({
          id: `${this.profileId}-missing-highdpi-images`,
          profileId: this.profileId,
          severity: 'info',
          category: 'responsive-design',
          message: `${imageQualityIssues.missingSrcset} large images lack srcset or <picture> sources for 4K/high-DPI screens`,
          details: { count: imageQualityIssues.missingSrcset },
          timestamp: Date.now(),
          isClassified: false,
        });
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
        findings.push({
          id: `${this.profileId}-tiny-text`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `${typographyChecks.tinyTextCount} text elements have font sizes below 12px, hindering legibility on 4K displays`,
          details: { count: typographyChecks.tinyTextCount },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (typographyChecks.excessiveLineLengthCount > 0) {
        findings.push({
          id: `${this.profileId}-excessive-line-length`,
          profileId: this.profileId,
          severity: 'info',
          category: 'responsive-design',
          message: `${typographyChecks.excessiveLineLengthCount} paragraphs exceed optimal reading line length at 4K width (>1600px width)`,
          details: { count: typographyChecks.excessiveLineLengthCount },
          timestamp: Date.now(),
          isClassified: false,
        });
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
        findings.push({
          id: `${this.profileId}-horizontal-overflow`,
          profileId: this.profileId,
          severity: 'error',
          category: 'responsive-design',
          message: `Horizontal overflow detected at 4K: page width (${layoutChecks.scrollWidth}px) exceeds viewport width (${viewportWidth}px)`,
          details: { scrollWidth: layoutChecks.scrollWidth, viewportWidth },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (layoutChecks.unconstrainedContent) {
        findings.push({
          id: `${this.profileId}-unconstrained-layout`,
          profileId: this.profileId,
          severity: 'info',
          category: 'responsive-design',
          message:
            'Main content lacks max-width containment, stretching across the entire 4K viewport',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (layoutChecks.fixedBackgrounds > 0) {
        findings.push({
          id: `${this.profileId}-fixed-background-performance`,
          profileId: this.profileId,
          severity: 'info',
          category: 'performance',
          message: `${layoutChecks.fixedBackgrounds} elements use background-attachment: fixed, which can degrade scrolling performance on 4K displays`,
          details: { count: layoutChecks.fixedBackgrounds },
          timestamp: Date.now(),
          isClassified: false,
        });
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
        findings.push({
          id: `${this.profileId}-cls-poor`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'performance',
          message: `Cumulative Layout Shift (${clsValue.toFixed(3)}) on 4K exceeds threshold of 0.1`,
          details: { cls: clsValue },
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
        message: `Desktop 4K profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
        browserEngine: 'chromium',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
