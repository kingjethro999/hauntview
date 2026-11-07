/**
 * Accessibility: Keyboard Navigation Profile
 * Validates keyboard accessibility, tab order, and focus management
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

export class AccessibilityKeyboardProfile {
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

      // Check for positive tabindex values
      const positiveTabindex = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[tabindex]'));
        return elements.filter(
          (el: Element) => parseInt((el as HTMLElement).getAttribute('tabindex') || '0') > 0
        ).length;
      });

      if (positiveTabindex > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.positive-tabindex',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'measured',
          title: `${positiveTabindex} elements use positive tabindex`,
          summary: `${positiveTabindex} elements have tabindex > 0, which overrides the natural tab order and disorients keyboard users.`,
          where: { selector: '[tabindex]', url },
          evidence: [
            {
              kind: 'metric',
              name: 'positiveTabindexCount',
              value: positiveTabindex,
              unit: 'elements',
            },
          ],
          investigate: [
            'Remove positive tabindex values; use tabindex="0" or fix DOM order instead.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-positive-tabindex`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: positiveTabindex },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for keyboard-only accessible buttons
      const buttons = await page.locator('button, a, input').all();
      let nonKeyboardAccessible = 0;

      for (const button of buttons) {
        const isButton = await button.evaluate((el: Element) => el.tagName === 'BUTTON');
        const isLink = await button.evaluate((el: Element) => el.tagName === 'A');
        const isInput = await button.evaluate(
          (el: Element) =>
            el.tagName === 'INPUT' &&
            ['button', 'submit', 'reset'].includes((el as HTMLInputElement).type)
        );

        if (!isButton && !isLink && !isInput) {
          const onClick = await button.getAttribute('onclick');
          if (onClick) {
            // Div/span with onclick, check for keyboard handler
            const onKeyDown = await button.getAttribute('onkeydown');
            if (!onKeyDown) {
              nonKeyboardAccessible++;
            }
          }
        }
      }

      if (nonKeyboardAccessible > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.non-keyboard-interactive',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'heuristic',
          title: `${nonKeyboardAccessible} clickable elements lack keyboard handlers`,
          summary: `${nonKeyboardAccessible} elements have click handlers but no keyboard equivalent, making them unreachable without a mouse.`,
          where: { selector: '[onclick]', url },
          evidence: [
            {
              kind: 'metric',
              name: 'nonKeyboardAccessibleCount',
              value: nonKeyboardAccessible,
              unit: 'elements',
            },
          ],
          investigate: [
            'Use native <button>/<a> elements or add keydown handlers for Enter/Space.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-non-keyboard-buttons`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: nonKeyboardAccessible },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for focus visible styles
      const focusStyles = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return {
          hasFocus: styles.outline !== 'none',
        };
      });

      if (!focusStyles.hasFocus) {
        const canonical = buildFinding({
          ruleId: 'accessibility.focus-indicator-missing',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'heuristic',
          title: 'Focus indicator may not be visible',
          summary:
            'The body computed style reports outline: none, suggesting focus outlines may be suppressed without a visible replacement (WCAG 2.4.7).',
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'body',
              snippet: sanitizeUntrusted('computed outline-style on body is none'),
            },
          ],
          investigate: ['Ensure :focus-visible styles provide a clear, high-contrast indicator.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-focus-styles`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for keyboard shortcuts documentation
      const hasAccessKey = await page.evaluate(() => {
        return document.querySelectorAll('[accesskey]').length > 0;
      });

      if (hasAccessKey) {
        const canonical = buildFinding({
          ruleId: 'accessibility.accesskey-undocumented',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'observed',
          title: 'Page uses accesskey attributes',
          summary:
            'One or more elements define accesskey shortcuts. These should be documented for users and checked for conflicts with browser/AT shortcuts.',
          where: { selector: '[accesskey]', url },
          evidence: [{ kind: 'metric', name: 'accesskeyElementCount', value: 1, unit: 'present' }],
          investigate: [
            'Document keyboard shortcuts in help text; prefer single-key alternatives.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-accesskey`,
            profileId: this.profileId,
            severity: 'info',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for focus trap in modals
      const modals = await page.locator('[role="dialog"], .modal').all();
      if (modals.length > 0) {
        const focusTrapped = await modals[0].evaluate(() => {
          const modal = document.querySelector('[role="dialog"], .modal') as HTMLElement;
          if (!modal) return false;

          const focusableElements = modal.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          ) as NodeListOf<Element>;
          return focusableElements.length > 0;
        });

        if (!focusTrapped) {
          const canonical = buildFinding({
            ruleId: 'accessibility.modal-no-focusable',
            rite: 'accessibility',
            severity: 'warning',
            confidence: 'observed',
            title: 'Modal dialog has no focusable elements',
            summary:
              'An element matching [role="dialog"] or .modal contains no focusable descendants, trapping keyboard users with no way to interact or dismiss it.',
            where: { selector: '[role="dialog"], .modal', url },
            evidence: [{ kind: 'metric', name: 'modalFocusableCount', value: 0, unit: 'elements' }],
            investigate: ['Ensure dialogs contain at least one focusable control and trap focus.'],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-modal-focus`,
              profileId: this.profileId,
              severity: 'warning',
              category: 'accessibility',
              message: canonical.title,
              details: { canonicalFinding: canonical },
              evidence: [...canonical.evidence],
            })
          );
        }
      }

      // Check for Tab key handling in forms
      const formInputs = await page.locator('input[type="text"], textarea').all();
      let tabHandled = 0;

      for (const input of formInputs) {
        const onKeyDown = await input.getAttribute('onkeydown');
        if (onKeyDown?.includes('Tab')) {
          tabHandled++;
        }
      }

      if (tabHandled > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility.custom-tab-handling',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'heuristic',
          title: `${tabHandled} inputs intercept the Tab key`,
          summary: `${tabHandled} text inputs have custom Tab keydown handlers. Custom tab handling can break expected focus order if not carefully implemented.`,
          where: { selector: 'input[type="text"], textarea', url },
          evidence: [
            { kind: 'metric', name: 'tabInterceptingInputs', value: tabHandled, unit: 'elements' },
          ],
          investigate: [
            'Verify custom Tab handlers preserve logical focus order and Escape behavior.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-tab-handling`,
            profileId: this.profileId,
            severity: 'info',
            category: 'accessibility',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: tabHandled },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for Escape key to close overlays
      const overlays = await page.locator('[role="dialog"], .modal, .popover').all();
      if (overlays.length > 0) {
        const hasEscapeHandler = await overlays[0].evaluate(() => {
          const el = document.querySelector('[role="dialog"], .modal, .popover') as HTMLElement;
          interface ChromeWindow extends Window {
            getEventListeners?: (target: EventTarget) => {
              keydown?: Array<{ listener: { toString(): string } }>;
            };
          }
          const listeners = (window as ChromeWindow).getEventListeners?.(el);
          return listeners?.keydown?.some((l) => l.listener.toString().includes('Escape')) ?? false;
        });

        if (!hasEscapeHandler) {
          const canonical = buildFinding({
            ruleId: 'accessibility.overlay-no-escape',
            rite: 'accessibility',
            severity: 'info',
            confidence: 'heuristic',
            title: 'Overlay/modal lacks detected Escape handler',
            summary:
              'An overlay element exists but no Escape keydown listener was detected. Users expect Escape to dismiss modals and popovers.',
            where: { selector: '[role="dialog"], .modal, .popover', url },
            evidence: [
              {
                kind: 'dom',
                selector: '[role="dialog"], .modal, .popover',
                snippet: sanitizeUntrusted('no Escape keydown listener detected'),
              },
            ],
            investigate: ['Add an Escape key handler that closes the overlay and returns focus.'],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-escape-close`,
              profileId: this.profileId,
              severity: 'info',
              category: 'accessibility',
              message: canonical.title,
              details: { canonicalFinding: canonical },
              evidence: [...canonical.evidence],
            })
          );
        }
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: 'error',
          category: 'execution',
          message: `Keyboard profile error: ${error instanceof Error ? error.message : String(error)}`,
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
