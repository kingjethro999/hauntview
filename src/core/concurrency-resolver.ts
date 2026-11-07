/**
 * src/core/concurrency-resolver.ts
 *
 * Implements Phase 1 concurrency resolution, hosted-environment guards,
 * and deterministic bounded-concurrency execution pool.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { ConcurrencyOptions } from '../types/contracts';

export interface ResolvedConcurrency {
  concurrency: boolean;
  concurrencyAmount: number;
  isHosted: boolean;
  downgradedDueToHosted: boolean;
}

/**
 * Detects whether the current process is running in a constrained hosted environment
 * (Render.com or any service with HAUNT_HOSTED=1).
 */
export function isHostedEnvironment(): boolean {
  return (
    process.env.RENDER === 'true' ||
    process.env.HAUNT_HOSTED === '1' ||
    process.env.HAUNT_HOSTED === 'true'
  );
}

/**
 * Checks whether an operator has explicitly authorized concurrency in a hosted environment.
 */
export function isConcurrencyAllowedInHosted(): boolean {
  return (
    process.env.HAUNT_ALLOW_CONCURRENCY === '1' || process.env.HAUNT_ALLOW_CONCURRENCY === 'true'
  );
}

/**
 * Attempts to load stored user config from ~/.hauntview/config.json
 */
export function loadUserConfig(): Partial<ConcurrencyOptions> | null {
  try {
    const configPath = path.join(os.homedir(), '.hauntview', 'config.json');
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore invalid/unreadable config files
  }
  return null;
}

/**
 * Resolves concurrency options according to the strict 4-level precedence:
 * 1. Explicit per-call options
 * 2. Environment variables: HAUNT_CONCURRENCY and HAUNT_CONCURRENCY_AMOUNT
 * 3. User configuration file (~/.hauntview/config.json)
 * 4. Built-in defaults: concurrency=false, concurrencyAmount=2
 *
 * Hosted Guard: If running in a hosted environment without explicit override,
 * concurrency is forced to false.
 */
export function resolveConcurrency(
  options?: Partial<ConcurrencyOptions>,
  configOverride?: Partial<ConcurrencyOptions>
): ResolvedConcurrency {
  const isHosted = isHostedEnvironment();
  const allowHosted = isConcurrencyAllowedInHosted();
  const userConfig = configOverride ?? loadUserConfig() ?? {};

  // 1. Resolve raw concurrency boolean
  let rawConcurrency: boolean;
  if (options?.concurrency !== undefined) {
    rawConcurrency = Boolean(options.concurrency);
  } else if (process.env.HAUNT_CONCURRENCY !== undefined) {
    rawConcurrency =
      process.env.HAUNT_CONCURRENCY === 'true' || process.env.HAUNT_CONCURRENCY === '1';
  } else if (userConfig.concurrency !== undefined) {
    rawConcurrency = Boolean(userConfig.concurrency);
  } else {
    rawConcurrency = false;
  }

  // 2. Resolve raw concurrency amount (int >= 1, default 2)
  let rawAmount: number;
  if (options?.concurrencyAmount !== undefined) {
    rawAmount = Math.max(1, Math.floor(Number(options.concurrencyAmount)));
  } else if (process.env.HAUNT_CONCURRENCY_AMOUNT !== undefined) {
    const parsed = parseInt(process.env.HAUNT_CONCURRENCY_AMOUNT, 10);
    rawAmount = Number.isNaN(parsed) || parsed < 1 ? 2 : parsed;
  } else if (userConfig.concurrencyAmount !== undefined) {
    rawAmount = Math.max(1, Math.floor(Number(userConfig.concurrencyAmount)));
  } else {
    rawAmount = 2;
  }

  // 3. Apply Hosted Guard
  let effectiveConcurrency = rawConcurrency;
  let downgradedDueToHosted = false;

  if (isHosted && !allowHosted && rawConcurrency) {
    effectiveConcurrency = false;
    downgradedDueToHosted = true;
  }

  return {
    concurrency: effectiveConcurrency,
    concurrencyAmount: rawAmount,
    isHosted,
    downgradedDueToHosted,
  };
}

/**
 * Executes a list of async task factories with a bounded concurrency pool.
 * Guarantees:
 * - Active concurrency never exceeds `concurrencyLimit`.
 * - Result ordering strictly matches the input task order.
 * - Failure isolation: exceptions handled via `onFailure` without aborting other tasks.
 */
export async function executeWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrencyLimit: number,
  options?: { onFailure?: (index: number, error: unknown) => T }
): Promise<T[]> {
  const limit = Math.max(1, concurrencyLimit);
  const results: T[] = new Array(tasks.length);
  let nextTaskIndex = 0;

  async function worker() {
    while (nextTaskIndex < tasks.length) {
      const currentIndex = nextTaskIndex++;
      try {
        results[currentIndex] = await tasks[currentIndex]();
      } catch (err) {
        if (options?.onFailure) {
          results[currentIndex] = options.onFailure(currentIndex, err);
        } else {
          throw err;
        }
      }
    }
  }

  const workerCount = Math.min(limit, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());

  await Promise.all(workers);
  return results;
}
