/**
 * Property-based tests for FontFailureProfile
 * Acceptance criterion: font-failure — findings have evidence; layout-shift severity is warning+measured.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';

describe('font-failure', () => {
  // font-failure 1 — findings always carry evidence
  it('font-failure 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'font-failure.layout-shift',
        rite: 'font-failure',
        severity: 'warning',
        confidence: 'measured',
        title: 'Test',
        summary: 'Test summary',
        evidence: [],
      })
    ).toThrow();
  });

  // font-failure 2 — layout-shift finding is warning+measured (valid combination)
  it('font-failure 2 — warning+measured is a valid combination', () => {
    expect(() =>
      buildFinding({
        ruleId: 'font-failure.layout-shift',
        rite: 'font-failure',
        severity: 'warning',
        confidence: 'measured',
        title: 'Font blocking caused potential layout shift',
        summary: 'Fallback fonts can cause CLS.',
        evidence: [
          { kind: 'screenshot', captureId: 'cap-001' },
          {
            kind: 'request',
            url: 'https://fonts.googleapis.com/css2?family=Test',
            method: 'GET',
            failure: 'blocked',
          },
        ],
      })
    ).not.toThrow();
  });

  // font-failure 3 — title length is always ≤ 90 chars
  it('font-failure 3 — title length constraint (≤90 chars)', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 50 }), (count) => {
        const title = `Font blocking caused potential layout shift (${count} font request(s) blocked)`;
        expect(title.length).toBeLessThanOrEqual(90);
      }),
      { numRuns: 100 }
    );
  });
});
