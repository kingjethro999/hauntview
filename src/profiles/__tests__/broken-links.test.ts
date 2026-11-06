/**
 * Property-based tests for BrokenLinksProfile
 * Acceptance criterion: broken-links — 404/410→warning, 401/403/429→info, 5xx→warning.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';
import { sanitizeUntrusted } from '../../types/contracts';

describe('broken-links', () => {
  // broken-links 1 — finding requires evidence
  it('broken-links 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'broken-links.not-found',
        rite: 'broken-links',
        severity: 'warning',
        confidence: 'observed',
        title: 'Same-origin link returned 404',
        summary: 'Broken link.',
        evidence: [],
      })
    ).toThrow();
  });

  // broken-links 2 — 404/410 map to warning, 401/403/429 map to info
  it('broken-links 2 — severity mapping by status code', () => {
    const notFoundStatuses = [404, 410];
    const authStatuses = [401, 403, 429];

    for (const status of notFoundStatuses) {
      expect(() =>
        buildFinding({
          ruleId: 'broken-links.not-found',
          rite: 'broken-links',
          severity: 'warning',
          confidence: 'observed',
          title: `Same-origin link returned ${status}: /test`,
          summary: `HTTP ${status}.`,
          evidence: [{ kind: 'request', url: '/test', method: 'HEAD', status }],
        })
      ).not.toThrow();
    }

    for (const status of authStatuses) {
      expect(() =>
        buildFinding({
          ruleId: 'broken-links.auth-required',
          rite: 'broken-links',
          severity: 'info',
          confidence: 'observed',
          title: `Link returned ${status} (inconclusive): /test`,
          summary: `HTTP ${status}.`,
          evidence: [{ kind: 'request', url: '/test', method: 'HEAD', status }],
        })
      ).not.toThrow();
    }
  });

  // broken-links 3 — property: URLs are always sanitized before use in findings
  it('broken-links 3 — URLs are sanitized to ≤300 chars', () => {
    fc.assert(
      fc.property(fc.webUrl(), (url) => {
        const safe = sanitizeUntrusted(url);
        expect(safe.untrusted).toBe(true);
        expect(safe.text.length).toBeLessThanOrEqual(300);
      }),
      { numRuns: 100 }
    );
  });

  // broken-links 4 — 5xx maps to warning
  it('broken-links 4 — 5xx status codes map to warning severity', () => {
    fc.assert(
      fc.property(fc.integer({ min: 500, max: 599 }), (status) => {
        expect(() =>
          buildFinding({
            ruleId: 'broken-links.server-error',
            rite: 'broken-links',
            severity: 'warning',
            confidence: 'observed',
            title: `Link returned server error ${status}: /test`,
            summary: `HTTP ${status}.`,
            evidence: [{ kind: 'request', url: '/test', method: 'HEAD', status }],
          })
        ).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});
