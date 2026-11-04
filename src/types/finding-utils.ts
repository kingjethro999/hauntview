/**
 * Utilities for creating and validating CanonicalFinding objects.
 * Per AGENTS.md §4.4 and §4.5 evidence/finding rules.
 *
 * Uses CanonicalFinding (from contracts.ts) rather than the legacy Finding
 * type (from profiles.ts) to avoid a name conflict.
 */

import { createHash } from 'crypto';
import type { AtomicRiteId, CanonicalFinding, Confidence, Evidence, Severity } from './contracts';

// ---------------------------------------------------------------------------
// assertValidSeverityConfidence
// ---------------------------------------------------------------------------

/**
 * Throws if the severity/confidence combination is forbidden.
 * Rule (AGENTS.md §4.5): `heuristic` confidence may not produce `serious` severity.
 */
export function assertValidSeverityConfidence(severity: Severity, confidence: Confidence): void {
  if (confidence === 'heuristic' && severity === 'serious') {
    throw new Error(
      `Invalid combination: confidence 'heuristic' cannot be paired with severity 'serious'. ` +
        `Heuristic findings must be 'info' or 'warning'.`
    );
  }
}

// ---------------------------------------------------------------------------
// makeFindingId
// ---------------------------------------------------------------------------

/**
 * Generates a stable 16-character finding id.
 * sha256(ruleId + rite + normalizedLocator).slice(0, 16)
 * Allows the same issue to be tracked across runs (lingering, revenant, laid to rest).
 */
export function makeFindingId(
  ruleId: string,
  rite: AtomicRiteId,
  normalizedLocator: string
): string {
  return createHash('sha256')
    .update(ruleId + rite + normalizedLocator)
    .digest('hex')
    .slice(0, 16);
}

// ---------------------------------------------------------------------------
// buildFinding
// ---------------------------------------------------------------------------

/** Parameters accepted by buildFinding. */
export type BuildFindingParams = Omit<CanonicalFinding, 'id' | 'evidence' | 'investigate'> & {
  evidence: Evidence[];
  investigate?: string[];
  /**
   * Optional stable locator string used to derive the id.
   * Falls back to `where.selector ?? where.url ?? ''` when omitted.
   */
  normalizedLocator?: string;
};

/**
 * Validates params, generates a stable id, and returns a complete CanonicalFinding.
 *
 * Throws if:
 * - `evidence` is empty
 * - `confidence === 'heuristic'` and `severity === 'serious'`
 * - `title` exceeds 90 characters
 */
export function buildFinding(params: BuildFindingParams): CanonicalFinding {
  const {
    normalizedLocator,
    ruleId,
    rite,
    severity,
    confidence,
    title,
    summary,
    where,
    evidence,
    investigate,
  } = params;

  // Validate evidence is non-empty
  if (!evidence || evidence.length === 0) {
    throw new Error(
      `Finding '${ruleId}' on rite '${rite}' has no evidence. ` +
        `Every finding must carry at least one piece of evidence.`
    );
  }

  // Validate severity/confidence combination
  assertValidSeverityConfidence(severity, confidence);

  // Validate title length
  if (title.length > 90) {
    throw new Error(
      `Finding title exceeds 90 characters (${title.length}): "${title.slice(0, 50)}…"`
    );
  }

  // Derive the locator used for id generation
  const locator = normalizedLocator ?? where?.selector ?? where?.url ?? '';

  const id = makeFindingId(ruleId, rite, locator);

  return {
    id,
    ruleId,
    rite,
    severity,
    confidence,
    title,
    summary,
    ...(where !== undefined ? { where } : {}),
    evidence: evidence as [Evidence, ...Evidence[]],
    investigate: investigate ?? [],
  };
}
