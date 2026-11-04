/**
 * Image Failure Profile (canonical RiteId: image-failure)
 * Blocks all image requests and checks for missing alt attributes and missing dimensions.
 */

import { Page } from 'playwright';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding } from '../types/finding-utils';
import { Finding, ProfileResult } from '../types';

export class ImageFailureProfile {
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
      // Block all image requests
      await page.route('**/*', (route) => {
        if (route.request().resourceType() === 'image') {
          route.abort();
        } else {
          route.continue();
        }
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Capture screenshot as evidence
      await page.screenshot({ fullPage: false });
      const captureId = `image-failure-${Date.now()}`;

      const evalResult = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        const missingAlt: Array<{ selector: string; snippet: string }> = [];
        const missingDimensions: Array<{ selector: string; snippet: string }> = [];

        imgs.forEach((img, idx) => {
          const sel = img.id
            ? `img#${img.id}`
            : img.className
              ? `img.${img.className.split(' ')[0]}`
              : `img:nth-of-type(${idx + 1})`;
          const outerSnippet = img.outerHTML.slice(0, 200);

          if (!img.hasAttribute('alt')) {
            missingAlt.push({ selector: sel, snippet: outerSnippet });
          }
          if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
            missingDimensions.push({ selector: sel, snippet: outerSnippet });
          }
        });

        return {
          missingAlt,
          missingDimensions,
          scrollHeight: document.body.scrollHeight,
        };
      });

      // Finding for missing alt attributes
      if (evalResult.missingAlt.length > 0) {
        const first = evalResult.missingAlt[0];
        // first is always defined since length > 0
        const canonical = buildFinding({
          ruleId: 'image-failure.missing-alt',
          rite: 'image-failure',
          severity: 'warning',
          confidence: 'observed',
          title: `${evalResult.missingAlt.length} image(s) missing alt attribute`,
          summary: `Images without alt attributes are inaccessible to screen readers. ${evalResult.missingAlt.length} instance(s) found.`,
          where: { selector: first?.selector },
          evidence: [
            { kind: 'screenshot', captureId },
            {
              kind: 'dom',
              selector: first?.selector ?? 'img',
              snippet: sanitizeUntrusted(first?.snippet ?? ''),
            },
          ],
          investigate: [
            'Add descriptive alt attributes to all meaningful images.',
            'Use alt="" for decorative images.',
          ],
        });

        findings.push({
          id: `${this.profileId}-missing-alt`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            count: evalResult.missingAlt.length,
          },
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Finding for missing width/height (layout shift risk)
      if (evalResult.missingDimensions.length > 0) {
        const first = evalResult.missingDimensions[0];
        const canonical = buildFinding({
          ruleId: 'image-failure.no-dimensions',
          rite: 'image-failure',
          severity: 'info',
          confidence: 'heuristic',
          title: `${evalResult.missingDimensions.length} image(s) missing width/height attributes`,
          summary: `Images without explicit width and height can cause cumulative layout shift (CLS) when they load.`,
          where: { selector: first?.selector },
          evidence: [
            { kind: 'screenshot', captureId },
            {
              kind: 'dom',
              selector: first?.selector ?? 'img',
              snippet: sanitizeUntrusted(first?.snippet ?? ''),
            },
          ],
          investigate: [
            'Add explicit width and height attributes or use CSS aspect-ratio to prevent layout shift.',
          ],
        });

        findings.push({
          id: `${this.profileId}-no-dimensions`,
          profileId: this.profileId,
          severity: 'info',
          category: 'performance',
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            count: evalResult.missingDimensions.length,
          },
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
        message: `Image failure profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    }

    const endTime = Date.now();
    const browserVersion = page.context().browser()?.version() ?? 'unknown';

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
        browserVersion: browserVersion,
        nodeVersion: process.version,
      },
    };
  }
}
