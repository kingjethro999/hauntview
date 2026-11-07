/**
 * src/__tests__/concurrency.test.ts
 *
 * Verifies Phase 1 concurrency resolution, hosted guards, bounded pool execution,
 * failure isolation, and deterministic ordering.
 */

import {
  resolveConcurrency,
  isHostedEnvironment,
  executeWithConcurrency,
} from '../core/concurrency-resolver';
import { ConcurrencyOptionsSchema } from '../types/contracts';
import { HauntViewEngine } from '../engine';
import { ProfileResult } from '../types';

jest.setTimeout(15000);

interface EnginePrivateMethods {
  executeProfile: (profileId: string, url: string, context: unknown) => Promise<ProfileResult>;
}

describe('Phase 1 — Concurrency Resolution & Hosted Guard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.RENDER;
    delete process.env.HAUNT_HOSTED;
    delete process.env.HAUNT_ALLOW_CONCURRENCY;
    delete process.env.HAUNT_CONCURRENCY;
    delete process.env.HAUNT_CONCURRENCY_AMOUNT;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Zod Contracts', () => {
    it('validates default concurrency options', () => {
      const parsed = ConcurrencyOptionsSchema.parse({});
      expect(parsed).toEqual({
        concurrency: false,
        concurrencyAmount: 2,
      });
    });

    it('accepts valid explicit options', () => {
      const parsed = ConcurrencyOptionsSchema.parse({
        concurrency: true,
        concurrencyAmount: 4,
      });
      expect(parsed).toEqual({
        concurrency: true,
        concurrencyAmount: 4,
      });
    });

    it('rejects concurrencyAmount < 1', () => {
      expect(() => {
        ConcurrencyOptionsSchema.parse({
          concurrencyAmount: 0,
        });
      }).toThrow();
    });
  });

  describe('Precedence & Option Resolution', () => {
    it('returns built-in defaults (false, 2) when nothing is specified', () => {
      const res = resolveConcurrency();
      expect(res.concurrency).toBe(false);
      expect(res.concurrencyAmount).toBe(2);
      expect(res.isHosted).toBe(false);
      expect(res.downgradedDueToHosted).toBe(false);
    });

    it('prefers explicit call options over env variables and defaults', () => {
      process.env.HAUNT_CONCURRENCY = 'false';
      process.env.HAUNT_CONCURRENCY_AMOUNT = '8';

      const res = resolveConcurrency({
        concurrency: true,
        concurrencyAmount: 3,
      });

      expect(res.concurrency).toBe(true);
      expect(res.concurrencyAmount).toBe(3);
    });

    it('resolves environment variables when call options are absent', () => {
      process.env.HAUNT_CONCURRENCY = 'true';
      process.env.HAUNT_CONCURRENCY_AMOUNT = '5';

      const res = resolveConcurrency();
      expect(res.concurrency).toBe(true);
      expect(res.concurrencyAmount).toBe(5);
    });

    it('reads user config file when call options and env vars are absent', () => {
      const mockConfig = { concurrency: true, concurrencyAmount: 4 };
      const res = resolveConcurrency(undefined, mockConfig);
      expect(res.concurrency).toBe(true);
      expect(res.concurrencyAmount).toBe(4);
    });
  });

  describe('Hosted-Environment Guard', () => {
    it('detects RENDER=true as hosted', () => {
      process.env.RENDER = 'true';
      expect(isHostedEnvironment()).toBe(true);
    });

    it('detects HAUNT_HOSTED=1 as hosted', () => {
      process.env.HAUNT_HOSTED = '1';
      expect(isHostedEnvironment()).toBe(true);
    });

    it('forces concurrency=false when hosted, even if explicitly requested', () => {
      process.env.RENDER = 'true';

      const res = resolveConcurrency({
        concurrency: true,
        concurrencyAmount: 4,
      });

      expect(res.isHosted).toBe(true);
      expect(res.concurrency).toBe(false);
      expect(res.downgradedDueToHosted).toBe(true);
    });

    it('allows concurrency in hosted environment if HAUNT_ALLOW_CONCURRENCY=1 is explicitly set', () => {
      process.env.RENDER = 'true';
      process.env.HAUNT_ALLOW_CONCURRENCY = '1';

      const res = resolveConcurrency({
        concurrency: true,
        concurrencyAmount: 3,
      });

      expect(res.isHosted).toBe(true);
      expect(res.concurrency).toBe(true);
      expect(res.concurrencyAmount).toBe(3);
      expect(res.downgradedDueToHosted).toBe(false);
    });
  });

  describe('Bounded Concurrency Execution Pool', () => {
    it('executes tasks with bounded concurrency never exceeding concurrencyAmount', async () => {
      const maxConcurrency = 2;
      let activeCount = 0;
      let peakConcurrency = 0;

      const tasks = [1, 2, 3, 4, 5].map((item) => async () => {
        activeCount++;
        peakConcurrency = Math.max(peakConcurrency, activeCount);
        // Simulate async work
        await new Promise((resolve) => setTimeout(resolve, 30));
        activeCount--;
        return `result-${item}`;
      });

      const results = await executeWithConcurrency(tasks, maxConcurrency);

      expect(peakConcurrency).toBeLessThanOrEqual(maxConcurrency);
      expect(results).toEqual(['result-1', 'result-2', 'result-3', 'result-4', 'result-5']);
    });

    it('maintains strict deterministic ordering even when tasks resolve out-of-order', async () => {
      // Task 1 takes longer than Task 2 and Task 3
      const tasks = [
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return 'profile-1';
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return 'profile-2';
        },
        async () => {
          await new Promise((resolve) => setTimeout(resolve, 20));
          return 'profile-3';
        },
      ];

      const results = await executeWithConcurrency(tasks, 3);
      expect(results).toEqual(['profile-1', 'profile-2', 'profile-3']);
    });

    it('guarantees failure isolation: one failing task does not abort remaining tasks', async () => {
      const tasks = [
        async () => 'success-1',
        async () => {
          throw new Error('Profile failed execution');
        },
        async () => 'success-3',
      ];

      const results = await executeWithConcurrency(tasks, 2, {
        onFailure: (index, error) => `handled-error-${index}: ${(error as Error).message}`,
      });

      expect(results).toEqual([
        'success-1',
        'handled-error-1: Profile failed execution',
        'success-3',
      ]);
    });
  });

  describe('HauntViewEngine Concurrency Integration', () => {
    it('executes profiles with bounded concurrency and preserves deterministic order', async () => {
      const engine = new HauntViewEngine();

      let activeProfiles = 0;
      let peakProfiles = 0;

      // Mock executeProfile
      jest
        .spyOn(engine as unknown as EnginePrivateMethods, 'executeProfile')
        .mockImplementation(async (profileId: string) => {
          activeProfiles++;
          peakProfiles = Math.max(peakProfiles, activeProfiles);

          // Simulate variable duration
          const delay = profileId.includes('desktop') ? 30 : 10;
          await new Promise((resolve) => setTimeout(resolve, delay));

          activeProfiles--;
          return {
            profileId,
            profileName: profileId,
            success: true,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: delay,
            findings: [],
            screenshots: [],
            metadata: {
              browserEngine: 'playwright',
              browserVersion: '1.0',
              nodeVersion: process.version,
            },
          };
        });

      // Run with concurrency enabled
      const report = await engine.executeTests({
        url: 'https://example.com',
        profiles: ['mobile', 'tablet', 'desktop'],
        concurrency: true,
        concurrencyAmount: 2,
      });

      // Bounded concurrency verified
      expect(peakProfiles).toBeLessThanOrEqual(2);

      // Deterministic order matches requested/optimal order
      const executedIds = report.profileResults.map((r) => r.profileId);
      expect(executedIds).toEqual(['mobile', 'tablet', 'desktop']);
    });

    it('isolates failures: crashing profile does not abort the report', async () => {
      const engine = new HauntViewEngine();

      jest
        .spyOn(engine as unknown as EnginePrivateMethods, 'executeProfile')
        .mockImplementation(async (profileId: string) => {
          if (profileId === 'mobile') {
            throw new Error('Playwright session crashed');
          }
          return {
            profileId,
            profileName: profileId,
            success: true,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 10,
            findings: [],
            screenshots: [],
            metadata: {
              browserEngine: 'playwright',
              browserVersion: '1.0',
              nodeVersion: process.version,
            },
          };
        });

      const report = await engine.executeTests({
        url: 'https://example.com',
        profiles: ['mobile', 'tablet', 'desktop'],
        concurrency: true,
        concurrencyAmount: 2,
      });

      expect(report.profileResults.length).toBe(3);
      expect(report.profileResults[0].profileId).toBe('mobile');
      expect(report.profileResults[0].success).toBe(false);
      expect(report.profileResults[0].error?.message).toContain('Playwright session crashed');
      expect(report.profileResults[1].success).toBe(true);
      expect(report.profileResults[2].success).toBe(true);
    });

    it('falls back to sequential when hosted guard is active', async () => {
      process.env.RENDER = 'true';
      const engine = new HauntViewEngine();

      let activeProfiles = 0;
      let peakProfiles = 0;

      jest
        .spyOn(engine as unknown as EnginePrivateMethods, 'executeProfile')
        .mockImplementation(async (profileId: string) => {
          activeProfiles++;
          peakProfiles = Math.max(peakProfiles, activeProfiles);
          await new Promise((resolve) => setTimeout(resolve, 20));
          activeProfiles--;
          return {
            profileId,
            profileName: profileId,
            success: true,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 20,
            findings: [],
            screenshots: [],
            metadata: {
              browserEngine: 'playwright',
              browserVersion: '1.0',
              nodeVersion: process.version,
            },
          };
        });

      const report = await engine.executeTests({
        url: 'https://example.com',
        profiles: ['mobile', 'tablet'],
        concurrency: true,
        concurrencyAmount: 2,
      });

      // Because RENDER=true, it downgraded to sequential: peakProfiles is strictly 1
      expect(peakProfiles).toBe(1);
      expect(report.profileResults.length).toBe(2);
    });
  });
});
