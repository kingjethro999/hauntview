import { describe, it, expect, jest } from '@jest/globals';
import { TabletProfile } from '../tablet';
import { Page } from 'playwright';
import { ProfileContext } from '../../types';

describe('TabletProfile', () => {
  const mockContext: ProfileContext = {
    profileId: 'tablet-ipad',
    profileName: 'Tablet - iPad Pro',
    viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false, hasTouch: true },
    strictMode: false,
  };

  function createMockPage(evalOverrides: Record<string, unknown> = {}) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      waitForLoadState: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn().mockReturnValue({
        getAttribute: jest
          .fn()
          .mockResolvedValue('width=device-width, initial-scale=1, viewport-fit=cover' as never),
        evaluateAll: jest.fn().mockResolvedValue(true as never),
        all: jest.fn().mockResolvedValue([] as never),
        count: jest.fn().mockResolvedValue(0 as never),
      }),
      evaluate: jest.fn().mockImplementation((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('touchAction')) {
          return evalOverrides.touchAction ?? 'auto';
        }
        if (fnStr.includes('landscape')) {
          return evalOverrides.landWidth ?? 1024;
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

  it('initializes with correct profileId and profileName', () => {
    const profile = new TabletProfile('tablet-ipad', 'Tablet - iPad Pro');
    expect(profile).toBeDefined();
  });

  it('executes successfully and returns valid ProfileResult structure', async () => {
    const profile = new TabletProfile('tablet-ipad', 'Tablet - iPad Pro');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com', mockContext);

    expect(result.profileId).toBe('tablet-ipad');
    expect(result.profileName).toBe('Tablet - iPad Pro');
    expect(result.duration).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(result.findings)).toBe(true);
    expect(result.metadata.browserEngine).toBe('webkit');
  });

  it('detects landscape horizontal overflow issues', async () => {
    const profile = new TabletProfile('tablet-ipad', 'Tablet - iPad Pro');
    const mockPage = createMockPage({ landWidth: 1500 }); // > 1024 * 1.1

    const result = await profile.execute(mockPage, 'https://example.com', mockContext);

    const overflowFinding = result.findings.find((f) => f.id.includes('landscape-overflow'));
    expect(overflowFinding).toBeDefined();
    expect(overflowFinding?.category).toBe('responsive-design');
    expect(overflowFinding?.severity).toBe('warning');
  });
});
