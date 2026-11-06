import { describe, it, expect, jest } from '@jest/globals';
import { AccessibilityKeyboardProfile } from '../accessibility-keyboard';
import { Page } from 'playwright';

describe('AccessibilityKeyboardProfile', () => {
  function createMockPage(
    overrides: {
      positiveTabindex?: number;
      hasFocusStyle?: boolean;
      hasAccessKey?: boolean;
    } = {}
  ) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn().mockReturnValue({
        all: jest.fn().mockResolvedValue([] as never),
        count: jest.fn().mockResolvedValue(0 as never),
      }),
      evaluate: jest.fn().mockImplementation((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('tabindex')) {
          return overrides.positiveTabindex ?? 0;
        }
        if (fnStr.includes('focusStyles') || fnStr.includes('hasFocus')) {
          return { hasFocus: overrides.hasFocusStyle ?? true };
        }
        if (fnStr.includes('accesskey')) {
          return overrides.hasAccessKey ?? false;
        }
        return false;
      }),
      context: jest.fn().mockReturnValue({
        browser: jest.fn().mockReturnValue({
          version: jest.fn().mockReturnValue('120.0'),
        }),
      }),
    } as unknown as Page;
  }

  it('runs cleanly on properly keyboard-accessible page', async () => {
    const profile = new AccessibilityKeyboardProfile('a11y-keyboard', 'Keyboard Navigation');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('a11y-keyboard');
    expect(result.success).toBe(true);
  });

  it('detects positive tabindex disrupting standard tab flow', async () => {
    const profile = new AccessibilityKeyboardProfile('a11y-keyboard', 'Keyboard Navigation');
    const mockPage = createMockPage({ positiveTabindex: 4 });

    const result = await profile.execute(mockPage, 'https://example.com');

    const tabindexFinding = result.findings.find((f) => f.id.includes('positive-tabindex'));
    expect(tabindexFinding).toBeDefined();
    expect(tabindexFinding?.severity).toBe('warning');
  });

  it('flags missing visible focus indicators', async () => {
    const profile = new AccessibilityKeyboardProfile('a11y-keyboard', 'Keyboard Navigation');
    const mockPage = createMockPage({ hasFocusStyle: false });

    const result = await profile.execute(mockPage, 'https://example.com');

    const focusFinding = result.findings.find((f) => f.id.includes('no-focus-styles'));
    expect(focusFinding).toBeDefined();
    expect(focusFinding?.severity).toBe('warning');
  });
});
