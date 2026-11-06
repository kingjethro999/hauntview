import { describe, it, expect, jest } from '@jest/globals';
import { AccessibilityVisualProfile } from '../accessibility-visual';
import { Page } from 'playwright';

describe('AccessibilityVisualProfile', () => {
  function createMockPage(
    overrides: {
      contrastIssues?: Array<{ text: string; contrast: string; level: string }>;
      colorOnly?: string[];
      allowsZoom?: boolean;
      bgImageText?: number;
    } = {}
  ) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      evaluate: jest.fn().mockImplementation((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('ContrastIssue') || fnStr.includes('getContrast')) {
          return overrides.contrastIssues ?? [];
        }
        if (fnStr.includes('colorOnlyInfo') || fnStr.includes('style*="color"')) {
          return overrides.colorOnly ?? [];
        }
        if (fnStr.includes('allowsZoom') || fnStr.includes('user-scalable=no')) {
          return overrides.allowsZoom ?? true;
        }
        if (fnStr.includes('bgImageText') || fnStr.includes('background-image')) {
          return overrides.bgImageText ?? 0;
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

  it('runs cleanly on high contrast visual page', async () => {
    const profile = new AccessibilityVisualProfile('a11y-visual', 'Visual Impairment');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('a11y-visual');
    expect(result.success).toBe(true);
  });

  it('detects insufficient color contrast ratio', async () => {
    const profile = new AccessibilityVisualProfile('a11y-visual', 'Visual Impairment');
    const mockPage = createMockPage({
      contrastIssues: [{ text: 'Low contrast heading', contrast: '2.1', level: 'fail' }],
    });

    const result = await profile.execute(mockPage, 'https://example.com');

    const contrastFinding = result.findings.find((f) => f.id.includes('contrast-ratio'));
    expect(contrastFinding).toBeDefined();
    expect(contrastFinding?.severity).toBe('error');
  });

  it('detects disabled user pinch zoom', async () => {
    const profile = new AccessibilityVisualProfile('a11y-visual', 'Visual Impairment');
    const mockPage = createMockPage({ allowsZoom: false });

    const result = await profile.execute(mockPage, 'https://example.com');

    const zoomFinding = result.findings.find((f) => f.id.includes('no-zoom'));
    expect(zoomFinding).toBeDefined();
    expect(zoomFinding?.severity).toBe('warning');
  });
});
