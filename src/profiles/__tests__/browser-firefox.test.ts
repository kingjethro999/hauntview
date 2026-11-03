import { describe, it, expect, jest } from '@jest/globals';
import { BrowserFirefoxProfile } from '../browser-firefox';
import { Page } from 'playwright';

describe('BrowserFirefoxProfile', () => {
  function createMockPage(
    overrides: {
      cssPrefixIssues?: string[];
      jsCompatibility?: string[];
      formAppearanceIssues?: number;
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
      on: jest.fn((event: string, cb: unknown) => {
        if (event === 'console') {
          consoleCallback = cb as (msg: { type: () => string; text: () => string }) => void;
        }
      }),
      off: jest.fn(),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('cssPrefixIssues') || fnStr.includes('::-webkit-scrollbar')) {
          return overrides.cssPrefixIssues ?? [];
        }
        if (fnStr.includes('jsCompatibility') || fnStr.includes('userAgentData')) {
          return overrides.jsCompatibility ?? [];
        }
        if (fnStr.includes('formAppearanceIssues') || fnStr.includes('-webkit-appearance')) {
          return overrides.formAppearanceIssues ?? 0;
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

  it('runs cleanly on standard-compliant Firefox page', async () => {
    const profile = new BrowserFirefoxProfile();
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('browser-firefox');
    expect(result.profileName).toBe('Browser - Firefox');
    expect(result.metadata.browserEngine).toBe('firefox');
    expect(result.success).toBe(true);
  });

  it('flags ::-webkit-scrollbar without Firefox scrollbar-width', async () => {
    const profile = new BrowserFirefoxProfile();
    const mockPage = createMockPage({ cssPrefixIssues: ['custom-scrollbar', 'backdrop-filter'] });

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.findings.some((f) => f.id.includes('webkit-scrollbar'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('webkit-backdrop'))).toBe(true);
  });

  it('detects WebKit-only JavaScript APIs (webkitSpeechRecognition)', async () => {
    const profile = new BrowserFirefoxProfile();
    const mockPage = createMockPage({ jsCompatibility: ['webkitSpeechRecognition-only'] });

    const result = await profile.execute(mockPage, 'https://example.com');

    const apiFinding = result.findings.find((f) => f.id.includes('webkitSpeechRecognition-only'));
    expect(apiFinding).toBeDefined();
    expect(apiFinding?.severity).toBe('error');
    expect(result.success).toBe(false);
  });

  it('captures console errors on Firefox engine', async () => {
    const profile = new BrowserFirefoxProfile();
    const mockPage = createMockPage({
      consoleErrors: ['TypeError: Cannot read property of undefined'],
    });

    const result = await profile.execute(mockPage, 'https://example.com');

    const consoleFinding = result.findings.find((f) => f.id.includes('console-errors'));
    expect(consoleFinding).toBeDefined();
    expect(consoleFinding?.severity).toBe('error');
  });
});
