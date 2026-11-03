import { describe, it, expect, jest } from '@jest/globals';
import { AccessibilityCognitiveProfile } from '../accessibility-cognitive';
import { Page } from 'playwright';

describe('AccessibilityCognitiveProfile', () => {
  function createMockPage(
    overrides: {
      elements?: number;
      nested?: number;
      animations?: number;
      autoplay?: number;
      hasInstructions?: boolean;
      avgWordLength?: number;
    } = {}
  ) {
    return {
      goto: jest.fn().mockResolvedValue(undefined as never),
      locator: jest.fn((selector: string) => {
        if (selector.includes('autoplay')) {
          return { count: jest.fn().mockResolvedValue((overrides.autoplay ?? 0) as never) };
        }
        return { count: jest.fn().mockResolvedValue(0 as never) };
      }),
      evaluate: jest.fn((fn: unknown) => {
        const fnStr = typeof fn === 'function' ? fn.toString() : '';
        if (fnStr.includes('complexity') || fnStr.includes('document.querySelectorAll')) {
          return {
            elements: overrides.elements ?? 150,
            forms: 0,
            inputs: 0,
            buttons: 5,
            animations: overrides.animations ?? 2,
            nested: overrides.nested ?? 6,
          };
        }
        if (fnStr.includes('hasInstructions')) {
          return overrides.hasInstructions ?? true;
        }
        if (fnStr.includes('avgWordLength')) {
          return overrides.avgWordLength ?? 4.5;
        }
        if (fnStr.includes('paragraphs')) {
          return 0;
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

  it('runs cleanly on low-cognitive-load page', async () => {
    const profile = new AccessibilityCognitiveProfile('a11y-cognitive', 'Cognitive Load');
    const mockPage = createMockPage();

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.profileId).toBe('a11y-cognitive');
    expect(result.success).toBe(true);
  });

  it('detects overwhelming DOM complexity (>500 elements) and deep nesting', async () => {
    const profile = new AccessibilityCognitiveProfile('a11y-cognitive', 'Cognitive Load');
    const mockPage = createMockPage({ elements: 800, nested: 22 });

    const result = await profile.execute(mockPage, 'https://example.com');

    expect(result.findings.some((f) => f.id.includes('too-many-elements'))).toBe(true);
    expect(result.findings.some((f) => f.id.includes('deep-nesting'))).toBe(true);
  });

  it('detects disruptive autoplay media', async () => {
    const profile = new AccessibilityCognitiveProfile('a11y-cognitive', 'Cognitive Load');
    const mockPage = createMockPage({ autoplay: 2 });

    const result = await profile.execute(mockPage, 'https://example.com');

    const autoplayFinding = result.findings.find((f) => f.id.includes('autoplay'));
    expect(autoplayFinding).toBeDefined();
    expect(autoplayFinding?.severity).toBe('warning');
  });
});
