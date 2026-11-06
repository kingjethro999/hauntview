import { describe, it, expect, jest } from '@jest/globals';
import { Desktop4KProfile } from '../desktop-4k';
import { Page } from 'playwright';
import { ProfileContext } from '../../types';

describe('Desktop4KProfile', () => {
  const mockContext: ProfileContext = {
    profileId: 'desktop-4k',
    profileName: 'Desktop - 4K',
    viewport: { width: 3840, height: 2160, isMobile: false, hasTouch: false },
    strictMode: false,
  };

  function createMockPage(evalHandler?: (fnStr: string) => unknown) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      waitForLoadState: jest.fn().mockResolvedValue(undefined as never),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (evalHandler) {
          const custom = evalHandler(fnStr);
          if (custom !== undefined) return custom;
        }

        if (fnStr.includes('upscaledImages')) {
          return { upscaledImages: 0, missingSrcset: 0 };
        }
        if (fnStr.includes('tinyTextCount')) {
          return { tinyTextCount: 0, excessiveLineLengthCount: 0 };
        }
        if (fnStr.includes('scrollWidth')) {
          return {
            scrollWidth: 3840,
            hasHorizontalOverflow: false,
            unconstrainedContent: false,
            fixedBackgrounds: 0,
          };
        }
        if (fnStr.includes('PerformanceObserver')) {
          return 0.02;
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

  it('initializes with default values', () => {
    const profile = new Desktop4KProfile();
    expect(profile).toBeDefined();
  });

  it('executes and returns valid ProfileResult structure', async () => {
    const profile = new Desktop4KProfile('desktop-4k', 'Desktop - 4K');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com', mockContext);

    expect(result.profileId).toBe('desktop-4k');
    expect(result.profileName).toBe('Desktop - 4K');
    expect(result.success).toBe(true);
    expect(result.metadata.browserEngine).toBe('chromium');
  });

  it('flags upscaled images and missing srcset on 4K', async () => {
    const profile = new Desktop4KProfile();
    const mockPage = createMockPage((fnStr) => {
      if (fnStr.includes('upscaledImages')) {
        return { upscaledImages: 3, missingSrcset: 2 };
      }
      return undefined;
    });

    const result = await profile.execute(mockPage, 'https://example.com', mockContext);

    expect(result.findings.some((f) => f.id.includes('upscaled-images'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('missing-highdpi-images'))).toBe(true);
  });

  it('flags tiny text below 12px on 4K display', async () => {
    const profile = new Desktop4KProfile();
    const mockPage = createMockPage((fnStr) => {
      if (fnStr.includes('tinyTextCount')) {
        return { tinyTextCount: 5, excessiveLineLengthCount: 2 };
      }
      return undefined;
    });

    const result = await profile.execute(mockPage, 'https://example.com', mockContext);

    expect(result.findings.some((f) => f.id.includes('tiny-text'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('excessive-line-length'))).toBe(true);
  });

  it('flags horizontal overflow at 4K viewport', async () => {
    const profile = new Desktop4KProfile();
    const mockPage = createMockPage((fnStr) => {
      if (fnStr.includes('scrollWidth')) {
        return {
          scrollWidth: 4200,
          hasHorizontalOverflow: true,
          unconstrainedContent: true,
          fixedBackgrounds: 1,
        };
      }
      return undefined;
    });

    const result = await profile.execute(mockPage, 'https://example.com', mockContext);

    expect(result.findings.some((f) => f.id.includes('horizontal-overflow'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('unconstrained-layout'))).toBe(true);
  });
});
