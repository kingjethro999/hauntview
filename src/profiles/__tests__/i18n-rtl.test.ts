import { describe, it, expect, jest } from '@jest/globals';
import { I18nRTLProfile } from '../i18n-rtl';
import { Page } from 'playwright';

describe('I18nRTLProfile', () => {
  function createMockPage(
    overrides: {
      dir?: string | null;
      textAlign?: string;
      stylesUseLR?: number;
      arrowImages?: number;
    } = {}
  ) {
    const defaultLocatorObj = {
      getAttribute: jest
        .fn()
        .mockResolvedValue((overrides.dir !== undefined ? overrides.dir : 'rtl') as never),
      all: jest.fn().mockResolvedValue([] as never),
      count: jest.fn().mockResolvedValue(0 as never),
      first: jest.fn().mockReturnValue({
        getAttribute: jest.fn().mockResolvedValue('rtl' as never),
      }),
    };

    return {
      addInitScript: jest.fn().mockResolvedValue(undefined as never),
      goto: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn((selector: string) => {
        if (selector === 'html') {
          return {
            ...defaultLocatorObj,
            getAttribute: jest
              .fn()
              .mockResolvedValue((overrides.dir !== undefined ? overrides.dir : 'rtl') as never),
          };
        }
        if (selector === 'img') {
          const imgs = Array.from({ length: overrides.arrowImages ?? 0 }, () => ({
            getAttribute: jest.fn((attr: string) => {
              if (attr === 'src') return 'icon-arrow-right.png';
              if (attr === 'alt') return 'next page';
              return null;
            }),
          }));
          return {
            ...defaultLocatorObj,
            all: jest.fn().mockResolvedValue(imgs as never),
          };
        }
        return defaultLocatorObj;
      }),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('textAlign')) {
          return overrides.textAlign ?? 'start';
        }
        if (fnStr.includes('margin-left') || fnStr.includes('padding-left')) {
          return overrides.stylesUseLR ?? 0;
        }
        if (fnStr.includes('border-radius')) {
          return false;
        }
        if (fnStr.includes('flex-direction')) {
          return false;
        }
        if (fnStr.includes('arabicNumbers') || fnStr.includes('latinNumbers')) {
          return { hasArabic: true, hasLatin: false };
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

  it('runs cleanly on properly configured RTL page', async () => {
    const profile = new I18nRTLProfile('i18n-rtl', 'I18N - RTL');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('i18n-rtl');
    expect(result.success).toBe(true);
    expect(mockPage.addInitScript).toHaveBeenCalled();
  });

  it('detects missing or invalid dir="rtl" attribute', async () => {
    const profile = new I18nRTLProfile('i18n-rtl', 'I18N - RTL');
    const mockPage = createMockPage({ dir: 'ltr' });

    const result = await profile.execute(mockPage, 'https://example.com');

    const rtlFinding = result.findings.find((f) => f.id.includes('no-rtl-dir'));
    expect(rtlFinding).toBeDefined();
    expect(rtlFinding?.severity).toBe('error');
  });

  it('flags hardcoded physical properties (margin-left/right) instead of logical properties', async () => {
    const profile = new I18nRTLProfile('i18n-rtl', 'I18N - RTL');
    const mockPage = createMockPage({ stylesUseLR: 12 });

    const result = await profile.execute(mockPage, 'https://example.com');

    const physicalFinding = result.findings.find((f) => f.id.includes('physical-properties'));
    expect(physicalFinding).toBeDefined();
    expect(physicalFinding?.severity).toBe('warning');
  });
});
