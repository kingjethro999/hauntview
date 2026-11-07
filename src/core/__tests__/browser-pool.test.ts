import { BrowserPool } from '../browser-pool';
import { Browser, Page } from 'playwright';

function createMockBrowser(connected = true): Browser {
  return {
    isConnected: jest.fn(() => connected),
    close: jest.fn().mockResolvedValue(undefined),
  } as unknown as Browser;
}

function createMockPage(): Page {
  return {
    isClosed: jest.fn(() => false),
    close: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
  } as unknown as Page;
}

describe('BrowserPool', () => {
  let pool: BrowserPool;

  afterEach(async () => {
    if (pool) {
      await pool.closeAll();
    }
  });

  it('allows registering up to 6 browsers with default config without errors', () => {
    pool = new BrowserPool({});
    const browserTypes = ['chromium', 'firefox', 'webkit', 'msedge', 'custom-1', 'custom-2'];

    expect(() => {
      for (const type of browserTypes) {
        pool.registerBrowser(type, createMockBrowser());
      }
    }).not.toThrow();

    const stats = pool.getStats();
    expect(stats.totalBrowsers).toBe(6);
  });

  it('evicts disconnected browsers upon new registration', () => {
    pool = new BrowserPool({ maxBrowsers: 2 });
    const b1 = createMockBrowser(false); // disconnected
    const b2 = createMockBrowser(true);

    pool.registerBrowser('b1', b1);
    pool.registerBrowser('b2', b2);

    const b3 = createMockBrowser(true);
    expect(() => pool.registerBrowser('b3', b3)).not.toThrow();

    const stats = pool.getStats();
    expect(stats.totalBrowsers).toBe(2);
  });

  it('evicts idle browsers with zero active pages when reaching capacity', () => {
    pool = new BrowserPool({ maxBrowsers: 2 });
    const b1 = createMockBrowser(true);
    const b2 = createMockBrowser(true);
    const b3 = createMockBrowser(true);

    pool.registerBrowser('b1', b1);
    pool.registerBrowser('b2', b2);
    pool.registerBrowser('b3', b3);

    expect(b1.close).toHaveBeenCalled();
    const stats = pool.getStats();
    expect(stats.totalBrowsers).toBe(2);
  });

  it('gracefully expands pool capacity when existing browsers have active pages', () => {
    pool = new BrowserPool({ maxBrowsers: 2 });
    const b1 = createMockBrowser(true);
    const b2 = createMockBrowser(true);
    const b3 = createMockBrowser(true);

    pool.registerBrowser('b1', b1);
    pool.registerBrowser('b2', b2);

    // Simulate active pages on b1 and b2
    const p1 = createMockPage();
    const p2 = createMockPage();
    (pool as unknown as { browsers: Map<string, { activePages: Set<Page> }> }).browsers
      .get('b1')!
      .activePages.add(p1);
    (pool as unknown as { browsers: Map<string, { activePages: Set<Page> }> }).browsers
      .get('b2')!
      .activePages.add(p2);

    expect(() => {
      pool.registerBrowser('b3', b3);
    }).not.toThrow();

    // Because b1 and b2 were active, neither was closed, and capacity dynamically expanded
    expect(b1.close).not.toHaveBeenCalled();
    expect(b2.close).not.toHaveBeenCalled();
    expect(pool.getStats().totalBrowsers).toBe(3);
  });
});
