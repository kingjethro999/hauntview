/**
 * src/__tests__/platform.test.ts
 *
 * Unit tests for cross-platform support module (Windows and Unix).
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import {
  getPlatformInfo,
  getPlatformConfigDir,
  getPlatformCacheDir,
  getPlaywrightBrowsersDir,
  expandEnvironmentPath,
  probeDirectoryWritability,
  getTerminalCapabilities,
  getAdaptiveGlyphs,
  detectEdgeBrowser,
  getNpxCommand,
  getPlatformTroubleshootingAdvice,
} from '../core/platform';

describe('Cross-Platform Support (Windows and Unix)', () => {
  const originalEnv = { ...process.env };
  let tempDir: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hauntview-platform-test-'));
  });

  afterEach(() => {
    process.env = originalEnv;
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  describe('getPlatformInfo', () => {
    it('returns structured platform classification', () => {
      const info = getPlatformInfo();
      expect(info.platform).toBe(process.platform);
      expect(info.arch).toBe(os.arch());
      expect(typeof info.isWindows).toBe('boolean');
      expect(typeof info.isUnix).toBe('boolean');
      expect(info.isWindows).toBe(process.platform === 'win32');
      expect(info.isUnix).toBe(process.platform !== 'win32');
      expect(typeof info.osName).toBe('string');
    });
  });

  describe('Directory Resolutions', () => {
    it('respects HAUNT_CONFIG_DIR override across all platforms', () => {
      process.env.HAUNT_CONFIG_DIR = path.join(tempDir, 'custom-config');
      expect(getPlatformConfigDir()).toBe(path.resolve(tempDir, 'custom-config'));
    });

    it('respects HAUNT_CACHE_DIR override across all platforms', () => {
      process.env.HAUNT_CACHE_DIR = path.join(tempDir, 'custom-cache');
      expect(getPlatformCacheDir()).toBe(path.resolve(tempDir, 'custom-cache'));
    });

    it('respects PLAYWRIGHT_BROWSERS_PATH override', () => {
      process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(tempDir, 'pw-browsers');
      expect(getPlaywrightBrowsersDir()).toBe(path.resolve(tempDir, 'pw-browsers'));
    });
  });

  describe('expandEnvironmentPath', () => {
    it('expands tilde (~) to home directory', () => {
      const expanded = expandEnvironmentPath('~/reports');
      expect(expanded).toBe(path.join(os.homedir(), 'reports'));
    });

    it('expands lone tilde (~)', () => {
      expect(expandEnvironmentPath('~')).toBe(os.homedir());
      expect(expandEnvironmentPath('~/')).toBe(os.homedir());
      expect(expandEnvironmentPath('~\\')).toBe(os.homedir());
    });

    it('expands Windows-style %VAR% environment variables', () => {
      process.env.TEST_WIN_ROOT = 'C:\\Audits';
      process.env.TEST_WIN_SUB = 'Quarter1';

      const expanded = expandEnvironmentPath('%TEST_WIN_ROOT%\\%TEST_WIN_SUB%\\out');
      expect(expanded).toContain(path.normalize('Audits'));
      expect(expanded).toContain(path.normalize('Quarter1'));
    });

    it('expands Unix-style $VAR environment variables', () => {
      process.env.TEST_UNIX_VAR = '/var/hauntview';
      const expanded = expandEnvironmentPath('$TEST_UNIX_VAR/exports');
      expect(expanded).toContain(path.normalize('hauntview'));
      expect(expanded).toContain(path.normalize('exports'));
    });

    it('normalizes slashes and resolves relative paths', () => {
      const expanded = expandEnvironmentPath('./relative/sub/../dir', tempDir);
      expect(expanded).toBe(path.join(tempDir, 'relative', 'dir'));
    });
  });

  describe('probeDirectoryWritability', () => {
    it('returns writable true for accessible temporary directory', () => {
      const res = probeDirectoryWritability(tempDir);
      expect(res.writable).toBe(true);
      expect(res.error).toBeUndefined();
    });

    it('returns writable false for non-existent directory', () => {
      const nonExistent = path.join(tempDir, 'missing', 'dir');
      const res = probeDirectoryWritability(nonExistent);
      expect(res.writable).toBe(false);
      expect(typeof res.error).toBe('string');
    });
  });

  describe('Terminal Capabilities & Adaptive Glyphs', () => {
    it('returns terminal capability flags', () => {
      const caps = getTerminalCapabilities();
      expect(typeof caps.supportsUnicode).toBe('boolean');
      expect(typeof caps.supportsColor).toBe('boolean');
      expect(typeof caps.shellName).toBe('string');
    });

    it('returns adaptive glyphs with fallbacks', () => {
      const glyphs = getAdaptiveGlyphs();
      expect(glyphs.ghost).toBeDefined();
      expect(glyphs.tick).toBeDefined();
      expect(glyphs.cross).toBeDefined();
      expect(glyphs.wait).toBeDefined();
    });
  });

  describe('detectEdgeBrowser', () => {
    it('detects Edge browser structure without throwing', () => {
      const edge = detectEdgeBrowser();
      expect(typeof edge.installed).toBe('boolean');
      expect(typeof edge.isNativeToPlatform).toBe('boolean');
      if (edge.installed) {
        expect(typeof edge.executablePath).toBe('string');
        expect(fs.existsSync(edge.executablePath!)).toBe(true);
      }
    });
  });

  describe('getNpxCommand', () => {
    it('returns execution options with shell enabled', () => {
      const res = getNpxCommand('playwright --version');
      expect(typeof res.options.shell).toBe('string');
      expect(res.command).toContain('playwright --version');
    });
  });

  describe('getPlatformTroubleshootingAdvice', () => {
    it('returns non-empty array of platform-specific tips', () => {
      const tips = getPlatformTroubleshootingAdvice();
      expect(Array.isArray(tips)).toBe(true);
      expect(tips.length).toBeGreaterThan(0);
    });
  });
});
