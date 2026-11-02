/**
 * visual-diff.ts — Ectoplasm diff engine
 *
 * Compares two PNG screenshots using pixelmatch and clusters changed pixels
 * into bounding-box regions (the "ectoplasm overlay").
 *
 * changedRatio is a pure fact about pixels — it is NOT a finding by itself.
 * Callers must attach a mechanism (overflow, failed request, etc.) before
 * raising a Finding.
 */

import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DiffResult {
  /** Fraction of pixels that changed, 0..1 */
  changedRatio: number;
  /** Absolute path where the ectoplasm PNG was written */
  ectoplasmPath: string;
  /** Up to 20 change regions, sorted by area descending */
  changeRegions: Rect[];
  /** Masked regions that were blanked before diffing */
  maskedRegions: Rect[];
}

/** Maximum PNG height (px) before cropping */
const MAX_HEIGHT = 12_000;

/**
 * Compute a pixel diff between two PNGs and write an ectoplasm overlay.
 *
 * @param baselinePath   - Path to the baseline (living page) PNG
 * @param apparitionPath - Path to the apparition (condition run) PNG
 * @param outputPath     - Path where the ectoplasm diff PNG will be written
 * @param maskedRegions  - Optional areas to blank in both images before diffing
 */
export async function computeDiff(
  baselinePath: string,
  apparitionPath: string,
  outputPath: string,
  maskedRegions: Rect[] = []
): Promise<DiffResult> {
  // Read both PNGs synchronously
  const baselineBuffer = fs.readFileSync(baselinePath);
  const apparitionBuffer = fs.readFileSync(apparitionPath);

  const baselinePng = PNG.sync.read(baselineBuffer);
  const apparitionPng = PNG.sync.read(apparitionBuffer);

  // Normalise to the same canvas size (union of both dims), then cap height
  const rawWidth = Math.max(baselinePng.width, apparitionPng.width);
  const rawHeight = Math.min(Math.max(baselinePng.height, apparitionPng.height), MAX_HEIGHT);

  // Create canvases of the normalised size (zero-initialised = transparent/black)
  const canvasA = new PNG({ width: rawWidth, height: rawHeight });
  const canvasB = new PNG({ width: rawWidth, height: rawHeight });

  // Blit source images into canvases (cropping to MAX_HEIGHT implicitly)
  const blitHeight = (src: PNG) => Math.min(src.height, rawHeight);
  PNG.bitblt(baselinePng, canvasA, 0, 0, baselinePng.width, blitHeight(baselinePng), 0, 0);
  PNG.bitblt(apparitionPng, canvasB, 0, 0, apparitionPng.width, blitHeight(apparitionPng), 0, 0);

  // Apply masked regions: set identical pixels in both canvases so they never diff
  for (const region of maskedRegions) {
    applyMask(canvasA, region);
    applyMask(canvasB, region);
  }

  const diffPng = new PNG({ width: rawWidth, height: rawHeight });

  const changedPixels = pixelmatch(canvasA.data, canvasB.data, diffPng.data, rawWidth, rawHeight, {
    threshold: 0.1,
    includeAA: false,
  });

  const totalPixels = rawWidth * rawHeight;
  const changedRatio = totalPixels > 0 ? changedPixels / totalPixels : 0;

  // Write ectoplasm PNG, creating parent directory as needed
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });
  const diffBuffer = PNG.sync.write(diffPng);
  fs.writeFileSync(outputPath, diffBuffer);

  // Build a boolean mask of which pixels actually changed.
  // We compare the two source canvases directly rather than interpreting
  // pixelmatch's coloured output (which tints even unchanged pixels gray).
  const changedMask = buildChangedMask(canvasA, canvasB, rawWidth, rawHeight, 0.1);

  // Cluster changed pixels into bounding-box regions via BFS flood fill
  const changeRegions = clusterChangedRegions(changedMask, rawWidth, rawHeight);

  return {
    changedRatio,
    ectoplasmPath: outputPath,
    changeRegions,
    maskedRegions,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Zero out a rectangular region in a PNG (RGBA → 0,0,0,0) so it produces
 * no diff signal against the other canvas which receives the same treatment.
 */
function applyMask(png: PNG, region: Rect): void {
  const x2 = Math.min(region.x + region.width, png.width);
  const y2 = Math.min(region.y + region.height, png.height);

  for (let y = Math.max(0, region.y); y < y2; y++) {
    for (let x = Math.max(0, region.x); x < x2; x++) {
      const idx = (y * png.width + x) * 4;
      png.data[idx] = 0;
      png.data[idx + 1] = 0;
      png.data[idx + 2] = 0;
      png.data[idx + 3] = 0;
    }
  }
}

/**
 * Build a boolean mask (Uint8Array, 1 = changed) by directly comparing the
 * two source canvases.  This avoids interpreting pixelmatch's coloured diff
 * output, which tints even unchanged pixels with a faint gray so they are
 * visible against a white background — those tinted pixels are NOT real diffs.
 *
 * A pixel is considered changed when the per-channel delta for any channel
 * exceeds the pixelmatch threshold (0..255 scale) or alpha differs.
 */
function buildChangedMask(
  canvasA: PNG,
  canvasB: PNG,
  width: number,
  height: number,
  threshold: number // 0..1 as used by pixelmatch
): Uint8Array {
  const mask = new Uint8Array(width * height);
  const thresholdByte = threshold * 255;

  for (let i = 0; i < width * height; i++) {
    const p = i * 4;
    const dr = Math.abs(canvasA.data[p] - canvasB.data[p]);
    const dg = Math.abs(canvasA.data[p + 1] - canvasB.data[p + 1]);
    const db = Math.abs(canvasA.data[p + 2] - canvasB.data[p + 2]);
    const da = Math.abs(canvasA.data[p + 3] - canvasB.data[p + 3]);
    if (dr > thresholdByte || dg > thresholdByte || db > thresholdByte || da > thresholdByte) {
      mask[i] = 1;
    }
  }
  return mask;
}

/**
 * Cluster changed pixels (mask[i] === 1) into bounding-box regions via BFS
 * flood fill.  Returns up to 20 regions, sorted by area descending.
 */
function clusterChangedRegions(changedMask: Uint8Array, width: number, height: number): Rect[] {
  const visited = new Uint8Array(width * height);
  const regions: Rect[] = [];

  for (let startY = 0; startY < height; startY++) {
    for (let startX = 0; startX < width; startX++) {
      const idx = startY * width + startX;
      if (visited[idx] || !changedMask[idx]) {
        visited[idx] = 1;
        continue;
      }

      // BFS over the connected component
      const queue: number[] = [idx];
      visited[idx] = 1;

      let minX = startX;
      let maxX = startX;
      let minY = startY;
      let maxY = startY;

      let head = 0;
      while (head < queue.length) {
        const cur = queue[head++];
        const cy = Math.floor(cur / width);
        const cx = cur % width;

        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;

        // 4-connected neighbours
        const neighbours = [
          cy > 0 ? cur - width : -1,
          cy < height - 1 ? cur + width : -1,
          cx > 0 ? cur - 1 : -1,
          cx < width - 1 ? cur + 1 : -1,
        ];

        for (const nb of neighbours) {
          if (nb < 0 || visited[nb]) continue;
          if (changedMask[nb]) {
            visited[nb] = 1;
            queue.push(nb);
          }
        }
      }

      regions.push({
        x: minX,
        y: minY,
        width: maxX - minX + 1,
        height: maxY - minY + 1,
      });
    }
  }

  // Sort by area descending, keep at most 20
  regions.sort((a, b) => b.width * b.height - a.width * a.height);
  return regions.slice(0, 20);
}
