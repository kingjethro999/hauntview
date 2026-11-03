import { describe, it, expect, jest } from '@jest/globals';
import { BrowserLegacyProfile } from '../browser-legacy';
import { Page } from 'playwright';

describe('BrowserLegacyProfile', () => {
  function createMockPage(
    overrides: {
      xUaCompatible?: string | null;
      cssVarCount?: number;
      cssGridCount?: number;
      cssClampCount?: number;
      esCheck?: string[];
      hasNoscript?: boolean;
      hasUnsupportedWarning?: boolean;
    } = {}
  ) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      waitForLoadState: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn().mockImplementation((selector: string) => {
        if (selector.includes('X-UA-Compatible')) {
          return {
            getAttribute: jest
              .fn()
              .mockResolvedValue(
                overrides.xUaCompatible !== undefined
                  ? overrides.xUaCompatible
                  : ('IE=edge' as never)
              ),
          };
        }
        return { getAttribute: jest.fn().mockResolvedValue(null as never) };
      }),
      evaluate: jest.fn().mockImplementation((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('cssAudit') || fnStr.includes('var(--')) {
          return {
            cssVarCount: overrides.cssVarCount ?? 0,
            cssGridCount: overrides.cssGridCount ?? 0,
            cssClampCount: overrides.cssClampCount ?? 0,
          };
        }
        if (fnStr.includes('esCheck') || fnStr.includes('arrow-functions')) {
          return overrides.esCheck ?? [];
        }
        if (fnStr.includes('fallbackAudit') || fnStr.includes('noscript')) {
          return {
            hasNoscript: overrides.hasNoscript ?? true,
            hasUnsupportedBrowserWarning: overrides.hasUnsupportedWarning ?? false,
          };
        }
        return null;
      }),
      context: jest.fn().mockReturnValue({
        browser: jest.fn().mockReturnValue({
          version: jest.fn().mockReturnValue('120.0'),
        }),
      }),
    } as unknown as Page;
  }

  it('runs cleanly on legacy-ready/gracefully-degraded page', async () => {
    const profile = new BrowserLegacyProfile();
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('browser-legacy');
    expect(result.profileName).toBe('Browser - Legacy');
    expect(result.metadata.browserEngine).toBe('trident-emulation');
    expect(result.success).toBe(true);
  });

  it('flags CSS Custom Properties and CSS Grid without legacy fallbacks', async () => {
    const profile = new BrowserLegacyProfile();
    const mockPage = createMockPage({ cssVarCount: 15, cssGridCount: 4 });

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.findings.some((f) => f.id.includes('css-variables'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('css-grid'))).toBe(true);
  });

  it('flags untranspiled modern ES6+ JavaScript syntax as errors', async () => {
    const profile = new BrowserLegacyProfile();
    const mockPage = createMockPage({ esCheck: ['arrow-functions', 'async-await'] });

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.findings.some((f) => f.id.includes('untranspiled-arrow-functions'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('untranspiled-async-await'))).toBe(true);
    expect(result.success).toBe(false);
  });

  it('flags missing X-UA-Compatible meta tag', async () => {
    const profile = new BrowserLegacyProfile();
    const mockPage = createMockPage({ xUaCompatible: null });

    const result = await profile.execute(mockPage, 'https://example.com');

    const xUaFinding = result.findings.find((f) => f.id.includes('missing-x-ua-compatible'));
    expect(xUaFinding).toBeDefined();
    expect(xUaFinding?.severity).toBe('info');
  });
});
