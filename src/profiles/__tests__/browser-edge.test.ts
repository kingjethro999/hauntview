import { describe, it, expect, jest } from '@jest/globals';
import { BrowserEdgeProfile } from '../browser-edge';
import { Page } from 'playwright';

describe('BrowserEdgeProfile', () => {
  function createMockPage(
    overrides: {
      svgIconsWithoutFillOrCurrentColor?: number;
      forcedColorsAdjustNone?: number;
      sniffingIssues?: string[];
      hasManifest?: boolean;
      consoleErrors?: string[];
    } = {}
  ) {
    let consoleCallback: ((msg: { type: () => string; text: () => string }) => void) | null = null;

    return {
      goto: jest.fn().mockImplementation(async () => {
        if (overrides.consoleErrors && consoleCallback) {
          for (const err of overrides.consoleErrors) {
            consoleCallback({ type: () => 'error', text: () => err });
          }
        }
      }),
      waitForLoadState: jest.fn().mockResolvedValue(undefined as never),
      on: jest.fn().mockImplementation((event: string, cb: unknown) => {
        if (event === 'console') {
          consoleCallback = cb as (msg: { type: () => string; text: () => string }) => void;
        }
      }),
      off: jest.fn(),
      evaluate: jest.fn().mockImplementation((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('forcedColorsAudit') || fnStr.includes('forced-color-adjust')) {
          return {
            svgIconsWithoutFillOrCurrentColor: overrides.svgIconsWithoutFillOrCurrentColor ?? 0,
            forcedColorsAdjustNone: overrides.forcedColorsAdjustNone ?? 0,
          };
        }
        if (fnStr.includes('sniffingIssues') || fnStr.includes('ua-sniffing')) {
          return overrides.sniffingIssues ?? [];
        }
        if (fnStr.includes('windowsPwaChecks') || fnStr.includes('manifest')) {
          return {
            hasManifest: overrides.hasManifest ?? true,
            hasThemeColor: true,
            hasTileColor: true,
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

  it('runs cleanly on Edge-compatible page', async () => {
    const profile = new BrowserEdgeProfile();
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('browser-edge');
    expect(result.profileName).toBe('Browser - Edge');
    expect(result.metadata.browserEngine).toBe('chromium-edge');
    expect(result.success).toBe(true);
  });

  it('flags forced-color-adjust: none breaking Windows High Contrast', async () => {
    const profile = new BrowserEdgeProfile();
    const mockPage = createMockPage({ forcedColorsAdjustNone: 3 });

    const result = await profile.execute(mockPage, 'https://example.com');

    const forcedFinding = result.findings.find((f) => f.id.includes('forced-colors-none'));
    expect(forcedFinding).toBeDefined();
    expect(forcedFinding?.severity).toBe('warning');
  });

  it('flags missing PWA web app manifest for Edge/Windows integration', async () => {
    const profile = new BrowserEdgeProfile();
    const mockPage = createMockPage({ hasManifest: false });

    const result = await profile.execute(mockPage, 'https://example.com');

    const pwaFinding = result.findings.find((f) => f.id.includes('pwa-manifest'));
    expect(pwaFinding).toBeDefined();
    expect(pwaFinding?.severity).toBe('info');
  });
});
