/**
 * ScreenshotManager - Handles screenshot capture, storage, and comparison
 * Manages screenshot metadata, hashing, and deduplication
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { Page } from 'playwright';
import { PNG } from 'pngjs';
import { ScreenshotMetadata, Viewport } from '../types';

interface StoredScreenshot {
  metadata: ScreenshotMetadata;
  buffer: Buffer;
  hash: string;
}

export class ScreenshotManager {
  private screenshotDir: string;
  private screenshots: Map<string, StoredScreenshot> = new Map();
  private hashIndex: Map<string, string[]> = new Map(); // hash -> filenames

  constructor(screenshotDir: string = '.hauntview/screenshots') {
    this.screenshotDir = screenshotDir;
  }

  /**
   * Initialize screenshot directory
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize screenshot directory: ${error}`);
    }
  }

  /**
   * Capture screenshot from page
   */
  async captureScreenshot(
    page: Page,
    profileId: string,
    url: string,
    viewport: Viewport,
    options?: { fullPage?: boolean }
  ): Promise<ScreenshotMetadata> {
    try {
      const buffer = await page.screenshot({
        fullPage: options?.fullPage ?? true,
      });

      const metadata = this.generateMetadata(profileId, url, viewport, buffer);
      await this.storeScreenshot(metadata, buffer);

      return metadata;
    } catch (error) {
      throw new Error(`Failed to capture screenshot: ${error}`);
    }
  }

  /**
   * Store screenshot on disk
   */
  async storeScreenshot(metadata: ScreenshotMetadata, buffer: Buffer): Promise<void> {
    const filePath = path.join(this.screenshotDir, metadata.fileName);

    try {
      // Ensure subdirectory exists
      await fs.mkdir(path.dirname(filePath), { recursive: true });

      // Write screenshot
      await fs.writeFile(filePath, buffer);

      // Store in memory index
      this.screenshots.set(metadata.fileName, {
        metadata,
        buffer,
        hash: metadata.hash,
      });

      // Update hash index for deduplication
      if (!this.hashIndex.has(metadata.hash)) {
        this.hashIndex.set(metadata.hash, []);
      }
      this.hashIndex.get(metadata.hash)!.push(metadata.fileName);
    } catch (error) {
      throw new Error(`Failed to store screenshot: ${error}`);
    }
  }

  /**
   * Retrieve screenshot by filename
   */
  async getScreenshot(fileName: string): Promise<ScreenshotMetadata | null> {
    const stored = this.screenshots.get(fileName);
    if (stored) {
      return stored.metadata;
    }

    // Try to load from disk
    const filePath = path.join(this.screenshotDir, fileName);
    try {
      const buffer = await fs.readFile(filePath);
      const hash = this.hashBuffer(buffer);

      const metadata: ScreenshotMetadata = {
        profileId: fileName.split('/')[0],
        timestamp: parseInt(fileName.match(/\d+/)?.[0] || String(Date.now())),
        url: '',
        viewport: { width: 1280, height: 720, isMobile: false, hasTouch: false },
        fileName,
        hash,
      };

      this.screenshots.set(fileName, {
        metadata,
        buffer,
        hash,
      });

      return metadata;
    } catch {
      return null;
    }
  }

  /**
   * Find duplicate screenshots by hash
   */
  async findDuplicates(fileName: string): Promise<string[]> {
    const screenshot = this.screenshots.get(fileName);
    if (!screenshot) {
      return [];
    }

    const duplicates = this.hashIndex.get(screenshot.hash) || [];
    return duplicates.filter((f) => f !== fileName);
  }

  /**
   * Compare two screenshots using pixelmatch and pngjs
   */
  async compareScreenshots(
    fileName1: string,
    fileName2: string
  ): Promise<{ pixelDifference: number; percentageDifference: number; diffBuffer?: Buffer }> {
    const screenshot1 =
      this.screenshots.get(fileName1) || (await this.loadStoredScreenshot(fileName1));
    const screenshot2 =
      this.screenshots.get(fileName2) || (await this.loadStoredScreenshot(fileName2));

    if (!screenshot1 || !screenshot2) {
      throw new Error('One or both screenshots not found');
    }

    // Simple comparison: if hashes match, identical
    if (screenshot1.hash === screenshot2.hash) {
      return { pixelDifference: 0, percentageDifference: 0 };
    }

    try {
      const img1 = PNG.sync.read(screenshot1.buffer);
      const img2 = PNG.sync.read(screenshot2.buffer);

      const width = Math.max(img1.width, img2.width);
      const height = Math.max(img1.height, img2.height);

      // Normalize dimensions if they differ
      const canvas1 = new PNG({ width, height });
      const canvas2 = new PNG({ width, height });
      PNG.bitblt(img1, canvas1, 0, 0, img1.width, img1.height, 0, 0);
      PNG.bitblt(img2, canvas2, 0, 0, img2.width, img2.height, 0, 0);

      const pixelmatchModule = await import('pixelmatch');
      const pixelmatch = pixelmatchModule.default || pixelmatchModule;

      const diff = new PNG({ width, height });
      const pixelDifference = pixelmatch(canvas1.data, canvas2.data, diff.data, width, height, {
        threshold: 0.1,
      });

      const totalPixels = width * height;
      const percentageDifference = totalPixels > 0 ? pixelDifference / totalPixels : 0;
      const diffBuffer = PNG.sync.write(diff);

      return {
        pixelDifference,
        percentageDifference,
        diffBuffer,
      };
    } catch {
      // Fallback for non-PNG or decoding issue
      return { pixelDifference: -1, percentageDifference: 1 };
    }
  }

  private async loadStoredScreenshot(fileName: string): Promise<StoredScreenshot | null> {
    const filePath = path.join(this.screenshotDir, fileName);
    try {
      const buffer = await fs.readFile(filePath);
      const hash = this.hashBuffer(buffer);
      const metadata: ScreenshotMetadata = {
        profileId: fileName.split('/')[0] || 'default',
        timestamp: Date.now(),
        url: '',
        viewport: { width: 1280, height: 720, isMobile: false, hasTouch: false },
        fileName,
        hash,
      };
      const stored = { metadata, buffer, hash };
      this.screenshots.set(fileName, stored);
      return stored;
    } catch {
      return null;
    }
  }

  /**
   * Clean up screenshots older than specified time
   */
  async cleanup(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    let removedCount = 0;
    const now = Date.now();

    try {
      const files = await fs.readdir(this.screenshotDir, { recursive: true });

      for (const file of files) {
        const filePath = path.join(this.screenshotDir, String(file));
        const stat = await fs.stat(filePath);

        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath);
          this.screenshots.delete(String(file));
          removedCount++;
        }
      }
    } catch (error) {
      throw new Error(`Failed to cleanup screenshots: ${error}`);
    }

    return removedCount;
  }

  /**
   * Get all screenshots for a profile
   */
  async getProfileScreenshots(profileId: string): Promise<ScreenshotMetadata[]> {
    const screenshots: ScreenshotMetadata[] = [];

    for (const stored of this.screenshots.values()) {
      if (stored.metadata.profileId === profileId) {
        screenshots.push(stored.metadata);
      }
    }

    return screenshots.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate metadata for screenshot
   */
  private generateMetadata(
    profileId: string,
    url: string,
    viewport: Viewport,
    buffer: Buffer
  ): ScreenshotMetadata {
    const timestamp = Date.now();
    const hash = this.hashBuffer(buffer);
    const fileName = `${profileId}/${timestamp}-${hash.substring(0, 8)}.png`;

    return {
      profileId,
      timestamp,
      url,
      viewport,
      fileName,
      hash,
    };
  }

  /**
   * Calculate hash of buffer
   */
  private hashBuffer(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Get screenshot statistics
   */
  getStats(): {
    totalScreenshots: number;
    uniqueScreenshots: number;
    totalSize: number;
  } {
    let totalSize = 0;

    for (const stored of this.screenshots.values()) {
      totalSize += stored.buffer.length;
    }

    return {
      totalScreenshots: this.screenshots.size,
      uniqueScreenshots: this.hashIndex.size,
      totalSize,
    };
  }
}
