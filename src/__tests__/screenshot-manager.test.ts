import { ScreenshotManager } from '../core/screenshot-manager';
import { PNG } from 'pngjs';
import * as fs from 'fs/promises';

describe('ScreenshotManager Pixel Diffing', () => {
  const testDir = '.hauntview/test-screenshots';
  let manager: ScreenshotManager;

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
    manager = new ScreenshotManager(testDir);
    await manager.initialize();
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  function createSolidPng(width: number, height: number, r: number, g: number, b: number): Buffer {
    const png = new PNG({ width, height });
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (width * y + x) << 2;
        png.data[idx] = r;
        png.data[idx + 1] = g;
        png.data[idx + 2] = b;
        png.data[idx + 3] = 255;
      }
    }
    return PNG.sync.write(png);
  }

  it('detects identical images with 0 difference', async () => {
    const buf = createSolidPng(10, 10, 255, 0, 0);
    const meta1 = {
      profileId: 'test',
      timestamp: 1,
      url: 'http://test.local',
      viewport: { width: 10, height: 10, isMobile: false, hasTouch: false },
      fileName: 'img1.png',
      hash: 'hash1',
    };
    await manager.storeScreenshot(meta1, buf);

    const result = await manager.compareScreenshots('img1.png', 'img1.png');
    expect(result.pixelDifference).toBe(0);
    expect(result.percentageDifference).toBe(0);
  });

  it('detects pixel differences using pixelmatch', async () => {
    const redBuf = createSolidPng(10, 10, 255, 0, 0);
    const blueBuf = createSolidPng(10, 10, 0, 0, 255);

    const metaRed = {
      profileId: 'test',
      timestamp: 1,
      url: 'http://test.local',
      viewport: { width: 10, height: 10, isMobile: false, hasTouch: false },
      fileName: 'red.png',
      hash: 'hash-red',
    };
    const metaBlue = {
      profileId: 'test',
      timestamp: 2,
      url: 'http://test.local',
      viewport: { width: 10, height: 10, isMobile: false, hasTouch: false },
      fileName: 'blue.png',
      hash: 'hash-blue',
    };

    await manager.storeScreenshot(metaRed, redBuf);
    await manager.storeScreenshot(metaBlue, blueBuf);

    const result = await manager.compareScreenshots('red.png', 'blue.png');
    expect(result.pixelDifference).toBe(100);
    expect(result.percentageDifference).toBe(1);
    expect(result.diffBuffer).toBeDefined();
  });
});
