/**
 * BrowserPool - Manages Playwright browser instances and page lifecycle
 * Handles browser instance pooling, page reuse, and resource cleanup
 */

import { Browser, BrowserContext, Page } from 'playwright';
import { BrowserPoolConfig, ProfileContext } from '../types';

interface PooledBrowser {
  browser: Browser;
  pages: Page[];
  activePages: Set<Page>;
  lastUsed: number;
}

interface PooledPage {
  page: Page;
  context: BrowserContext;
  profileContext?: ProfileContext;
  inUse: boolean;
  lastUsed?: number;
}

export class BrowserPool {
  private browsers: Map<string, PooledBrowser> = new Map();
  private pagePool: PooledPage[] = [];
  private config: BrowserPoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: BrowserPoolConfig) {
    this.config = {
      maxBrowsers: config.maxBrowsers ?? 3,
      maxPagesPerBrowser: config.maxPagesPerBrowser ?? 5,
      idleTimeout: config.idleTimeout ?? 30000,
      launchOptions: config.launchOptions,
    };

    // Start cleanup interval
    this.startCleanupInterval();
  }

  /**
   * Acquire a page from the pool or create a new one
   */
  async acquirePage(
    browserKey: string,
    profileContext: ProfileContext,
    playwrightBrowser: Browser
  ): Promise<Page> {
    // Try to find an available page in the pool
    const availablePage = this.pagePool.find(
      (p) => !p.inUse && p.profileContext?.profileId === profileContext.profileId
    );

    if (availablePage) {
      availablePage.inUse = true;
      availablePage.profileContext = profileContext;
      return availablePage.page;
    }

    // Create new page if under limit
    const pooledBrowser = this.browsers.get(browserKey);
    if (pooledBrowser && pooledBrowser.pages.length < this.config.maxPagesPerBrowser) {
      const context = await playwrightBrowser.newContext({
        viewport: {
          width: profileContext.viewport.width,
          height: profileContext.viewport.height,
        },
        isMobile: profileContext.viewport.isMobile,
        hasTouch: profileContext.viewport.hasTouch,
        userAgent: profileContext.userAgent,
        locale: profileContext.locale,
        timezoneId: profileContext.timezone,
      });

      const page = await context.newPage();
      const pooledPage: PooledPage = {
        page,
        context,
        profileContext,
        inUse: true,
      };

      pooledBrowser.pages.push(page);
      pooledBrowser.activePages.add(page);
      this.pagePool.push(pooledPage);

      // Listen for page close to clean up
      page.on('close', () => {
        pooledBrowser.activePages.delete(page);
      });

      return page;
    }

    throw new Error(
      `Browser pool exhausted: ${this.config.maxPagesPerBrowser} pages per browser reached`
    );
  }

  /**
   * Release a page back to the pool
   */
  releasePage(page: Page): void {
    const pooledPage = this.pagePool.find((p) => p.page === page);
    if (pooledPage) {
      pooledPage.inUse = false;
      pooledPage.lastUsed = Date.now();
    }
  }

  /**
   * Register a browser instance
   */
  registerBrowser(key: string, browser: Browser): void {
    if (this.browsers.size >= this.config.maxBrowsers) {
      throw new Error(`Browser pool full: max ${this.config.maxBrowsers} browsers reached`);
    }

    this.browsers.set(key, {
      browser,
      pages: [],
      activePages: new Set(),
      lastUsed: Date.now(),
    });
  }

  /**
   * Close all resources in the pool
   */
  async closeAll(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all pages
    for (const pooledPage of this.pagePool) {
      try {
        await pooledPage.context.close();
      } catch {
        // Already closed
      }
    }

    // Close all browsers
    for (const pooledBrowser of this.browsers.values()) {
      try {
        await pooledBrowser.browser.close();
      } catch {
        // Already closed
      }
    }

    this.pagePool = [];
    this.browsers.clear();
  }

  /**
   * Get pool statistics
   */
  getStats(): {
    totalBrowsers: number;
    totalPages: number;
    activePages: number;
    availablePages: number;
  } {
    let totalPages = 0;
    let activePages = 0;

    for (const pooledBrowser of this.browsers.values()) {
      totalPages += pooledBrowser.pages.length;
      activePages += pooledBrowser.activePages.size;
    }

    return {
      totalBrowsers: this.browsers.size,
      totalPages,
      activePages,
      availablePages: totalPages - activePages,
    };
  }

  /**
   * Start periodic cleanup of idle resources
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleResources();
    }, 10000); // Check every 10 seconds

    // Unref to not keep process alive
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up idle pages and browsers
   */
  private async cleanupIdleResources(): Promise<void> {
    const now = Date.now();

    // Remove idle pages
    const idlePages = this.pagePool.filter(
      (p) => !p.inUse && now - (p.lastUsed || now) > this.config.idleTimeout
    );

    for (const pooledPage of idlePages) {
      try {
        await pooledPage.context.close();
        this.pagePool = this.pagePool.filter((p) => p !== pooledPage);
      } catch {
        // Already closed
      }
    }

    // Remove idle browsers
    for (const [key, pooledBrowser] of this.browsers.entries()) {
      const isIdle =
        pooledBrowser.activePages.size === 0 &&
        now - pooledBrowser.lastUsed > this.config.idleTimeout;

      if (isIdle) {
        try {
          await pooledBrowser.browser.close();
          this.browsers.delete(key);

          // Clean up associated pages
          this.pagePool = this.pagePool.filter((p) => !pooledBrowser.pages.includes(p.page));
        } catch {
          // Already closed
        }
      }
    }
  }
}
