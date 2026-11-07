/**
 * src/core/system-capability.ts
 *
 * System hardware capability detection, heuristic concurrency recommendations,
 * validation, and runtime clamping.
 */

import * as os from 'os';

export interface SystemSpecs {
  logicalCores: number;
  cpuModel: string;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
}

export interface ConcurrencyRecommendation {
  cpuBound: number;
  ramBound: number;
  recommendedMax: number;
  defaultSuggested: number;
  isConstrained: boolean;
  constraintReason?: string;
  specs: SystemSpecs;
}

export interface ConcurrencyValidationResult {
  valid: boolean;
  clampedValue: number;
  warning?: string;
  errorMessage?: string;
}

/**
 * Reads live machine specs using Node's os module
 */
export function getLiveSystemSpecs(): SystemSpecs {
  let logicalCores = 1;
  try {
    if (typeof os.availableParallelism === 'function') {
      logicalCores = os.availableParallelism();
    } else {
      logicalCores = os.cpus().length || 1;
    }
  } catch {
    logicalCores = 1;
  }

  let cpuModel = 'Generic CPU';
  try {
    const cpus = os.cpus();
    if (cpus && cpus.length > 0 && cpus[0].model) {
      cpuModel = cpus[0].model.trim();
    }
  } catch {
    // Fallback to generic CPU
  }

  return {
    logicalCores,
    cpuModel,
    totalMemoryBytes: os.totalmem(),
    freeMemoryBytes: os.freemem(),
  };
}

/**
 * Computes hardware-aware concurrency limits using conservative heuristics:
 * - CPU bound: roughly half logical cores (min 1) to account for hyperthreading and browser overhead
 * - RAM bound: ~2 GB per concurrent browser execution
 * - Constrained: < 4 GB RAM or < 2 cores caps concurrency at 1
 */
export function evaluateSystemCapability(customSpecs?: SystemSpecs): ConcurrencyRecommendation {
  const specs = customSpecs ?? getLiveSystemSpecs();
  const totalMemoryGb = specs.totalMemoryBytes / (1024 * 1024 * 1024);

  const cpuBound = Math.max(1, Math.floor(specs.logicalCores / 2));
  const ramBound = Math.max(1, Math.floor(totalMemoryGb / 2));

  const isConstrained = specs.logicalCores < 2 || totalMemoryGb < 3.5;

  let recommendedMax: number;
  let constraintReason: string | undefined;

  if (isConstrained) {
    recommendedMax = 1;
    constraintReason = `Your system has limited hardware resources (${specs.logicalCores} cores, ${totalMemoryGb.toFixed(1)} GB RAM). Concurrency is not recommended and is capped at 1.`;
  } else {
    recommendedMax = Math.max(1, Math.min(cpuBound, ramBound));
  }

  const defaultSuggested = Math.min(2, recommendedMax);

  return {
    cpuBound,
    ramBound,
    recommendedMax,
    defaultSuggested,
    isConstrained,
    constraintReason,
    specs,
  };
}

/**
 * Validates a user-requested concurrency amount against machine recommendations.
 * Rejects values that exceed recommendedMax with an informative explanation.
 */
export function validateConcurrencyAmount(
  requested: number,
  recommendation: ConcurrencyRecommendation
): ConcurrencyValidationResult {
  const { recommendedMax, specs } = recommendation;
  const totalMemoryGb = specs.totalMemoryBytes / (1024 * 1024 * 1024);

  if (requested < 1) {
    return {
      valid: false,
      clampedValue: 1,
      errorMessage: 'Concurrency amount must be at least 1.',
    };
  }

  if (requested > recommendedMax) {
    const errorMessage = `Your ${specs.cpuModel} (${specs.logicalCores} cores/threads, ${totalMemoryGb.toFixed(1)} GB RAM) supports at most ${recommendedMax} concurrent rites; ${requested} would likely freeze the machine.`;
    return {
      valid: false,
      clampedValue: recommendedMax,
      errorMessage,
    };
  }

  return {
    valid: true,
    clampedValue: requested,
  };
}

/**
 * Runtime clamping for config values loaded from disk or env vars
 */
export function clampConcurrencyAmount(
  requested: number,
  recommendation: ConcurrencyRecommendation
): { effectiveAmount: number; wasClamped: boolean; warning?: string } {
  const { recommendedMax, specs } = recommendation;
  if (requested > recommendedMax) {
    const totalMemoryGb = specs.totalMemoryBytes / (1024 * 1024 * 1024);
    const warning = `[haunt] Configured concurrency amount (${requested}) exceeds machine recommended limit (${recommendedMax}) for ${specs.cpuModel} (${totalMemoryGb.toFixed(1)} GB RAM). Clamping to ${recommendedMax}.`;
    return {
      effectiveAmount: recommendedMax,
      wasClamped: true,
      warning,
    };
  }

  return {
    effectiveAmount: Math.max(1, requested),
    wasClamped: false,
  };
}
