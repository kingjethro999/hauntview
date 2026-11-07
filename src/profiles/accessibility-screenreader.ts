/**
 * Accessibility: Screen Reader Profile
 * Validates ARIA, semantic HTML, and screen reader compatibility
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

export class AccessibilityScreenReaderProfile {
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

      // Check for page language
      const langAttr = await page.locator('html').getAttribute('lang');
      if (!langAttr) {
        const canonical = buildFinding({
          ruleId: 'accessibility.html-lang-missing',
          rite: 'accessibility',
          severity: 'serious',
          confidence: 'observed',
          title: 'Missing lang attribute on <html>',
          summary:
            'The document element has no lang attribute, so screen readers cannot select the correct pronunciation rules for the page content.',
          where: { selector: 'html', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'html',
              snippet: sanitizeUntrusted('<html> without lang attribute'),
            },
          ],
          investigate: ['Add lang="…" to the <html> element matching the page language.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-lang`,
            profileId: this.profileId,
            severity: 'error',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for main landmark
      const hasMain = await page.locator('main, [role="main"]').count();
      if (hasMain === 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.main-landmark-missing',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'observed',
          title: 'Page has no main landmark',
          summary:
            'No <main> element or role="main" landmark exists, so screen reader users cannot jump directly to the primary content.',
          where: { selector: 'main, [role="main"]', url },
          evidence: [
            {
              kind: 'metric',
              name: 'mainLandmarkCount',
              value: hasMain,
              unit: 'elements',
            },
          ],
          investigate: ['Wrap primary content in <main> or add role="main" to the main container.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-main`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for heading hierarchy
      const headings = await page.evaluate(() => {
        const h = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        return h.map((el: Element) => parseInt(el.tagName[1]));
      });

      if (headings.length === 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.no-headings',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'observed',
          title: 'Page contains no heading elements',
          summary:
            'No h1–h6 elements were found. Headings provide the primary navigation structure for screen reader users.',
          where: { selector: 'h1, h2, h3, h4, h5, h6', url },
          evidence: [
            {
              kind: 'metric',
              name: 'headingCount',
              value: headings.length,
              unit: 'elements',
            },
          ],
          investigate: ['Add a logical heading hierarchy starting with a single <h1>.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-headings`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      } else if (headings[0] !== 1) {
        const canonical = buildFinding({
          ruleId: 'accessibility.h1-not-first',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'observed',
          title: 'First heading is not <h1>',
          summary: `The document's first heading is h${headings[0] ?? 0}, not h1. Pages should begin their outline with a single top-level heading.`,
          where: { selector: 'h1, h2, h3, h4, h5, h6', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'h1, h2, h3, h4, h5, h6',
              snippet: sanitizeUntrusted(
                `first heading level: h${headings[0] ?? 'none'} of ${headings.length} total`
              ),
            },
          ],
          investigate: ['Start the heading outline with one <h1> describing the page.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-h1-missing`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, firstHeading: headings[0] },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for heading order violations
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i - 1] + 1) {
          const canonical = buildFinding({
            ruleId: 'accessibility.heading-level-skip',
            rite: 'accessibility',
            severity: 'warning',
            confidence: 'observed',
            title: `Heading order skips from h${headings[i - 1]} to h${headings[i]}`,
            summary: `The heading outline jumps a level (h${headings[i - 1]} → h${headings[i]}), which disorients screen reader navigation.`,
            where: { selector: 'h1, h2, h3, h4, h5, h6', url },
            evidence: [
              {
                kind: 'dom',
                selector: 'h1, h2, h3, h4, h5, h6',
                snippet: sanitizeUntrusted(
                  `heading sequence contains h${headings[i - 1]} followed by h${headings[i]}`
                ),
              },
            ],
            investigate: ['Do not skip heading levels; use one level at a time down the outline.'],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-heading-order`,
              profileId: this.profileId,
              severity: 'warning',
              category: 'accessibility',
              message: canonical.title,
              details: {
                canonicalFinding: canonical,
                fromLevel: headings[i - 1],
                toLevel: headings[i],
              },
              evidence: [...canonical.evidence],
            })
          );
          break;
        }
      }

      // Check for images without alt text
      const imgsNoAlt = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter(
          (img: Element) =>
            !(img as HTMLImageElement).getAttribute('alt') ||
            ((img as HTMLImageElement).getAttribute('alt') || '').trim() === ''
        ).length;
      });

      if (imgsNoAlt > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.images-missing-alt',
          rite: 'accessibility',
          severity: 'serious',
          confidence: 'measured',
          title: `${imgsNoAlt} images missing alt text`,
          summary: `${imgsNoAlt} <img> elements have no alt attribute or an empty one. Screen readers announce them as unlabelled graphics.`,
          where: { selector: 'img', url },
          evidence: [
            {
              kind: 'metric',
              name: 'imagesMissingAlt',
              value: imgsNoAlt,
              unit: 'elements',
            },
          ],
          investigate: ['Add descriptive alt text, or alt="" for purely decorative images.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-img-alt`,
            profileId: this.profileId,
            severity: 'error',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: imgsNoAlt },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for form labels
      const inputs = await page.locator('input, textarea, select').all();
      let missingLabels = 0;

      for (const input of inputs) {
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');
        const ariaLabelledBy = await input.getAttribute('aria-labelledby');

        if (!ariaLabel && !ariaLabelledBy && id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          if (label === 0) {
            missingLabels++;
          }
        }
      }

      if (missingLabels > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.inputs-missing-labels',
          rite: 'accessibility',
          severity: 'serious',
          confidence: 'measured',
          title: `${missingLabels} form inputs missing accessible names`,
          summary: `${missingLabels} input/select/textarea elements have no associated <label>, aria-label, or aria-labelledby. Screen readers cannot announce their purpose.`,
          where: { selector: 'input, textarea, select', url },
          evidence: [
            {
              kind: 'metric',
              name: 'unlabeledInputs',
              value: missingLabels,
              unit: 'elements',
            },
          ],
          investigate: [
            'Associate a <label for>, or add aria-label / aria-labelledby to each input.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-form-labels`,
            profileId: this.profileId,
            severity: 'error',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: missingLabels },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for skip to main link
      const skipLink = await page
        .locator('a[href="#main"], a[href="#content"], a[href="#main-content"], a[href^="#main"]')
        .count();
      if (skipLink === 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.skip-link-missing',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'observed',
          title: 'Missing skip-to-main-content link',
          summary:
            'No skip link targeting #main, #main-content, or #content was found. Keyboard and screen reader users must tab through the entire header/navigation on every page.',
          where: {
            selector: 'a[href="#main"], a[href="#content"], a[href="#main-content"]',
            url,
          },
          evidence: [
            {
              kind: 'metric',
              name: 'skipLinkCount',
              value: skipLink,
              unit: 'elements',
            },
          ],
          investigate: [
            'Add a visually-hidden "Skip to main content" link as the first focusable element.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-skip-link`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for ARIA attributes on interactive elements
      const ariaErrors = await page.evaluate(() => {
        const errors: string[] = [];
        const elements = document.querySelectorAll('[role]');

        for (const el of elements) {
          const role = el.getAttribute('role');
          // Check for conflicting ARIA roles
          if (['button', 'link', 'tab'].includes(role || '')) {
            const actualTag = el.tagName.toLowerCase();
            if (
              actualTag !== 'button' &&
              actualTag !== 'a' &&
              !el.getAttribute('aria-pressed') &&
              !el.getAttribute('aria-selected')
            ) {
              errors.push(`Semantic <${actualTag}> with role="${role}"`);
            }
          }
        }

        return errors;
      });

      if (ariaErrors.length > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.aria-semantic-conflicts',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'heuristic',
          title: `${ariaErrors.length} potential ARIA/semantic role conflicts`,
          summary: `${ariaErrors.length} elements combine a semantic HTML tag with a conflicting ARIA role, which can confuse assistive technology. First conflict: ${sanitizeUntrusted(ariaErrors[0] ?? '').text}`,
          where: { selector: '[role]', url },
          evidence: [
            {
              kind: 'dom',
              selector: '[role]',
              snippet: sanitizeUntrusted(ariaErrors.slice(0, 3).join(' | ')),
            },
          ],
          investigate: [
            'Prefer native semantic elements over redundant ARIA roles; audit flagged elements.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-aria-conflicts`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: ariaErrors.length },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for focus management
      const focusableCount = await page
        .locator('a, button, input, select, textarea, [tabindex]')
        .count();
      if (focusableCount === 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.no-focusable-elements',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'observed',
          title: 'Page has no keyboard-focusable elements',
          summary:
            'No links, buttons, inputs, or [tabindex] elements exist, so keyboard users have nothing to interact with.',
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'focusableElementCount',
              value: focusableCount,
              unit: 'elements',
            },
          ],
          investigate: [
            'If the page is purely informational this may be acceptable; otherwise add interactive controls.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-focusable`,
            profileId: this.profileId,
            severity: 'info',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
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
          message: `Screen reader profile error: ${error instanceof Error ? error.message : String(error)}`,
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
