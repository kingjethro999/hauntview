/**
 * Unit tests for visual-diff.ts — ectoplasm diff engine
 */

import { describe, it, expect, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PNG } from 'pngjs';
import { computeDiff } from '../visual-diff';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Write a solid-colour 10×10 PNG to a temp file and return the path. */
function writeSolidPng(
  dir: string,
  name: string,
  r: number,
  g: number,
  b: number,
  a = 255
): string {
  const width = 10;
  const height = 10;
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, PNG.sync.write(png));
  return filePath;
}

/** Write a 10×10 PNG where one pixel (0,0) differs from the rest. */
function writeSinglePixelDiffPng(
  dir: string,
  name: string,
  diffR: number,
  diffG: number,
  diffB: number
): string {
  const width = 10;
  const height = 10;
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      // Most pixels are white
      png.data[idx] = 255;
      png.data[idx + 1] = 255;
      png.data[idx + 2] = 255;
      png.data[idx + 3] = 255;
    }
  }
  // Override pixel at (0, 0)
  png.data[0] = diffR;
  png.data[1] = diffG;
  png.data[2] = diffB;
  png.data[3] = 255;
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, PNG.sync.write(png));
  return filePath;
}

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'hauntview-diff-test-'));

afterAll(() => {
  // Clean up temp dir
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('computeDiff', () => {
  it('two identical 10×10 white PNGs → changedRatio === 0, changeRegions.length === 0', async () => {
    const a = writeSolidPng(tmpDir, 'identical-a.png', 255, 255, 255);
    const b = writeSolidPng(tmpDir, 'identical-b.png', 255, 255, 255);
    const out = path.join(tmpDir, 'ecto-identical.png');

    const result = await computeDiff(a, b, out);

    expect(result.changedRatio).toBe(0);
    expect(result.changeRegions.length).toBe(0);
    expect(fs.existsSync(out)).toBe(true);
  });

  it('one differing pixel → changedRatio > 0, changeRegions.length >= 1', async () => {
    const base = writeSolidPng(tmpDir, 'base-white.png', 255, 255, 255);
    // apparition has a single red pixel at (0,0)
    const apparition = writeSinglePixelDiffPng(tmpDir, 'apparition-onepx.png', 200, 0, 0);
    const out = path.join(tmpDir, 'ecto-onepx.png');

    const result = await computeDiff(base, apparition, out);

    expect(result.changedRatio).toBeGreaterThan(0);
    expect(result.changeRegions.length).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(out)).toBe(true);
  });
});
