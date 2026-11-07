/**
 * src/__tests__/cli-config.test.ts
 *
 * Unit tests for CLI config loading, saving, reset,
 * and cross-platform path expansion (~, ., relative, absolute).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  expandAndValidatePath,
  loadCliConfig,
  saveCliConfig,
  resetCliConfig,
  CliConfig,
} from '../cli/config';

describe('Phase 3 — CLI Configuration and Path Utils', () => {
  let tmpDir: string;
  let originalConfigDirEnv: string | undefined;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hauntview-cli-test-'));
    originalConfigDirEnv = process.env.HAUNT_CONFIG_DIR;
    process.env.HAUNT_CONFIG_DIR = tmpDir;
  });

  afterEach(() => {
    process.env.HAUNT_CONFIG_DIR = originalConfigDirEnv;
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  describe('Path Expansion & Validation', () => {
    it('expands "." to current working directory', () => {
      const res = expandAndValidatePath('.');
      expect(res.valid).toBe(true);
      expect(res.resolvedPath).toBe(process.cwd());
    });

    it('expands "~" to user home directory', () => {
      const res = expandAndValidatePath('~');
      expect(res.valid).toBe(true);
      expect(res.resolvedPath).toBe(os.homedir());
    });

    it('expands "~/subfolder" to a child of home directory', () => {
      const res = expandAndValidatePath('~/Downloads', { createIfMissing: false });
      expect(res.resolvedPath).toBe(path.join(os.homedir(), 'Downloads'));
    });

    it('creates missing directories when createIfMissing=true', () => {
      const target = path.join(tmpDir, 'nested', 'exports');
      expect(fs.existsSync(target)).toBe(false);

      const res = expandAndValidatePath(target, { createIfMissing: true });
      expect(res.valid).toBe(true);
      expect(fs.existsSync(target)).toBe(true);
    });

    it('fails validation when non-existent path is checked with createIfMissing=false', () => {
      const target = path.join(tmpDir, 'non-existent-dir');
      const res = expandAndValidatePath(target, { createIfMissing: false });
      expect(res.valid).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('expands Windows %VAR% environment variables', () => {
      process.env.WIN_TEST_DIR = tmpDir;
      const res = expandAndValidatePath('%WIN_TEST_DIR%/win-export', { createIfMissing: true });
      expect(res.valid).toBe(true);
      expect(res.resolvedPath).toBe(path.join(tmpDir, 'win-export'));
    });

    it('expands Unix $VAR environment variables', () => {
      process.env.UNIX_TEST_DIR = tmpDir;
      const res = expandAndValidatePath('$UNIX_TEST_DIR/unix-export', { createIfMissing: true });
      expect(res.valid).toBe(true);
      expect(res.resolvedPath).toBe(path.join(tmpDir, 'unix-export'));
    });
  });

  describe('Config Store CRUD', () => {
    it('returns default config when no file exists', () => {
      const config = loadCliConfig();
      expect(config.defaultFormats).toEqual(['zip', 'html']);
      expect(config.exportDir).toBe('.');
      expect(config.concurrency).toBe(false);
      expect(config.concurrencyAmount).toBe(2);
    });

    it('saves and reloads config correctly', () => {
      const newConfig: CliConfig = {
        defaultFormats: ['html', 'markdown'],
        exportDir: '~/reports',
        concurrency: true,
        concurrencyAmount: 3,
      };

      saveCliConfig(newConfig);
      const reloaded = loadCliConfig();
      expect(reloaded).toEqual(newConfig);
    });

    it('resets config to factory defaults', () => {
      saveCliConfig({
        defaultFormats: ['json'],
        exportDir: '/tmp',
        concurrency: true,
        concurrencyAmount: 4,
      });

      resetCliConfig();
      const reloaded = loadCliConfig();
      expect(reloaded.defaultFormats).toEqual(['zip', 'html']);
      expect(reloaded.exportDir).toBe('.');
      expect(reloaded.concurrency).toBe(false);
    });
  });
});
