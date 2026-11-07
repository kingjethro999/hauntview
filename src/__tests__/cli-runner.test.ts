/**
 * src/__tests__/cli-runner.test.ts
 *
 * Tests CLI runner argument parsing, first-run browser detection,
 * doctor output, and binary smoke testing.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import { areAllBrowsersInstalled, getBrowsersStatus } from '../cli/browsers';
import { VERSION } from '../version';

const ROOT = path.resolve(__dirname, '../..');
const CLI_PATH = path.join(ROOT, 'dist', 'cli.js');

describe('Phase 3 — CLI Execution and Smoke Tests', () => {
  describe('First-Run Browser Detection', () => {
    it('checks status of Playwright browsers without throwing', () => {
      const status = getBrowsersStatus();
      expect(status).toHaveLength(3);
      expect(status.map((b) => b.name)).toEqual(['chromium', 'firefox', 'webkit']);
      for (const b of status) {
        expect(typeof b.installed).toBe('boolean');
      }
    });

    it('areAllBrowsersInstalled returns boolean', () => {
      const allInstalled = areAllBrowsersInstalled();
      expect(typeof allInstalled).toBe('boolean');
    });
  });

  describe('Compiled CLI Binary Smoke Tests', () => {
    beforeAll(() => {
      // Ensure CLI is built
      execSync('node scripts/build-cli.mjs', { cwd: ROOT });
      expect(fs.existsSync(CLI_PATH)).toBe(true);
    });

    it('outputs help text with node dist/cli.js --help', () => {
      const output = execSync(`node ${CLI_PATH} --help`, { cwd: ROOT }).toString();
      expect(output).toContain('Usage: haunt [options] [command] [url]');
      expect(output).toContain('HauntView — Local-first website resilience');
      expect(output).toContain('--concurrency');
      expect(output).toContain('setup');
      expect(output).toContain('doctor');
    });

    it('outputs current version matching VERSION file with node dist/cli.js --version', () => {
      const output = execSync(`node ${CLI_PATH} --version`, { cwd: ROOT }).toString().trim();
      expect(output).toBe(VERSION);
    });

    it('runs doctor command cleanly with node dist/cli.js doctor', () => {
      const output = execSync(`node ${CLI_PATH} doctor`, { cwd: ROOT }).toString();
      expect(output).toContain(`HauntView Diagnostics — v${VERSION}`);
      expect(output).toContain('Environment:');
      expect(output).toContain('System Hardware & Concurrency:');
      expect(output).toContain('Playwright Browsers:');
    });

    it('shows saved configuration with node dist/cli.js setup --show', () => {
      const output = execSync(`node ${CLI_PATH} setup --show`, { cwd: ROOT }).toString();
      expect(output).toContain('Current HauntView CLI Configuration:');
      expect(output).toContain('"defaultFormats"');
      expect(output).toContain('"exportDir"');
      expect(output).toContain('"concurrency"');
    });
  });
});
