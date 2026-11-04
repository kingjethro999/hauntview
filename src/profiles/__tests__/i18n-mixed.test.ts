import { describe, it, expect, jest } from '@jest/globals';
import { I18nMixedProfile } from '../i18n-mixed';
import { Page } from 'playwright';

describe('I18nMixedProfile', () => {
  function createMockPage(
    overrides: {
      lang?: string | null;
      fontFamily?: string;
      diacritics?: number;
      ligatures?: string;
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
              .mockResolvedValue(
                (overrides.lang !== undefined ? overrides.lang : 'hi-IN') as never
              ),
          };
        }
        return { getAttribute: jest.fn().mockResolvedValue(null as never) };
      }),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('fontFamily')) {
          return overrides.fontFamily ?? 'Noto Sans Devanagari, sans-serif';
        }
        if (fnStr.includes('diacritics')) {
          return overrides.diacritics ?? 8;
        }
        if (fnStr.includes('ligatures')) {
          return overrides.ligatures ?? 'normal';
        }
        if (fnStr.includes('lineHeight')) {
          return '1.5';
        }
        if (fnStr.includes('textRendering')) {
          return 'optimizeLegibility';
        }
        return 'normal';
      }),
      context: jest.fn().mockReturnValue({
        browser: jest.fn().mockReturnValue({
          version: jest.fn().mockReturnValue('120.0'),
        }),
      }),
    } as unknown as Page;
  }

  it('runs cleanly on Hindi/Devanagari mixed script page', async () => {
    const profile = new I18nMixedProfile('i18n-mixed', 'I18N - Mixed');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('i18n-mixed');
    expect(result.success).toBe(true);
    expect(mockPage.addInitScript).toHaveBeenCalled();
  });

  it('detects missing Hindi lang attribute', async () => {
    const profile = new I18nMixedProfile('i18n-mixed', 'I18N - Mixed');
    const mockPage = createMockPage({ lang: 'en' });

    const result = await profile.execute(mockPage, 'https://example.com');

    const langFinding = result.findings.find((f) => f.id.includes('no-hi-lang'));
    expect(langFinding).toBeDefined();
    expect(langFinding?.severity).toBe('warning');
  });

  it('detects missing Devanagari font support', async () => {
    const profile = new I18nMixedProfile('i18n-mixed', 'I18N - Mixed');
    const mockPage = createMockPage({ fontFamily: 'Times New Roman, serif' });

    const result = await profile.execute(mockPage, 'https://example.com');

    const fontFinding = result.findings.find((f) => f.id.includes('no-devanagari-font'));
    expect(fontFinding).toBeDefined();
    expect(fontFinding?.severity).toBe('warning');
  });
});
