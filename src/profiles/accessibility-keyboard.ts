/**
 * Accessibility: Keyboard Navigation Profile
 * Validates keyboard accessibility, tab order, and focus management
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class AccessibilityKeyboardProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string, _context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check for positive tabindex values
      const positiveTabindex = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('[tabindex]'));
        return elements.filter(
          (el: Element) => parseInt((el as HTMLElement).getAttribute('tabindex') || '0') > 0
        ).length;
      });

      if (positiveTabindex > 0) {
        findings.push({
          id: `${this.profileId}-positive-tabindex`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `${positiveTabindex} elements use positive tabindex, breaks tab order`,
          timestamp: Date.now(),
          isClassified: false,
        });
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
        findings.push({
          id: `${this.profileId}-non-keyboard-buttons`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: `${nonKeyboardAccessible} elements may not be keyboard accessible`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for focus visible styles
      const focusStyles = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return {
          hasFocus: styles.outline !== 'none',
        };
      });

      if (!focusStyles.hasFocus) {
        findings.push({
          id: `${this.profileId}-no-focus-styles`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'accessibility',
          message: 'Focus indicator not visible with outline styling',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for keyboard shortcuts documentation
      const hasAccessKey = await page.evaluate(() => {
        return document.querySelectorAll('[accesskey]').length > 0;
      });

      if (hasAccessKey) {
        findings.push({
          id: `${this.profileId}-accesskey`,
          profileId: this.profileId,
          severity: 'info',
          category: 'accessibility',
          message: 'Page uses accesskey attribute, should document shortcuts',
          timestamp: Date.now(),
          isClassified: false,
        });
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
          findings.push({
            id: `${this.profileId}-modal-focus`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'accessibility',
            message: 'Modal dialog has no focusable elements',
            timestamp: Date.now(),
            isClassified: false,
          });
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
        findings.push({
          id: `${this.profileId}-tab-handling`,
          profileId: this.profileId,
          severity: 'info',
          category: 'accessibility',
          message: `${tabHandled} form inputs handle Tab key, ensure escape to native tab works`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for Escape key to close overlays
      const overlays = await page.locator('[role="dialog"], .modal, .popover').all();
      if (overlays.length > 0) {
        const hasEscapeHandler = await overlays[0].evaluate(() => {
          const el = document.querySelector('[role="dialog"], .modal, .popover') as HTMLElement;
          const listeners = (window as any).getEventListeners?.(el);
          return (
            listeners?.keydown?.some((l: any) => l.listener.toString().includes('Escape')) ?? false
          );
        });

        if (!hasEscapeHandler) {
          findings.push({
            id: `${this.profileId}-escape-close`,
            profileId: this.profileId,
            severity: 'info',
            category: 'accessibility',
            message: 'Overlay/modal should close on Escape key',
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `Keyboard profile error: ${error instanceof Error ? error.message : String(error)}`,
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
