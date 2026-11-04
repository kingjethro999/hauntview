/**
 * Property-based tests for ImageFailureProfile
 * Acceptance criterion: image-failure — every finding has non-empty evidence
 * and severity/confidence rules are upheld.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';
import { sanitizeUntrusted } from '../../types/contracts';
import type { Evidence } from '../../types/contracts';

// image-failure 1 — findings always carry evidence
describe('image-failure', () => {
  it('image-failure 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'image-failure.missing-alt',
        rite: 'image-failure',
        severity: 'warning',
        confidence: 'observed',
        title: 'Test finding',
        summary: 'Test summary',
        // deliberately empty — cast to bypass tuple type so we can test the runtime guard
        evidence: [] as unknown as [Evidence, ...Evidence[]],
        investigate: [],
      })
    ).toThrow();
  });

  // image-failure 2 — heuristic+serious is rejected
  it('image-failure 2 — heuristic confidence may not produce serious severity', () => {
    expect(() =>
      buildFinding({
        ruleId: 'image-failure.no-dimensions',
        rite: 'image-failure',
        severity: 'serious',
        confidence: 'heuristic',
        title: 'Test finding',
        summary: 'Test summary',
        evidence: [{ kind: 'screenshot', captureId: 'x' }],
        investigate: [],
      })
    ).toThrow();
  });

  // image-failure 3 — sanitizeUntrusted strips control chars and caps at 300 chars
  it.each([
    ['hello\x00world', 'helloworld'],
    ['a'.repeat(400), 'a'.repeat(300)],
    ['clean text', 'clean text'],
  ] as [string, string][])(
    'image-failure 3 — sanitizeUntrusted cleans input',
    (input, expected) => {
      const result = sanitizeUntrusted(input);
      expect(result.untrusted).toBe(true);
      expect(result.text).toBe(expected);
      expect(result.text.length).toBeLessThanOrEqual(300);
    }
  );

  // image-failure 4 — property: arbitrary page snippets are always safe after sanitization
  it('image-failure 4 — sanitizeUntrusted output is always ≤300 chars', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 1000 }), (raw) => {
        const result = sanitizeUntrusted(raw);
        expect(result.untrusted).toBe(true);
        expect(result.text.length).toBeLessThanOrEqual(300);
      }),
      { numRuns: 100 }
    );
  });
});
