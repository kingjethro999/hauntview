import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  nextVersion,
  syncVersionToCarriers,
  runBump,
  PATCH_ROLLOVER,
  MINOR_ROLLOVER,
} from '../../scripts/bump-version.mjs';
import { checkVersion } from '../../scripts/check-version.mjs';

describe('Version bump logic — Section 0.75.1', () => {
  it('has named rollover constants', () => {
    expect(PATCH_ROLLOVER).toBe(9);
    expect(MINOR_ROLLOVER).toBe(99);
  });

  it('handles standard patch increments', () => {
    expect(nextVersion('0.0.1')).toBe('0.0.2');
    expect(nextVersion('v0.0.1')).toBe('0.0.2');
    expect(nextVersion('0.1.0')).toBe('0.1.1');
    expect(nextVersion('1.0.0')).toBe('1.0.1');
  });

  it('rolls over patch to minor at 9 (PATCH_ROLLOVER = 9)', () => {
    expect(nextVersion('0.0.9')).toBe('0.1.0');
    expect(nextVersion('v0.0.9')).toBe('0.1.0');
    expect(nextVersion('0.1.9')).toBe('0.2.0');
    expect(nextVersion('0.98.9')).toBe('0.99.0');
    expect(nextVersion('1.0.9')).toBe('1.1.0');
  });

  it('rolls over minor to major at 99 with patch at 9 (MINOR_ROLLOVER = 99)', () => {
    expect(nextVersion('0.99.9')).toBe('1.0.0');
    expect(nextVersion('v0.99.9')).toBe('1.0.0');
    expect(nextVersion('1.99.9')).toBe('2.0.0');
  });

  it('handles multi-step boundary sequences', () => {
    // 0.0.8 -> 0.0.9 -> 0.1.0
    const step1 = nextVersion('0.0.8');
    expect(step1).toBe('0.0.9');
    const step2 = nextVersion(step1);
    expect(step2).toBe('0.1.0');

    // 0.99.8 -> 0.99.9 -> 1.0.0
    const mStep1 = nextVersion('0.99.8');
    expect(mStep1).toBe('0.99.9');
    const mStep2 = nextVersion(mStep1);
    expect(mStep2).toBe('1.0.0');
  });

  it('rejects malformed or empty inputs', () => {
    // @ts-expect-error test invalid types
    expect(() => nextVersion(null)).toThrow(/Invalid version input/);
    // @ts-expect-error test invalid types
    expect(() => nextVersion(undefined)).toThrow(/Invalid version input/);
    expect(() => nextVersion('')).toThrow(/Invalid version input/);
    expect(() => nextVersion('1.0')).toThrow(/Invalid version format/);
    expect(() => nextVersion('1.0.0.0')).toThrow(/Invalid version format/);
    expect(() => nextVersion('invalid')).toThrow(/Invalid version format/);
  });
});

describe('Workspace-wide sync and checkVersion — Section 0.75.2 & 0.75.4', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hauntview-version-test-'));
    fs.writeFileSync(path.join(tempDir, 'VERSION'), 'v0.1.0\n');
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({ name: 'hauntview', version: '0.1.0' }, null, 2)
    );
    fs.mkdirSync(path.join(tempDir, 'power'), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, 'power', 'plugin.json'),
      JSON.stringify({ name: 'hauntview', version: '0.1.0' }, null, 2)
    );
    fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, 'src', 'version.ts'), "export const VERSION = '0.1.0';\n");
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('verifies consistent versions in temporary workspace', () => {
    const check = checkVersion(tempDir);
    expect(check.valid).toBe(true);
    expect(check.errors).toHaveLength(0);
  });

  it('detects and reports carrier mismatches in checkVersion', () => {
    // Break power/plugin.json
    fs.writeFileSync(
      path.join(tempDir, 'power', 'plugin.json'),
      JSON.stringify({ name: 'hauntview', version: '0.0.9' }, null, 2)
    );

    const check = checkVersion(tempDir);
    expect(check.valid).toBe(false);
    expect(check.errors.length).toBeGreaterThan(0);
    expect(check.errors[0]).toMatch(/power\/plugin\.json/);
  });

  it('synchronizes bumped version across all carriers correctly', () => {
    const updated = syncVersionToCarriers('0.1.1', tempDir);
    expect(updated).toContain('VERSION');
    expect(updated).toContain('package.json');
    expect(updated).toContain(path.join('power', 'plugin.json'));
    expect(updated).toContain(path.join('src', 'version.ts'));

    const check = checkVersion(tempDir);
    expect(check.valid).toBe(true);
    expect(check.expectedVersion).toBe('v0.1.1');

    const pkg = JSON.parse(fs.readFileSync(path.join(tempDir, 'package.json'), 'utf8'));
    expect(pkg.version).toBe('0.1.1');
    const versionFile = fs.readFileSync(path.join(tempDir, 'VERSION'), 'utf8').trim();
    expect(versionFile).toBe('v0.1.1');
  });

  it('runs end-to-end bump and increments version on disk', () => {
    const res = runBump(tempDir);
    expect(res.previousVersion).toBe('v0.1.0');
    expect(res.nextVersion).toBe('0.1.1');

    const check = checkVersion(tempDir);
    expect(check.valid).toBe(true);
    expect(check.expectedVersion).toBe('v0.1.1');
  });
});
