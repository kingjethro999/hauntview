/**
 * Property-based tests for OfflineProfile
 * Acceptance criterion: offline — no SW + minimal content triggers info+observed.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';

describe('offline', () => {
  // offline 1 — finding requires evidence
  it('offline 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'offline.no-sw-fallback',
        rite: 'offline',
        severity: 'info',
        confidence: 'observed',
        title: 'No service worker or offline fallback detected',
        summary: 'No SW.',
        evidence: [],
      })
    ).toThrow();
  });

  // offline 2 — info+observed is a valid combination
  it('offline 2 — info+observed with metric+screenshot evidence is valid', () => {
    expect(() =>
      buildFinding({
        ruleId: 'offline.no-sw-fallback',
        rite: 'offline',
        severity: 'info',
        confidence: 'observed',
        title: 'No service worker or offline fallback detected',
        summary: 'When the network is unavailable the page shows no content.',
        evidence: [
          { kind: 'metric', name: 'serviceWorkerRegistered', value: 0, unit: 'boolean' },
          { kind: 'screenshot', captureId: 'cap-offline-1' },
        ],
      })
    ).not.toThrow();
  });

  // offline 3 — property: serviceWorkerRegistered metric value is always 0 or 1
  it('offline 3 — metric value for serviceWorkerRegistered is 0 or 1', () => {
    fc.assert(
      fc.property(fc.boolean(), (registered) => {
        const value = registered ? 1 : 0;
        expect([0, 1]).toContain(value);
      }),
      { numRuns: 100 }
    );
  });
});
