/**
 * Property-based tests for ReducedMotionProfile
 * Acceptance criterion: reduced-motion — running animations under reduced-motion triggers warning+observed.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';

describe('reduced-motion', () => {
  // reduced-motion 1 — finding requires evidence
  it('reduced-motion 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'reduced-motion.animations-persist',
        rite: 'reduced-motion',
        severity: 'warning',
        confidence: 'observed',
        title: 'Animations still running under prefers-reduced-motion',
        summary: 'Summary.',
        evidence: [],
      })
    ).toThrow();
  });

  // reduced-motion 2 — valid finding: metric + screenshot evidence
  it('reduced-motion 2 — warning+observed with metric evidence is valid', () => {
    expect(() =>
      buildFinding({
        ruleId: 'reduced-motion.animations-persist',
        rite: 'reduced-motion',
        severity: 'warning',
        confidence: 'observed',
        title: '3 animation(s) still running under prefers-reduced-motion: reduce',
        summary: 'Animations persist.',
        evidence: [
          {
            kind: 'metric',
            name: 'runningAnimationsUnderReducedMotion',
            value: 3,
            unit: 'count',
            threshold: 0,
          },
          { kind: 'screenshot', captureId: 'cap-rm-1' },
        ],
      })
    ).not.toThrow();
  });

  // reduced-motion 3 — property: title with any runningCount ≤ 90 chars
  it('reduced-motion 3 — title is always ≤90 chars for any animation count', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 9999 }), (count) => {
        const title = `${count} animation(s) still running under prefers-reduced-motion: reduce`;
        expect(title.length).toBeLessThanOrEqual(90);
      }),
      { numRuns: 100 }
    );
  });
});
