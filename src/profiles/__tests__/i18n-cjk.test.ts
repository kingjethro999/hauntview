import { describe, it, expect, jest } from '@jest/globals';
import { I18nCJKProfile } from '../i18n-cjk';
import { Page } from 'playwright';

describe('I18nCJKProfile', () => {
  function createMockPage(
    overrides: {
      lang?: string | null;
      fontFamily?: string;
      wordBreak?: string;
      hasRuby?: number;
      cjkPunctuation?: number;
    } = {}
  ) {
    return {
      addInitScript: jest.fn().mockResolvedValue(undefined as never),
      goto: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn((selector: string) => {
        if (selector === 'html') {
          return {
            getAttribute: jest
              .fn()
              .mockResolvedValue((overrides.lang !== undefined ? overrides.lang : 'ja') as never),
          };
        }
        if (selector === 'ruby') {
          return { count: jest.fn().mockResolvedValue((overrides.hasRuby ?? 1) as never) };
        }
        return {
          getAttribute: jest.fn().mockResolvedValue(null as never),
          count: jest.fn().mockResolvedValue(0 as never),
        };
      }),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('fontFamily')) {
          return overrides.fontFamily ?? 'Noto Sans CJK JP, sans-serif';
        }
        if (fnStr.includes('wordBreak')) {
          return overrides.wordBreak ?? 'break-word';
        }
        if (fnStr.includes('cjkPunctuation')) {
          return overrides.cjkPunctuation ?? 5;
        }
        if (fnStr.includes('textOrientation')) {
          return true;
        }
        if (fnStr.includes('letterSpacing')) {
          return 'normal';
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

  it('runs cleanly on Japanese CJK page', async () => {
    const profile = new I18nCJKProfile('i18n-cjk', 'I18N - CJK');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('i18n-cjk');
    expect(result.success).toBe(true);
    expect(mockPage.addInitScript).toHaveBeenCalled();
  });

  it('detects missing Japanese lang attribute', async () => {
    const profile = new I18nCJKProfile('i18n-cjk', 'I18N - CJK');
    const mockPage = createMockPage({ lang: 'en-US' });

    const result = await profile.execute(mockPage, 'https://example.com');

    const langFinding = result.findings.find((f) => f.id.includes('no-ja-lang'));
    expect(langFinding).toBeDefined();
    expect(langFinding?.severity).toBe('warning');
  });

  it('flags font stacks lacking CJK font support', async () => {
    const profile = new I18nCJKProfile('i18n-cjk', 'I18N - CJK');
    const mockPage = createMockPage({ fontFamily: 'Arial, Helvetica, sans-serif' });

    const result = await profile.execute(mockPage, 'https://example.com');

    const fontFinding = result.findings.find((f) => f.id.includes('no-cjk-font'));
    expect(fontFinding).toBeDefined();
    expect(fontFinding?.severity).toBe('info');
  });
});
