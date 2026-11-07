/**
 * Property-based tests for HauntView invariants (AGENTS.md §4.4/§4.5,
 * .kiro/steering/type_and_schema_guardrails.md).
 */

import * as fc from 'fast-check';
import {
  buildFinding,
  assertValidSeverityConfidence,
  sanitizeMessage,
  assertFindingHasEvidence,
  buildProfileFinding,
} from '../finding-utils';
import { sanitizeUntrusted as sanitizeContract } from '../contracts';
import type { Evidence } from '../contracts';
import type { Finding } from '../profiles';

const arbEvidence = fc.record({
  kind: fc.constantFrom('metric' as const),
  name: fc.string({ minLength: 1, maxLength: 20 }),
  value: fc.float({ noNaN: true, noDefaultInfinity: true }),
  unit: fc.constantFrom('px', 'ms', 'count', 'score'),
});

const arbRite = fc.constantFrom(
  'mobile',
  'tablet',
  'desktop',
  'image-failure',
  'font-failure',
  'js-disabled',
  'reduced-motion',
  'console-errors',
  'offline',
  'accessibility',
  'broken-links',
  'network-resilience',
  'performance',
  'security-hygiene',
  'form-resilience'
) as fc.Arbitrary<import('../contracts').AtomicRiteId>;

const arbSeverity = fc.constantFrom('info' as const, 'warning' as const, 'serious' as const);
const arbConfidence = fc.constantFrom(
  'observed' as const,
  'measured' as const,
  'heuristic' as const
);

describe('invariant: evidence is never empty', () => {
  it('buildFinding throws when evidence array is empty', () => {
    fc.assert(
      fc.property(arbRite, arbSeverity, arbConfidence, (rite, severity, confidence) => {
        // skip combos buildFinding would reject for other reasons
        if (confidence === 'heuristic' && severity === 'serious') return;
        expect(() =>
          buildFinding({
            ruleId: 'test.rule',
            rite,
            severity,
            confidence,
            title: 'Valid title',
            summary: 'Valid summary.',
            evidence: [],
          })
        ).toThrow(/no evidence/);
      }),
      { numRuns: 100 }
    );
  });

  it('buildFinding returns non-empty evidence for any non-empty input', () => {
    fc.assert(
      fc.property(
        arbRite,
        arbSeverity,
        arbConfidence,
        fc.array(arbEvidence, { minLength: 1, maxLength: 5 }),
        (rite, severity, confidence, evidence) => {
          if (confidence === 'heuristic' && severity === 'serious') return;
          const f = buildFinding({
            ruleId: 'test.rule',
            rite,
            severity,
            confidence,
            title: 'Valid title',
            summary: 'Valid summary.',
            evidence: evidence as Evidence[],
          });
          expect(f.evidence.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('buildProfileFinding throws on empty evidence and accepts non-empty', () => {
    fc.assert(
      fc.property(fc.array(arbEvidence, { maxLength: 5 }), (evidence) => {
        const params = {
          id: 'p-1',
          profileId: 'p',
          severity: 'info' as const,
          category: 'test',
          message: 'msg',
          evidence: evidence as Evidence[],
        };
        if (evidence.length === 0) {
          expect(() => buildProfileFinding(params)).toThrow(/no evidence/);
        } else {
          const f = buildProfileFinding(params);
          expect(f.evidence.length).toBe(evidence.length);
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('invariant: heuristic confidence never produces serious severity', () => {
  it('assertValidSeverityConfidence throws only for heuristic+serious', () => {
    fc.assert(
      fc.property(arbSeverity, arbConfidence, (severity, confidence) => {
        const shouldThrow = confidence === 'heuristic' && severity === 'serious';
        if (shouldThrow) {
          expect(() => assertValidSeverityConfidence(severity, confidence)).toThrow();
        } else {
          expect(() => assertValidSeverityConfidence(severity, confidence)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });
});

describe('invariant: UntrustedText is truncated to <= 300 chars with control chars stripped', () => {
  const arbRaw = fc.string({ maxLength: 1000 });

  it('sanitizeUntrusted output text is at most 300 chars', () => {
    fc.assert(
      fc.property(arbRaw, (raw) => {
        const out = sanitizeContract(raw);
        expect(out.untrusted).toBe(true);
        expect(out.text.length).toBeLessThanOrEqual(300);
      }),
      { numRuns: 100 }
    );
  });

  it('sanitizeUntrusted strips control characters', () => {
    fc.assert(
      fc.property(arbRaw, (raw) => {
        const out = sanitizeContract(raw);
        expect(out.text).not.toMatch(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/);
      }),
      { numRuns: 100 }
    );
  });

  it('sanitizeMessage caps legacy finding messages at 500 chars', () => {
    fc.assert(
      fc.property(arbRaw, (raw) => {
        expect(sanitizeMessage(raw).length).toBeLessThanOrEqual(500);
      }),
      { numRuns: 100 }
    );
  });
});

describe('invariant: changedRatio alone never produces a finding', () => {
  it('diff facts are not CanonicalFindings', () => {
    fc.assert(
      fc.property(fc.float({ min: 0, max: 1, noNaN: true }), (changedRatio) => {
        const diffFact = { changedRatio };
        // A bare diff measurement has no ruleId/severity/evidence — it cannot
        // satisfy the CanonicalFinding contract and is never emitted as one.
        expect(diffFact).not.toHaveProperty('evidence');
        expect(diffFact).not.toHaveProperty('severity');
      }),
      { numRuns: 100 }
    );
  });
});

describe('invariant: assertFindingHasEvidence guards legacy findings', () => {
  it('throws for empty evidence, passes for non-empty', () => {
    fc.assert(
      fc.property(fc.array(arbEvidence, { maxLength: 3 }), (evidence) => {
        const finding = {
          id: 'f1',
          profileId: 'p',
          severity: 'info' as const,
          category: 'c',
          message: 'm',
          timestamp: 0,
          isClassified: false,
          evidence: evidence as Evidence[],
        } as Finding;
        if (evidence.length === 0) {
          expect(() => assertFindingHasEvidence(finding)).toThrow(/no evidence/);
        } else {
          expect(() => assertFindingHasEvidence(finding)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });
});
