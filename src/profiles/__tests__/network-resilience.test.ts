/**
 * Property-based tests for NetworkResilienceProfile
 * Acceptance criterion: network-resilience — api-failure is warning+observed; no XHR → zero findings.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';
import { sanitizeUntrusted } from '../../types/contracts';

describe('network-resilience', () => {
  // network-resilience 1 — finding requires evidence
  it('network-resilience 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'network-resilience.api-failure',
        rite: 'network-resilience',
        severity: 'warning',
        confidence: 'observed',
        title: 'Page shows errors when API requests are blocked',
        summary: 'No graceful degradation.',
        evidence: [],
      })
    ).toThrow();
  });

  // network-resilience 2 — warning+observed is valid
  it('network-resilience 2 — warning+observed with request+screenshot is valid', () => {
    expect(() =>
      buildFinding({
        ruleId: 'network-resilience.api-failure',
        rite: 'network-resilience',
        severity: 'warning',
        confidence: 'observed',
        title: 'Page shows errors or blank content when API requests are blocked',
        summary: 'API failure causes blank page.',
        evidence: [
          {
            kind: 'request',
            url: 'https://api.example.com/data',
            method: 'GET',
            failure: 'aborted',
          },
          { kind: 'screenshot', captureId: 'cap-nr-1' },
        ],
      })
    ).not.toThrow();
  });

  // network-resilience 3 — property: arbitrary API URLs are safe after sanitization
  it('network-resilience 3 — API URLs are sanitized to ≤300 chars', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const safe = sanitizeUntrusted(url);
        expect(safe.untrusted).toBe(true);
        expect(safe.text.length).toBeLessThanOrEqual(300);
      }),
      { numRuns: 100 }
    );
  });
});
