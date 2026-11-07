/**
 * Form Resilience Profile (canonical RiteId: form-resilience)
 * Submits empty forms and checks whether validation feedback is shown.
 * Confidence is heuristic throughout — severity never exceeds warning.
 */

import { Browser } from 'playwright';
import { ScreenshotManager } from '../core/screenshot-manager';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, executionErrorEvidence } from '../types/finding-utils';
import { Finding, ProfileResult, ProfileContext, ScreenshotMetadata } from '../types';
import { navigateResilient } from './navigation';

const PAYMENT_AUTOCOMPLETE = new Set(['payment', 'cc-number', 'cc-csc', 'cc-exp', 'cc-name']);

function hasPaymentField(formHtml: string): boolean {
  const autocompleteMatches = formHtml.match(/autocomplete=["']?([^"'\s>]+)/gi) ?? [];
  return autocompleteMatches.some((m) => {
    const val = m
      .replace(/autocomplete=["']?/i, '')
      .replace(/["']/g, '')
      .toLowerCase();
    return PAYMENT_AUTOCOMPLETE.has(val);
  });
}

export class FormResilienceProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(
    browser: Browser,
    url: string,
    profileContext?: ProfileContext,
    screenshotManager?: ScreenshotManager
  ): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false,
    };
    let screenshotMeta: ScreenshotMetadata | null = null;

    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
    });

    // Abort all non-GET requests to prevent accidental data submission
    await context.route('**/*', (route) => {
      if (route.request().method() !== 'GET') {
        route.abort();
      } else {
        route.continue();
      }
    });

    const page = await context.newPage();

    try {
      await navigateResilient(page, url);

      // Collect form outer HTML for payment-field detection (evaluate in page)
      const formData = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('form')).map((form, idx) => {
          const sel = form.id ? `form#${form.id}` : `form:nth-of-type(${idx + 1})`;
          return { selector: sel, outerHtml: form.outerHTML.slice(0, 500) };
        });
      });

      if (formData.length === 0) {
        // No forms — valid, zero findings
        const endTime = Date.now();
        const browserVersion = browser.version();
        return {
          profileId: this.profileId,
          profileName: this.profileName,
          success: true,
          startTime,
          endTime,
          duration: endTime - startTime,
          findings: [],
          screenshots: [],
          metadata: {
            browserEngine: 'chromium',
            browserVersion,
            nodeVersion: process.version,
          },
        };
      }

      for (const { selector, outerHtml } of formData) {
        // Skip payment forms
        if (hasPaymentField(outerHtml)) continue;

        try {
          const formHandle = page.locator(selector).first();

          // Attempt empty submit
          await formHandle.evaluate((form) => {
            if (form instanceof HTMLFormElement) {
              const btn = form.querySelector<HTMLElement>(
                'button[type="submit"], input[type="submit"]'
              );
              if (btn) {
                btn.click();
              } else {
                form.requestSubmit();
              }
            }
          });

          // Brief wait for validation UI
          await page.waitForTimeout(500);

          const captureId = `form-resilience-${Date.now()}`;
          if (screenshotManager && !screenshotMeta) {
            try {
              screenshotMeta = await screenshotManager.captureScreenshot(
                page,
                this.profileId,
                url,
                viewport,
                { fullPage: false }
              );
            } catch (screenshotErr) {
              console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
            }
          } else {
            await page.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
          }

          const validationResult = await page.evaluate((sel: string) => {
            const form = document.querySelector(sel);
            if (!form) return { invalidCount: 0, ariaInvalidCount: 0, visibleErrorText: '' };

            const invalidFields = form.querySelectorAll(':invalid');
            const ariaInvalidFields = form.querySelectorAll('[aria-invalid="true"]');

            // Look for visible error text near the form
            const errorEls = form.querySelectorAll(
              '[role="alert"],[aria-live],[class*="error"],[class*="invalid"],[class*="validation"]'
            );
            const errorText = Array.from(errorEls)
              .map((el) => (el.textContent ?? '').trim())
              .filter(Boolean)
              .join(' ')
              .slice(0, 200);

            return {
              invalidCount: invalidFields.length,
              ariaInvalidCount: ariaInvalidFields.length,
              visibleErrorText: errorText,
            };
          }, selector);

          const hasValidation =
            validationResult.invalidCount > 0 ||
            validationResult.ariaInvalidCount > 0 ||
            validationResult.visibleErrorText.length > 0;

          if (!hasValidation) {
            const canonical = buildFinding({
              ruleId: 'form-resilience.no-validation',
              rite: 'form-resilience',
              severity: 'warning',
              confidence: 'heuristic',
              title: `Form submits without showing validation feedback`,
              summary: `Submitting an empty form (${selector}) produced no :invalid fields, no aria-invalid attributes, and no visible error messages. Users may not understand what went wrong.`,
              where: { selector },
              evidence: [
                { kind: 'screenshot', captureId },
                {
                  kind: 'dom',
                  selector,
                  snippet: sanitizeUntrusted(outerHtml),
                },
              ],
              investigate: [
                'Add HTML5 required attributes and/or aria-required="true" to mandatory fields.',
                'Display visible error messages near each invalid field.',
                'Use aria-invalid="true" and aria-describedby to associate errors with fields.',
              ],
            });

            findings.push({
              id: `${this.profileId}-no-validation-${findings.length}`,
              profileId: this.profileId,
              severity: 'warning',
              category: 'forms',
              message: canonical.title,
              evidence: [...canonical.evidence],
              details: { canonicalFinding: canonical, selector },
              timestamp: Date.now(),
              isClassified: false,
            });
          } else {
            const canonical = buildFinding({
              ruleId: 'form-resilience.validation-works',
              rite: 'form-resilience',
              severity: 'info',
              confidence: 'heuristic',
              title: `Form shows validation feedback on empty submit`,
              summary: `Submitting an empty form (${selector}) triggered validation feedback: ${validationResult.invalidCount} invalid field(s), ${validationResult.ariaInvalidCount} aria-invalid field(s).`,
              where: { selector },
              evidence: [
                { kind: 'screenshot', captureId },
                {
                  kind: 'dom',
                  selector,
                  snippet: sanitizeUntrusted(
                    validationResult.visibleErrorText || outerHtml.slice(0, 200)
                  ),
                },
              ],
              investigate: [],
            });

            findings.push({
              id: `${this.profileId}-validation-works-${findings.length}`,
              profileId: this.profileId,
              severity: 'info',
              category: 'forms',
              message: canonical.title,
              evidence: [...canonical.evidence],
              details: {
                canonicalFinding: canonical,
                selector,
                invalidFields: validationResult.invalidCount,
                ariaInvalidFields: validationResult.ariaInvalidCount,
              },
              timestamp: Date.now(),
              isClassified: false,
            });
          }
        } catch {
          // Skip individual form errors — don't fail the whole profile
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `Form resilience profile error: ${error instanceof Error ? error.message : String(error)}`,
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
        timestamp: Date.now(),
        isClassified: false,
      });
    } finally {
      await context.close();
    }

    const endTime = Date.now();
    const browserVersion = browser.version();

    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }

    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === 'error').length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: 'chromium',
        browserVersion,
        nodeVersion: process.version,
      },
    };
  }
}
