import { describe, it, expect, jest } from '@jest/globals';
import { AccessibilityScreenReaderProfile } from '../accessibility-screenreader';
import { Page } from 'playwright';

describe('AccessibilityScreenReaderProfile', () => {
  function createMockPage(
    overrides: {
      lang?: string | null;
      mainCount?: number;
      headings?: number[];
      imgsNoAlt?: number;
      missingLabels?: number;
      ariaErrors?: string[];
    } = {}
  ) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn((selector: string) => {
        if (selector === 'html') {
          return {
            getAttribute: jest
              .fn()
              .mockResolvedValue((overrides.lang !== undefined ? overrides.lang : 'en') as never),
          };
        }
        if (selector.includes('main')) {
          return { count: jest.fn().mockResolvedValue((overrides.mainCount ?? 1) as never) };
        }
        if (selector.includes('input') || selector.includes('button')) {
          return {
            all: jest.fn().mockResolvedValue([] as never),
            count: jest.fn().mockResolvedValue(10 as never),
          };
        }
        return {
          count: jest.fn().mockResolvedValue(1 as never),
          all: jest.fn().mockResolvedValue([] as never),
          getAttribute: jest.fn().mockResolvedValue(null as never),
        };
      }),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('h1, h2')) {
          return overrides.headings ?? [1, 2, 3];
        }
        if (fnStr.includes('img')) {
          return overrides.imgsNoAlt ?? 0;
        }
        if (fnStr.includes('role')) {
          return overrides.ariaErrors ?? [];
        }
        return [];
      }),
      context: jest.fn().mockReturnValue({
        browser: jest.fn().mockReturnValue({
          version: jest.fn().mockReturnValue('120.0'),
        }),
      }),
    } as unknown as Page;
  }

  it('passes cleanly when semantic HTML and ARIA standards are met', async () => {
    const profile = new AccessibilityScreenReaderProfile('a11y-screenreader', 'Screen Reader');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('a11y-screenreader');
    expect(result.success).toBe(true);
    expect(result.findings.filter((f) => f.severity === 'error').length).toBe(0);
  });

  it('detects missing html lang attribute', async () => {
    const profile = new AccessibilityScreenReaderProfile('a11y-screenreader', 'Screen Reader');
    const mockPage = createMockPage({ lang: null });

    const result = await profile.execute(mockPage, 'https://example.com');

    const langFinding = result.findings.find((f) => f.id.includes('no-lang'));
    expect(langFinding).toBeDefined();
    expect(langFinding?.severity).toBe('error');
  });

  it('detects missing main landmark and missing image alt text', async () => {
    const profile = new AccessibilityScreenReaderProfile('a11y-screenreader', 'Screen Reader');
    const mockPage = createMockPage({ mainCount: 0, imgsNoAlt: 4 });

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.findings.some((f) => f.id.includes('no-main'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('img-alt'))).toBe(true);
  });
});
