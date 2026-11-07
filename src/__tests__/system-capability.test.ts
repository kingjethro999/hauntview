/**
 * src/__tests__/system-capability.test.ts
 *
 * Tests system-aware concurrency heuristics, hardware detection,
 * validation, and runtime clamping.
 */

import {
  evaluateSystemCapability,
  validateConcurrencyAmount,
  clampConcurrencyAmount,
  SystemSpecs,
} from '../core/system-capability';

describe('Phase 3 — System Capability & Concurrency Heuristic', () => {
  describe('Dual-core Core i3 (2 cores / 4 threads, 8 GB RAM)', () => {
    const i3Specs: SystemSpecs = {
      logicalCores: 4,
      cpuModel: 'Intel(R) Core(TM) i3-10100 CPU @ 3.60GHz',
      totalMemoryBytes: 8 * 1024 * 1024 * 1024,
      freeMemoryBytes: 4 * 1024 * 1024 * 1024,
    };

    it('computes recommended max concurrency of 2', () => {
      const rec = evaluateSystemCapability(i3Specs);
      expect(rec.cpuBound).toBe(2);
      expect(rec.ramBound).toBe(4);
      expect(rec.recommendedMax).toBe(2);
      expect(rec.defaultSuggested).toBe(2);
      expect(rec.isConstrained).toBe(false);
    });

    it('refuses requested concurrency of 6 with clear explanation', () => {
      const rec = evaluateSystemCapability(i3Specs);
      const result = validateConcurrencyAmount(6, rec);
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toContain('Intel(R) Core(TM) i3');
      expect(result.errorMessage).toContain(
        'supports at most 2 concurrent rites; 6 would likely freeze'
      );
    });

    it('accepts requested concurrency <= 2', () => {
      const rec = evaluateSystemCapability(i3Specs);
      const result = validateConcurrencyAmount(2, rec);
      expect(result.valid).toBe(true);
      expect(result.clampedValue).toBe(2);
    });

    it('runtime clamps 6 to 2 with warning', () => {
      const rec = evaluateSystemCapability(i3Specs);
      const clamped = clampConcurrencyAmount(6, rec);
      expect(clamped.effectiveAmount).toBe(2);
      expect(clamped.wasClamped).toBe(true);
      expect(clamped.warning).toBeDefined();
    });
  });

  describe('Constrained System (< 4 GB RAM or < 2 cores)', () => {
    const lowEndSpecs: SystemSpecs = {
      logicalCores: 1,
      cpuModel: 'Low-power single core',
      totalMemoryBytes: 2 * 1024 * 1024 * 1024,
      freeMemoryBytes: 512 * 1024 * 1024,
    };

    it('caps max concurrency at 1 and marks system constrained', () => {
      const rec = evaluateSystemCapability(lowEndSpecs);
      expect(rec.recommendedMax).toBe(1);
      expect(rec.defaultSuggested).toBe(1);
      expect(rec.isConstrained).toBe(true);
      expect(rec.constraintReason).toContain('limited hardware resources');
    });

    it('refuses any amount > 1 on constrained system', () => {
      const rec = evaluateSystemCapability(lowEndSpecs);
      const result = validateConcurrencyAmount(2, rec);
      expect(result.valid).toBe(false);
    });
  });

  describe('High-end Workstation (16 cores, 32 GB RAM)', () => {
    const workstationSpecs: SystemSpecs = {
      logicalCores: 16,
      cpuModel: 'AMD Ryzen 9 5950X 16-Core Processor',
      totalMemoryBytes: 32 * 1024 * 1024 * 1024,
      freeMemoryBytes: 20 * 1024 * 1024 * 1024,
    };

    it('calculates higher concurrency allowance with safe default of 2', () => {
      const rec = evaluateSystemCapability(workstationSpecs);
      expect(rec.cpuBound).toBe(8);
      expect(rec.ramBound).toBe(16);
      expect(rec.recommendedMax).toBe(8);
      expect(rec.defaultSuggested).toBe(2);
      expect(rec.isConstrained).toBe(false);
    });

    it('validates 4 concurrent rites successfully', () => {
      const rec = evaluateSystemCapability(workstationSpecs);
      const result = validateConcurrencyAmount(4, rec);
      expect(result.valid).toBe(true);
      expect(result.clampedValue).toBe(4);
    });
  });

  describe('Live Host Detection', () => {
    it('successfully detects live system specs without throwing', () => {
      const liveRec = evaluateSystemCapability();
      expect(liveRec.specs.logicalCores).toBeGreaterThanOrEqual(1);
      expect(liveRec.recommendedMax).toBeGreaterThanOrEqual(1);
      expect(liveRec.defaultSuggested).toBeGreaterThanOrEqual(1);
    });
  });
});
