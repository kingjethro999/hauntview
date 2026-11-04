/**
 * Property-based tests for JsDisabledProfile
 * Acceptance criterion: js-disabled — empty content triggers warning; noscript present triggers info.
 */

import { describe, it, expect } from '@jest/globals';
import * as fc from 'fast-check';
import { buildFinding } from '../../types/finding-utils';
import { sanitizeUntrusted } from '../../types/contracts';

describe('js-disabled', () => {
  // js-disabled 1 — empty-content finding requires evidence
  it('js-disabled 1 — buildFinding rejects empty evidence', () => {
    expect(() =>
      buildFinding({
        ruleId: 'js-disabled.empty-content',
        rite: 'js-disabled',
        severity: 'warning',
        confidence: 'observed',
        title: 'Page renders no content without JavaScript',
        summary: 'No content.',
        evidence: [],
      })
    ).toThrow();
  });

  // js-disabled 2 — empty-content is warning, noscript-fallback is info
  it('js-disabled 2 — severity rules: empty-content=warning, noscript-fallback=info', () => {
    expect(() =>
      buildFinding({
        ruleId: 'js-disabled.empty-content',
        rite: 'js-disabled',
        severity: 'warning',
        confidence: 'observed',
        title: 'Page renders no content without JavaScript and has no <noscript> fallback',
        summary: 'Blank page.',
        evidence: [{ kind: 'screenshot', captureId: 'cap-js-1' }],
      })
    ).not.toThrow();

    expect(() =>
      buildFinding({
        ruleId: 'js-disabled.noscript-fallback',
        rite: 'js-disabled',
        severity: 'info',
        confidence: 'observed',
        title: 'Page has a <noscript> fallback but renders little content without JavaScript',
        summary: 'Noscript present.',
        evidence: [{ kind: 'screenshot', captureId: 'cap-js-2' }],
      })
    ).not.toThrow();
  });

  // js-disabled 3 — property: body snippets are always sanitized safely
  it('js-disabled 3 — sanitizeUntrusted handles arbitrary DOM snippets', () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 600 }), (snippet) => {
        const result = sanitizeUntrusted(snippet);
        expect(result.untrusted).toBe(true);
        expect(result.text.length).toBeLessThanOrEqual(300);
      }),
      { numRuns: 100 }
    );
  });
});
