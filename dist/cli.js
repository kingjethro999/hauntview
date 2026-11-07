#!/usr/bin/env node

// src/cli/index.ts
import { Command } from "commander";

// src/version.ts
var VERSION = "0.0.8";

// src/cli/runner.ts
import * as fs8 from "fs";
import * as path8 from "path";
import { checkbox } from "@inquirer/prompts";

// src/engine.ts
import { chromium, webkit, firefox } from "playwright";

// src/core/browser-launch.ts
async function getChromiumLaunchOptions() {
  const isRender = process.env.RENDER === "true";
  const isCI = process.env.CI === "true";
  if ((isRender || isCI) && process.platform === "linux") {
    const { default: sparticuzChromium } = await import("@sparticuz/chromium");
    sparticuzChromium.setGraphicsMode = false;
    const executablePath = await sparticuzChromium.executablePath();
    const args = [
      ...sparticuzChromium.args,
      "--headless=new",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote"
    ];
    return {
      executablePath,
      args
    };
  }
  return {
    executablePath: void 0,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  };
}

// src/core/profile-manager.ts
var PROFILES = [
  // Device profiles (5)
  {
    id: "mobile-iphone15",
    name: "Mobile - iPhone 15",
    description: "Apple iPhone 15 Pro (390x844)",
    enabled: true,
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    timeout: 3e4,
    retries: 2
  },
  {
    id: "mobile-android",
    name: "Mobile - Android",
    description: "Samsung Galaxy S23 (360x800)",
    enabled: true,
    viewport: { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-S910B) AppleWebKit/537.36",
    timeout: 3e4,
    retries: 2
  },
  {
    id: "tablet-ipad",
    name: "Tablet - iPad Pro",
    description: 'iPad Pro 12.9" (1024x1366)',
    enabled: true,
    viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false, hasTouch: true },
    userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    timeout: 3e4,
    retries: 2
  },
  {
    id: "desktop-1080p",
    name: "Desktop - 1080p",
    description: "Standard desktop (1920x1080)",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0",
    timeout: 3e4,
    retries: 1
  },
  {
    id: "desktop-4k",
    name: "Desktop - 4K",
    description: "High-resolution desktop (3840x2160)",
    enabled: true,
    viewport: { width: 3840, height: 2160, isMobile: false, hasTouch: false },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0",
    timeout: 3e4,
    retries: 1
  },
  // Accessibility profiles (4)
  {
    id: "a11y-screenreader",
    name: "Accessibility - Screen Reader",
    description: "Screen reader compatibility check",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: "en-US",
    timeout: 3e4,
    retries: 2
  },
  {
    id: "a11y-keyboard",
    name: "Accessibility - Keyboard Navigation",
    description: "Keyboard-only navigation support",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 2
  },
  {
    id: "a11y-visual",
    name: "Accessibility - Visual Impairment",
    description: "Visual impairment simulation (high contrast)",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 2
  },
  {
    id: "a11y-cognitive",
    name: "Accessibility - Cognitive Load",
    description: "Cognitive accessibility check",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 2
  },
  // Localization profiles (3)
  {
    id: "i18n-rtl",
    name: "Internationalization - RTL",
    description: "Right-to-left language support (Arabic)",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: "ar-SA",
    timezone: "Asia/Riyadh",
    timeout: 3e4,
    retries: 2
  },
  {
    id: "i18n-cjk",
    name: "Internationalization - CJK",
    description: "CJK language support (Japanese)",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: "ja-JP",
    timezone: "Asia/Tokyo",
    timeout: 3e4,
    retries: 2
  },
  {
    id: "i18n-mixed",
    name: "Internationalization - Mixed Scripts",
    description: "Mixed script support (Devanagari)",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: "hi-IN",
    timezone: "Asia/Kolkata",
    timeout: 3e4,
    retries: 2
  },
  // Browser/Engine profiles (4)
  {
    id: "browser-webkit",
    name: "Browser - WebKit",
    description: "WebKit engine compatibility",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15",
    timeout: 3e4,
    retries: 1
  },
  {
    id: "browser-firefox",
    name: "Browser - Firefox",
    description: "Firefox engine compatibility",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: "Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0",
    timeout: 3e4,
    retries: 1
  },
  {
    id: "browser-edge",
    name: "Browser - Edge",
    description: "Microsoft Edge (Chromium) compatibility",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    timeout: 3e4,
    retries: 1
  },
  {
    id: "browser-legacy",
    name: "Browser - Legacy",
    description: "Legacy browser support detection",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: "Mozilla/5.0 (Windows NT 6.3; rv:11.0) like Gecko",
    timeout: 3e4,
    retries: 1
  },
  // Performance profile
  {
    id: "performance",
    name: "Performance",
    description: "Core Web Vitals and performance metrics",
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  },
  // Canonical rite profiles — desktop viewport (1280×800 per AGENTS.md §4.5)
  {
    id: "image-failure",
    name: "Image Failure",
    description: "Blocks all images; checks missing alt attributes and missing width/height",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  },
  {
    id: "font-failure",
    name: "Font Failure",
    description: "Blocks web fonts; detects layout shift caused by fallback font substitution",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  },
  {
    id: "js-disabled",
    name: "JS Disabled",
    description: "Disables JavaScript; checks for meaningful content and <noscript> fallbacks",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  },
  {
    id: "reduced-motion",
    name: "Reduced Motion",
    description: "Sets prefers-reduced-motion: reduce; detects animations still running",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  },
  {
    id: "offline",
    name: "Offline",
    description: "Goes offline after first load; checks for service worker and offline fallback",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 45e3,
    retries: 1
  },
  {
    id: "broken-links",
    name: "Broken Links",
    description: "Probes same-origin anchor hrefs (cap 100); flags 404/410/5xx links",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 6e4,
    retries: 1
  },
  {
    id: "network-resilience",
    name: "Network Resilience",
    description: "Aborts all XHR/fetch requests; checks page degrades gracefully",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 45e3,
    retries: 1
  },
  {
    id: "security-hygiene",
    name: "Security Hygiene",
    description: "Passively inspects response headers for CSP, HSTS, X-Frame-Options, etc.",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  },
  {
    id: "form-resilience",
    name: "Form Resilience",
    description: "Submits empty forms; checks whether validation feedback is shown",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 45e3,
    retries: 1
  },
  // Canonical viewport aliases (same class, canonical IDs)
  {
    id: "mobile",
    name: "Mobile",
    description: "Canonical mobile viewport (390\xD7844)",
    enabled: true,
    viewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
    timeout: 3e4,
    retries: 2
  },
  {
    id: "tablet",
    name: "Tablet",
    description: "Canonical tablet viewport (820\xD71180)",
    enabled: true,
    viewport: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: false, hasTouch: true },
    timeout: 3e4,
    retries: 2
  },
  {
    id: "desktop",
    name: "Desktop",
    description: "Canonical desktop viewport (1280\xD7800)",
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 3e4,
    retries: 1
  }
];
var ProfileManager = class {
  // profileId -> durations
  constructor(customProfiles) {
    this.profiles = /* @__PURE__ */ new Map();
    this.executionHistory = /* @__PURE__ */ new Map();
    for (const profile of PROFILES) {
      this.profiles.set(profile.id, profile);
    }
    if (customProfiles) {
      for (const profile of customProfiles) {
        this.profiles.set(profile.id, profile);
      }
    }
  }
  /**
   * Get all profiles
   */
  getAllProfiles() {
    return Array.from(this.profiles.values());
  }
  /**
   * Get enabled profiles
   */
  getEnabledProfiles() {
    return this.getAllProfiles().filter((p) => p.enabled);
  }
  /**
   * Get profile by ID
   */
  getProfile(id) {
    return this.profiles.get(id);
  }
  /**
   * Get profiles by category (device, accessibility, etc.)
   */
  getProfilesByCategory(category) {
    return this.getAllProfiles().filter((p) => p.id.startsWith(category));
  }
  /**
   * Create execution context from profile
   */
  createExecutionContext(profileId) {
    const profile = this.getProfile(profileId);
    if (!profile) {
      return null;
    }
    return {
      profileId: profile.id,
      profileName: profile.name,
      viewport: profile.viewport,
      userAgent: profile.userAgent,
      locale: profile.locale,
      timezone: profile.timezone,
      strictMode: profile.strictMode ?? false
    };
  }
  /**
   * Enable profile
   */
  enableProfile(id) {
    const profile = this.profiles.get(id);
    if (!profile) {
      return false;
    }
    profile.enabled = true;
    return true;
  }
  /**
   * Disable profile
   */
  disableProfile(id) {
    const profile = this.profiles.get(id);
    if (!profile) {
      return false;
    }
    profile.enabled = false;
    return true;
  }
  /**
   * Record profile execution
   */
  recordExecution(profileId, duration) {
    if (!this.executionHistory.has(profileId)) {
      this.executionHistory.set(profileId, []);
    }
    this.executionHistory.get(profileId).push(duration);
  }
  /**
   * Get profile execution statistics
   */
  getExecutionStats(profileId) {
    const durations = this.executionHistory.get(profileId);
    if (!durations || durations.length === 0) {
      return null;
    }
    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / durations.length;
    return {
      executions: durations.length,
      averageDuration: average,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    };
  }
  /**
   * Get optimal profile execution order for parallelization
   */
  getOptimalExecutionOrder() {
    const enabled = this.getEnabledProfiles();
    return enabled.sort((a, b) => {
      const statsA = this.getExecutionStats(a.id);
      const statsB = this.getExecutionStats(b.id);
      const durationA = statsA?.averageDuration ?? (a.timeout || 3e4);
      const durationB = statsB?.averageDuration ?? (b.timeout || 3e4);
      return durationB - durationA;
    });
  }
  /**
   * Validate profile configuration
   */
  validateProfileConfig(profile) {
    const errors = [];
    if (!profile.id) errors.push("Profile ID is required");
    if (!profile.name) errors.push("Profile name is required");
    if (!profile.viewport) errors.push("Viewport configuration is required");
    if (profile.viewport && profile.viewport.width < 320)
      errors.push("Viewport width must be at least 320px");
    if (profile.viewport && profile.viewport.height < 240)
      errors.push("Viewport height must be at least 240px");
    return {
      valid: errors.length === 0,
      errors
    };
  }
  /**
   * Add custom profile
   */
  addProfile(profile) {
    const validation = this.validateProfileConfig(profile);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(", ") };
    }
    this.profiles.set(profile.id, profile);
    return { success: true };
  }
  /**
   * Get profile count
   */
  getProfileCount() {
    const total = this.profiles.size;
    const enabled = this.getEnabledProfiles().length;
    return {
      total,
      enabled,
      disabled: total - enabled
    };
  }
};

// src/core/browser-pool.ts
var BrowserPool = class {
  constructor(config) {
    this.browsers = /* @__PURE__ */ new Map();
    this.pagePool = [];
    this.cleanupInterval = null;
    this.config = {
      maxBrowsers: config.maxBrowsers ?? 3,
      maxPagesPerBrowser: config.maxPagesPerBrowser ?? 5,
      idleTimeout: config.idleTimeout ?? 3e4,
      launchOptions: config.launchOptions
    };
    this.startCleanupInterval();
  }
  /**
   * Acquire a page from the pool or create a new one
   */
  async acquirePage(browserKey, profileContext, playwrightBrowser) {
    let pooledBrowser = this.browsers.get(browserKey);
    if (!pooledBrowser) {
      this.registerBrowser(browserKey, playwrightBrowser);
      pooledBrowser = this.browsers.get(browserKey);
    }
    pooledBrowser.pages = pooledBrowser.pages.filter((p) => !p.isClosed());
    for (const p of pooledBrowser.activePages) {
      if (p.isClosed()) {
        pooledBrowser.activePages.delete(p);
      }
    }
    if (pooledBrowser.pages.length >= this.config.maxPagesPerBrowser) {
      const idlePages = this.pagePool.filter((p) => !p.inUse);
      for (const idle of idlePages) {
        try {
          if (!idle.page.isClosed()) {
            await idle.page.close();
          }
          await idle.context.close();
        } catch {
        }
        this.pagePool = this.pagePool.filter((p) => p !== idle);
        pooledBrowser.pages = pooledBrowser.pages.filter((p) => p !== idle.page);
        pooledBrowser.activePages.delete(idle.page);
      }
    }
    const context = await playwrightBrowser.newContext({
      viewport: {
        width: profileContext.viewport.width,
        height: profileContext.viewport.height
      },
      isMobile: profileContext.viewport.isMobile,
      hasTouch: profileContext.viewport.hasTouch,
      userAgent: profileContext.userAgent,
      locale: profileContext.locale,
      timezoneId: profileContext.timezone
    });
    const page = await context.newPage();
    const pooledPage = {
      page,
      context,
      profileContext,
      inUse: true,
      lastUsed: Date.now()
    };
    pooledBrowser.pages.push(page);
    pooledBrowser.activePages.add(page);
    this.pagePool.push(pooledPage);
    page.on("close", () => {
      pooledBrowser?.activePages.delete(page);
    });
    return page;
  }
  /**
   * Release a page back to the pool
   */
  releasePage(page) {
    const pooledPageIndex = this.pagePool.findIndex((p) => p.page === page);
    if (pooledPageIndex !== -1) {
      const [pooledPage] = this.pagePool.splice(pooledPageIndex, 1);
      pooledPage.inUse = false;
      Promise.all([
        !page.isClosed() ? page.close().catch(() => {
        }) : Promise.resolve(),
        pooledPage.context.close().catch(() => {
        })
      ]).finally(() => {
        for (const pooledBrowser of this.browsers.values()) {
          pooledBrowser.pages = pooledBrowser.pages.filter((p) => p !== page);
          pooledBrowser.activePages.delete(page);
        }
      });
    }
  }
  /**
   * Register a browser instance
   */
  registerBrowser(key, browser) {
    if (this.browsers.has(key)) {
      const existing = this.browsers.get(key);
      existing.browser = browser;
      existing.lastUsed = Date.now();
      return;
    }
    if (this.browsers.size >= this.config.maxBrowsers) {
      throw new Error(`Browser pool full: max ${this.config.maxBrowsers} browsers reached`);
    }
    this.browsers.set(key, {
      browser,
      pages: [],
      activePages: /* @__PURE__ */ new Set(),
      lastUsed: Date.now()
    });
  }
  /**
   * Close all resources in the pool
   */
  async closeAll() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    for (const pooledPage of this.pagePool) {
      try {
        await pooledPage.context.close();
      } catch {
      }
    }
    for (const pooledBrowser of this.browsers.values()) {
      try {
        await pooledBrowser.browser.close();
      } catch {
      }
    }
    this.pagePool = [];
    this.browsers.clear();
  }
  /**
   * Get pool statistics
   */
  getStats() {
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
      availablePages: totalPages - activePages
    };
  }
  /**
   * Start periodic cleanup of idle resources
   */
  startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleResources();
    }, 1e4);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }
  /**
   * Clean up idle pages and browsers
   */
  async cleanupIdleResources() {
    const now = Date.now();
    const idlePages = this.pagePool.filter(
      (p) => !p.inUse && now - (p.lastUsed || now) > this.config.idleTimeout
    );
    for (const pooledPage of idlePages) {
      try {
        await pooledPage.context.close();
        this.pagePool = this.pagePool.filter((p) => p !== pooledPage);
      } catch {
      }
    }
    for (const [key, pooledBrowser] of this.browsers.entries()) {
      const isIdle = pooledBrowser.activePages.size === 0 && now - pooledBrowser.lastUsed > this.config.idleTimeout;
      if (isIdle) {
        try {
          await pooledBrowser.browser.close();
          this.browsers.delete(key);
          this.pagePool = this.pagePool.filter((p) => !pooledBrowser.pages.includes(p.page));
        } catch {
        }
      }
    }
  }
};

// src/core/finding-classifier.ts
import * as crypto from "crypto";
var FindingClassifier = class {
  // 1 hour
  constructor() {
    this.rules = [];
    this.cache = /* @__PURE__ */ new Map();
    this.seenFindings = /* @__PURE__ */ new Map();
    // hash -> canonical finding
    this.cacheTTL = 60 * 60 * 1e3;
    this.initializeClassificationRules();
  }
  /**
   * Classify a finding
   */
  async classify(finding) {
    const cacheKey = this.generateFindingHash(finding);
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      return {
        originalFinding: finding,
        canonical: cached.finding,
        classifier: "cache",
        confidence: 1
      };
    }
    for (const rule of this.rules) {
      if (rule.pattern.test(finding.message)) {
        const canonical = {
          ...finding,
          category: rule.category,
          severity: rule.severity,
          message: rule.canonical,
          canonicalHash: this.hashFinding(rule.canonical)
        };
        this.seenFindings.set(canonical.canonicalHash, canonical);
        this.cacheClassification(cacheKey, canonical);
        return {
          originalFinding: finding,
          canonical,
          classifier: "rule-based",
          confidence: 0.95
        };
      }
    }
    return this.classifyByHeuristic(finding, cacheKey);
  }
  /**
   * Batch classify findings
   */
  async classifyBatch(findings) {
    return Promise.all(findings.map((f) => this.classify(f)));
  }
  /**
   * Deduplicate findings
   */
  deduplicateFindings(findings) {
    const deduplicated = [];
    const seen = /* @__PURE__ */ new Set();
    for (const finding of findings) {
      const hash = finding.canonicalHash || this.hashFinding(finding.message);
      if (!seen.has(hash)) {
        seen.add(hash);
        deduplicated.push(finding);
      }
    }
    return deduplicated;
  }
  /**
   * Group findings by category
   */
  groupByCategory(findings) {
    const grouped = /* @__PURE__ */ new Map();
    for (const finding of findings) {
      const category = finding.category || "uncategorized";
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category).push(finding);
    }
    return grouped;
  }
  /**
   * Group findings by severity
   */
  groupBySeverity(findings) {
    const grouped = /* @__PURE__ */ new Map();
    for (const finding of findings) {
      if (!grouped.has(finding.severity)) {
        grouped.set(finding.severity, []);
      }
      grouped.get(finding.severity).push(finding);
    }
    return grouped;
  }
  /**
   * Analyze finding trends
   */
  analyzeTrends(currentFindings, previousFindings) {
    if (!previousFindings) {
      return {
        newFindings: currentFindings,
        resolvedFindings: [],
        changedFindings: []
      };
    }
    const currentHashes = new Set(
      currentFindings.map((f) => f.canonicalHash || this.hashFinding(f.message))
    );
    const previousHashes = new Set(
      previousFindings.map((f) => f.canonicalHash || this.hashFinding(f.message))
    );
    const newFindings = currentFindings.filter(
      (f) => !previousHashes.has(f.canonicalHash || this.hashFinding(f.message))
    );
    const resolvedFindings = previousFindings.filter(
      (f) => !currentHashes.has(f.canonicalHash || this.hashFinding(f.message))
    );
    const changedFindings = currentFindings.filter((f) => {
      const hash = f.canonicalHash || this.hashFinding(f.message);
      if (!previousHashes.has(hash)) return false;
      const prevFinding = previousFindings.find(
        (pf) => (pf.canonicalHash || this.hashFinding(pf.message)) === hash
      );
      return prevFinding && prevFinding.severity !== f.severity;
    });
    return {
      newFindings,
      resolvedFindings,
      changedFindings
    };
  }
  /**
   * Clear classification cache
   */
  clearCache() {
    this.cache.clear();
  }
  /**
   * Initialize classification rules
   */
  initializeClassificationRules() {
    this.rules = [
      // Accessibility rules
      {
        pattern: /alt.{0,50}text|missing.{0,30}alt/i,
        category: "accessibility",
        severity: "error",
        canonical: "Missing or invalid alt text on image element"
      },
      {
        pattern: /aria.{0,50}label|missing.{0,30}aria.{0,20}label/i,
        category: "accessibility",
        severity: "warning",
        canonical: "Element missing ARIA label"
      },
      {
        pattern: /contrast|wcag|color.{0,30}contrast/i,
        category: "accessibility",
        severity: "warning",
        canonical: "Insufficient color contrast ratio"
      },
      // Performance rules
      {
        pattern: /layout.{0,30}shift|cumulative.{0,30}layout|cls/i,
        category: "performance",
        severity: "warning",
        canonical: "Cumulative Layout Shift detected"
      },
      {
        pattern: /large.{0,30}image|unoptimized.{0,30}image|image.{0,30}size/i,
        category: "performance",
        severity: "info",
        canonical: "Image optimization opportunity detected"
      },
      // Best practices rules
      {
        pattern: /console.{0,50}error|javascript.{0,30}error|uncaught/i,
        category: "errors",
        severity: "error",
        canonical: "JavaScript error in console"
      },
      {
        pattern: /console.{0,50}warn|javascript.{0,30}warning/i,
        category: "errors",
        severity: "warning",
        canonical: "JavaScript warning in console"
      },
      // Security rules
      {
        pattern: /mixed.{0,30}content|http.{0,30}https|insecure/i,
        category: "security",
        severity: "error",
        canonical: "Mixed content (HTTP/HTTPS) detected"
      },
      // Responsive design rules
      {
        pattern: /text.{0,30}small|font.{0,30}size|readability/i,
        category: "responsive",
        severity: "warning",
        canonical: "Text size may be too small for readability"
      }
    ];
  }
  /**
   * Classify by heuristic when no rule matches
   */
  classifyByHeuristic(finding, cacheKey) {
    const category = finding.category || "general";
    let severity = finding.severity || "info";
    if (finding.message.toLowerCase().includes("error")) {
      severity = "error";
    } else if (finding.message.toLowerCase().includes("warning")) {
      severity = "warning";
    }
    const canonical = {
      ...finding,
      category,
      severity,
      canonicalHash: this.hashFinding(finding.message),
      isClassified: true
    };
    this.cacheClassification(cacheKey, canonical);
    return {
      originalFinding: finding,
      canonical,
      classifier: "heuristic",
      confidence: 0.6
    };
  }
  /**
   * Generate cache key for a finding
   */
  generateFindingHash(finding) {
    const key = `${finding.profileId}:${finding.message}:${finding.category}`;
    return crypto.createHash("sha256").update(key).digest("hex");
  }
  /**
   * Hash finding message
   */
  hashFinding(message) {
    return crypto.createHash("sha256").update(message).digest("hex");
  }
  /**
   * Cache a classification result
   */
  cacheClassification(key, finding) {
    const now = Date.now();
    this.cache.set(key, {
      key,
      finding,
      ttl: this.cacheTTL,
      createdAt: now,
      expiresAt: now + this.cacheTTL
    });
  }
  /**
   * Check if cache entry is expired
   */
  isCacheExpired(entry) {
    return Date.now() > entry.expiresAt;
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      seenFindingsCount: this.seenFindings.size,
      rulesCount: this.rules.length
    };
  }
};

// src/core/screenshot-manager.ts
import * as fs from "fs/promises";
import * as path from "path";
import * as crypto2 from "crypto";
import { PNG } from "pngjs";
var ScreenshotManager = class {
  // hash -> filenames
  constructor(screenshotDir = ".hauntview/screenshots") {
    this.screenshots = /* @__PURE__ */ new Map();
    this.hashIndex = /* @__PURE__ */ new Map();
    this.screenshotDir = screenshotDir;
  }
  /**
   * Initialize screenshot directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize screenshot directory: ${error}`);
    }
  }
  /**
   * Capture screenshot from page
   */
  async captureScreenshot(page, profileId, url, viewport, options) {
    try {
      const buffer = await page.screenshot({
        fullPage: options?.fullPage ?? true
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
  async storeScreenshot(metadata, buffer) {
    const filePath = path.join(this.screenshotDir, metadata.fileName);
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, buffer);
      this.screenshots.set(metadata.fileName, {
        metadata,
        buffer,
        hash: metadata.hash
      });
      if (!this.hashIndex.has(metadata.hash)) {
        this.hashIndex.set(metadata.hash, []);
      }
      this.hashIndex.get(metadata.hash).push(metadata.fileName);
    } catch (error) {
      throw new Error(`Failed to store screenshot: ${error}`);
    }
  }
  /**
   * Retrieve screenshot by filename
   */
  async getScreenshot(fileName) {
    const stored = this.screenshots.get(fileName);
    if (stored) {
      return stored.metadata;
    }
    const filePath = path.join(this.screenshotDir, fileName);
    try {
      const buffer = await fs.readFile(filePath);
      const hash = this.hashBuffer(buffer);
      const metadata = {
        profileId: fileName.split("/")[0],
        timestamp: parseInt(fileName.match(/\d+/)?.[0] || String(Date.now())),
        url: "",
        viewport: { width: 1280, height: 720, isMobile: false, hasTouch: false },
        fileName,
        hash
      };
      this.screenshots.set(fileName, {
        metadata,
        buffer,
        hash
      });
      return metadata;
    } catch {
      return null;
    }
  }
  /**
   * Find duplicate screenshots by hash
   */
  async findDuplicates(fileName) {
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
  async compareScreenshots(fileName1, fileName2) {
    const screenshot1 = this.screenshots.get(fileName1) || await this.loadStoredScreenshot(fileName1);
    const screenshot2 = this.screenshots.get(fileName2) || await this.loadStoredScreenshot(fileName2);
    if (!screenshot1 || !screenshot2) {
      throw new Error("One or both screenshots not found");
    }
    if (screenshot1.hash === screenshot2.hash) {
      return { pixelDifference: 0, percentageDifference: 0 };
    }
    try {
      const img1 = PNG.sync.read(screenshot1.buffer);
      const img2 = PNG.sync.read(screenshot2.buffer);
      const width = Math.max(img1.width, img2.width);
      const height = Math.max(img1.height, img2.height);
      const canvas1 = new PNG({ width, height });
      const canvas2 = new PNG({ width, height });
      PNG.bitblt(img1, canvas1, 0, 0, img1.width, img1.height, 0, 0);
      PNG.bitblt(img2, canvas2, 0, 0, img2.width, img2.height, 0, 0);
      const pixelmatchModule = await import("pixelmatch");
      const pixelmatch = pixelmatchModule.default || pixelmatchModule;
      const diff = new PNG({ width, height });
      const pixelDifference = pixelmatch(canvas1.data, canvas2.data, diff.data, width, height, {
        threshold: 0.1
      });
      const totalPixels = width * height;
      const percentageDifference = totalPixels > 0 ? pixelDifference / totalPixels : 0;
      const diffBuffer = PNG.sync.write(diff);
      return {
        pixelDifference,
        percentageDifference,
        diffBuffer
      };
    } catch {
      return { pixelDifference: -1, percentageDifference: 1 };
    }
  }
  async loadStoredScreenshot(fileName) {
    const filePath = path.join(this.screenshotDir, fileName);
    try {
      const buffer = await fs.readFile(filePath);
      const hash = this.hashBuffer(buffer);
      const metadata = {
        profileId: fileName.split("/")[0] || "default",
        timestamp: Date.now(),
        url: "",
        viewport: { width: 1280, height: 720, isMobile: false, hasTouch: false },
        fileName,
        hash
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
  async cleanup(maxAgeMs = 7 * 24 * 60 * 60 * 1e3) {
    let removedCount = 0;
    const now = Date.now();
    try {
      const files = await fs.readdir(this.screenshotDir, { recursive: true });
      for (const file of files) {
        const filePath = path.join(this.screenshotDir, String(file));
        const stat2 = await fs.stat(filePath);
        if (now - stat2.mtimeMs > maxAgeMs) {
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
  async getProfileScreenshots(profileId) {
    const screenshots = [];
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
  generateMetadata(profileId, url, viewport, buffer) {
    const timestamp = Date.now();
    const hash = this.hashBuffer(buffer);
    const fileName = `${profileId}/${timestamp}-${hash.substring(0, 8)}.png`;
    return {
      profileId,
      timestamp,
      url,
      viewport,
      fileName,
      hash
    };
  }
  /**
   * Calculate hash of buffer
   */
  hashBuffer(buffer) {
    return crypto2.createHash("sha256").update(buffer).digest("hex");
  }
  /**
   * Get screenshot statistics
   */
  getStats() {
    let totalSize = 0;
    for (const stored of this.screenshots.values()) {
      totalSize += stored.buffer.length;
    }
    return {
      totalScreenshots: this.screenshots.size,
      uniqueScreenshots: this.hashIndex.size,
      totalSize
    };
  }
};

// src/reports/html-generator.ts
var HTMLReportGenerator = class {
  async generate(report, options) {
    const content = this.generateHTMLContent(report, options);
    const filename = `hauntview-grimoire-${report.id}.html`;
    return {
      format: "html",
      content,
      filename,
      mimeType: "text/html"
    };
  }
  generateHTMLContent(report, options) {
    const theme = this.darkTheme();
    const findings = this.getAllFindings(report);
    const statistics = this.calculateStatistics(report);
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HauntView Grimoire - S\xE9ance Report</title>
  <style>
    ${this.getStyles(theme)}
  </style>
</head>
<body>
  <div class="parchment">
    ${this.renderHeader(report, statistics)}
    ${this.renderTOC()}
    ${this.renderExecutiveSummary(report, statistics)}
    ${this.renderFindingsBySeverity(findings)}
    ${this.renderFindingsByCategory(findings)}
    ${this.renderProfileDetails(report)}
    ${options.includeScreenshots ? this.renderScreenshots(report) : ""}
    ${this.renderFooter()}
  </div>
</body>
</html>`;
  }
  renderHeader(report, statistics) {
    const theme = this.darkTheme();
    const passRate = (statistics.successfulProfiles / statistics.totalProfiles * 100).toFixed(1);
    const hasErrors = statistics.errorCount > 0;
    return `
    <header class="grimoire-header">
      <div class="wax-seal">
        <svg viewBox="0 0 100 100" class="seal-svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="${theme.secondary}" stroke-width="2"/>
          <path d="M50 20 L50 35 M50 65 L50 80 M20 50 L35 50 M65 50 L80 50" stroke="${theme.accent}" stroke-width="2"/>
          <circle cx="50" cy="50" r="15" fill="${theme.accent}" opacity="0.3"/>
        </svg>
      </div>
      <div class="header-content">
        <div class="specimen-label">SPIRIT PHOTOGRAPHY GRIMOIRE</div>
        <h1>HauntView S\xE9ance Report</h1>
        <p class="subtitle">Web Resilience Audit \u2022 Kiroween 2026</p>
        <div class="meta-grid">
          <div class="meta-item">
            <span class="meta-label">House</span>
            <code class="meta-value">${this.escapeHtml(report.url)}</code>
          </div>
          <div class="meta-item">
            <span class="meta-label">Duration</span>
            <span class="meta-value">${(report.duration / 1e3).toFixed(2)}s</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Generated</span>
            <span class="meta-value">${new Date(report.startTime).toLocaleString()}</span>
          </div>
        </div>
        <div class="status-banner ${hasErrors ? "has-errors" : "no-errors"}">
          <div class="status-badge">
            ${hasErrors ? "OMENS DETECTED" : "NO OMENS"}
          </div>
          <div class="status-metrics">
            <span>${passRate}% rites passed</span>
            <span>${statistics.totalFindings} findings</span>
          </div>
        </div>
      </div>
    </header>`;
  }
  renderTOC() {
    return `
    <nav class="table-of-contents">
      <h2>Contents</h2>
      <ul>
        <li><a href="#summary">Executive Summary</a></li>
        <li><a href="#severity">Omens by Severity</a></li>
        <li><a href="#category">Omens by Category</a></li>
        <li><a href="#profiles">Rite Details</a></li>
        ${this.hasScreenshots() ? '<li><a href="#apparitions">Gallery of Apparitions</a></li>' : ""}
      </ul>
    </nav>`;
  }
  renderExecutiveSummary(report, statistics) {
    return `
    <section id="summary" class="section">
      <div class="section-header">
        <h2>Executive Summary</h2>
        <div class="section-decorator"></div>
      </div>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${statistics.totalProfiles}</div>
          <div class="metric-label">Rites Conducted</div>
        </div>
        <div class="metric-card">
          <div class="metric-value success">${statistics.successfulProfiles}</div>
          <div class="metric-label">Passed</div>
        </div>
        <div class="metric-card">
          <div class="metric-value ${statistics.errorCount > 0 ? "error" : "success"}">${statistics.errorCount}</div>
          <div class="metric-label">Screams</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${statistics.totalFindings}</div>
          <div class="metric-label">Total Omens</div>
        </div>
      </div>
      <div class="breakdown-panel">
        <h3>Omen Distribution</h3>
        <table class="distribution-table">
          <tbody>
            <tr>
              <td class="severity-label serious">Screams</td>
              <td><span class="count-badge serious">${report.summary.findingsBySeverity.error}</span></td>
            </tr>
            <tr>
              <td class="severity-label warning">Chills</td>
              <td><span class="count-badge warning">${report.summary.findingsBySeverity.warning}</span></td>
            </tr>
            <tr>
              <td class="severity-label whisper">Whispers</td>
              <td><span class="count-badge whisper">${report.summary.findingsBySeverity.info}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>`;
  }
  renderFindingsBySeverity(findings) {
    const bySeverity = this.groupBySeverity(findings);
    const severities = ["error", "warning", "info"];
    let html = `<section id="severity" class="section">
      <div class="section-header">
        <h2>Omens by Severity</h2>
        <div class="section-decorator"></div>
      </div>`;
    for (const severity of severities) {
      const items = bySeverity[severity] || [];
      const severityName = severity === "error" ? "Screams" : severity === "warning" ? "Chills" : "Whispers";
      html += `
      <div class="omen-group">
        <h3 class="severity-${severity}">
          <span class="severity-icon"></span>
          ${severityName} (${items.length})
        </h3>
        ${items.length > 0 ? `
        <table class="omen-table">
          <thead>
            <tr>
              <th>Rite</th>
              <th>Category</th>
              <th>Omen</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((f) => this.renderFindingRow(f)).join("")}
          </tbody>
        </table>
        ` : '<p class="no-omens">No omens of this severity</p>'}
      </div>`;
    }
    html += `</section>`;
    return html;
  }
  renderFindingsByCategory(findings) {
    const byCategory = this.groupByCategory(findings);
    let html = `<section id="category" class="section">
      <div class="section-header">
        <h2>Omens by Category</h2>
        <div class="section-decorator"></div>
      </div>`;
    for (const [category, items] of Object.entries(byCategory)) {
      html += `
      <div class="omen-group">
        <h3>
          <span class="category-icon"></span>
          ${category} (${items.length})
        </h3>
        ${items.length > 0 ? `
        <table class="omen-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Rite</th>
              <th>Omen</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((f) => this.renderFindingRow(f)).join("")}
          </tbody>
        </table>
        ` : '<p class="no-omens">No omens in this category</p>'}
      </div>`;
    }
    html += `</section>`;
    return html;
  }
  renderProfileDetails(report) {
    let html = `<section id="profiles" class="section">
      <div class="section-header">
        <h2>Rite Details</h2>
        <div class="section-decorator"></div>
      </div>`;
    for (const profile of report.profileResults) {
      const statusIcon = profile.success ? "\u2713" : "\u2717";
      html += `
      <div class="rite-card">
        <div class="rite-header ${profile.success ? "passed" : "failed"}">
          <div class="rite-status">${statusIcon}</div>
          <div class="rite-info">
            <h3>${profile.profileName}</h3>
            <div class="rite-meta">
              <span>Duration: ${profile.duration}ms</span>
              <span>Findings: ${profile.findings.length}</span>
            </div>
          </div>
        </div>
        <div class="rite-findings">
          ${profile.findings.length > 0 ? `
            <table class="omen-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Category</th>
                  <th>Omen</th>
                </tr>
              </thead>
              <tbody>
                ${profile.findings.map((f) => this.renderFindingRow(f)).join("")}
              </tbody>
            </table>
          ` : '<p class="no-omens">No omens detected</p>'}
        </div>
      </div>`;
    }
    html += `</section>`;
    return html;
  }
  renderScreenshots(report) {
    const allScreenshots = report.profileResults.flatMap((p) => p.screenshots.map((s) => ({ ...s, profile: p.profileName }))).filter((s) => s.fileName);
    if (allScreenshots.length === 0) {
      return "";
    }
    let html = `<section id="apparitions" class="section">
      <div class="section-header">
        <h2>Gallery of Apparitions</h2>
        <div class="section-decorator"></div>
      </div>
      <div class="apparition-grid">`;
    for (const screenshot of allScreenshots) {
      const src = screenshot.fileName.startsWith("screenshots/") || screenshot.fileName.startsWith("http") || screenshot.fileName.startsWith("/") ? screenshot.fileName : `screenshots/${screenshot.fileName}`;
      html += `
      <div class="apparition-plate">
        <div class="plate-header">
          <span class="plate-label">${screenshot.profile}</span>
          <span class="plate-time">${new Date(screenshot.timestamp).toLocaleTimeString()}</span>
        </div>
        <div class="plate-frame">
          <img src="${src}" alt="Apparition from ${screenshot.profile}">
        </div>
      </div>`;
    }
    html += `</div></section>`;
    return html;
  }
  renderFindingRow(finding) {
    const screenshotRef = finding.details?.screenshot;
    const screenshotSrc = screenshotRef ? screenshotRef.startsWith("screenshots/") || screenshotRef.startsWith("http") || screenshotRef.startsWith("/") ? screenshotRef : `screenshots/${screenshotRef}` : null;
    return `
    <tr>
      <td><span class="severity-mark severity-${finding.severity}">${finding.severity.toUpperCase()}</span></td>
      <td>${this.escapeHtml(finding.category)}</td>
      <td>
        <span class="omen-text">${this.escapeHtml(finding.message)}</span>
        ${screenshotSrc ? `<div class="screenshot-link"><a href="${screenshotSrc}" target="_blank">View Apparition Plate</a></div>` : ""}
      </td>
    </tr>`;
  }
  renderFooter() {
    return `
    <footer class="grimoire-footer">
      <div class="footer-seal">
        <svg viewBox="0 0 60 60" class="footer-ghost">
          <path d="M30 10 C20 10, 15 20, 15 30 C15 40, 20 50, 30 50 C40 50, 45 40, 45 30 C45 20, 40 10, 30 10" fill="none" stroke="currentColor" stroke-width="2"/>
          <circle cx="25" cy="25" r="2" fill="currentColor"/>
          <circle cx="35" cy="25" r="2" fill="currentColor"/>
          <path d="M30 35 L25 45 L35 45 Z" fill="currentColor"/>
        </svg>
      </div>
      <div class="footer-content">
        <p>Generated by <strong>HauntView v0.0.1</strong></p>
        <p>Kiroween 2026 Hackathon Submission</p>
        <p class="footer-motto">See what breaks before your users do</p>
      </div>
    </footer>`;
  }
  getStyles(theme) {
    return `
      :root {
        --primary: ${theme.primary};
        --secondary: ${theme.secondary};
        --accent: ${theme.accent};
        --bg: ${theme.bg};
        --bg-alt: ${theme.bgAlt};
        --text: ${theme.text};
        --text-muted: ${theme.textMuted};
        --border: ${theme.border};
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Georgia', 'Times New Roman', serif;
        background-color: var(--bg);
        color: var(--text);
        line-height: 1.7;
        background-image: 
          radial-gradient(#8a829518 0.5px, transparent 0.5px),
          radial-gradient(ellipse at 85% 15%, rgba(45, 31, 61, 0.4), transparent 50%),
          radial-gradient(ellipse at 20% 85%, rgba(255, 121, 31, 0.12), transparent 45%);
        background-size: 20px 20px, 100% 100%, 100% 100%;
        background-attachment: fixed;
      }

      .parchment {
        max-width: 1000px;
        margin: 0 auto;
        padding: 60px 40px;
        background: linear-gradient(160deg, rgba(28, 21, 35, 0.9) 0%, rgba(15, 11, 21, 0.95) 100%);
        border: 1px solid rgba(255, 121, 31, 0.2);
        border-radius: 8px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 157, 77, 0.08);
      }

      .grimoire-header {
        text-align: center;
        padding: 40px 0 50px;
        border-bottom: 2px solid var(--border);
        margin-bottom: 50px;
        position: relative;
      }

      .wax-seal {
        width: 80px;
        height: 80px;
        margin: 0 auto 20px;
        position: relative;
      }

      .seal-svg {
        width: 100%;
        height: 100%;
        filter: drop-shadow(0 0 12px rgba(255, 121, 31, 0.4));
      }

      .specimen-label {
        font-family: 'Courier New', monospace;
        font-size: 9px;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--accent);
        background: rgba(255, 121, 31, 0.08);
        border: 1px solid rgba(255, 121, 31, 0.3);
        padding: 6px 12px;
        border-radius: 3px;
        display: inline-block;
        margin-bottom: 16px;
      }

      .header-content h1 {
        font-size: 2.8rem;
        font-weight: 600;
        letter-spacing: -0.03em;
        margin-bottom: 8px;
        color: var(--text);
      }

      .subtitle {
        font-size: 1rem;
        color: var(--text-muted);
        margin-bottom: 30px;
        font-style: italic;
      }

      .meta-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .meta-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px;
        background: rgba(28, 21, 35, 0.5);
        border: 1px solid var(--border);
        border-radius: 4px;
      }

      .meta-label {
        font-size: 10px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
        margin-bottom: 4px;
      }

      .meta-value {
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: var(--text);
      }

      .status-banner {
        display: flex;
        gap: 20px;
        align-items: center;
        justify-content: center;
        padding: 16px;
        border-radius: 4px;
        margin-top: 20px;
      }

      .status-banner.no-errors {
        background: rgba(22, 163, 74, 0.1);
        border: 1px solid rgba(22, 163, 74, 0.3);
      }

      .status-banner.has-errors {
        background: rgba(220, 38, 38, 0.1);
        border: 1px solid rgba(220, 38, 38, 0.3);
      }

      .status-badge {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        font-weight: 600;
        padding: 8px 16px;
        border-radius: 3px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .status-banner.no-errors .status-badge {
        background: rgba(22, 163, 74, 0.2);
        color: #86efac;
      }

      .status-banner.has-errors .status-badge {
        background: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
      }

      .status-metrics {
        display: flex;
        gap: 20px;
        font-size: 13px;
        color: var(--text-muted);
      }

      .table-of-contents {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
        margin-bottom: 50px;
        border-left: 3px solid var(--accent);
      }

      .table-of-contents h2 {
        font-size: 1.2rem;
        margin-bottom: 16px;
        color: var(--text);
      }

      .table-of-contents ul {
        list-style: none;
      }

      .table-of-contents li {
        margin: 10px 0;
      }

      .table-of-contents a {
        color: var(--accent);
        text-decoration: none;
        font-size: 14px;
        transition: color 0.2s;
      }

      .table-of-contents a:hover {
        color: #ff9448;
        text-decoration: underline;
      }

      .section {
        margin-bottom: 60px;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--border);
      }

      .section-header h2 {
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--text);
      }

      .section-decorator {
        flex: 1;
        height: 1px;
        background: linear-gradient(90deg, var(--accent), transparent);
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .metric-card {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
        text-align: center;
        border-top: 3px solid var(--accent);
      }

      .metric-value {
        font-size: 2.5rem;
        font-weight: 600;
        color: var(--accent);
        margin-bottom: 8px;
      }

      .metric-value.success {
        color: #86efac;
      }

      .metric-value.error {
        color: #fca5a5;
      }

      .metric-label {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--text-muted);
      }

      .breakdown-panel {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
      }

      .breakdown-panel h3 {
        font-size: 1rem;
        margin-bottom: 16px;
        color: var(--text);
      }

      .distribution-table {
        width: 100%;
        border-collapse: collapse;
      }

      .distribution-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }

      .severity-label {
        font-size: 13px;
        font-weight: 500;
      }

      .severity-label.serious {
        color: #fca5a5;
      }

      .severity-label.warning {
        color: #fed7aa;
      }

      .severity-label.whisper {
        color: #93c5fd;
      }

      .count-badge {
        display: inline-block;
        padding: 4px 12px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 12px;
      }

      .count-badge.serious {
        background: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
      }

      .count-badge.warning {
        background: rgba(234, 88, 12, 0.2);
        color: #fed7aa;
      }

      .count-badge.whisper {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
      }

      .omen-group {
        background: rgba(28, 21, 35, 0.5);
        padding: 24px;
        border-radius: 6px;
        margin-bottom: 20px;
      }

      .omen-group h3 {
        font-size: 1.1rem;
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .severity-icon {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .severity-error .severity-icon {
        background: #dc2626;
        box-shadow: 0 0 8px rgba(220, 38, 38, 0.6);
      }

      .severity-warning .severity-icon {
        background: #ea580c;
        box-shadow: 0 0 8px rgba(234, 88, 12, 0.6);
      }

      .severity-info .severity-icon {
        background: #3b82f6;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
      }

      .category-icon {
        width: 8px;
        height: 8px;
        border-radius: 2px;
        background: var(--accent);
      }

      .omen-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }

      .omen-table thead {
        background: rgba(255, 121, 31, 0.1);
      }

      .omen-table th {
        padding: 12px 16px;
        text-align: left;
        font-weight: 600;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-muted);
      }

      .omen-table td {
        padding: 12px 16px;
        border-bottom: 1px solid var(--border);
      }

      .omen-table tbody tr:hover {
        background: rgba(255, 121, 31, 0.05);
      }

      .severity-mark {
        display: inline-block;
        padding: 3px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .severity-mark.serious {
        background: rgba(220, 38, 38, 0.2);
        color: #fca5a5;
      }

      .severity-mark.warning {
        background: rgba(234, 88, 12, 0.2);
        color: #fed7aa;
      }

      .severity-mark.info {
        background: rgba(59, 130, 246, 0.2);
        color: #93c5fd;
      }

      .omen-text {
        color: var(--text);
      }

      .screenshot-link {
        margin-top: 6px;
      }

      .screenshot-link a {
        color: var(--accent);
        font-size: 11px;
        text-decoration: none;
        transition: color 0.2s;
      }

      .screenshot-link a:hover {
        color: #ff9448;
        text-decoration: underline;
      }

      .no-omens {
        color: var(--text-muted);
        font-style: italic;
        text-align: center;
        padding: 20px;
      }

      .rite-card {
        background: rgba(28, 21, 35, 0.5);
        border-radius: 6px;
        margin-bottom: 20px;
        overflow: hidden;
      }

      .rite-header {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 20px;
        border-left: 4px solid;
      }

      .rite-header.passed {
        border-left-color: #86efac;
      }

      .rite-header.failed {
        border-left-color: #fca5a5;
      }

      .rite-status {
        font-size: 24px;
        font-weight: 600;
      }

      .rite-header.passed .rite-status {
        color: #86efac;
      }

      .rite-header.failed .rite-status {
        color: #fca5a5;
      }

      .rite-info h3 {
        font-size: 14px;
        margin-bottom: 4px;
        color: var(--text);
      }

      .rite-meta {
        display: flex;
        gap: 16px;
        font-size: 12px;
        color: var(--text-muted);
      }

      .rite-findings {
        padding: 16px 20px;
      }

      .apparition-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 20px;
      }

      .apparition-plate {
        background: rgba(28, 21, 35, 0.5);
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid var(--border);
      }

      .plate-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background: rgba(255, 121, 31, 0.05);
        border-bottom: 1px solid var(--border);
      }

      .plate-label {
        font-family: 'Courier New', monospace;
        font-size: 11px;
        color: var(--accent);
      }

      .plate-time {
        font-size: 11px;
        color: var(--text-muted);
      }

      .plate-frame {
        aspect-ratio: 16/10;
        background: #0a0711;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .plate-frame img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .grimoire-footer {
        margin-top: 60px;
        padding-top: 30px;
        border-top: 1px solid var(--border);
        display: flex;
        align-items: center;
        gap: 20px;
      }

      .footer-seal {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      .footer-ghost {
        width: 100%;
        height: 100%;
        color: var(--accent);
        opacity: 0.5;
      }

      .footer-content {
        flex: 1;
      }

      .footer-content p {
        font-size: 12px;
        color: var(--text-muted);
        margin-bottom: 4px;
      }

      .footer-content strong {
        color: var(--text);
      }

      .footer-motto {
        font-style: italic;
        color: var(--accent);
      }

      @media (max-width: 768px) {
        .parchment {
          padding: 30px 20px;
        }

        .header-content h1 {
          font-size: 2rem;
        }

        .meta-grid {
          grid-template-columns: 1fr;
        }

        .metrics-grid {
          grid-template-columns: 1fr 1fr;
        }

        .omen-table {
          font-size: 12px;
        }

        .omen-table th,
        .omen-table td {
          padding: 8px 12px;
        }

        .apparition-grid {
          grid-template-columns: 1fr;
        }
      }

      @media print {
        body {
          background: white;
          color: black;
        }

        .parchment {
          box-shadow: none;
          border: 1px solid #ccc;
        }

        .table-of-contents {
          page-break-after: always;
        }

        .section {
          page-break-inside: avoid;
        }
      }
    `;
  }
  darkTheme() {
    return {
      primary: "#1c1629",
      secondary: "#0a0711",
      accent: "#ff791f",
      bg: "#0a0711",
      bgAlt: "#1c1629",
      text: "#f5f0e8",
      textMuted: "#8a8295",
      border: "#46334b"
    };
  }
  getAllFindings(report) {
    return report.profileResults.flatMap((p) => p.findings);
  }
  hasScreenshots() {
    return true;
  }
  calculateStatistics(report) {
    const allFindings = this.getAllFindings(report);
    return {
      totalProfiles: report.profileResults.length,
      successfulProfiles: report.profileResults.filter((p) => p.success).length,
      errorCount: allFindings.filter((f) => f.severity === "error").length,
      totalFindings: allFindings.length
    };
  }
  groupBySeverity(findings) {
    return {
      error: findings.filter((f) => f.severity === "error"),
      warning: findings.filter((f) => f.severity === "warning"),
      info: findings.filter((f) => f.severity === "info")
    };
  }
  groupByCategory(findings) {
    const grouped = {};
    for (const finding of findings) {
      const category = finding.category || "uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(finding);
    }
    return grouped;
  }
  escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }
};

// src/reports/markdown-generator.ts
var MarkdownReportGenerator = class {
  async generate(report, options) {
    const content = this.generateMarkdownContent(report, options);
    const filename = `hauntview-report-${report.id}.md`;
    return {
      format: "markdown",
      content,
      filename,
      mimeType: "text/markdown"
    };
  }
  generateMarkdownContent(report, options) {
    const findings = this.getAllFindings(report);
    const statistics = this.calculateStatistics(report);
    let markdown = "";
    markdown += this.renderHeader(report, statistics);
    markdown += this.renderTOC();
    markdown += this.renderExecutiveSummary(report, statistics);
    markdown += this.renderFindingsBySeverity(findings);
    markdown += this.renderFindingsByCategory(findings);
    markdown += this.renderProfileDetails(report);
    if (options.includeScreenshots) {
      markdown += this.renderScreenshots(report);
    }
    markdown += this.renderFooter();
    return markdown;
  }
  renderHeader(report, statistics) {
    const passRate = (statistics.successfulProfiles / statistics.totalProfiles * 100).toFixed(1);
    const status = statistics.errorCount === 0 ? "\u2705 PASS" : "\u274C ISSUES FOUND";
    return `# \u{1F47B} HauntView Testing Report

> Comprehensive Web Testing Analysis

## Report Status: ${status}

**URL:** \`${report.url}\`  
**Generated:** ${new Date(report.startTime).toLocaleString()}  
**Duration:** ${(report.duration / 1e3).toFixed(2)}s  

### Quick Stats
- **Pass Rate:** ${passRate}%
- **Profiles Run:** ${statistics.totalProfiles}
- **Profiles Passed:** ${statistics.successfulProfiles}
- **Total Findings:** ${statistics.totalFindings}
  - Errors: ${statistics.errorCount}
  - Warnings: ${statistics.warningCount}
  - Info: ${statistics.infoCount}

---

`;
  }
  renderTOC() {
    return `## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Findings by Severity](#findings-by-severity)
3. [Findings by Category](#findings-by-category)
4. [Profile Details](#profile-details)
5. [Recommendations](#recommendations)

---

`;
  }
  renderExecutiveSummary(report, statistics) {
    let markdown = `## Executive Summary

### Overview
This HauntView test report analyzes the website against ${statistics.totalProfiles} testing profiles covering:
- Device compatibility (mobile, tablet, desktop)
- Accessibility standards
- Internationalization support
- Performance metrics
- Browser compatibility

### Results

| Metric | Value |
|--------|-------|
| Total Profiles | ${statistics.totalProfiles} |
| Profiles Passed | ${statistics.successfulProfiles} |
| Total Findings | ${statistics.totalFindings} |
| Errors | ${statistics.errorCount} |
| Warnings | ${statistics.warningCount} |
| Info Messages | ${statistics.infoCount} |

### Key Findings

`;
    if (statistics.errorCount > 0) {
      markdown += `\u{1F534} **${statistics.errorCount} Critical Issues** - Require immediate attention

`;
    }
    if (statistics.warningCount > 0) {
      markdown += `\u{1F7E1} **${statistics.warningCount} Warnings** - Should be reviewed and fixed

`;
    }
    if (statistics.infoCount > 0) {
      markdown += `\u2139\uFE0F **${statistics.infoCount} Info Messages** - Suggestions for improvement

`;
    }
    markdown += `---

`;
    return markdown;
  }
  renderFindingsBySeverity(findings) {
    let markdown = `## Findings by Severity

`;
    const errors = findings.filter((f) => f.severity === "error");
    markdown += this.renderSeveritySection("\u{1F534} Errors", errors, errors.length > 0);
    const warnings = findings.filter((f) => f.severity === "warning");
    markdown += this.renderSeveritySection("\u{1F7E1} Warnings", warnings, warnings.length > 0);
    const infos = findings.filter((f) => f.severity === "info");
    markdown += this.renderSeveritySection("\u2139\uFE0F Information", infos, infos.length > 0);
    markdown += `---

`;
    return markdown;
  }
  renderSeveritySection(title, findings, hasFindings) {
    if (!hasFindings) {
      return `### ${title}

No findings.

`;
    }
    let markdown = `### ${title} (${findings.length})

| Profile | Category | Message |
|---------|----------|---------|
`;
    for (const finding of findings) {
      markdown += `| ${finding.profileId} | ${finding.category} | ${finding.message} |
`;
    }
    markdown += "\n";
    return markdown;
  }
  renderFindingsByCategory(findings) {
    const byCategory = this.groupByCategory(findings);
    let markdown = `## Findings by Category

`;
    for (const [category, items] of Object.entries(byCategory).sort()) {
      const errorCount = items.filter((f) => f.severity === "error").length;
      const warningCount = items.filter((f) => f.severity === "warning").length;
      const infoCount = items.filter((f) => f.severity === "info").length;
      markdown += `### \u{1F4C2} ${category} (${items.length} total)

| Severity | Count |
|----------|-------|
| \u{1F534} Error | ${errorCount} |
| \u{1F7E1} Warning | ${warningCount} |
| \u2139\uFE0F Info | ${infoCount} |

`;
      markdown += `| Profile | Message |
`;
      markdown += `|---------|----------|
`;
      for (const finding of items) {
        const severityIcon = finding.severity === "error" ? "\u{1F534}" : finding.severity === "warning" ? "\u{1F7E1}" : "\u2139\uFE0F";
        markdown += `| ${severityIcon} ${finding.profileId} | ${finding.message} |
`;
      }
      markdown += "\n";
    }
    markdown += `---

`;
    return markdown;
  }
  renderProfileDetails(report) {
    let markdown = `## Profile Details

`;
    for (const profile of report.profileResults) {
      const status = profile.success ? "\u2705" : "\u274C";
      const findingCount = profile.findings.length;
      markdown += `### ${status} ${profile.profileName}

**Duration:** ${profile.duration}ms  
**Findings:** ${findingCount}

`;
      if (findingCount === 0) {
        markdown += "No findings - this profile passed successfully!\n\n";
      } else {
        markdown += `| Severity | Category | Message |
`;
        markdown += `|----------|----------|----------|
`;
        for (const finding of profile.findings) {
          const severityIcon = finding.severity === "error" ? "\u{1F534}" : finding.severity === "warning" ? "\u{1F7E1}" : "\u2139\uFE0F";
          const plateRef = finding.details?.screenshot ? ` ([View Plate](screenshots/${finding.details.screenshot}))` : "";
          markdown += `| ${severityIcon} | ${finding.category} | ${finding.message}${plateRef} |
`;
        }
        markdown += "\n";
      }
    }
    markdown += `---

`;
    return markdown;
  }
  renderScreenshots(report) {
    const allScreenshots = report.profileResults.flatMap((p) => p.screenshots.map((s) => ({ ...s, profile: p.profileName }))).filter((s) => s.fileName);
    if (allScreenshots.length === 0) {
      return "";
    }
    let markdown = `## Spirit Photography Apparition Plates

`;
    for (const screenshot of allScreenshots) {
      const src = screenshot.fileName.startsWith("screenshots/") || screenshot.fileName.startsWith("http") || screenshot.fileName.startsWith("/") ? screenshot.fileName : `screenshots/${screenshot.fileName}`;
      markdown += `### ${screenshot.profile}

![Apparition Plate: ${screenshot.profile}](${src})  
*Captured: ${new Date(screenshot.timestamp).toLocaleTimeString()}*

`;
    }
    markdown += `---

`;
    return markdown;
  }
  renderFooter() {
    return `## Recommendations

### High Priority (Errors)
Address all critical errors immediately. These issues impact core functionality or user experience.

### Medium Priority (Warnings)
Review and fix warnings when possible. These represent best practices and accessibility concerns.

### Low Priority (Info)
Consider implementing suggestions from info messages for further optimization.

---

*Generated by **HauntView v0.0.1** | ${(/* @__PURE__ */ new Date()).toLocaleString()}*  
*Built for Kiroween 2026 Hackathon*
`;
  }
  getAllFindings(report) {
    return report.profileResults.flatMap((p) => p.findings);
  }
  calculateStatistics(report) {
    const allFindings = this.getAllFindings(report);
    return {
      totalProfiles: report.profileResults.length,
      successfulProfiles: report.profileResults.filter((p) => p.success).length,
      errorCount: allFindings.filter((f) => f.severity === "error").length,
      warningCount: allFindings.filter((f) => f.severity === "warning").length,
      infoCount: allFindings.filter((f) => f.severity === "info").length,
      totalFindings: allFindings.length
    };
  }
  groupByCategory(findings) {
    const grouped = {};
    for (const finding of findings) {
      const category = finding.category || "uncategorized";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(finding);
    }
    return grouped;
  }
};

// src/reports/zip-generator.ts
import JSZip from "jszip";
import fs2 from "fs/promises";
import path2 from "path";
var SCREENSHOTS_DIR = path2.join(process.cwd(), ".hauntview", "screenshots");
var ZipReportGenerator = class {
  async generate(report, options) {
    const zip = new JSZip();
    const htmlGen = new HTMLReportGenerator();
    const htmlReport = await htmlGen.generate(report, {
      ...options,
      format: "html",
      includeScreenshots: true
    });
    zip.file("hauntview-report.html", htmlReport.content);
    const mdGen = new MarkdownReportGenerator();
    const mdReport = await mdGen.generate(report, {
      ...options,
      format: "markdown",
      includeScreenshots: true
    });
    zip.file("hauntview-report.md", mdReport.content);
    zip.file("hauntview-report.json", JSON.stringify(report, null, 2));
    const screenshotsFolder = zip.folder("screenshots");
    const allScreenshots = report.profileResults.flatMap((p) => p.screenshots || []).filter((s) => s && s.fileName);
    const addedFiles = /* @__PURE__ */ new Set();
    for (const screenshot of allScreenshots) {
      if (addedFiles.has(screenshot.fileName)) continue;
      addedFiles.add(screenshot.fileName);
      const filePath = path2.join(SCREENSHOTS_DIR, screenshot.fileName);
      try {
        const buffer = await fs2.readFile(filePath);
        screenshotsFolder?.file(screenshot.fileName, buffer);
      } catch {
        const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="#0a0711">
          <rect width="800" height="600" fill="#0a0711" />
          <rect x="20" y="20" width="760" height="560" fill="none" stroke="#46334b" stroke-width="4" />
          <text x="400" y="260" font-family="serif" font-size="28" fill="#fff1dc" text-anchor="middle">HauntView Spirit Photograph</text>
          <text x="400" y="310" font-family="monospace" font-size="20" fill="#ff791f" text-anchor="middle">Profile: ${screenshot.profileId}</text>
          <text x="400" y="360" font-family="sans-serif" font-size="14" fill="#d9d3e0" text-anchor="middle">Viewport: ${screenshot.viewport?.width ?? 1280}x${screenshot.viewport?.height ?? 800}</text>
        </svg>`;
        screenshotsFolder?.file(screenshot.fileName, fallbackSvg);
      }
    }
    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 6 }
    });
    const filename = `hauntview-grimoire-${report.id}.zip`;
    return {
      format: "zip",
      content: zipBuffer,
      filename,
      mimeType: "application/zip"
    };
  }
};

// src/reports/factory.ts
var ReportFactory = class {
  static createGenerator(format) {
    switch (format.toLowerCase()) {
      case "html":
        return new HTMLReportGenerator();
      case "markdown":
      case "md":
        return new MarkdownReportGenerator();
      case "zip":
      case "bundle":
        return new ZipReportGenerator();
      default:
        throw new Error(`Unsupported report format: ${format}`);
    }
  }
  static getAvailableFormats() {
    return ["zip", "html", "markdown", "json"];
  }
  static getFormatInfo(format) {
    const info = {
      zip: {
        mime: "application/zip",
        extension: "zip",
        description: "Complete Grimoire archive with HTML/MD reports and screenshots directory"
      },
      html: {
        mime: "text/html",
        extension: "html",
        description: "Interactive HTML report with styling and charts"
      },
      markdown: {
        mime: "text/markdown",
        extension: "md",
        description: "Clean Markdown format for easy sharing"
      },
      json: {
        mime: "application/json",
        extension: "json",
        description: "Raw JSON data for programmatic access"
      }
    };
    return info[format.toLowerCase()] || info.html;
  }
};

// src/core/concurrency-resolver.ts
import * as fs3 from "fs";
import * as path3 from "path";
import * as os from "os";
function isHostedEnvironment() {
  return process.env.RENDER === "true" || process.env.HAUNT_HOSTED === "1" || process.env.HAUNT_HOSTED === "true";
}
function isConcurrencyAllowedInHosted() {
  return process.env.HAUNT_ALLOW_CONCURRENCY === "1" || process.env.HAUNT_ALLOW_CONCURRENCY === "true";
}
function loadUserConfig() {
  try {
    const configPath = path3.join(os.homedir(), ".hauntview", "config.json");
    if (fs3.existsSync(configPath)) {
      const content = fs3.readFileSync(configPath, "utf8");
      return JSON.parse(content);
    }
  } catch {
  }
  return null;
}
function resolveConcurrency(options, configOverride) {
  const isHosted = isHostedEnvironment();
  const allowHosted = isConcurrencyAllowedInHosted();
  const userConfig = configOverride ?? loadUserConfig() ?? {};
  let rawConcurrency;
  if (options?.concurrency !== void 0) {
    rawConcurrency = Boolean(options.concurrency);
  } else if (process.env.HAUNT_CONCURRENCY !== void 0) {
    rawConcurrency = process.env.HAUNT_CONCURRENCY === "true" || process.env.HAUNT_CONCURRENCY === "1";
  } else if (userConfig.concurrency !== void 0) {
    rawConcurrency = Boolean(userConfig.concurrency);
  } else {
    rawConcurrency = false;
  }
  let rawAmount;
  if (options?.concurrencyAmount !== void 0) {
    rawAmount = Math.max(1, Math.floor(Number(options.concurrencyAmount)));
  } else if (process.env.HAUNT_CONCURRENCY_AMOUNT !== void 0) {
    const parsed = parseInt(process.env.HAUNT_CONCURRENCY_AMOUNT, 10);
    rawAmount = Number.isNaN(parsed) || parsed < 1 ? 2 : parsed;
  } else if (userConfig.concurrencyAmount !== void 0) {
    rawAmount = Math.max(1, Math.floor(Number(userConfig.concurrencyAmount)));
  } else {
    rawAmount = 2;
  }
  let effectiveConcurrency = rawConcurrency;
  let downgradedDueToHosted = false;
  if (isHosted && !allowHosted && rawConcurrency) {
    effectiveConcurrency = false;
    downgradedDueToHosted = true;
  }
  return {
    concurrency: effectiveConcurrency,
    concurrencyAmount: rawAmount,
    isHosted,
    downgradedDueToHosted
  };
}
async function executeWithConcurrency(tasks, concurrencyLimit, options) {
  const limit = Math.max(1, concurrencyLimit);
  const results = new Array(tasks.length);
  let nextTaskIndex = 0;
  async function worker() {
    while (nextTaskIndex < tasks.length) {
      const currentIndex = nextTaskIndex++;
      try {
        results[currentIndex] = await tasks[currentIndex]();
      } catch (err) {
        if (options?.onFailure) {
          results[currentIndex] = options.onFailure(currentIndex, err);
        } else {
          throw err;
        }
      }
    }
  }
  const workerCount = Math.min(limit, tasks.length);
  const workers = Array.from({ length: workerCount }, () => worker());
  await Promise.all(workers);
  return results;
}

// src/profiles/navigation.ts
async function navigateResilient(page, url, options = {}) {
  const timeout = options.timeout ?? 15e3;
  const settleTimeout = options.settleTimeout ?? 2500;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout });
  if (typeof page.waitForLoadState === "function") {
    let timer;
    try {
      await Promise.race([
        page.waitForLoadState("load", { timeout: settleTimeout }),
        new Promise((resolve3) => {
          timer = setTimeout(resolve3, settleTimeout);
        })
      ]);
    } catch {
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }
}

// src/profiles/mobile.ts
var MobileProfile = class {
  // WCAG recommended
  constructor(profileId, profileName) {
    this.minTouchTargetSize = 48;
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute mobile testing profile
   */
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const viewportMeta = await page.locator('meta[name="viewport"]').count();
      if (viewportMeta === 0) {
        findings.push({
          id: `${this.profileId}-viewport-missing`,
          profileId: this.profileId,
          severity: "error",
          category: "responsive-design",
          message: "Missing viewport meta tag for responsive design",
          location: { file: url, line: 1 },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const interactiveElements = await page.locator("button, a, input, select, textarea").all();
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box) {
          const size = Math.min(box.width, box.height);
          if (size < this.minTouchTargetSize && await element.isVisible()) {
            const tagName = await element.evaluate((el) => el.tagName.toLowerCase()).catch(() => "element");
            const elementId = await element.getAttribute("id");
            const classAttr = await element.getAttribute("class");
            const textContent = await element.evaluate((el) => (el.textContent || "").trim().slice(0, 30)).catch(() => "");
            const selector = elementId ? `#${elementId}` : classAttr ? `${tagName}.${classAttr.split(/\s+/).filter(Boolean).slice(0, 2).join(".")}` : `${tagName}${textContent ? `[text="${textContent}"]` : ""}`;
            findings.push({
              id: `${this.profileId}-small-touch-target-${findings.length + 1}`,
              profileId: this.profileId,
              severity: "warning",
              category: "touch-targets",
              message: `Touch target ${Math.round(box.width)}x${Math.round(box.height)}px is smaller than WCAG recommended ${this.minTouchTargetSize}px`,
              location: {
                selector
              },
              details: {
                actualSize: `${Math.round(box.width)}x${Math.round(box.height)}px`,
                recommendedSize: `${this.minTouchTargetSize}x${this.minTouchTargetSize}px`,
                element: `<${tagName}>${textContent ? ` "${textContent}"` : ""}`
              },
              timestamp: Date.now(),
              isClassified: false
            });
          }
        }
      }
      const scrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });
      if (scrollWidth > 5) {
        findings.push({
          id: `${this.profileId}-horizontal-scroll`,
          profileId: this.profileId,
          severity: "warning",
          category: "responsive-design",
          message: `Page causes horizontal scrolling on mobile (${scrollWidth}px overflow)`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const images = await page.locator("img").all();
      for (const img of images) {
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        const displayWidth = await img.evaluate((el) => el.offsetWidth);
        if (naturalWidth > 0 && displayWidth > 0 && naturalWidth > displayWidth * 1.5) {
          findings.push({
            id: `${this.profileId}-oversized-image`,
            profileId: this.profileId,
            severity: "info",
            category: "performance",
            message: `Image is ${Math.round(naturalWidth / displayWidth * 100)}% larger than displayed size`,
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
      const bodyFontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });
      const fontSizeValue = parseInt(bodyFontSize);
      if (fontSizeValue < 16) {
        findings.push({
          id: `${this.profileId}-small-font`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `Base font size ${bodyFontSize} is smaller than WCAG recommended 16px`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Mobile profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/desktop.ts
var DesktopProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute desktop testing profile
   */
  async execute(page, url, context) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const clsValue = await page.evaluate(() => {
        return new Promise((resolve3) => {
          let cls = 0;
          const observer = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const anyEntry = entry;
              if (anyEntry.hadRecentInput) continue;
              cls += anyEntry.value || 0;
            }
          });
          observer.observe({ type: "layout-shift", buffered: true });
          setTimeout(() => {
            observer.disconnect();
            resolve3(cls);
          }, 3e3);
        });
      });
      if (clsValue > 0.1) {
        findings.push({
          id: `${this.profileId}-cls-poor`,
          profileId: this.profileId,
          severity: "warning",
          category: "performance",
          message: `Cumulative Layout Shift (${clsValue.toFixed(3)}) exceeds WCAG threshold of 0.1`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const stylesheets = await page.locator('link[rel="stylesheet"]').count();
      if (stylesheets > 0) {
        const unusedStyles = await page.evaluate(() => {
          let count = 0;
          for (const sheet of document.styleSheets) {
            try {
              for (const rule of sheet.cssRules || []) {
                const cssRule = rule;
                if (cssRule.selectorText) {
                  const matches = document.querySelectorAll(cssRule.selectorText).length;
                  if (matches === 0) {
                    count++;
                  }
                }
              }
            } catch {
            }
          }
          return count;
        });
        if (unusedStyles > 10) {
          findings.push({
            id: `${this.profileId}-unused-css`,
            profileId: this.profileId,
            severity: "info",
            category: "performance",
            message: `Found approximately ${unusedStyles} unused CSS rules`,
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
      const maxWidth = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return Math.max(body.scrollWidth, html.scrollWidth);
      });
      const viewportWidth = context.viewport.width;
      if (maxWidth > viewportWidth * 0.9) {
        findings.push({
          id: `${this.profileId}-wide-content`,
          profileId: this.profileId,
          severity: "info",
          category: "responsive-design",
          message: `Content width (${maxWidth}px) is near or exceeds viewport width (${viewportWidth}px)`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const imagesWithoutDimensions = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.filter(
          (img) => !img.getAttribute("width") && !img.getAttribute("height") && !window.getComputedStyle(img).width
        ).length;
      });
      if (imagesWithoutDimensions > 0) {
        findings.push({
          id: `${this.profileId}-images-no-dimensions`,
          profileId: this.profileId,
          severity: "warning",
          category: "performance",
          message: `${imagesWithoutDimensions} images lack width/height attributes, may cause layout shift`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute("content");
      if (viewportContent && viewportContent.includes("user-scalable=no")) {
        findings.push({
          id: `${this.profileId}-no-user-zoom`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: "Viewport disables user zoom, violates accessibility guidelines",
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Desktop profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/desktop-4k.ts
var Desktop4KProfile = class {
  constructor(profileId = "desktop-4k", profileName = "Desktop - 4K") {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute desktop 4K testing profile
   */
  async execute(page, url, context) {
    const startTime = Date.now();
    const findings = [];
    const viewportWidth = context?.viewport?.width ?? 3840;
    try {
      await navigateResilient(page, url);
      const imageQualityIssues = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        let upscaledImages = 0;
        let missingSrcset = 0;
        for (const img of images) {
          const rect = img.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            if (img.naturalWidth > 0 && rect.width > img.naturalWidth * 1.5) {
              upscaledImages++;
            }
            if (rect.width > 500 && !img.srcset && !img.closest("picture")) {
              missingSrcset++;
            }
          }
        }
        return { upscaledImages, missingSrcset };
      });
      if (imageQualityIssues.upscaledImages > 0) {
        findings.push({
          id: `${this.profileId}-upscaled-images`,
          profileId: this.profileId,
          severity: "warning",
          category: "responsive-design",
          message: `${imageQualityIssues.upscaledImages} images are upscaled beyond their natural resolution on 4K, resulting in blurriness`,
          details: { count: imageQualityIssues.upscaledImages },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (imageQualityIssues.missingSrcset > 0) {
        findings.push({
          id: `${this.profileId}-missing-highdpi-images`,
          profileId: this.profileId,
          severity: "info",
          category: "responsive-design",
          message: `${imageQualityIssues.missingSrcset} large images lack srcset or <picture> sources for 4K/high-DPI screens`,
          details: { count: imageQualityIssues.missingSrcset },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const typographyChecks = await page.evaluate(() => {
        const textElements = Array.from(
          document.querySelectorAll("p, span, li, a, h1, h2, h3, h4, h5, h6")
        );
        let tinyTextCount = 0;
        let excessiveLineLengthCount = 0;
        for (const el of textElements) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0 && el.textContent?.trim()) {
            if (fontSize < 12) {
              tinyTextCount++;
            }
            if (el.tagName === "P" && rect.width > 1600 && (el.textContent?.length ?? 0) > 120) {
              excessiveLineLengthCount++;
            }
          }
        }
        return { tinyTextCount, excessiveLineLengthCount };
      });
      if (typographyChecks.tinyTextCount > 0) {
        findings.push({
          id: `${this.profileId}-tiny-text`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `${typographyChecks.tinyTextCount} text elements have font sizes below 12px, hindering legibility on 4K displays`,
          details: { count: typographyChecks.tinyTextCount },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (typographyChecks.excessiveLineLengthCount > 0) {
        findings.push({
          id: `${this.profileId}-excessive-line-length`,
          profileId: this.profileId,
          severity: "info",
          category: "responsive-design",
          message: `${typographyChecks.excessiveLineLengthCount} paragraphs exceed optimal reading line length at 4K width (>1600px width)`,
          details: { count: typographyChecks.excessiveLineLengthCount },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const layoutChecks = await page.evaluate((vpWidth) => {
        const body = document.body;
        const html = document.documentElement;
        const scrollWidth = Math.max(body.scrollWidth, html.scrollWidth);
        const hasHorizontalOverflow = scrollWidth > vpWidth + 5;
        const main = document.querySelector("main, #root, #__next, .container, body");
        let unconstrainedContent = false;
        if (main) {
          const style = window.getComputedStyle(main);
          const rect = main.getBoundingClientRect();
          if (style.maxWidth === "none" && rect.width >= vpWidth * 0.95) {
            unconstrainedContent = true;
          }
        }
        const fixedBackgrounds = Array.from(document.querySelectorAll("*")).filter((el) => {
          const s = window.getComputedStyle(el);
          return s.backgroundAttachment === "fixed" && s.backgroundImage !== "none";
        }).length;
        return { scrollWidth, hasHorizontalOverflow, unconstrainedContent, fixedBackgrounds };
      }, viewportWidth);
      if (layoutChecks.hasHorizontalOverflow) {
        findings.push({
          id: `${this.profileId}-horizontal-overflow`,
          profileId: this.profileId,
          severity: "error",
          category: "responsive-design",
          message: `Horizontal overflow detected at 4K: page width (${layoutChecks.scrollWidth}px) exceeds viewport width (${viewportWidth}px)`,
          details: { scrollWidth: layoutChecks.scrollWidth, viewportWidth },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (layoutChecks.unconstrainedContent) {
        findings.push({
          id: `${this.profileId}-unconstrained-layout`,
          profileId: this.profileId,
          severity: "info",
          category: "responsive-design",
          message: "Main content lacks max-width containment, stretching across the entire 4K viewport",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (layoutChecks.fixedBackgrounds > 0) {
        findings.push({
          id: `${this.profileId}-fixed-background-performance`,
          profileId: this.profileId,
          severity: "info",
          category: "performance",
          message: `${layoutChecks.fixedBackgrounds} elements use background-attachment: fixed, which can degrade scrolling performance on 4K displays`,
          details: { count: layoutChecks.fixedBackgrounds },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const clsValue = await page.evaluate(() => {
        return new Promise((resolve3) => {
          let cls = 0;
          try {
            const observer = new PerformanceObserver((entryList) => {
              for (const entry of entryList.getEntries()) {
                const anyEntry = entry;
                if (anyEntry.hadRecentInput) continue;
                cls += anyEntry.value || 0;
              }
            });
            observer.observe({ type: "layout-shift", buffered: true });
            setTimeout(() => {
              observer.disconnect();
              resolve3(cls);
            }, 1500);
          } catch {
            resolve3(0);
          }
        });
      });
      if (clsValue > 0.1) {
        findings.push({
          id: `${this.profileId}-cls-poor`,
          profileId: this.profileId,
          severity: "warning",
          category: "performance",
          message: `Cumulative Layout Shift (${clsValue.toFixed(3)}) on 4K exceeds threshold of 0.1`,
          details: { cls: clsValue },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Desktop 4K profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "chromium",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/console-errors.ts
var ConsoleErrorsProfile = class {
  constructor(profileId, profileName) {
    this.messages = [];
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute console errors testing profile
   */
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    this.messages = [];
    try {
      page.on("console", (msg) => {
        this.messages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location().url
        });
      });
      page.on("pageerror", (error) => {
        this.messages.push({
          type: "error",
          text: error.toString(),
          location: "page-error"
        });
      });
      page.on("requestfailed", (request) => {
        this.messages.push({
          type: "error",
          text: `Request failed: ${request.url()} - ${request.failure()?.errorText}`,
          location: "request-failed"
        });
      });
      await navigateResilient(page, url);
      await page.waitForTimeout(2e3);
      const swErrors = await page.evaluate(() => {
        return new Promise((resolve3) => {
          const errors = [];
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations.forEach((reg) => {
                if (reg.installing?.state === "redundant") {
                  errors.push("Service Worker installation failed");
                }
              });
              resolve3(errors);
            });
          } else {
            resolve3([]);
          }
        });
      });
      for (const msg of this.messages) {
        let severity = "info";
        if (msg.type === "error") {
          severity = "error";
        } else if (msg.type === "warn") {
          severity = "warning";
        }
        if (this.isIgnoredMessage(msg.text)) {
          continue;
        }
        findings.push({
          id: `${this.profileId}-${msg.type}-${findings.length}`,
          profileId: this.profileId,
          severity,
          category: "console",
          message: `${msg.type.toUpperCase()}: ${msg.text}`,
          location: msg.location ? { file: msg.location } : void 0,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      for (const swError of swErrors) {
        findings.push({
          id: `${this.profileId}-sw-error-${findings.length}`,
          profileId: this.profileId,
          severity: "warning",
          category: "console",
          message: `Service Worker: ${swError}`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      page.on("pageerror", (error) => {
        if (error.message.includes("Unhandled promise rejection")) {
          findings.push({
            id: `${this.profileId}-unhandled-rejection-${findings.length}`,
            profileId: this.profileId,
            severity: "error",
            category: "console",
            message: `Unhandled Promise Rejection: ${error.message}`,
            timestamp: Date.now(),
            isClassified: false
          });
        }
      });
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Console errors profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      page.removeAllListeners();
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
  /**
   * Check if message should be ignored
   */
  isIgnoredMessage(text) {
    const ignoredPatterns = [
      /Non-Error promise rejection captured/i,
      /Translation not found/i,
      /ResizeObserver loop limit exceeded/i,
      /Ignored an unsupported entryTypes value/i,
      /Failed to load .*google.*analytics/i,
      /Failed to load extension/i
    ];
    return ignoredPatterns.some((pattern) => pattern.test(text));
  }
};

// src/profiles/tablet.ts
var TabletProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url, context) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute("content");
      if (!viewportContent?.includes("viewport-fit")) {
        findings.push({
          id: `${this.profileId}-viewport-fit`,
          profileId: this.profileId,
          severity: "info",
          category: "responsive-design",
          message: "Missing viewport-fit for safe area handling on tablets",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const orientationMeta = await page.locator("meta").evaluateAll(
        (metas) => metas.some((m) => m.getAttribute("name") === "orientation")
      );
      if (!orientationMeta) {
        findings.push({
          id: `${this.profileId}-orientation-meta`,
          profileId: this.profileId,
          severity: "info",
          category: "responsive-design",
          message: "No orientation meta tag for tablet landscape/portrait handling",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const touchActionStyle = await page.evaluate(() => {
        const root = document.documentElement;
        return window.getComputedStyle(root).touchAction;
      });
      if (touchActionStyle === "pan-x pan-y") {
        findings.push({
          id: `${this.profileId}-touch-action`,
          profileId: this.profileId,
          severity: "info",
          category: "touch-optimization",
          message: "touch-action: pan-x pan-y enables double-tap zoom, consider optimization",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const buttons = await page.locator('button, a, input[type="button"]').all();
      let smallTouchTargets = 0;
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && await button.isVisible()) {
          const size = Math.min(box.width, box.height);
          if (size < 44) {
            smallTouchTargets++;
          }
        }
      }
      if (smallTouchTargets > 0) {
        findings.push({
          id: `${this.profileId}-small-touch-targets`,
          profileId: this.profileId,
          severity: "warning",
          category: "touch-targets",
          message: `${smallTouchTargets} interactive elements smaller than 44px Apple minimum for tablets`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const landWidth = await page.evaluate(() => {
        if (window.matchMedia("(orientation: landscape)").matches) {
          return document.documentElement.scrollWidth;
        }
        return 0;
      });
      if (landWidth > context.viewport.width * 1.1) {
        findings.push({
          id: `${this.profileId}-landscape-overflow`,
          profileId: this.profileId,
          severity: "warning",
          category: "responsive-design",
          message: "Page may have horizontal scroll in landscape mode on tablets",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const modals = await page.locator('[role="dialog"], .modal, .popup').all();
      if (modals.length > 0) {
        for (const modal of modals) {
          const box = await modal.boundingBox();
          if (box && await modal.isVisible()) {
            if (box.width > context.viewport.width * 0.9) {
              findings.push({
                id: `${this.profileId}-modal-width`,
                profileId: this.profileId,
                severity: "info",
                category: "responsive-design",
                message: "Modal/dialog width approaches screen edge on tablet",
                timestamp: Date.now(),
                isClassified: false
              });
              break;
            }
          }
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Tablet profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/performance.ts
var PerformanceProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const vitals = await page.evaluate(() => {
        return new Promise((resolve3) => {
          const vitalsData = {
            fcp: null,
            lcp: null,
            cls: 0,
            tbt: 0,
            tti: null,
            resourceCount: 0,
            totalResourceSize: 0
          };
          const paintEntries = performance.getEntriesByType("paint");
          const fcp = paintEntries.find((e) => e.name === "first-contentful-paint");
          if (fcp) vitalsData.fcp = fcp.startTime;
          const lcpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const lcpEntry = entry;
              vitalsData.lcp = lcpEntry.renderTime || lcpEntry.loadTime || null;
            }
          });
          try {
            lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
          } catch {
          }
          const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const clsEntry = entry;
              if (clsEntry.hadRecentInput) continue;
              vitalsData.cls += clsEntry.value || 0;
            }
          });
          try {
            clsObserver.observe({ type: "layout-shift", buffered: true });
          } catch {
          }
          const resources = performance.getEntriesByType("resource");
          vitalsData.resourceCount = resources.length;
          vitalsData.totalResourceSize = resources.reduce(
            (acc, r) => acc + (r.transferSize || 0),
            0
          );
          setTimeout(() => {
            lcpObserver.disconnect();
            clsObserver.disconnect();
            resolve3(vitalsData);
          }, 3e3);
        });
      });
      if (vitals.fcp && vitals.fcp > 1800) {
        findings.push({
          id: `${this.profileId}-fcp-slow`,
          profileId: this.profileId,
          severity: vitals.fcp > 3e3 ? "error" : "warning",
          category: "performance",
          message: `First Contentful Paint ${vitals.fcp.toFixed(0)}ms exceeds good threshold (1.8s)`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (vitals.lcp && vitals.lcp > 2500) {
        findings.push({
          id: `${this.profileId}-lcp-slow`,
          profileId: this.profileId,
          severity: vitals.lcp > 4e3 ? "error" : "warning",
          category: "performance",
          message: `Largest Contentful Paint ${vitals.lcp.toFixed(0)}ms exceeds good threshold (2.5s)`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (vitals.cls > 0.1) {
        findings.push({
          id: `${this.profileId}-cls-high`,
          profileId: this.profileId,
          severity: vitals.cls > 0.25 ? "error" : "warning",
          category: "performance",
          message: `Cumulative Layout Shift ${vitals.cls.toFixed(3)} exceeds good threshold (0.1)`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (vitals.resourceCount > 100) {
        findings.push({
          id: `${this.profileId}-resource-count`,
          profileId: this.profileId,
          severity: "warning",
          category: "performance",
          message: `Page loads ${vitals.resourceCount} resources, consider consolidation`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const sizeMb = vitals.totalResourceSize / (1024 * 1024);
      if (sizeMb > 5) {
        findings.push({
          id: `${this.profileId}-resource-size`,
          profileId: this.profileId,
          severity: sizeMb > 10 ? "error" : "warning",
          category: "performance",
          message: `Total resource size ${sizeMb.toFixed(1)}MB exceeds recommended ~3MB`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const unminified = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script[src]"));
        return scripts.filter((s) => {
          const src = s.getAttribute("src") || "";
          return src.includes("/src/") || src.endsWith(".js") && !src.includes(".min.");
        }).length;
      });
      if (unminified > 0) {
        findings.push({
          id: `${this.profileId}-unminified-js`,
          profileId: this.profileId,
          severity: "info",
          category: "performance",
          message: `Found ${unminified} potentially unminified JavaScript files`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const renderBlocking = await page.evaluate(() => {
        return performance.getEntriesByType("resource").filter((r) => {
          const url2 = r.name.toLowerCase();
          return (url2.endsWith(".css") || url2.endsWith(".js")) && r.duration > 500;
        }).length;
      });
      if (renderBlocking > 0) {
        findings.push({
          id: `${this.profileId}-render-blocking`,
          profileId: this.profileId,
          severity: "warning",
          category: "performance",
          message: `${renderBlocking} render-blocking resources taking > 500ms`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Performance profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/accessibility-screenreader.ts
var AccessibilityScreenReaderProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const langAttr = await page.locator("html").getAttribute("lang");
      if (!langAttr) {
        findings.push({
          id: `${this.profileId}-no-lang`,
          profileId: this.profileId,
          severity: "error",
          category: "accessibility",
          message: "Missing lang attribute on html element",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const hasMain = await page.locator('main, [role="main"]').count();
      if (hasMain === 0) {
        findings.push({
          id: `${this.profileId}-no-main`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: 'Page missing <main> or role="main" landmark',
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const headings = await page.evaluate(() => {
        const h = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        return h.map((el) => parseInt(el.tagName[1]));
      });
      if (headings.length === 0) {
        findings.push({
          id: `${this.profileId}-no-headings`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: "Page contains no heading elements",
          timestamp: Date.now(),
          isClassified: false
        });
      } else if (headings[0] !== 1) {
        findings.push({
          id: `${this.profileId}-h1-missing`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: "Page should start with <h1> element",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i - 1] + 1) {
          findings.push({
            id: `${this.profileId}-heading-order`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: `Heading order skips level (h${headings[i - 1]} to h${headings[i]})`,
            timestamp: Date.now(),
            isClassified: false
          });
          break;
        }
      }
      const imgsNoAlt = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("img")).filter(
          (img) => !img.getAttribute("alt") || (img.getAttribute("alt") || "").trim() === ""
        ).length;
      });
      if (imgsNoAlt > 0) {
        findings.push({
          id: `${this.profileId}-img-alt`,
          profileId: this.profileId,
          severity: "error",
          category: "accessibility",
          message: `${imgsNoAlt} images missing alt text`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const inputs = await page.locator("input, textarea, select").all();
      let missingLabels = 0;
      for (const input2 of inputs) {
        const id = await input2.getAttribute("id");
        const ariaLabel = await input2.getAttribute("aria-label");
        const ariaLabelledBy = await input2.getAttribute("aria-labelledby");
        if (!ariaLabel && !ariaLabelledBy && id) {
          const label = await page.locator(`label[for="${id}"]`).count();
          if (label === 0) {
            missingLabels++;
          }
        }
      }
      if (missingLabels > 0) {
        findings.push({
          id: `${this.profileId}-form-labels`,
          profileId: this.profileId,
          severity: "error",
          category: "accessibility",
          message: `${missingLabels} form inputs missing associated labels`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const skipLink = await page.locator('a[href="#main"], a[href="#content"]').count();
      if (skipLink === 0) {
        findings.push({
          id: `${this.profileId}-skip-link`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: "Missing skip-to-main-content link",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const ariaErrors = await page.evaluate(() => {
        const errors = [];
        const elements = document.querySelectorAll("[role]");
        for (const el of elements) {
          const role = el.getAttribute("role");
          if (["button", "link", "tab"].includes(role || "")) {
            const actualTag = el.tagName.toLowerCase();
            if (actualTag !== "button" && actualTag !== "a" && !el.getAttribute("aria-pressed") && !el.getAttribute("aria-selected")) {
              errors.push(`Semantic <${actualTag}> with role="${role}"`);
            }
          }
        }
        return errors;
      });
      if (ariaErrors.length > 0) {
        findings.push({
          id: `${this.profileId}-aria-conflicts`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `Found ${ariaErrors.length} potential ARIA/semantic conflicts`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const focusableCount = await page.locator("a, button, input, select, textarea, [tabindex]").count();
      if (focusableCount === 0) {
        findings.push({
          id: `${this.profileId}-no-focusable`,
          profileId: this.profileId,
          severity: "info",
          category: "accessibility",
          message: "Page has no focusable elements",
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Screen reader profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/accessibility-keyboard.ts
var AccessibilityKeyboardProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const positiveTabindex = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll("[tabindex]"));
        return elements.filter(
          (el) => parseInt(el.getAttribute("tabindex") || "0") > 0
        ).length;
      });
      if (positiveTabindex > 0) {
        findings.push({
          id: `${this.profileId}-positive-tabindex`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `${positiveTabindex} elements use positive tabindex, breaks tab order`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const buttons = await page.locator("button, a, input").all();
      let nonKeyboardAccessible = 0;
      for (const button of buttons) {
        const isButton = await button.evaluate((el) => el.tagName === "BUTTON");
        const isLink = await button.evaluate((el) => el.tagName === "A");
        const isInput = await button.evaluate(
          (el) => el.tagName === "INPUT" && ["button", "submit", "reset"].includes(el.type)
        );
        if (!isButton && !isLink && !isInput) {
          const onClick = await button.getAttribute("onclick");
          if (onClick) {
            const onKeyDown = await button.getAttribute("onkeydown");
            if (!onKeyDown) {
              nonKeyboardAccessible++;
            }
          }
        }
      }
      if (nonKeyboardAccessible > 0) {
        findings.push({
          id: `${this.profileId}-non-keyboard-buttons`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `${nonKeyboardAccessible} elements may not be keyboard accessible`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const focusStyles = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return {
          hasFocus: styles.outline !== "none"
        };
      });
      if (!focusStyles.hasFocus) {
        findings.push({
          id: `${this.profileId}-no-focus-styles`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: "Focus indicator not visible with outline styling",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const hasAccessKey = await page.evaluate(() => {
        return document.querySelectorAll("[accesskey]").length > 0;
      });
      if (hasAccessKey) {
        findings.push({
          id: `${this.profileId}-accesskey`,
          profileId: this.profileId,
          severity: "info",
          category: "accessibility",
          message: "Page uses accesskey attribute, should document shortcuts",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const modals = await page.locator('[role="dialog"], .modal').all();
      if (modals.length > 0) {
        const focusTrapped = await modals[0].evaluate(() => {
          const modal = document.querySelector('[role="dialog"], .modal');
          if (!modal) return false;
          const focusableElements = modal.querySelectorAll(
            'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          return focusableElements.length > 0;
        });
        if (!focusTrapped) {
          findings.push({
            id: `${this.profileId}-modal-focus`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: "Modal dialog has no focusable elements",
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
      const formInputs = await page.locator('input[type="text"], textarea').all();
      let tabHandled = 0;
      for (const input2 of formInputs) {
        const onKeyDown = await input2.getAttribute("onkeydown");
        if (onKeyDown?.includes("Tab")) {
          tabHandled++;
        }
      }
      if (tabHandled > 0) {
        findings.push({
          id: `${this.profileId}-tab-handling`,
          profileId: this.profileId,
          severity: "info",
          category: "accessibility",
          message: `${tabHandled} form inputs handle Tab key, ensure escape to native tab works`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const overlays = await page.locator('[role="dialog"], .modal, .popover').all();
      if (overlays.length > 0) {
        const hasEscapeHandler = await overlays[0].evaluate(() => {
          const el = document.querySelector('[role="dialog"], .modal, .popover');
          const listeners = window.getEventListeners?.(el);
          return listeners?.keydown?.some((l) => l.listener.toString().includes("Escape")) ?? false;
        });
        if (!hasEscapeHandler) {
          findings.push({
            id: `${this.profileId}-escape-close`,
            profileId: this.profileId,
            severity: "info",
            category: "accessibility",
            message: "Overlay/modal should close on Escape key",
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Keyboard profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/accessibility-visual.ts
var AccessibilityVisualProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        function getLuminance(r, g, b) {
          const [rs, gs, bs] = [r, g, b].map((x) => {
            x = x / 255;
            return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
          });
          return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
        }
        function getContrast(rgb1, rgb2) {
          const parse = (rgb) => {
            const match = rgb.match(/\d+/g);
            return match ? [parseInt(match[0], 10), parseInt(match[1], 10), parseInt(match[2], 10)] : [0, 0, 0];
          };
          const [r1, g1, b1] = parse(rgb1);
          const [r2, g2, b2] = parse(rgb2);
          const l1 = getLuminance(r1, g1, b1);
          const l2 = getLuminance(r2, g2, b2);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }
        const textElements = document.querySelectorAll(
          "p, span, a, button, label, h1, h2, h3, h4, h5, h6"
        );
        function getEffectiveBg(element) {
          let current = element;
          while (current) {
            const bg = window.getComputedStyle(current).backgroundColor;
            if (bg && bg !== "transparent" && !bg.match(/rgba\([^)]+,\s*0\)/)) {
              return bg;
            }
            current = current.parentElement;
          }
          return "rgb(10, 7, 17)";
        }
        for (const el of textElements) {
          const style = window.getComputedStyle(el);
          const bgColor = getEffectiveBg(el);
          const color = style.color;
          if (bgColor && color && el.offsetHeight > 0) {
            const contrast = getContrast(color, bgColor);
            if (contrast < 4.5) {
              issues.push({
                text: el.textContent?.substring(0, 50),
                contrast: contrast.toFixed(2),
                level: contrast >= 3 ? "AA-large" : "fail"
              });
            }
          }
        }
        return issues;
      });
      if (contrastIssues.length > 0) {
        const failCount = contrastIssues.filter((i) => i.level === "fail").length;
        findings.push({
          id: `${this.profileId}-contrast-ratio`,
          profileId: this.profileId,
          severity: failCount > 0 ? "error" : "warning",
          category: "accessibility",
          message: `${contrastIssues.length} text elements have insufficient color contrast (< 4.5:1)`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const colorOnlyInfo = await page.evaluate(() => {
        const issues = [];
        const elements = document.querySelectorAll(
          '[style*="color"], [class*="red"], [class*="green"], [class*="error"], [class*="success"]'
        );
        for (const el of elements) {
          const text = el.textContent?.trim();
          if (text && text.length < 10 && !text.includes("\u2022") && !text.includes("\u2713") && !text.includes("\xD7")) {
            issues.push(text);
          }
        }
        return issues;
      });
      if (colorOnlyInfo.length > 0) {
        findings.push({
          id: `${this.profileId}-color-only`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `Found ${colorOnlyInfo.length} elements that may use color alone to convey meaning`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const highContrastSupport = await page.evaluate(() => {
        return window.matchMedia("(prefers-contrast: more)").matches;
      });
      if (!highContrastSupport) {
        findings.push({
          id: `${this.profileId}-high-contrast`,
          profileId: this.profileId,
          severity: "info",
          category: "accessibility",
          message: "Consider adding high-contrast mode support with prefers-contrast media query",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const forcedColorsSupport = await page.evaluate(() => {
        return window.matchMedia("(forced-colors: active)").matches;
      });
      if (!forcedColorsSupport) {
        findings.push({
          id: `${this.profileId}-forced-colors`,
          profileId: this.profileId,
          severity: "info",
          category: "accessibility",
          message: "Consider testing with forced colors mode (Windows High Contrast)",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const bgImageText = await page.evaluate(() => {
        let count = 0;
        const elements = document.querySelectorAll(
          '[style*="background-image"], [style*="background"]'
        );
        for (const el of elements) {
          if (el.textContent?.trim().length ?? 0 > 0) {
            count++;
          }
        }
        return count;
      });
      if (bgImageText > 0) {
        findings.push({
          id: `${this.profileId}-bg-image-text`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `${bgImageText} elements have text over background images, verify contrast`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const allowsZoom = await page.evaluate(() => {
        const viewport = document.querySelector('meta[name="viewport"]');
        const content = viewport?.getAttribute("content") || "";
        return !content.includes("user-scalable=no");
      });
      if (!allowsZoom) {
        findings.push({
          id: `${this.profileId}-no-zoom`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: "Page disables user zoom, violates visual accessibility guidelines",
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Visual profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/accessibility-cognitive.ts
var AccessibilityCognitiveProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const complexity = await page.evaluate(() => {
        const elements = document.querySelectorAll("*");
        return {
          elements: elements.length,
          forms: document.querySelectorAll("form").length,
          inputs: document.querySelectorAll("input, select, textarea").length,
          buttons: document.querySelectorAll('button, a[role="button"]').length,
          animations: document.querySelectorAll('[style*="animation"], [style*="transition"]').length,
          nested: Math.max(
            ...Array.from(elements).map((el) => {
              let depth = 0;
              let parent = el.parentElement;
              while (parent) {
                depth++;
                parent = parent.parentElement;
              }
              return depth;
            })
          )
        };
      });
      if (complexity.elements > 500) {
        findings.push({
          id: `${this.profileId}-too-many-elements`,
          profileId: this.profileId,
          severity: "warning",
          category: "cognitive",
          message: `Page has ${complexity.elements} DOM elements, consider simplification`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (complexity.nested > 15) {
        findings.push({
          id: `${this.profileId}-deep-nesting`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: `Maximum nesting depth is ${complexity.nested} levels, consider flattening`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (complexity.animations > 10) {
        findings.push({
          id: `${this.profileId}-excessive-animation`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: `${complexity.animations} animated elements, may overwhelm users`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const autoplay = await page.locator("audio[autoplay], video[autoplay]").count();
      if (autoplay > 0) {
        findings.push({
          id: `${this.profileId}-autoplay`,
          profileId: this.profileId,
          severity: "warning",
          category: "cognitive",
          message: `${autoplay} media elements auto-play, breaks cognitive accessibility`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const reducedMotion = await page.evaluate(() => {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      });
      if (!reducedMotion) {
        findings.push({
          id: `${this.profileId}-no-reduced-motion`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: "Add prefers-reduced-motion media query support for animations",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (complexity.forms > 0) {
        const formComplexity = await page.evaluate(() => {
          const forms = document.querySelectorAll("form");
          const issues = [];
          for (const form of forms) {
            const inputs = form.querySelectorAll("input, select, textarea").length;
            const labels = form.querySelectorAll("label").length;
            if (inputs > 15) {
              issues.push(`Form with ${inputs} fields, consider multi-step`);
            }
            if (inputs > labels) {
              issues.push(`${inputs - labels} form fields missing labels`);
            }
          }
          return issues;
        });
        if (formComplexity.length > 0) {
          findings.push({
            id: `${this.profileId}-form-complexity`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: `Form complexity issue: ${formComplexity[0]}`,
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
      const hasInstructions = await page.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || "";
        return text.includes("step") || text.includes("instructions") || text.includes("how to") || text.includes("guide");
      });
      if (!hasInstructions) {
        findings.push({
          id: `${this.profileId}-no-instructions`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: "Page lacks clear instructions or guidance for users",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const abbreviations = await page.locator("abbr").count();
      const abbreviationsWithTitle = await page.locator("abbr[title]").count();
      if (abbreviations > 0 && abbreviationsWithTitle < abbreviations) {
        findings.push({
          id: `${this.profileId}-unexplained-abbr`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: `${abbreviations - abbreviationsWithTitle} abbreviations lack title/explanation`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const avgWordLength = await page.evaluate(() => {
        const text = document.body.innerText || "";
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 0) return 0;
        const totalChars = words.reduce((sum, w) => sum + w.length, 0);
        return totalChars / words.length;
      });
      if (avgWordLength > 7) {
        findings.push({
          id: `${this.profileId}-complex-language`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: `Average word length ${avgWordLength.toFixed(1)} characters, consider simpler language`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const paragraphs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("p")).filter((p) => {
          const words = p.textContent?.split(/\s+/).length || 0;
          return words > 100;
        }).length;
      });
      if (paragraphs > 0) {
        findings.push({
          id: `${this.profileId}-long-paragraphs`,
          profileId: this.profileId,
          severity: "info",
          category: "cognitive",
          message: `${paragraphs} paragraphs with > 100 words, consider breaking up`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Cognitive profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/i18n-rtl.ts
var I18nRTLProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "language", { value: "ar-SA", writable: false });
      });
      await navigateResilient(page, url);
      const dir = await page.locator("html").getAttribute("dir");
      if (!dir || dir !== "rtl") {
        findings.push({
          id: `${this.profileId}-no-rtl-dir`,
          profileId: this.profileId,
          severity: "error",
          category: "i18n",
          message: 'Missing or incorrect dir="rtl" attribute on html element',
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const textAlign = await page.evaluate(() => {
        const body = document.body;
        return window.getComputedStyle(body).textAlign;
      });
      if (!["inherit", "initial", "auto", "start"].includes(textAlign)) {
        findings.push({
          id: `${this.profileId}-hardcoded-text-align`,
          profileId: this.profileId,
          severity: "warning",
          category: "i18n",
          message: `Text align hardcoded to "${textAlign}", should use logical properties or start/end`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const stylesUseLR = await page.evaluate(() => {
        let count = 0;
        const elements = document.querySelectorAll("[style]");
        for (const el of elements) {
          const style = el.getAttribute("style") || "";
          if (style.includes("margin-left") || style.includes("margin-right") || style.includes("padding-left") || style.includes("padding-right")) {
            count++;
          }
        }
        return count;
      });
      if (stylesUseLR > 5) {
        findings.push({
          id: `${this.profileId}-physical-properties`,
          profileId: this.profileId,
          severity: "warning",
          category: "i18n",
          message: `${stylesUseLR} elements use physical properties (left/right) instead of logical`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const images = await page.locator("img").all();
      let arrowImages = 0;
      for (const img of images) {
        const src = await img.getAttribute("src");
        const alt = await img.getAttribute("alt");
        if ((src?.includes("arrow") || src?.includes("chevron")) && !alt?.includes("rtl")) {
          arrowImages++;
        }
      }
      if (arrowImages > 0) {
        findings.push({
          id: `${this.profileId}-directional-images`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: `${arrowImages} directional images may need RTL-specific versions`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const hasRounded = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="border-radius"]');
        return elements.length > 0;
      });
      if (hasRounded) {
        findings.push({
          id: `${this.profileId}-rounded-checks`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page uses border-radius, verify appearance in RTL context",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const flexDir = await page.evaluate(() => {
        let hasExplicitDir = false;
        const elements = document.querySelectorAll('[style*="flex-direction"]');
        for (const el of elements) {
          const dir2 = el.getAttribute("style");
          if (dir2?.includes("flex-direction: row")) {
            hasExplicitDir = true;
            break;
          }
        }
        return hasExplicitDir;
      });
      if (flexDir) {
        findings.push({
          id: `${this.profileId}-flexbox-direction`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Flexbox direction hardcoded, consider auto-direction in RTL",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const numbers = await page.evaluate(() => {
        const text = document.body.innerText;
        const arabicNumbers = text.match(/٠|١|٢|٣|٤|٥|٦|٧|٨|٩/g);
        const latinNumbers = text.match(/0|1|2|3|4|5|6|7|8|9/g);
        return {
          hasArabic: !!arabicNumbers,
          hasLatin: !!latinNumbers
        };
      });
      if (numbers.hasLatin && !numbers.hasArabic) {
        findings.push({
          id: `${this.profileId}-no-arabic-numerals`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page uses Latin numerals, consider Arabic numerals for RTL",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const formCount = await page.locator("form").count();
      if (formCount > 0) {
        const formDir = await page.locator("form").first().getAttribute("dir");
        if (!formDir) {
          findings.push({
            id: `${this.profileId}-form-no-dir`,
            profileId: this.profileId,
            severity: "info",
            category: "i18n",
            message: "Form elements should inherit or explicitly set dir attribute",
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `RTL profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/i18n-cjk.ts
var I18nCJKProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "language", { value: "ja-JP", writable: false });
      });
      await navigateResilient(page, url);
      const lang = await page.locator("html").getAttribute("lang");
      if (!lang?.startsWith("ja")) {
        findings.push({
          id: `${this.profileId}-no-ja-lang`,
          profileId: this.profileId,
          severity: "warning",
          category: "i18n",
          message: "Page lang attribute not set to Japanese",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      const hasCJKFont = fontFamily.includes("Noto Sans CJK") || fontFamily.includes("Source Han Sans") || fontFamily.includes("HiraginoSans") || fontFamily.includes("\u30E1\u30A4\u30EA\u30AA");
      if (!hasCJKFont && !fontFamily.includes("system-ui")) {
        findings.push({
          id: `${this.profileId}-no-cjk-font`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: `Font stack "${fontFamily}" may not include CJK support`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const lineBreaking = await page.evaluate(() => {
        return window.getComputedStyle(document.body).wordBreak;
      });
      if (lineBreaking === "normal") {
        findings.push({
          id: `${this.profileId}-line-breaking`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Consider word-break properties for CJK text",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const hasRuby = await page.locator("ruby").count();
      if (hasRuby === 0) {
        findings.push({
          id: `${this.profileId}-no-ruby`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "No ruby annotations (furigana) found, consider adding for kanji",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const cjkPunctuation = await page.evaluate(() => {
        const text = document.body.innerText;
        const cjkPunc = /[、。「」『』（）・]/g;
        return text.match(cjkPunc)?.length || 0;
      });
      if (cjkPunctuation === 0) {
        findings.push({
          id: `${this.profileId}-no-cjk-punct`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page contains no CJK-specific punctuation, may use ASCII substitutes",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const textOrientation = await page.evaluate(() => {
        const elements = document.querySelectorAll('[style*="writing-mode"]');
        return elements.length > 0;
      });
      if (!textOrientation) {
        findings.push({
          id: `${this.profileId}-vertical-text`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page lacks vertical text support, common in Japanese",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const letterSpacing = await page.evaluate(() => {
        return window.getComputedStyle(document.body).letterSpacing;
      });
      if (letterSpacing !== "normal" && letterSpacing !== "0px") {
        findings.push({
          id: `${this.profileId}-letter-spacing`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: `Letter-spacing "${letterSpacing}" may distort CJK text`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const hasNumbers = await page.evaluate(() => {
        const text = document.body.innerText;
        return /[0-9]/g.test(text);
      });
      if (hasNumbers) {
        findings.push({
          id: `${this.profileId}-number-format`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page contains numbers, verify proper locale-specific formatting",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const dates = await page.evaluate(() => {
        const text = document.body.innerText;
        const isoDate = /\d{4}-\d{2}-\d{2}/g;
        return text.match(isoDate)?.length || 0;
      });
      if (dates > 0) {
        findings.push({
          id: `${this.profileId}-date-format`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: `${dates} dates using ISO format, consider Japanese format`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `CJK profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/i18n-mixed.ts
var I18nMixedProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "language", { value: "hi-IN", writable: false });
      });
      await navigateResilient(page, url);
      const lang = await page.locator("html").getAttribute("lang");
      if (!lang?.startsWith("hi")) {
        findings.push({
          id: `${this.profileId}-no-hi-lang`,
          profileId: this.profileId,
          severity: "warning",
          category: "i18n",
          message: "Page lang attribute not set to Hindi",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const fontFamily = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontFamily;
      });
      const hasDevanagariFont = fontFamily.includes("Noto Sans Devanagari") || fontFamily.includes("Noto Serif Devanagari") || fontFamily.includes("Mangal") || fontFamily.includes("Kokila");
      if (!hasDevanagariFont && !fontFamily.includes("system-ui")) {
        findings.push({
          id: `${this.profileId}-no-devanagari-font`,
          profileId: this.profileId,
          severity: "warning",
          category: "i18n",
          message: `Font stack "${fontFamily}" may not support Devanagari script`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const diacritics = await page.evaluate(() => {
        const text = document.body.innerText;
        const devanagariDiacritics = text.match(/[\u093E-\u0944]/g);
        return devanagariDiacritics?.length || 0;
      });
      if (diacritics === 0) {
        findings.push({
          id: `${this.profileId}-no-diacritics`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page contains no Devanagari diacritics/vowel signs",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const ligatures = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontVariantLigatures;
      });
      if (ligatures === "none") {
        findings.push({
          id: `${this.profileId}-no-ligatures`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Ligatures disabled (font-variant-ligatures: none), needed for complex scripts",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const lineHeight = await page.evaluate(() => {
        return window.getComputedStyle(document.body).lineHeight;
      });
      if (lineHeight === "normal") {
        findings.push({
          id: `${this.profileId}-line-height`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Consider explicit line-height > 1.2 for complex script readability",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const textRendering = await page.evaluate(() => {
        return window.getComputedStyle(document.body).textRendering;
      });
      if (textRendering !== "geometricPrecision" && textRendering !== "optimizeLegibility") {
        findings.push({
          id: `${this.profileId}-text-rendering`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: `text-rendering: "${textRendering}", consider optimizeLegibility for complex scripts`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const wordSpacing = await page.evaluate(() => {
        return window.getComputedStyle(document.body).wordSpacing;
      });
      if (wordSpacing !== "normal" && wordSpacing !== "0px") {
        findings.push({
          id: `${this.profileId}-word-spacing`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: `word-spacing: "${wordSpacing}" may distort complex script rendering`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const scriptMix = await page.evaluate(() => {
        const text = document.body.innerText;
        const hasDevanagari = /[\u0900-\u097F]/.test(text);
        const hasLatin = /[a-zA-Z]/.test(text);
        const hasNumbers = /[0-9]/.test(text);
        return { hasDevanagari, hasLatin, hasNumbers };
      });
      if (scriptMix.hasLatin && scriptMix.hasDevanagari) {
        findings.push({
          id: `${this.profileId}-script-mixing`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page mixes Latin and Devanagari scripts, verify rendering",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const currency = await page.evaluate(() => {
        const text = document.body.innerText;
        return {
          hasRupeSymbol: text.includes("\u20B9"),
          hasNumbers: /[0-9]/.test(text)
        };
      });
      if (currency.hasNumbers && !currency.hasRupeSymbol) {
        findings.push({
          id: `${this.profileId}-currency`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Page has numbers but no rupee symbol (\u20B9), verify currency formatting",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const vowelRendering = await page.evaluate(() => {
        const elements = document.querySelectorAll("body *");
        let count = 0;
        for (const el of elements) {
          const text = el.textContent || "";
          if (/[\u093F\u0940][\u0915-\u0939]/.test(text)) {
            count++;
          }
        }
        return count;
      });
      if (vowelRendering > 0) {
        findings.push({
          id: `${this.profileId}-vowel-order`,
          profileId: this.profileId,
          severity: "info",
          category: "i18n",
          message: "Verify vowel sign placement in complex script rendering",
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Mixed scripts profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "webkit",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/browser-firefox.ts
var BrowserFirefoxProfile = class {
  constructor(profileId = "browser-firefox", profileName = "Browser - Firefox") {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute Firefox compatibility testing profile
   */
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    const consoleErrors = [];
    const onConsole = (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    };
    page.on("console", onConsole);
    try {
      await navigateResilient(page, url);
      const cssPrefixIssues = await page.evaluate(() => {
        const issues = [];
        let hasWebkitScrollbar = false;
        let hasStandardScrollbar = false;
        let hasWebkitBackdrop = false;
        let hasStandardBackdrop = false;
        let hasWebkitClipText = false;
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              const cssText = rule.cssText || "";
              if (cssText.includes("::-webkit-scrollbar")) {
                hasWebkitScrollbar = true;
              }
              if (cssText.includes("scrollbar-width") || cssText.includes("scrollbar-color")) {
                hasStandardScrollbar = true;
              }
              if (cssText.includes("-webkit-backdrop-filter")) {
                hasWebkitBackdrop = true;
              }
              if (/(?:^|[^-])backdrop-filter\s*:/.test(cssText)) {
                hasStandardBackdrop = true;
              }
              if (cssText.includes("-webkit-background-clip: text")) {
                hasWebkitClipText = true;
              }
            }
          } catch {
          }
        }
        if (hasWebkitScrollbar && !hasStandardScrollbar) {
          issues.push("custom-scrollbar");
        }
        if (hasWebkitBackdrop && !hasStandardBackdrop) {
          issues.push("backdrop-filter");
        }
        if (hasWebkitClipText) {
          issues.push("background-clip-text");
        }
        return issues;
      });
      if (cssPrefixIssues.includes("custom-scrollbar")) {
        findings.push({
          id: `${this.profileId}-webkit-scrollbar`,
          profileId: this.profileId,
          severity: "warning",
          category: "browser-compatibility",
          message: "Page uses ::-webkit-scrollbar without standard scrollbar-width / scrollbar-color, ignored in Firefox",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (cssPrefixIssues.includes("backdrop-filter")) {
        findings.push({
          id: `${this.profileId}-webkit-backdrop`,
          profileId: this.profileId,
          severity: "warning",
          category: "browser-compatibility",
          message: "Page uses -webkit-backdrop-filter without standard backdrop-filter, will not render blur in Firefox",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (cssPrefixIssues.includes("background-clip-text")) {
        findings.push({
          id: `${this.profileId}-background-clip-text`,
          profileId: this.profileId,
          severity: "info",
          category: "browser-compatibility",
          message: "Page uses -webkit-background-clip: text; verify text fill color fallback is defined for Firefox",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const jsCompatibility = await page.evaluate(() => {
        const issues = [];
        const scripts = Array.from(document.querySelectorAll("script"));
        const inlineScriptContent = scripts.map((s) => s.textContent || "").join("\n");
        if (inlineScriptContent.includes("navigator.userAgentData") && !inlineScriptContent.includes("navigator.userAgent")) {
          issues.push("userAgentData-without-fallback");
        }
        if (inlineScriptContent.includes("webkitSpeechRecognition") && !inlineScriptContent.includes("SpeechRecognition")) {
          issues.push("webkitSpeechRecognition-only");
        }
        if (inlineScriptContent.includes("webkitAudioContext") && !inlineScriptContent.includes("AudioContext")) {
          issues.push("webkitAudioContext-only");
        }
        return issues;
      });
      for (const issue of jsCompatibility) {
        findings.push({
          id: `${this.profileId}-${issue}`,
          profileId: this.profileId,
          severity: "error",
          category: "browser-compatibility",
          message: `Script relies on WebKit-specific API "${issue}" without standard fallback, breaks in Firefox`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const formAppearanceIssues = await page.evaluate(() => {
        let unstyledAppearance = 0;
        const selectsAndButtons = Array.from(
          document.querySelectorAll('select, button, input[type="button"]')
        );
        for (const el of selectsAndButtons) {
          const style = window.getComputedStyle(el);
          const hasWebkitAppearance = style["-webkit-appearance"];
          const hasMozAppearance = style["-moz-appearance"];
          if (hasWebkitAppearance === "none" && hasMozAppearance !== "none" && style.appearance !== "none") {
            unstyledAppearance++;
          }
        }
        return unstyledAppearance;
      });
      if (formAppearanceIssues > 0) {
        findings.push({
          id: `${this.profileId}-appearance-property`,
          profileId: this.profileId,
          severity: "info",
          category: "browser-compatibility",
          message: `${formAppearanceIssues} controls use -webkit-appearance without standard appearance or -moz-appearance`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (consoleErrors.length > 0) {
        findings.push({
          id: `${this.profileId}-console-errors`,
          profileId: this.profileId,
          severity: "error",
          category: "console-errors",
          message: `${consoleErrors.length} JavaScript console errors encountered in Firefox engine`,
          details: { errors: consoleErrors.slice(0, 5) },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Firefox profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      page.off("console", onConsole);
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "firefox",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/browser-edge.ts
var BrowserEdgeProfile = class {
  constructor(profileId = "browser-edge", profileName = "Browser - Edge") {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute Edge compatibility testing profile
   */
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    const consoleErrors = [];
    const onConsole = (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    };
    page.on("console", onConsole);
    try {
      await navigateResilient(page, url);
      const forcedColorsAudit = await page.evaluate(() => {
        let svgIconsWithoutFillOrCurrentColor = 0;
        let forcedColorsAdjustNone = 0;
        const svgs = Array.from(document.querySelectorAll("svg"));
        for (const svg of svgs) {
          const style = window.getComputedStyle(svg);
          const fill = style.fill;
          const stroke = style.stroke;
          const attrFill = svg.getAttribute("fill");
          const attrStroke = svg.getAttribute("stroke");
          const hasCurrentColor = attrFill === "currentColor" || attrStroke === "currentColor" || fill === "currentColor" || stroke === "currentColor";
          if (!hasCurrentColor && style.borderWidth === "0px") {
            svgIconsWithoutFillOrCurrentColor++;
          }
        }
        const allElements = Array.from(document.querySelectorAll("*"));
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          if (style["forced-color-adjust"] === "none") {
            forcedColorsAdjustNone++;
          }
        }
        return { svgIconsWithoutFillOrCurrentColor, forcedColorsAdjustNone };
      });
      if (forcedColorsAudit.forcedColorsAdjustNone > 0) {
        findings.push({
          id: `${this.profileId}-forced-colors-none`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: `${forcedColorsAudit.forcedColorsAdjustNone} elements disable forced colors (forced-color-adjust: none), may be unreadable in Windows High Contrast on Edge`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (forcedColorsAudit.svgIconsWithoutFillOrCurrentColor > 10) {
        findings.push({
          id: `${this.profileId}-svg-high-contrast`,
          profileId: this.profileId,
          severity: "info",
          category: "accessibility",
          message: `${forcedColorsAudit.svgIconsWithoutFillOrCurrentColor} SVG icons do not use currentColor, verify visibility in Windows High Contrast on Edge`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const sniffingIssues = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script"));
        const scriptText = scripts.map((s) => s.textContent || "").join("\n");
        const issues = [];
        if (scriptText.includes("/Chrome/.test") && !scriptText.includes("Edg")) {
          issues.push("ua-sniffing-chrome-only");
        }
        return issues;
      });
      if (sniffingIssues.includes("ua-sniffing-chrome-only")) {
        findings.push({
          id: `${this.profileId}-ua-sniffing`,
          profileId: this.profileId,
          severity: "warning",
          category: "browser-compatibility",
          message: "Inline script appears to sniff for Chrome without checking for Edge (Edg/), risking incorrect feature branches",
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const windowsPwaChecks = await page.evaluate(() => {
        const hasManifest = Boolean(document.querySelector('link[rel="manifest"]'));
        const hasThemeColor = Boolean(document.querySelector('meta[name="theme-color"]'));
        const hasTileColor = Boolean(
          document.querySelector('meta[name="msapplication-TileColor"]')
        );
        return { hasManifest, hasThemeColor, hasTileColor };
      });
      if (!windowsPwaChecks.hasManifest) {
        findings.push({
          id: `${this.profileId}-pwa-manifest`,
          profileId: this.profileId,
          severity: "info",
          category: "browser-compatibility",
          message: 'Missing web app manifest (<link rel="manifest">) for Edge PWA and Windows installability',
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (consoleErrors.length > 0) {
        findings.push({
          id: `${this.profileId}-console-errors`,
          profileId: this.profileId,
          severity: "error",
          category: "console-errors",
          message: `${consoleErrors.length} JavaScript console errors encountered during Edge evaluation`,
          details: { errors: consoleErrors.slice(0, 5) },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Edge profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      page.off("console", onConsole);
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "chromium-edge",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/browser-legacy.ts
var BrowserLegacyProfile = class {
  constructor(profileId = "browser-legacy", profileName = "Browser - Legacy") {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  /**
   * Execute legacy browser fallback detection profile
   */
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const xUaCompatible = await page.locator('meta[http-equiv="X-UA-Compatible"]').getAttribute("content", { timeout: 2e3 }).catch(() => null);
      if (!xUaCompatible || !xUaCompatible.includes("IE=edge")) {
        findings.push({
          id: `${this.profileId}-missing-x-ua-compatible`,
          profileId: this.profileId,
          severity: "info",
          category: "browser-compatibility",
          message: 'Missing <meta http-equiv="X-UA-Compatible" content="IE=edge"> tag to prevent IE compatibility view mode',
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const cssAudit = await page.evaluate(() => {
        let cssVarCount = 0;
        let cssGridCount = 0;
        let cssClampCount = 0;
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              const cssText = rule.cssText || "";
              if (cssText.includes("var(--")) {
                cssVarCount++;
              }
              if (cssText.includes("display: grid") || cssText.includes("display: inline-grid")) {
                cssGridCount++;
              }
              if (cssText.includes("clamp(") || cssText.includes("min(") || cssText.includes("max(")) {
                cssClampCount++;
              }
            }
          } catch {
          }
        }
        return { cssVarCount, cssGridCount, cssClampCount };
      });
      if (cssAudit.cssVarCount > 0) {
        findings.push({
          id: `${this.profileId}-css-variables`,
          profileId: this.profileId,
          severity: "warning",
          category: "browser-compatibility",
          message: `CSS Custom Properties (var(--*)) detected in ${cssAudit.cssVarCount} rules; unsupported in IE11 and legacy browsers without build-time post-processing`,
          details: { count: cssAudit.cssVarCount },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (cssAudit.cssGridCount > 0) {
        findings.push({
          id: `${this.profileId}-css-grid`,
          profileId: this.profileId,
          severity: "warning",
          category: "browser-compatibility",
          message: `Modern CSS Grid detected in ${cssAudit.cssGridCount} rules; IE11 requires -ms-grid prefixes or flexbox/float fallbacks`,
          details: { count: cssAudit.cssGridCount },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (cssAudit.cssClampCount > 0) {
        findings.push({
          id: `${this.profileId}-css-clamp-min-max`,
          profileId: this.profileId,
          severity: "info",
          category: "browser-compatibility",
          message: `CSS clamp(), min(), or max() functions used in ${cssAudit.cssClampCount} rules; ignored in IE11 and legacy browsers`,
          details: { count: cssAudit.cssClampCount },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const esCheck = await page.evaluate(() => {
        const scripts = Array.from(
          document.querySelectorAll('script:not([type="application/ld+json"])')
        );
        const inlineCode = scripts.map((s) => s.textContent || "").join("\n");
        const detectedFeatures = [];
        if (/(=>\s*\{|=>\s*[a-zA-Z0-9_\$])/g.test(inlineCode)) {
          detectedFeatures.push("arrow-functions");
        }
        if (/\?\.\w+|\?\?/g.test(inlineCode)) {
          detectedFeatures.push("optional-chaining-or-nullish-coalescing");
        }
        if (/\basync\s+function|\basync\s*\(/g.test(inlineCode)) {
          detectedFeatures.push("async-await");
        }
        return detectedFeatures;
      });
      for (const feature of esCheck) {
        findings.push({
          id: `${this.profileId}-untranspiled-${feature}`,
          profileId: this.profileId,
          severity: "error",
          category: "browser-compatibility",
          message: `Untranspiled modern JavaScript syntax ("${feature}") detected in inline script; causes fatal syntax errors in legacy browsers / IE11`,
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const fallbackAudit = await page.evaluate(() => {
        const hasNoscript = Boolean(document.querySelector("noscript"));
        const bodyText = document.body.textContent?.toLowerCase() || "";
        const hasUnsupportedBrowserWarning = bodyText.includes("browser is not supported") || bodyText.includes("unsupported browser") || bodyText.includes("please update your browser") || bodyText.includes("outdated browser");
        return { hasNoscript, hasUnsupportedBrowserWarning };
      });
      if (!fallbackAudit.hasUnsupportedBrowserWarning && !fallbackAudit.hasNoscript) {
        findings.push({
          id: `${this.profileId}-no-unsupported-browser-warning`,
          profileId: this.profileId,
          severity: "info",
          category: "browser-compatibility",
          message: "No unsupported browser warning banner or <noscript> tag detected to gracefully notify legacy browser users",
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Legacy browser profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "trident-emulation",
        browserVersion: metadata || "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/types/contracts.ts
import { z } from "zod";
var RiteIdSchema = z.enum([
  "full",
  "mobile",
  "tablet",
  "desktop",
  "image-failure",
  "font-failure",
  "js-disabled",
  "reduced-motion",
  "console-errors",
  "offline",
  "accessibility",
  "broken-links",
  "network-resilience",
  "performance",
  "security-hygiene",
  "form-resilience"
]);
var SeveritySchema = z.enum(["info", "warning", "serious"]);
var ConfidenceSchema = z.enum(["observed", "measured", "heuristic"]);
function sanitizeUntrusted(raw) {
  const stripped = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return { untrusted: true, text: stripped.slice(0, 300) };
}
var ConcurrencyOptionsSchema = z.object({
  concurrency: z.boolean().default(false),
  concurrencyAmount: z.number().int().min(1).default(2)
});

// src/types/finding-utils.ts
import { createHash as createHash3 } from "crypto";
function assertValidSeverityConfidence(severity, confidence) {
  if (confidence === "heuristic" && severity === "serious") {
    throw new Error(
      `Invalid combination: confidence 'heuristic' cannot be paired with severity 'serious'. Heuristic findings must be 'info' or 'warning'.`
    );
  }
}
function makeFindingId(ruleId, rite, normalizedLocator) {
  return createHash3("sha256").update(ruleId + rite + normalizedLocator).digest("hex").slice(0, 16);
}
function buildFinding(params) {
  const {
    normalizedLocator,
    ruleId,
    rite,
    severity,
    confidence,
    title,
    summary,
    where,
    evidence,
    investigate
  } = params;
  if (!evidence || evidence.length === 0) {
    throw new Error(
      `Finding '${ruleId}' on rite '${rite}' has no evidence. Every finding must carry at least one piece of evidence.`
    );
  }
  assertValidSeverityConfidence(severity, confidence);
  if (title.length > 90) {
    throw new Error(
      `Finding title exceeds 90 characters (${title.length}): "${title.slice(0, 50)}\u2026"`
    );
  }
  const locator = normalizedLocator ?? where?.selector ?? where?.url ?? "";
  const id = makeFindingId(ruleId, rite, locator);
  return {
    id,
    ruleId,
    rite,
    severity,
    confidence,
    title,
    summary,
    ...where !== void 0 ? { where } : {},
    evidence,
    investigate: investigate ?? []
  };
}

// src/profiles/image-failure.ts
var ImageFailureProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await page.route("**/*", (route) => {
        if (route.request().resourceType() === "image") {
          route.abort();
        } else {
          route.continue();
        }
      });
      await navigateResilient(page, url);
      await page.screenshot({ fullPage: false });
      const captureId = `image-failure-${Date.now()}`;
      const evalResult = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        const missingAlt = [];
        const missingDimensions = [];
        imgs.forEach((img, idx) => {
          const sel = img.id ? `img#${img.id}` : img.className ? `img.${img.className.split(" ")[0]}` : `img:nth-of-type(${idx + 1})`;
          const outerSnippet = img.outerHTML.slice(0, 200);
          if (!img.hasAttribute("alt")) {
            missingAlt.push({ selector: sel, snippet: outerSnippet });
          }
          if (!img.hasAttribute("width") || !img.hasAttribute("height")) {
            missingDimensions.push({ selector: sel, snippet: outerSnippet });
          }
        });
        return {
          missingAlt,
          missingDimensions,
          scrollHeight: document.body.scrollHeight
        };
      });
      if (evalResult.missingAlt.length > 0) {
        const first = evalResult.missingAlt[0];
        const canonical = buildFinding({
          ruleId: "image-failure.missing-alt",
          rite: "image-failure",
          severity: "warning",
          confidence: "observed",
          title: `${evalResult.missingAlt.length} image(s) missing alt attribute`,
          summary: `Images without alt attributes are inaccessible to screen readers. ${evalResult.missingAlt.length} instance(s) found.`,
          where: { selector: first?.selector },
          evidence: [
            { kind: "screenshot", captureId },
            {
              kind: "dom",
              selector: first?.selector ?? "img",
              snippet: sanitizeUntrusted(first?.snippet ?? "")
            }
          ],
          investigate: [
            "Add descriptive alt attributes to all meaningful images.",
            'Use alt="" for decorative images.'
          ]
        });
        findings.push({
          id: `${this.profileId}-missing-alt`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            count: evalResult.missingAlt.length
          },
          timestamp: Date.now(),
          isClassified: false
        });
      }
      if (evalResult.missingDimensions.length > 0) {
        const first = evalResult.missingDimensions[0];
        const canonical = buildFinding({
          ruleId: "image-failure.no-dimensions",
          rite: "image-failure",
          severity: "info",
          confidence: "heuristic",
          title: `${evalResult.missingDimensions.length} image(s) missing width/height attributes`,
          summary: `Images without explicit width and height can cause cumulative layout shift (CLS) when they load.`,
          where: { selector: first?.selector },
          evidence: [
            { kind: "screenshot", captureId },
            {
              kind: "dom",
              selector: first?.selector ?? "img",
              snippet: sanitizeUntrusted(first?.snippet ?? "")
            }
          ],
          investigate: [
            "Add explicit width and height attributes or use CSS aspect-ratio to prevent layout shift."
          ]
        });
        findings.push({
          id: `${this.profileId}-no-dimensions`,
          profileId: this.profileId,
          severity: "info",
          category: "performance",
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            count: evalResult.missingDimensions.length
          },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Image failure profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const browserVersion = page.context().browser()?.version() ?? "unknown";
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/font-failure.ts
var FONT_URL_PATTERNS = [
  /\.woff2?(\?.*)?$/i,
  /\.ttf(\?.*)?$/i,
  /\.otf(\?.*)?$/i,
  /\.eot(\?.*)?$/i,
  /fonts\.googleapis\.com/i,
  /fonts\.gstatic\.com/i,
  /use\.typekit\.net/i,
  /cdn\.fonts\.net/i
];
function isFontRequest(url, resourceType) {
  if (resourceType === "font") return true;
  return FONT_URL_PATTERNS.some((p) => p.test(url));
}
var FontFailureProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      const blockedFontUrls = [];
      await page.route("**/*", (route) => {
        const req = route.request();
        if (isFontRequest(req.url(), req.resourceType())) {
          blockedFontUrls.push(req.url());
          route.abort();
        } else {
          route.continue();
        }
      });
      const baselineHeight = 0;
      await navigateResilient(page, url);
      const postNavHeight = await page.evaluate(() => document.body.scrollHeight);
      const screenshotBuffer = await page.screenshot({ fullPage: false });
      void screenshotBuffer;
      const captureId = `font-failure-${Date.now()}`;
      const bodyTextLen = await page.evaluate(() => document.body.innerText.length);
      const heightChanged = postNavHeight !== baselineHeight && blockedFontUrls.length > 0;
      if (heightChanged || blockedFontUrls.length > 0) {
        const blockedUrl = blockedFontUrls[0] ?? "https://fonts.googleapis.com/css2?family=Dummy";
        const canonical = buildFinding({
          ruleId: "font-failure.layout-shift",
          rite: "font-failure",
          severity: "warning",
          confidence: "measured",
          title: `Font blocking caused potential layout shift (${blockedFontUrls.length} font request(s) blocked)`,
          summary: `When fonts fail to load, fallback fonts can change line heights and element sizes, causing cumulative layout shift. ${blockedFontUrls.length} font resource(s) were blocked.`,
          evidence: [
            { kind: "screenshot", captureId },
            {
              kind: "request",
              url: sanitizeUntrusted(blockedUrl).text,
              method: "GET",
              failure: "blocked by font-failure rite"
            }
          ],
          investigate: [
            "Use font-display: swap or optional to minimize layout shift from font loading.",
            "Define explicit line-heights and letter-spacing to reduce fallback font divergence.",
            `Blocked font URL(s): ${blockedFontUrls.slice(0, 3).join(", ")}`
          ]
        });
        findings.push({
          id: `${this.profileId}-layout-shift`,
          profileId: this.profileId,
          severity: "warning",
          category: "performance",
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            blockedFonts: blockedFontUrls.slice(0, 10),
            bodyTextLength: bodyTextLen
          },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Font failure profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const browserVersion = page.context().browser()?.version() ?? "unknown";
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/js-disabled.ts
var JsDisabledProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(browser, url, profileContext, screenshotManager) {
    const startTime = Date.now();
    const findings = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    };
    let screenshotMeta = null;
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 3e4 });
      const captureId = `js-disabled-${Date.now()}`;
      if (screenshotManager) {
        try {
          screenshotMeta = await screenshotManager.captureScreenshot(
            page,
            this.profileId,
            url,
            viewport,
            { fullPage: false }
          );
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
        }
      } else {
        await page.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
      }
      const evalResult = await page.evaluate(() => {
        const textLen = (document.body?.innerText ?? "").length;
        const hasNoscript = document.querySelector("noscript") !== null;
        const rootEmpty = (document.querySelector("#root,#app,[data-reactroot]")?.childElementCount ?? 1) === 0;
        const bodySnippet = (document.body?.innerHTML ?? "").slice(0, 200);
        return { textLen, hasNoscript, rootEmpty, bodySnippet };
      });
      const isEmpty = evalResult.textLen < 100 || evalResult.rootEmpty;
      if (isEmpty && !evalResult.hasNoscript) {
        const canonical = buildFinding({
          ruleId: "js-disabled.empty-content",
          rite: "js-disabled",
          severity: "warning",
          confidence: "observed",
          title: "Page renders no content without JavaScript and has no <noscript> fallback",
          summary: "When JavaScript is disabled the page body contains fewer than 100 characters and no <noscript> element is present. Users on assistive technologies or with JS blocked see a blank page.",
          evidence: [
            { kind: "screenshot", captureId },
            {
              kind: "dom",
              selector: "body",
              snippet: sanitizeUntrusted(evalResult.bodySnippet)
            }
          ],
          investigate: [
            "Add a <noscript> element with a meaningful fallback message.",
            "Consider server-side rendering to provide content without JavaScript."
          ]
        });
        findings.push({
          id: `${this.profileId}-empty-content`,
          profileId: this.profileId,
          severity: "warning",
          category: "resilience",
          message: canonical.title,
          details: { canonicalFinding: canonical, textLength: evalResult.textLen },
          timestamp: Date.now(),
          isClassified: false
        });
      } else if (isEmpty && evalResult.hasNoscript) {
        const canonical = buildFinding({
          ruleId: "js-disabled.noscript-fallback",
          rite: "js-disabled",
          severity: "info",
          confidence: "observed",
          title: "Page has a <noscript> fallback but renders little content without JavaScript",
          summary: "A <noscript> element is present, but the page body is nearly empty without JavaScript. The noscript fallback may need more content.",
          evidence: [
            { kind: "screenshot", captureId },
            {
              kind: "dom",
              selector: "noscript",
              snippet: sanitizeUntrusted(evalResult.bodySnippet)
            }
          ],
          investigate: ["Review the <noscript> element content to ensure it is helpful to users."]
        });
        findings.push({
          id: `${this.profileId}-noscript-fallback`,
          profileId: this.profileId,
          severity: "info",
          category: "resilience",
          message: canonical.title,
          details: { canonicalFinding: canonical, textLength: evalResult.textLen },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `JS disabled profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      await context.close();
    }
    const endTime = Date.now();
    const browserVersion = browser.version();
    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/reduced-motion.ts
var ReducedMotionProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(browser, url, profileContext, screenshotManager) {
    const startTime = Date.now();
    const findings = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    };
    let screenshotMeta = null;
    const context = await browser.newContext({
      reducedMotion: "reduce",
      forcedColors: "none",
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    try {
      await navigateResilient(page, url);
      const captureId = `reduced-motion-${Date.now()}`;
      if (screenshotManager) {
        try {
          screenshotMeta = await screenshotManager.captureScreenshot(
            page,
            this.profileId,
            url,
            viewport,
            { fullPage: false }
          );
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
        }
      } else {
        await page.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
      }
      const runningCount = await page.evaluate(() => {
        return document.getAnimations().filter((a) => a.playState === "running").length;
      });
      if (runningCount > 0) {
        const canonical = buildFinding({
          ruleId: "reduced-motion.animations-persist",
          rite: "reduced-motion",
          severity: "warning",
          confidence: "observed",
          title: `${runningCount} animation(s) still running under prefers-reduced-motion: reduce`,
          summary: `Users who request reduced motion via OS/browser settings may still see ${runningCount} running animation(s). This can cause discomfort or harm for users with vestibular disorders.`,
          evidence: [
            {
              kind: "metric",
              name: "runningAnimationsUnderReducedMotion",
              value: runningCount,
              unit: "count",
              threshold: 0
            },
            { kind: "screenshot", captureId }
          ],
          investigate: [
            "Wrap animation CSS in `@media (prefers-reduced-motion: no-preference)` blocks.",
            "Alternatively use `@media (prefers-reduced-motion: reduce)` to set animation-duration to 0.001ms.",
            `${runningCount} animation(s) detected via document.getAnimations() with playState === 'running'.`
          ]
        });
        findings.push({
          id: `${this.profileId}-animations-persist`,
          profileId: this.profileId,
          severity: "warning",
          category: "accessibility",
          message: canonical.title,
          details: { canonicalFinding: canonical, runningAnimations: runningCount },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Reduced motion profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      await context.close();
    }
    const endTime = Date.now();
    const browserVersion = browser.version();
    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/offline.ts
var OfflineProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(browser, url, profileContext, screenshotManager) {
    const startTime = Date.now();
    const findings = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    };
    let screenshotMeta = null;
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    const page = await context.newPage();
    try {
      await navigateResilient(page, url);
      const swRegistered = await page.evaluate(async () => {
        if (!("serviceWorker" in navigator)) return false;
        try {
          const regs = await navigator.serviceWorker.getRegistrations();
          return regs.length > 0;
        } catch {
          return false;
        }
      });
      await context.setOffline(true);
      await page.reload({ waitUntil: "domcontentloaded", timeout: 15e3 }).catch(() => {
      });
      const captureId = `offline-${Date.now()}`;
      if (screenshotManager) {
        try {
          screenshotMeta = await screenshotManager.captureScreenshot(
            page,
            this.profileId,
            url,
            viewport,
            { fullPage: false }
          );
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
        }
      } else {
        await page.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
      }
      const visibleTextLen = await page.evaluate(() => (document.body?.innerText ?? "").length).catch(() => 0);
      const hasMinimalContent = visibleTextLen < 50;
      if (!swRegistered && hasMinimalContent) {
        const canonical = buildFinding({
          ruleId: "offline.no-sw-fallback",
          rite: "offline",
          severity: "info",
          confidence: "observed",
          title: "No service worker or offline fallback detected",
          summary: "When the network is unavailable the page shows no content and no service worker is registered to provide an offline fallback.",
          evidence: [
            {
              kind: "metric",
              name: "serviceWorkerRegistered",
              value: 0,
              unit: "boolean"
            },
            { kind: "screenshot", captureId }
          ],
          investigate: [
            "Register a service worker with a cache-first or stale-while-revalidate strategy.",
            "Add an offline fallback page (e.g. /offline.html) to improve resilience."
          ]
        });
        findings.push({
          id: `${this.profileId}-no-sw-fallback`,
          profileId: this.profileId,
          severity: "info",
          category: "resilience",
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            serviceWorkerRegistered: swRegistered,
            visibleTextLength: visibleTextLen
          },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Offline profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      await context.close();
    }
    const endTime = Date.now();
    const browserVersion = browser.version();
    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/broken-links.ts
import pLimit from "p-limit";
var CONCURRENCY = 5;
var TIMEOUT_MS = 8e3;
var INTER_REQUEST_DELAY_MS = 100;
function sleep(ms) {
  return new Promise((resolve3) => setTimeout(resolve3, ms));
}
async function probeUrl(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headRes = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timer);
    return { status: headRes.status, method: "HEAD" };
  } catch {
    clearTimeout(timer);
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
    try {
      const getRes = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller2.signal
      });
      clearTimeout(timer2);
      return { status: getRes.status, method: "GET" };
    } catch (err) {
      clearTimeout(timer2);
      return { status: 0, method: "HEAD", failure: String(err) };
    }
  }
}
var BrokenLinksProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      await navigateResilient(page, url);
      const pageOrigin = new URL(url).origin;
      const hrefs = await page.evaluate((origin) => {
        const anchors = Array.from(document.querySelectorAll("a[href]"));
        const seen = /* @__PURE__ */ new Set();
        const results = [];
        for (const a of anchors) {
          const href = a.href;
          if (!href || seen.has(href)) continue;
          seen.add(href);
          try {
            const u = new URL(href);
            if ((u.protocol === "http:" || u.protocol === "https:") && u.origin === origin && u.hash === "") {
              results.push(href);
            }
          } catch {
          }
          if (results.length >= 100) break;
        }
        return results;
      }, pageOrigin);
      if (hrefs.length === 0) {
        const endTime2 = Date.now();
        const browserVersion2 = page.context().browser()?.version() ?? "unknown";
        return {
          profileId: this.profileId,
          profileName: this.profileName,
          success: true,
          startTime,
          endTime: endTime2,
          duration: endTime2 - startTime,
          findings: [],
          screenshots: [],
          metadata: {
            browserEngine: "chromium",
            browserVersion: browserVersion2 ?? "unknown",
            nodeVersion: process.version
          }
        };
      }
      const limit = pLimit(CONCURRENCY);
      const probeResults = await Promise.all(
        hrefs.map(
          (href) => limit(async () => {
            await sleep(INTER_REQUEST_DELAY_MS);
            const result = await probeUrl(href);
            return { href, ...result };
          })
        )
      );
      for (const probe of probeResults) {
        const safeUrl = sanitizeUntrusted(probe.href).text;
        if (probe.status === 404 || probe.status === 410) {
          const canonical = buildFinding({
            ruleId: "broken-links.not-found",
            rite: "broken-links",
            severity: "warning",
            confidence: "observed",
            title: `Same-origin link returned ${probe.status}: ${safeUrl.slice(0, 60)}`,
            summary: `A same-origin anchor link returned HTTP ${probe.status}, indicating a broken or removed page.`,
            where: { url: safeUrl },
            evidence: [
              {
                kind: "request",
                url: safeUrl,
                method: probe.method,
                status: probe.status
              }
            ],
            investigate: [
              `Fix or redirect the URL: ${safeUrl}`,
              "Check your sitemap and internal linking for stale references."
            ]
          });
          findings.push({
            id: `${this.profileId}-not-found-${findings.length}`,
            profileId: this.profileId,
            severity: "warning",
            category: "links",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false
          });
        } else if (probe.status === 401 || probe.status === 403 || probe.status === 429) {
          const canonical = buildFinding({
            ruleId: "broken-links.auth-required",
            rite: "broken-links",
            severity: "info",
            confidence: "observed",
            title: `Link returned ${probe.status} (inconclusive): ${safeUrl.slice(0, 60)}`,
            summary: `A same-origin link returned HTTP ${probe.status}. This may indicate an auth wall, rate-limit, or intentional restriction rather than a broken link.`,
            where: { url: safeUrl },
            evidence: [
              {
                kind: "request",
                url: safeUrl,
                method: probe.method,
                status: probe.status
              }
            ],
            investigate: [
              "Verify whether this URL is intentionally restricted.",
              "If the link should be public, investigate the access control configuration."
            ]
          });
          findings.push({
            id: `${this.profileId}-auth-required-${findings.length}`,
            profileId: this.profileId,
            severity: "info",
            category: "links",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false
          });
        } else if (probe.status >= 500) {
          const canonical = buildFinding({
            ruleId: "broken-links.server-error",
            rite: "broken-links",
            severity: "warning",
            confidence: "observed",
            title: `Link returned server error ${probe.status}: ${safeUrl.slice(0, 60)}`,
            summary: `A same-origin link returned HTTP ${probe.status}, indicating a server-side error on that page.`,
            where: { url: safeUrl },
            evidence: [
              {
                kind: "request",
                url: safeUrl,
                method: probe.method,
                status: probe.status
              }
            ],
            investigate: [`Investigate server logs for errors on: ${safeUrl}`]
          });
          findings.push({
            id: `${this.profileId}-server-error-${findings.length}`,
            profileId: this.profileId,
            severity: "warning",
            category: "links",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Broken links profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const browserVersion = page.context().browser()?.version() ?? "unknown";
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "chromium",
        browserVersion: browserVersion ?? "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/network-resilience.ts
var NetworkResilienceProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(browser, url, profileContext, screenshotManager) {
    const startTime = Date.now();
    const findings = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    };
    let screenshotMeta = null;
    const baselineContext = await browser.newContext();
    const baselinePage = await baselineContext.newPage();
    const baselineApiUrls = [];
    try {
      baselinePage.on("requestfinished", (req) => {
        const rt = req.resourceType();
        if (rt === "xhr" || rt === "fetch") {
          baselineApiUrls.push(req.url());
        }
      });
      await navigateResilient(baselinePage, url);
    } finally {
      await baselineContext.close();
    }
    if (baselineApiUrls.length === 0) {
      const endTime2 = Date.now();
      const browserVersion2 = browser.version();
      return {
        profileId: this.profileId,
        profileName: this.profileName,
        success: true,
        startTime,
        endTime: endTime2,
        duration: endTime2 - startTime,
        findings: [],
        screenshots: [],
        metadata: {
          browserEngine: "chromium",
          browserVersion: browserVersion2,
          nodeVersion: process.version
        }
      };
    }
    const failContext = await browser.newContext();
    const failPage = await failContext.newPage();
    const pageErrors = [];
    const failedUrls = [];
    try {
      failPage.on("pageerror", (err) => {
        pageErrors.push(err.message);
      });
      await failPage.route("**/*", (route) => {
        const rt = route.request().resourceType();
        if (rt === "xhr" || rt === "fetch") {
          failedUrls.push(route.request().url());
          route.abort();
        } else {
          route.continue();
        }
      });
      await navigateResilient(failPage, url).catch(() => {
      });
      const captureId = `network-resilience-${Date.now()}`;
      if (screenshotManager) {
        try {
          screenshotMeta = await screenshotManager.captureScreenshot(
            failPage,
            this.profileId,
            url,
            viewport,
            { fullPage: false }
          );
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
        }
      } else {
        await failPage.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
      }
      const visibleLen = await failPage.evaluate(() => (document.body?.innerText ?? "").length).catch(() => 0);
      const hasIssues = pageErrors.length > 0 || visibleLen < 50;
      if (hasIssues) {
        const firstFailedUrl = failedUrls[0] ?? url;
        const canonical = buildFinding({
          ruleId: "network-resilience.api-failure",
          rite: "network-resilience",
          severity: "warning",
          confidence: "observed",
          title: `Page shows errors or blank content when API requests are blocked`,
          summary: `When all XHR/fetch requests are aborted, the page ${pageErrors.length > 0 ? "throws JavaScript errors" : "renders minimal content"}. The page does not degrade gracefully when the network is unreliable.`,
          evidence: [
            {
              kind: "request",
              url: sanitizeUntrusted(firstFailedUrl).text,
              method: "GET",
              failure: "aborted by network-resilience rite"
            },
            { kind: "screenshot", captureId }
          ],
          investigate: [
            "Add error boundaries or loading/error states for each API call.",
            "Show a meaningful fallback UI when requests fail.",
            `${failedUrls.length} API request(s) were blocked: ${failedUrls.slice(0, 3).join(", ")}`,
            ...pageErrors.length > 0 ? [`Page errors observed: ${pageErrors.slice(0, 2).join("; ")}`] : []
          ]
        });
        findings.push({
          id: `${this.profileId}-api-failure`,
          profileId: this.profileId,
          severity: "warning",
          category: "resilience",
          message: canonical.title,
          details: {
            canonicalFinding: canonical,
            blockedRequests: failedUrls.length,
            pageErrors: pageErrors.slice(0, 5),
            visibleContentLength: visibleLen
          },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Network resilience profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      await failContext.close();
    }
    const endTime = Date.now();
    const browserVersion = browser.version();
    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/security-hygiene.ts
var HEADER_RULES = [
  {
    name: "content-security-policy",
    severity: "warning",
    ruleId: "security-hygiene.missing-csp",
    httpsOnly: false,
    title: "Content-Security-Policy header is missing",
    summary: "A missing CSP header leaves the page vulnerable to cross-site scripting (XSS) and data injection attacks."
  },
  {
    name: "x-content-type-options",
    severity: "info",
    ruleId: "security-hygiene.missing-xcto",
    httpsOnly: false,
    title: "X-Content-Type-Options header is missing",
    summary: "Without X-Content-Type-Options: nosniff, browsers may MIME-sniff responses away from the declared content type."
  },
  {
    name: "referrer-policy",
    severity: "info",
    ruleId: "security-hygiene.missing-referrer-policy",
    httpsOnly: false,
    title: "Referrer-Policy header is missing",
    summary: "A missing Referrer-Policy may leak sensitive URL information to third-party origins via the Referer header."
  },
  {
    name: "x-frame-options",
    severity: "warning",
    ruleId: "security-hygiene.missing-xfo",
    httpsOnly: false,
    title: "X-Frame-Options header is missing",
    summary: "Without X-Frame-Options or an equivalent frame-ancestors CSP directive, the page is potentially vulnerable to clickjacking."
  },
  {
    name: "strict-transport-security",
    severity: "warning",
    ruleId: "security-hygiene.missing-hsts",
    httpsOnly: true,
    title: "Strict-Transport-Security header is missing on HTTPS",
    summary: "HSTS is absent on an HTTPS page. Without it, browsers may allow downgrade attacks to plain HTTP."
  }
];
var SecurityHygieneProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(page, url) {
    const startTime = Date.now();
    const findings = [];
    try {
      const isHttps = url.toLowerCase().startsWith("https://");
      let responseHeaders = {};
      let mixedContentDetected = false;
      page.on("response", (response) => {
        const req = response.request();
        if (req.isNavigationRequest() && req.resourceType() === "document") {
          const headers = response.headers();
          responseHeaders = headers;
        }
        if (isHttps && response.url().startsWith("http://")) {
          mixedContentDetected = true;
        }
      });
      await navigateResilient(page, url);
      for (const rule of HEADER_RULES) {
        if (rule.httpsOnly && !isHttps) continue;
        const headerValue = responseHeaders[rule.name];
        if (headerValue === void 0) {
          const canonical = buildFinding({
            ruleId: rule.ruleId,
            rite: "security-hygiene",
            severity: rule.severity,
            confidence: "observed",
            title: rule.title,
            summary: rule.summary,
            evidence: [
              {
                kind: "header",
                name: rule.name,
                value: void 0,
                expected: "should be present"
              }
            ],
            investigate: [
              `Add the ${rule.name} response header to your server or CDN configuration.`
            ]
          });
          findings.push({
            id: `${this.profileId}-${rule.ruleId}`,
            profileId: this.profileId,
            severity: rule.severity,
            category: "security",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false
          });
        }
      }
      if (mixedContentDetected) {
        const canonical = buildFinding({
          ruleId: "security-hygiene.mixed-content",
          rite: "security-hygiene",
          severity: "warning",
          confidence: "observed",
          title: "Mixed content detected: HTTP resources loaded on an HTTPS page",
          summary: "Loading HTTP resources on an HTTPS page exposes users to network interception and may trigger browser security warnings.",
          evidence: [
            {
              kind: "header",
              name: "mixed-content",
              value: sanitizeUntrusted("http:// resource detected on https:// page"),
              expected: "all resources should use HTTPS"
            }
          ],
          investigate: [
            "Update all resource URLs to use HTTPS.",
            "Enable a Content-Security-Policy with upgrade-insecure-requests directive."
          ]
        });
        findings.push({
          id: `${this.profileId}-mixed-content`,
          profileId: this.profileId,
          severity: "warning",
          category: "security",
          message: canonical.title,
          details: { canonicalFinding: canonical },
          timestamp: Date.now(),
          isClassified: false
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Security hygiene profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    }
    const endTime = Date.now();
    const browserVersion = page.context().browser()?.version() ?? "unknown";
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: "chromium",
        browserVersion: browserVersion ?? "unknown",
        nodeVersion: process.version
      }
    };
  }
};

// src/profiles/form-resilience.ts
var PAYMENT_AUTOCOMPLETE = /* @__PURE__ */ new Set(["payment", "cc-number", "cc-csc", "cc-exp", "cc-name"]);
function hasPaymentField(formHtml) {
  const autocompleteMatches = formHtml.match(/autocomplete=["']?([^"'\s>]+)/gi) ?? [];
  return autocompleteMatches.some((m) => {
    const val = m.replace(/autocomplete=["']?/i, "").replace(/["']/g, "").toLowerCase();
    return PAYMENT_AUTOCOMPLETE.has(val);
  });
}
var FormResilienceProfile = class {
  constructor(profileId, profileName) {
    this.profileId = profileId;
    this.profileName = profileName;
  }
  async execute(browser, url, profileContext, screenshotManager) {
    const startTime = Date.now();
    const findings = [];
    const viewport = profileContext?.viewport ?? {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      isMobile: false,
      hasTouch: false
    };
    let screenshotMeta = null;
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height }
    });
    await context.route("**/*", (route) => {
      if (route.request().method() !== "GET") {
        route.abort();
      } else {
        route.continue();
      }
    });
    const page = await context.newPage();
    try {
      await navigateResilient(page, url);
      const formData = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("form")).map((form, idx) => {
          const sel = form.id ? `form#${form.id}` : `form:nth-of-type(${idx + 1})`;
          return { selector: sel, outerHtml: form.outerHTML.slice(0, 500) };
        });
      });
      if (formData.length === 0) {
        const endTime2 = Date.now();
        const browserVersion2 = browser.version();
        return {
          profileId: this.profileId,
          profileName: this.profileName,
          success: true,
          startTime,
          endTime: endTime2,
          duration: endTime2 - startTime,
          findings: [],
          screenshots: [],
          metadata: {
            browserEngine: "chromium",
            browserVersion: browserVersion2,
            nodeVersion: process.version
          }
        };
      }
      for (const { selector, outerHtml } of formData) {
        if (hasPaymentField(outerHtml)) continue;
        try {
          const formHandle = page.locator(selector).first();
          await formHandle.evaluate((form) => {
            if (form instanceof HTMLFormElement) {
              const btn = form.querySelector(
                'button[type="submit"], input[type="submit"]'
              );
              if (btn) {
                btn.click();
              } else {
                form.requestSubmit();
              }
            }
          });
          await page.waitForTimeout(500);
          const captureId = `form-resilience-${Date.now()}`;
          if (screenshotManager && !screenshotMeta) {
            try {
              screenshotMeta = await screenshotManager.captureScreenshot(
                page,
                this.profileId,
                url,
                viewport,
                { fullPage: false }
              );
            } catch (screenshotErr) {
              console.warn(`Could not capture screenshot for ${this.profileId}:`, screenshotErr);
            }
          } else {
            await page.screenshot({ fullPage: false }).catch(() => Buffer.alloc(0));
          }
          const validationResult = await page.evaluate((sel) => {
            const form = document.querySelector(sel);
            if (!form) return { invalidCount: 0, ariaInvalidCount: 0, visibleErrorText: "" };
            const invalidFields = form.querySelectorAll(":invalid");
            const ariaInvalidFields = form.querySelectorAll('[aria-invalid="true"]');
            const errorEls = form.querySelectorAll(
              '[role="alert"],[aria-live],[class*="error"],[class*="invalid"],[class*="validation"]'
            );
            const errorText = Array.from(errorEls).map((el) => (el.textContent ?? "").trim()).filter(Boolean).join(" ").slice(0, 200);
            return {
              invalidCount: invalidFields.length,
              ariaInvalidCount: ariaInvalidFields.length,
              visibleErrorText: errorText
            };
          }, selector);
          const hasValidation = validationResult.invalidCount > 0 || validationResult.ariaInvalidCount > 0 || validationResult.visibleErrorText.length > 0;
          if (!hasValidation) {
            const canonical = buildFinding({
              ruleId: "form-resilience.no-validation",
              rite: "form-resilience",
              severity: "warning",
              confidence: "heuristic",
              title: `Form submits without showing validation feedback`,
              summary: `Submitting an empty form (${selector}) produced no :invalid fields, no aria-invalid attributes, and no visible error messages. Users may not understand what went wrong.`,
              where: { selector },
              evidence: [
                { kind: "screenshot", captureId },
                {
                  kind: "dom",
                  selector,
                  snippet: sanitizeUntrusted(outerHtml)
                }
              ],
              investigate: [
                'Add HTML5 required attributes and/or aria-required="true" to mandatory fields.',
                "Display visible error messages near each invalid field.",
                'Use aria-invalid="true" and aria-describedby to associate errors with fields.'
              ]
            });
            findings.push({
              id: `${this.profileId}-no-validation-${findings.length}`,
              profileId: this.profileId,
              severity: "warning",
              category: "forms",
              message: canonical.title,
              details: { canonicalFinding: canonical, selector },
              timestamp: Date.now(),
              isClassified: false
            });
          } else {
            const canonical = buildFinding({
              ruleId: "form-resilience.validation-works",
              rite: "form-resilience",
              severity: "info",
              confidence: "heuristic",
              title: `Form shows validation feedback on empty submit`,
              summary: `Submitting an empty form (${selector}) triggered validation feedback: ${validationResult.invalidCount} invalid field(s), ${validationResult.ariaInvalidCount} aria-invalid field(s).`,
              where: { selector },
              evidence: [
                { kind: "screenshot", captureId },
                {
                  kind: "dom",
                  selector,
                  snippet: sanitizeUntrusted(
                    validationResult.visibleErrorText || outerHtml.slice(0, 200)
                  )
                }
              ],
              investigate: []
            });
            findings.push({
              id: `${this.profileId}-validation-works-${findings.length}`,
              profileId: this.profileId,
              severity: "info",
              category: "forms",
              message: canonical.title,
              details: {
                canonicalFinding: canonical,
                selector,
                invalidFields: validationResult.invalidCount,
                ariaInvalidFields: validationResult.ariaInvalidCount
              },
              timestamp: Date.now(),
              isClassified: false
            });
          }
        } catch {
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: "error",
        category: "execution",
        message: `Form resilience profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false
      });
    } finally {
      await context.close();
    }
    const endTime = Date.now();
    const browserVersion = browser.version();
    if (screenshotMeta) {
      for (const finding of findings) {
        if (!finding.details) finding.details = {};
        finding.details.screenshot = screenshotMeta.fileName;
      }
    }
    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === "error").length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: screenshotMeta ? [screenshotMeta] : [],
      metadata: {
        browserEngine: "chromium",
        browserVersion,
        nodeVersion: process.version
      }
    };
  }
};

// src/engine.ts
var HauntViewEngine = class {
  constructor() {
    this.browsers = /* @__PURE__ */ new Map();
    this.browserLaunchPromises = /* @__PURE__ */ new Map();
    this.profileManager = new ProfileManager();
    this.browserPool = new BrowserPool({
      maxBrowsers: 3,
      maxPagesPerBrowser: 10,
      idleTimeout: 3e4
    });
    this.classifier = new FindingClassifier();
    this.screenshotManager = new ScreenshotManager(".hauntview/screenshots");
  }
  /**
   * Thread-safe browser launcher/acquirer to avoid race conditions during concurrent runs
   */
  async getOrLaunchBrowser(browserType) {
    const existing = this.browsers.get(browserType);
    if (existing && existing.isConnected()) {
      return existing;
    }
    if (this.browserLaunchPromises.has(browserType)) {
      return this.browserLaunchPromises.get(browserType);
    }
    const launchPromise = (async () => {
      let launchedBrowser;
      if (browserType === "firefox") {
        try {
          launchedBrowser = await firefox.launch({ headless: true });
        } catch {
          const options = await getChromiumLaunchOptions();
          launchedBrowser = await chromium.launch({
            headless: true,
            executablePath: options.executablePath,
            args: options.args
          });
        }
      } else if (browserType === "webkit") {
        try {
          launchedBrowser = await webkit.launch({ headless: true });
        } catch {
          const options = await getChromiumLaunchOptions();
          launchedBrowser = await chromium.launch({
            headless: true,
            executablePath: options.executablePath,
            args: options.args
          });
        }
      } else if (browserType === "msedge") {
        try {
          launchedBrowser = await chromium.launch({
            channel: "msedge",
            headless: true
          });
        } catch {
          console.warn(
            "[engine] Microsoft Edge native channel not available. Falling back to Chromium for Edge profile."
          );
          const options = await getChromiumLaunchOptions();
          launchedBrowser = await chromium.launch({
            headless: true,
            executablePath: options.executablePath,
            args: options.args
          });
        }
      } else {
        const options = await getChromiumLaunchOptions();
        launchedBrowser = await chromium.launch({
          headless: true,
          executablePath: options.executablePath,
          args: options.args
        });
      }
      this.browsers.set(browserType, launchedBrowser);
      this.browserPool.registerBrowser(browserType, launchedBrowser);
      return launchedBrowser;
    })().finally(() => {
      this.browserLaunchPromises.delete(browserType);
    });
    this.browserLaunchPromises.set(browserType, launchPromise);
    return launchPromise;
  }
  /**
   * Initialize the engine
   */
  async initialize() {
    await this.screenshotManager.initialize();
  }
  /**
   * Execute test suite
   */
  async executeTests(options) {
    const reportId = `hauntview-${Date.now()}`;
    const startTime = Date.now();
    await this.screenshotManager.initialize();
    let executionOrder = this.profileManager.getOptimalExecutionOrder();
    if (options.profiles && options.profiles.length > 0) {
      executionOrder = executionOrder.filter((p) => options.profiles.includes(p.id));
    }
    const resolved = resolveConcurrency(options);
    if (resolved.downgradedDueToHosted) {
      console.warn(
        "[engine] Hosted environment detected (Render / HAUNT_HOSTED); concurrency was requested but downgraded to sequential to protect host resources."
      );
    }
    const profileResults = [];
    const totalProfiles = executionOrder.length;
    let completedProfiles = 0;
    if (!resolved.concurrency || resolved.concurrencyAmount <= 1) {
      for (const profile of executionOrder) {
        options.onProgress?.({
          completed: completedProfiles,
          total: totalProfiles,
          profileId: profile.id,
          profileName: profile.name,
          status: "start"
        });
        try {
          const context = this.profileManager.createExecutionContext(profile.id);
          if (!context) continue;
          const result = await this.executeProfile(profile.id, options.url, context);
          profileResults.push(result);
          for (const finding of result.findings) {
            const classified = await this.classifier.classify(finding);
            finding.canonicalHash = classified.canonical.canonicalHash;
            finding.isClassified = true;
          }
          this.profileManager.recordExecution(profile.id, result.duration);
          completedProfiles++;
          options.onProgress?.({
            completed: completedProfiles,
            total: totalProfiles,
            profileId: profile.id,
            profileName: profile.name,
            durationMs: result.duration,
            status: result.success ? "done" : "fail",
            findingsCount: result.findings.length
          });
        } catch (error) {
          console.error(`Error executing profile ${profile.id}:`, error);
          completedProfiles++;
          options.onProgress?.({
            completed: completedProfiles,
            total: totalProfiles,
            profileId: profile.id,
            profileName: profile.name,
            durationMs: 0,
            status: "fail",
            findingsCount: 0,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    } else {
      const tasks = executionOrder.map((profile) => async () => {
        options.onProgress?.({
          completed: completedProfiles,
          total: totalProfiles,
          profileId: profile.id,
          profileName: profile.name,
          status: "start"
        });
        const context = this.profileManager.createExecutionContext(profile.id);
        if (!context) return null;
        const result = await this.executeProfile(profile.id, options.url, context);
        for (const finding of result.findings) {
          const classified = await this.classifier.classify(finding);
          finding.canonicalHash = classified.canonical.canonicalHash;
          finding.isClassified = true;
        }
        this.profileManager.recordExecution(profile.id, result.duration);
        completedProfiles++;
        options.onProgress?.({
          completed: completedProfiles,
          total: totalProfiles,
          profileId: profile.id,
          profileName: profile.name,
          durationMs: result.duration,
          status: result.success ? "done" : "fail",
          findingsCount: result.findings.length
        });
        return result;
      });
      const rawResults = await executeWithConcurrency(tasks, resolved.concurrencyAmount, {
        onFailure: (index, error) => {
          const profile = executionOrder[index];
          console.error(`Error executing profile ${profile.id}:`, error);
          completedProfiles++;
          options.onProgress?.({
            completed: completedProfiles,
            total: totalProfiles,
            profileId: profile.id,
            profileName: profile.name,
            durationMs: 0,
            status: "fail",
            findingsCount: 0,
            error: error instanceof Error ? error.message : String(error)
          });
          const failedResult = {
            profileId: profile.id,
            profileName: profile.name,
            success: false,
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 0,
            findings: [],
            screenshots: [],
            error: {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : void 0
            },
            metadata: {
              browserEngine: "playwright",
              browserVersion: "unknown",
              nodeVersion: process.version
            }
          };
          return failedResult;
        }
      });
      for (const res of rawResults) {
        if (res) {
          profileResults.push(res);
        }
      }
    }
    const endTime = Date.now();
    const testReport = this.aggregateResults(
      reportId,
      options.url,
      startTime,
      endTime,
      profileResults
    );
    return testReport;
  }
  /**
   * Execute a single profile
   */
  async executeProfile(profileId, url, context) {
    let browserType = "chromium";
    if (profileId === "browser-webkit") {
      browserType = "webkit";
    } else if (profileId === "browser-firefox") {
      browserType = "firefox";
    } else if (profileId === "browser-edge") {
      browserType = "msedge";
    }
    const browser = await this.getOrLaunchBrowser(browserType);
    const page = await this.browserPool.acquirePage(browserType, context, browser);
    try {
      let profile;
      let result;
      if (profileId === "mobile-iphone15" || profileId === "mobile-android" || profileId === "mobile") {
        profile = new MobileProfile(profileId, "Mobile");
      } else if (profileId === "tablet-ipad" || profileId === "tablet") {
        profile = new TabletProfile(profileId, "Tablet");
      } else if (profileId === "desktop-4k") {
        profile = new Desktop4KProfile(profileId, "Desktop - 4K");
      } else if (profileId === "desktop-1080p" || profileId === "desktop") {
        profile = new DesktopProfile(profileId, "Desktop");
      } else if (profileId === "console-errors") {
        profile = new ConsoleErrorsProfile(profileId, "Console Errors");
      } else if (profileId === "performance") {
        profile = new PerformanceProfile(profileId, "Performance");
      } else if (profileId === "a11y-screenreader") {
        profile = new AccessibilityScreenReaderProfile(profileId, "Accessibility - Screen Reader");
      } else if (profileId === "a11y-keyboard") {
        profile = new AccessibilityKeyboardProfile(profileId, "Accessibility - Keyboard");
      } else if (profileId === "a11y-visual") {
        profile = new AccessibilityVisualProfile(profileId, "Accessibility - Visual");
      } else if (profileId === "a11y-cognitive") {
        profile = new AccessibilityCognitiveProfile(profileId, "Accessibility - Cognitive");
      } else if (profileId === "i18n-rtl") {
        profile = new I18nRTLProfile(profileId, "I18N - RTL (Arabic)");
      } else if (profileId === "i18n-cjk") {
        profile = new I18nCJKProfile(profileId, "I18N - CJK (Japanese)");
      } else if (profileId === "i18n-mixed") {
        profile = new I18nMixedProfile(profileId, "I18N - Mixed Scripts");
      } else if (profileId === "browser-firefox") {
        profile = new BrowserFirefoxProfile(profileId, "Browser - Firefox");
      } else if (profileId === "browser-edge") {
        profile = new BrowserEdgeProfile(profileId, "Browser - Edge");
      } else if (profileId === "browser-legacy") {
        profile = new BrowserLegacyProfile(profileId, "Browser - Legacy");
      } else if (profileId.startsWith("browser-")) {
        profile = new ConsoleErrorsProfile(profileId, `Browser - ${profileId}`);
      } else if (profileId === "image-failure") {
        profile = new ImageFailureProfile(profileId, "Image Failure");
      } else if (profileId === "font-failure") {
        profile = new FontFailureProfile(profileId, "Font Failure");
      } else if (profileId === "broken-links") {
        profile = new BrokenLinksProfile(profileId, "Broken Links");
      } else if (profileId === "security-hygiene") {
        profile = new SecurityHygieneProfile(profileId, "Security Hygiene");
      } else if (profileId === "js-disabled") {
        const p = new JsDisabledProfile(profileId, "JS Disabled");
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === "reduced-motion") {
        const p = new ReducedMotionProfile(profileId, "Reduced Motion");
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === "offline") {
        const p = new OfflineProfile(profileId, "Offline");
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === "network-resilience") {
        const p = new NetworkResilienceProfile(profileId, "Network Resilience");
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === "form-resilience") {
        const p = new FormResilienceProfile(profileId, "Form Resilience");
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else {
        profile = new ConsoleErrorsProfile(profileId, profileId);
      }
      if (!result) {
        result = await profile.execute(page, url, context);
        try {
          const screenshotMeta = await this.screenshotManager.captureScreenshot(
            page,
            profileId,
            url,
            context.viewport,
            { fullPage: false }
          );
          result.screenshots = [screenshotMeta];
          for (const finding of result.findings) {
            if (!finding.details) finding.details = {};
            finding.details.screenshot = screenshotMeta.fileName;
          }
        } catch (screenshotErr) {
          console.warn(`Could not capture screenshot for profile ${profileId}:`, screenshotErr);
        }
      }
      return result;
    } finally {
      this.browserPool.releasePage(page);
    }
  }
  /**
   * Aggregate profile results into test report
   */
  aggregateResults(reportId, url, startTime, endTime, profileResults) {
    const allFindings = profileResults.flatMap((r) => r.findings);
    const deduplicatedFindings = this.classifier.deduplicateFindings(allFindings);
    const findingsBySeverity = {
      error: deduplicatedFindings.filter((f) => f.severity === "error").length,
      warning: deduplicatedFindings.filter((f) => f.severity === "warning").length,
      info: deduplicatedFindings.filter((f) => f.severity === "info").length
    };
    const findingsByCategory = /* @__PURE__ */ new Map();
    for (const finding of deduplicatedFindings) {
      const category = finding.category || "uncategorized";
      findingsByCategory.set(category, (findingsByCategory.get(category) || 0) + 1);
    }
    return {
      id: reportId,
      url,
      startTime,
      endTime,
      duration: endTime - startTime,
      profileResults,
      summary: {
        totalProfiles: profileResults.length,
        successfulProfiles: profileResults.filter((r) => r.success).length,
        failedProfiles: profileResults.filter((r) => !r.success).length,
        totalFindings: deduplicatedFindings.length,
        findingsBySeverity,
        findingsByCategory: Object.fromEntries(findingsByCategory),
        canonicalizedFindings: deduplicatedFindings.filter((f) => f.canonicalHash).length
      }
    };
  }
  /**
   * Clean up resources
   */
  async cleanup() {
    await this.browserPool.closeAll();
    for (const browser of this.browsers.values()) {
      await browser.close();
    }
    this.browsers.clear();
  }
  /**
   * Generate report from test results
   */
  async generateReport(report, options) {
    const generator = ReportFactory.createGenerator(options.format);
    return generator.generate(report, {
      format: options.format,
      includeScreenshots: options.includeScreenshots ?? true
    });
  }
  /**
   * Get engine statistics
   */
  getStats() {
    return {
      browserPool: this.browserPool.getStats(),
      classifier: this.classifier.getStats(),
      screenshots: this.screenshotManager.getStats(),
      profiles: this.profileManager.getProfileCount()
    };
  }
};

// src/lib/server/url-safety.ts
import ipaddr from "ipaddr.js";
import { z as z2 } from "zod";
var TargetUrlSchema = z2.string().min(1, "Target URL is required").max(2048, "URL exceeds maximum length of 2048 characters").refine(
  (val) => {
    try {
      const parsed = new URL(val);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "Only http:// and https:// protocols are supported" }
).refine(
  (val) => {
    try {
      const parsed = new URL(val);
      return !parsed.username && !parsed.password;
    } catch {
      return false;
    }
  },
  { message: "URLs containing embedded credentials are not allowed" }
);
function isSafeIp(ipString, allowLocal = true) {
  if (!ipaddr.isValid(ipString)) {
    return false;
  }
  if (ipString === "169.254.169.254") {
    return false;
  }
  const parsed = ipaddr.parse(ipString);
  const range = parsed.range();
  const alwaysBlockedRanges = [
    "linkLocal",
    // covers 169.254.0.0/16 (including cloud metadata)
    "multicast",
    "broadcast",
    "carrierGradeNat",
    "unspecified"
  ];
  if (alwaysBlockedRanges.includes(range)) {
    return false;
  }
  if (parsed.kind() === "ipv6") {
    const ipv6 = parsed;
    const firstByte = ipv6.parts[0] >> 8;
    const isUniqueLocal = (firstByte & 254) === 252;
    if (isUniqueLocal) {
      return process.env.HAUNT_ALLOW_PRIVATE === "1";
    }
  }
  if (range === "loopback") {
    return allowLocal;
  }
  if (range === "private") {
    return process.env.HAUNT_ALLOW_PRIVATE === "1";
  }
  return true;
}
function validateTargetUrl(input2, options = { allowLocal: true }) {
  const allowLocal = options.allowLocal ?? true;
  const parsedZod = TargetUrlSchema.safeParse(input2.trim());
  if (!parsedZod.success) {
    return {
      valid: false,
      error: parsedZod.error.issues[0]?.message || "Invalid URL format"
    };
  }
  let parsed;
  try {
    parsed = new URL(input2.trim());
  } catch {
    return { valid: false, error: "Could not parse URL" };
  }
  const hostname = parsed.hostname.toLowerCase();
  const isLocalHostName = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".test");
  if (isLocalHostName) {
    if (!allowLocal) {
      return { valid: false, error: "Localhost destinations are not allowed in this mode" };
    }
    return { valid: true, normalizedUrl: parsed.toString() };
  }
  if (ipaddr.isValid(hostname)) {
    if (!isSafeIp(hostname, allowLocal)) {
      return {
        valid: false,
        error: `IP address ${hostname} is blocked for safety reasons`
      };
    }
  }
  return { valid: true, normalizedUrl: parsed.toString() };
}

// src/lib/server/database.ts
import Database from "better-sqlite3";
import fs4 from "fs";
import path4 from "path";
var dbInstance = null;
function getDatabasePath() {
  if (process.env.HAUNT_DB_PATH) {
    const custom = path4.resolve(process.env.HAUNT_DB_PATH);
    const parent = path4.dirname(custom);
    if (!fs4.existsSync(parent)) {
      fs4.mkdirSync(parent, { recursive: true });
    }
    return custom;
  }
  const dataDir = process.env.HAUNT_DATA_DIR ? path4.resolve(process.env.HAUNT_DATA_DIR) : path4.join(process.cwd(), ".hauntview", "data");
  if (!fs4.existsSync(dataDir)) {
    fs4.mkdirSync(dataDir, { recursive: true });
  }
  return path4.join(dataDir, "hauntview.db");
}
function initDatabase(dbPath) {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }
  const resolvedPath = dbPath || getDatabasePath();
  const parentDir = path4.dirname(resolvedPath);
  if (!fs4.existsSync(parentDir)) {
    fs4.mkdirSync(parentDir, { recursive: true });
  }
  const db = new Database(resolvedPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      target_url TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      duration_ms INTEGER,
      selected_profiles TEXT NOT NULL,
      total_findings INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      info_count INTEGER NOT NULL DEFAULT 0,
      html_report_path TEXT,
      markdown_report_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      location TEXT,
      evidence TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      hash TEXT NOT NULL,
      viewport_width INTEGER NOT NULL,
      viewport_height INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings(run_id);
    CREATE INDEX IF NOT EXISTS idx_screenshots_run_id ON screenshots(run_id);
    CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
  `);
  if (!dbPath) {
    dbInstance = db;
  }
  return db;
}
function saveTestReportToDb(report, paths, db) {
  const database = db || initDatabase();
  const insertRun = database.prepare(`
    INSERT OR REPLACE INTO runs (
      id, target_url, status, started_at, completed_at, duration_ms,
      selected_profiles, total_findings, error_count, warning_count, info_count,
      html_report_path, markdown_report_path
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `);
  const selectedProfiles = report.profileResults.map((r) => r.profileId);
  const status = report.summary.failedProfiles > 0 ? "completed_with_findings" : "completed";
  const transaction = database.transaction(() => {
    insertRun.run(
      report.id,
      report.url,
      status,
      report.startTime,
      report.endTime,
      report.duration,
      JSON.stringify(selectedProfiles),
      report.summary.totalFindings,
      report.summary.findingsBySeverity.error,
      report.summary.findingsBySeverity.warning,
      report.summary.findingsBySeverity.info,
      paths?.html || null,
      paths?.markdown || null
    );
    const insertFinding = database.prepare(`
      INSERT OR REPLACE INTO findings (
        id, run_id, profile_id, severity, category, message, location, evidence, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertScreenshot = database.prepare(`
      INSERT OR REPLACE INTO screenshots (
        id, run_id, profile_id, file_name, hash, viewport_width, viewport_height, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const profileResult of report.profileResults) {
      if (profileResult.screenshots) {
        for (const s of profileResult.screenshots) {
          insertScreenshot.run(
            `${report.id}-${s.fileName}`,
            report.id,
            s.profileId,
            s.fileName,
            s.hash,
            s.viewport.width,
            s.viewport.height,
            s.timestamp
          );
        }
      }
      for (const finding of profileResult.findings) {
        insertFinding.run(
          finding.id,
          report.id,
          finding.profileId,
          finding.severity,
          finding.category,
          finding.message,
          finding.location ? JSON.stringify(finding.location) : null,
          finding.details ? JSON.stringify(finding.details) : null,
          finding.timestamp
        );
      }
    }
  });
  transaction();
}

// src/core/system-capability.ts
import * as os2 from "os";
function getLiveSystemSpecs() {
  let logicalCores = 1;
  try {
    if (typeof os2.availableParallelism === "function") {
      logicalCores = os2.availableParallelism();
    } else {
      logicalCores = os2.cpus().length || 1;
    }
  } catch {
    logicalCores = 1;
  }
  let cpuModel = "Generic CPU";
  try {
    const cpus2 = os2.cpus();
    if (cpus2 && cpus2.length > 0 && cpus2[0].model) {
      cpuModel = cpus2[0].model.trim();
    }
  } catch {
  }
  return {
    logicalCores,
    cpuModel,
    totalMemoryBytes: os2.totalmem(),
    freeMemoryBytes: os2.freemem()
  };
}
function evaluateSystemCapability(customSpecs) {
  const specs = customSpecs ?? getLiveSystemSpecs();
  const totalMemoryGb = specs.totalMemoryBytes / (1024 * 1024 * 1024);
  const cpuBound = Math.max(1, Math.floor(specs.logicalCores / 2));
  const ramBound = Math.max(1, Math.floor(totalMemoryGb / 2));
  const isConstrained = specs.logicalCores < 2 || totalMemoryGb < 3.5;
  let recommendedMax;
  let constraintReason;
  if (isConstrained) {
    recommendedMax = 1;
    constraintReason = `Your system has limited hardware resources (${specs.logicalCores} cores, ${totalMemoryGb.toFixed(1)} GB RAM). Concurrency is not recommended and is capped at 1.`;
  } else {
    recommendedMax = Math.max(1, Math.min(cpuBound, ramBound));
  }
  const defaultSuggested = Math.min(2, recommendedMax);
  return {
    cpuBound,
    ramBound,
    recommendedMax,
    defaultSuggested,
    isConstrained,
    constraintReason,
    specs
  };
}
function validateConcurrencyAmount(requested, recommendation) {
  const { recommendedMax, specs } = recommendation;
  const totalMemoryGb = specs.totalMemoryBytes / (1024 * 1024 * 1024);
  if (requested < 1) {
    return {
      valid: false,
      clampedValue: 1,
      errorMessage: "Concurrency amount must be at least 1."
    };
  }
  if (requested > recommendedMax) {
    const errorMessage = `Your ${specs.cpuModel} (${specs.logicalCores} cores/threads, ${totalMemoryGb.toFixed(1)} GB RAM) supports at most ${recommendedMax} concurrent rites; ${requested} would likely freeze the machine.`;
    return {
      valid: false,
      clampedValue: recommendedMax,
      errorMessage
    };
  }
  return {
    valid: true,
    clampedValue: requested
  };
}
function clampConcurrencyAmount(requested, recommendation) {
  const { recommendedMax, specs } = recommendation;
  if (requested > recommendedMax) {
    const totalMemoryGb = specs.totalMemoryBytes / (1024 * 1024 * 1024);
    const warning = `[haunt] Configured concurrency amount (${requested}) exceeds machine recommended limit (${recommendedMax}) for ${specs.cpuModel} (${totalMemoryGb.toFixed(1)} GB RAM). Clamping to ${recommendedMax}.`;
    return {
      effectiveAmount: recommendedMax,
      wasClamped: true,
      warning
    };
  }
  return {
    effectiveAmount: Math.max(1, requested),
    wasClamped: false
  };
}

// src/core/platform.ts
import * as os3 from "os";
import * as path5 from "path";
import * as fs5 from "fs";
function getPlatformInfo() {
  const p = process.platform;
  const isWindows = p === "win32";
  const isMacOS = p === "darwin";
  const isLinux = p === "linux";
  const isUnix = !isWindows;
  let isWSL = false;
  if (isLinux) {
    if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) {
      isWSL = true;
    } else {
      try {
        const procVersion = fs5.readFileSync("/proc/version", "utf8");
        if (/microsoft|wsl/i.test(procVersion)) {
          isWSL = true;
        }
      } catch {
      }
    }
  }
  let osName = os3.type();
  if (isWindows) {
    const rel = os3.release();
    const build = parseInt(rel.split(".")[2] || "0", 10);
    osName = build >= 22e3 ? "Windows 11" : "Windows 10 / Server";
  } else if (isMacOS) {
    osName = "macOS";
  } else if (isLinux) {
    osName = isWSL ? "Linux (WSL)" : "Linux";
  }
  return {
    platform: p,
    arch: os3.arch(),
    isWindows,
    isMacOS,
    isLinux,
    isUnix,
    isWSL,
    release: os3.release(),
    osName
  };
}
function getPlatformConfigDir() {
  if (process.env.HAUNT_CONFIG_DIR) {
    return path5.resolve(process.env.HAUNT_CONFIG_DIR);
  }
  const { isWindows, isMacOS } = getPlatformInfo();
  const home = os3.homedir();
  if (isWindows) {
    const appData = process.env.APPDATA || (process.env.USERPROFILE ? path5.join(process.env.USERPROFILE, "AppData", "Roaming") : path5.join(home, "AppData", "Roaming"));
    return path5.join(appData, "hauntview");
  }
  if (isMacOS) {
    return path5.join(home, "Library", "Preferences", "hauntview");
  }
  const xdgConfig = process.env.XDG_CONFIG_HOME || path5.join(home, ".config");
  return path5.join(xdgConfig, "hauntview");
}
function expandEnvironmentPath(rawPath, baseDir = process.cwd()) {
  if (!rawPath || !rawPath.trim()) {
    return path5.normalize(baseDir);
  }
  let expanded = rawPath.trim();
  expanded = expanded.replace(/%([^%]+)%/g, (_, varName) => {
    return process.env[varName] !== void 0 ? process.env[varName] : `%${varName}%`;
  });
  expanded = expanded.replace(/\$([A-Za-z0-9_]+)/g, (_, varName) => {
    return process.env[varName] !== void 0 ? process.env[varName] : `$${varName}`;
  });
  const home = os3.homedir();
  if (expanded === "~" || expanded === "~/" || expanded === "~\\") {
    expanded = home;
  } else if (expanded.startsWith("~/") || expanded.startsWith("~\\")) {
    expanded = path5.join(home, expanded.slice(2));
  } else if (expanded === ".") {
    expanded = baseDir;
  } else {
    expanded = path5.resolve(baseDir, expanded);
  }
  return path5.normalize(expanded);
}
function probeDirectoryWritability(dirPath) {
  const probeFile = path5.join(
    dirPath,
    `.hauntview-probe-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tmp`
  );
  try {
    fs5.writeFileSync(probeFile, "ok", "utf8");
    fs5.unlinkSync(probeFile);
    return { writable: true };
  } catch (err) {
    return {
      writable: false,
      error: err.message
    };
  }
}
function getTerminalCapabilities() {
  const { isWindows } = getPlatformInfo();
  const isWindowsTerminal = Boolean(process.env.WT_SESSION);
  let shellName = "unknown";
  if (isWindows) {
    if (process.env.PSModulePath) {
      shellName = "PowerShell";
    } else if (process.env.COMSPEC && /cmd\.exe/i.test(process.env.COMSPEC)) {
      shellName = "Command Prompt (cmd.exe)";
    } else {
      shellName = "Windows Console";
    }
  } else {
    shellName = process.env.SHELL ? path5.basename(process.env.SHELL) : "sh";
  }
  let supportsUnicode = false;
  if (isWindows) {
    supportsUnicode = Boolean(
      isWindowsTerminal || process.env.TERMINAL_EMULATOR || process.env.TERM_PROGRAM === "vscode" || process.env.TERM === "xterm-256color" || process.env.TERM === "alacritty" || process.env.ConEmuPID
    );
  } else {
    supportsUnicode = process.env.TERM !== "linux";
  }
  const supportsColor = Boolean(
    process.stdout.isTTY && (process.env.COLORTERM || process.env.TERM || isWindowsTerminal || process.env.TERM_PROGRAM === "vscode")
  );
  return {
    supportsUnicode,
    supportsColor,
    shellName,
    isWindowsTerminal
  };
}
function getAdaptiveGlyphs() {
  const { supportsUnicode } = getTerminalCapabilities();
  if (supportsUnicode) {
    return {
      ghost: "\u{1F47B}",
      tick: "\u2713",
      cross: "\u2717",
      wait: "\u23F3",
      bullet: "\u2022",
      arrow: "\u276F",
      warn: "\u26A0\uFE0F"
    };
  }
  return {
    ghost: "[HauntView]",
    tick: "[OK]",
    cross: "[ERR]",
    wait: "[*]",
    bullet: "-",
    arrow: ">",
    warn: "[!]"
  };
}
function detectEdgeBrowser() {
  const { isWindows, isMacOS, isLinux } = getPlatformInfo();
  if (isWindows) {
    const candidates = [
      process.env["ProgramFiles(x86)"] ? path5.join(
        process.env["ProgramFiles(x86)"],
        "Microsoft",
        "Edge",
        "Application",
        "msedge.exe"
      ) : null,
      process.env.ProgramFiles ? path5.join(process.env.ProgramFiles, "Microsoft", "Edge", "Application", "msedge.exe") : null,
      process.env.LOCALAPPDATA ? path5.join(process.env.LOCALAPPDATA, "Microsoft", "Edge", "Application", "msedge.exe") : null,
      "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
      "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
    ].filter(Boolean);
    for (const candidate of candidates) {
      if (fs5.existsSync(candidate)) {
        return {
          installed: true,
          executablePath: candidate,
          isNativeToPlatform: true
        };
      }
    }
    return {
      installed: false,
      isNativeToPlatform: true
    };
  }
  if (isMacOS) {
    const macPath = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge";
    if (fs5.existsSync(macPath)) {
      return {
        installed: true,
        executablePath: macPath,
        isNativeToPlatform: false
      };
    }
    return { installed: false, isNativeToPlatform: false };
  }
  if (isLinux) {
    const linuxCandidates = [
      "/opt/microsoft/msedge/msedge",
      "/usr/bin/microsoft-edge",
      "/usr/bin/microsoft-edge-stable"
    ];
    for (const p of linuxCandidates) {
      if (fs5.existsSync(p)) {
        return {
          installed: true,
          executablePath: p,
          isNativeToPlatform: false
        };
      }
    }
    return { installed: false, isNativeToPlatform: false };
  }
  return { installed: false, isNativeToPlatform: false };
}
function getNpxCommand(args) {
  const { isWindows } = getPlatformInfo();
  if (isWindows) {
    return {
      command: `npx.cmd ${args}`,
      options: { shell: process.env.ComSpec || "cmd.exe" }
    };
  }
  return {
    command: `npx ${args}`,
    options: { shell: process.env.SHELL || "/bin/sh" }
  };
}
function getPlatformTroubleshootingAdvice() {
  const { isWindows, isMacOS, isLinux, isWSL } = getPlatformInfo();
  const tips = [];
  if (isWindows) {
    tips.push("Windows Setup & Troubleshooting:");
    tips.push(
      "  \u2022 Execution Policy: If PowerShell scripts are blocked, execute: Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned"
    );
    tips.push(
      "  \u2022 Terminal: Use Windows Terminal (msstore) for high-fidelity Unicode glyphs and colors."
    );
    tips.push(
      "  \u2022 Native Edge: Microsoft Edge runs with native high-contrast and Windows integration."
    );
    tips.push(
      "  \u2022 Manual Browser Installation: run `npx.cmd playwright install chromium firefox webkit`"
    );
  } else if (isWSL) {
    tips.push("Windows Subsystem for Linux (WSL) Notes:");
    tips.push("  \u2022 Install Linux browser dependencies: sudo npx playwright install-deps");
    tips.push(
      "  \u2022 If running headless inside WSL2 without X11/Wayland, standard headless mode is used."
    );
  } else if (isMacOS) {
    tips.push("macOS Setup & Troubleshooting:");
    tips.push("  \u2022 If necessary, install Xcode command-line tools: xcode-select --install");
    tips.push("  \u2022 Manual Browser Installation: run `npx playwright install`");
  } else if (isLinux) {
    tips.push("Linux Setup & Troubleshooting:");
    tips.push(
      "  \u2022 Shared system libraries for Chromium and WebKit can be installed via: sudo npx playwright install-deps"
    );
  }
  return tips;
}

// src/cli/config.ts
import * as fs6 from "fs";
import * as path6 from "path";
var DEFAULT_CLI_CONFIG = {
  defaultFormats: ["zip", "html"],
  exportDir: ".",
  concurrency: false,
  concurrencyAmount: 2
};
function getCliConfigDir() {
  return getPlatformConfigDir();
}
function getCliConfigFile() {
  return path6.join(getCliConfigDir(), "config.json");
}
function loadCliConfig() {
  const configFile = getCliConfigFile();
  try {
    if (fs6.existsSync(configFile)) {
      const data = JSON.parse(fs6.readFileSync(configFile, "utf8"));
      return {
        defaultFormats: Array.isArray(data.defaultFormats) ? data.defaultFormats : DEFAULT_CLI_CONFIG.defaultFormats,
        exportDir: typeof data.exportDir === "string" ? data.exportDir : DEFAULT_CLI_CONFIG.exportDir,
        concurrency: typeof data.concurrency === "boolean" ? data.concurrency : DEFAULT_CLI_CONFIG.concurrency,
        concurrencyAmount: typeof data.concurrencyAmount === "number" && data.concurrencyAmount >= 1 ? data.concurrencyAmount : DEFAULT_CLI_CONFIG.concurrencyAmount
      };
    }
  } catch {
  }
  return { ...DEFAULT_CLI_CONFIG };
}
function saveCliConfig(config) {
  const dir = getCliConfigDir();
  if (!fs6.existsSync(dir)) {
    fs6.mkdirSync(dir, { recursive: true });
  }
  const configFile = getCliConfigFile();
  fs6.writeFileSync(configFile, JSON.stringify(config, null, 2), "utf8");
}
function resetCliConfig() {
  saveCliConfig(DEFAULT_CLI_CONFIG);
}
function expandAndValidatePath(rawPath, options) {
  if (!rawPath || !rawPath.trim()) {
    return {
      valid: false,
      resolvedPath: process.cwd(),
      error: "Path cannot be empty."
    };
  }
  const expanded = expandEnvironmentPath(rawPath, process.cwd());
  const createIfMissing = options?.createIfMissing ?? true;
  try {
    if (!fs6.existsSync(expanded)) {
      if (createIfMissing) {
        fs6.mkdirSync(expanded, { recursive: true });
      } else {
        return {
          valid: false,
          resolvedPath: expanded,
          error: `Directory does not exist: ${expanded}`
        };
      }
    }
    const stat2 = fs6.statSync(expanded);
    if (!stat2.isDirectory()) {
      return {
        valid: false,
        resolvedPath: expanded,
        error: `Path exists but is not a directory: ${expanded}`
      };
    }
    const probe = probeDirectoryWritability(expanded);
    if (!probe.writable) {
      return {
        valid: false,
        resolvedPath: expanded,
        error: `Directory is not accessible or writable: ${probe.error || "Access denied"}`
      };
    }
    return {
      valid: true,
      resolvedPath: expanded
    };
  } catch (err) {
    return {
      valid: false,
      resolvedPath: expanded,
      error: `Directory is not accessible or writable: ${err.message}`
    };
  }
}

// src/cli/browsers.ts
import * as fs7 from "fs";
import * as path7 from "path";
import { execSync } from "child_process";
import { chromium as chromium2, firefox as firefox2, webkit as webkit2 } from "playwright";
function getBrowsersStatus(options) {
  const browsers = [
    { name: "chromium", installed: false },
    { name: "firefox", installed: false },
    { name: "webkit", installed: false }
  ];
  try {
    const p = chromium2.executablePath();
    browsers[0].installed = fs7.existsSync(p);
    browsers[0].executablePath = p;
  } catch {
    browsers[0].installed = false;
  }
  try {
    const p = firefox2.executablePath();
    browsers[1].installed = fs7.existsSync(p);
    browsers[1].executablePath = p;
  } catch {
    browsers[1].installed = false;
  }
  try {
    const p = webkit2.executablePath();
    browsers[2].installed = fs7.existsSync(p);
    browsers[2].executablePath = p;
  } catch {
    browsers[2].installed = false;
  }
  if (options?.includeEdge) {
    const edge = detectEdgeBrowser();
    browsers.push({
      name: "msedge",
      installed: edge.installed,
      executablePath: edge.executablePath,
      isNative: edge.isNativeToPlatform
    });
  }
  return browsers;
}
function getAllBrowsersStatus() {
  return getBrowsersStatus({ includeEdge: true });
}
function areAllBrowsersInstalled() {
  const status = getBrowsersStatus();
  return status.slice(0, 3).every((b) => b.installed);
}
function getMarkerPath() {
  return path7.join(getCliConfigDir(), "browsers-installed.json");
}
function ensureBrowsersInstalled(options) {
  const marker = getMarkerPath();
  const allInstalled = areAllBrowsersInstalled();
  if (allInstalled && fs7.existsSync(marker)) {
    return;
  }
  if (!options?.silent) {
    console.log(
      "\n[haunt] First run detected \u2014 installing Playwright browsers (Chromium, Firefox, WebKit)..."
    );
    console.log(
      "[haunt] This is a one-time download (~350 MB) required for full website resilience rites.\n"
    );
  }
  try {
    const { command, options: execOptions } = getNpxCommand(
      "playwright install chromium firefox webkit"
    );
    execSync(command, {
      stdio: options?.silent ? "pipe" : "inherit",
      shell: execOptions.shell
    });
    const dir = getCliConfigDir();
    if (!fs7.existsSync(dir)) {
      fs7.mkdirSync(dir, { recursive: true });
    }
    fs7.writeFileSync(
      marker,
      JSON.stringify({ installedAt: (/* @__PURE__ */ new Date()).toISOString() }, null, 2),
      "utf8"
    );
    if (!options?.silent) {
      console.log("\n\u2713 [haunt] All browsers installed successfully.\n");
    }
  } catch (err) {
    console.error("\n\u2717 [haunt] Failed to automatically install Playwright browsers:");
    console.error(`  ${err.message}
`);
    const advice = getPlatformTroubleshootingAdvice();
    for (const line of advice) {
      console.warn(line);
    }
    console.log();
  }
}

// src/cli/runner.ts
var TerminalProgressTracker = class {
  constructor() {
    this.spinnerIdx = 0;
    this.timer = null;
    this.activeProfiles = /* @__PURE__ */ new Map();
    this.completed = 0;
    this.total = 0;
    this.isTTY = Boolean(process.stdout.isTTY);
    const caps = getTerminalCapabilities();
    this.supportsUnicode = caps.supportsUnicode;
    this.glyphs = getAdaptiveGlyphs();
    this.spinnerFrames = this.supportsUnicode ? ["\u280B", "\u2819", "\u2839", "\u2838", "\u283C", "\u2834", "\u2826", "\u2827", "\u2807", "\u280F"] : ["-", "\\", "|", "/"];
  }
  start(total) {
    this.total = total;
    this.completed = 0;
    if (this.isTTY) {
      this.timer = setInterval(() => this.render(), 100);
      this.timer.unref();
    }
  }
  update(event) {
    if (event.status === "start") {
      this.activeProfiles.set(event.profileId, Date.now());
      if (this.isTTY) {
        this.render();
      }
    } else {
      this.activeProfiles.delete(event.profileId);
      this.completed = event.completed;
      this.clearLine();
      const glyph = event.status === "done" ? this.glyphs.tick : this.glyphs.cross;
      const durSec = event.durationMs !== void 0 ? `${(event.durationMs / 1e3).toFixed(1)}s` : "";
      const findingsSummary = event.findingsCount !== void 0 ? event.findingsCount === 1 ? "1 finding" : `${event.findingsCount} findings` : "";
      const details = [durSec, findingsSummary].filter(Boolean).join(", ");
      const padIndex = String(event.completed).padStart(2);
      const padTotal = String(event.total);
      console.log(
        `  ${glyph} [${padIndex}/${padTotal}] ${event.profileId}${details ? ` (${details})` : ""}`
      );
      if (this.isTTY && this.completed < this.total) {
        this.render();
      }
    }
  }
  finish() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.clearLine();
  }
  clearLine() {
    if (this.isTTY) {
      process.stdout.write("\r\x1B[2K");
    }
  }
  render() {
    if (!this.isTTY || this.total === 0) return;
    const pct = Math.floor(this.completed / this.total * 100);
    const barWidth = 18;
    const filled = Math.min(barWidth, Math.round(barWidth * this.completed / this.total));
    const fillChar = this.supportsUnicode ? "\u2588" : "#";
    const emptyChar = this.supportsUnicode ? "\u2591" : "-";
    const bar = fillChar.repeat(filled) + emptyChar.repeat(barWidth - filled);
    const spinner = this.spinnerFrames[this.spinnerIdx++ % this.spinnerFrames.length];
    const running = Array.from(this.activeProfiles.keys()).join(", ") || "preparing rites...";
    const statusLine = `  [${bar}] ${this.completed}/${this.total} (${pct}%) ${spinner} Running: ${running}`;
    const cols = process.stdout.columns || 80;
    const truncated = statusLine.length > cols - 2 ? statusLine.slice(0, Math.max(10, cols - 5)) + "..." : statusLine;
    process.stdout.write(`\r\x1B[2K${truncated}`);
  }
};
async function runHaunt(targetUrl, options) {
  const urlValidation = validateTargetUrl(targetUrl, { allowLocal: true });
  if (!urlValidation.valid) {
    console.error(`
\u2717 [haunt] Invalid URL: ${urlValidation.error}
`);
    process.exit(1);
  }
  const cleanUrl = urlValidation.normalizedUrl || targetUrl;
  ensureBrowsersInstalled();
  const config = loadCliConfig();
  const exportPathResult = expandAndValidatePath(options.outDir || config.exportDir, {
    createIfMissing: true
  });
  if (!exportPathResult.valid) {
    console.error(`
\u2717 [haunt] Export directory error: ${exportPathResult.error}
`);
    process.exit(1);
  }
  const exportDir = exportPathResult.resolvedPath;
  let chosenFormats = [];
  if (options.output) {
    const rawTokens = options.output.split(",").map((t) => t.trim().toLowerCase());
    for (const t of rawTokens) {
      if (t === "html") chosenFormats.push("html");
      else if (t === "md" || t === "markdown") chosenFormats.push("markdown");
      else if (t === "zip" || t === "bundle") chosenFormats.push("zip");
      else if (t === "json") chosenFormats.push("json");
    }
  } else if (options.interactive) {
    try {
      chosenFormats = await checkbox({
        message: "What output would you like to generate?",
        choices: [
          {
            name: "Zip (Complete archive: HTML, Markdown, screenshots, evidence plates)",
            value: "zip",
            checked: config.defaultFormats.includes("zip")
          },
          {
            name: "HTML (Interactive standalone spectral executive report plate)",
            value: "html",
            checked: config.defaultFormats.includes("html")
          },
          {
            name: "Markdown (Dev-ready GitHub Flavored markdown summary)",
            value: "markdown",
            checked: config.defaultFormats.includes("markdown")
          }
        ],
        validate: (choices) => choices.length > 0 ? true : "Please select at least one format."
      });
    } catch {
      chosenFormats = config.defaultFormats;
    }
  } else {
    chosenFormats = config.defaultFormats && config.defaultFormats.length > 0 ? config.defaultFormats : DEFAULT_CLI_CONFIG.defaultFormats;
  }
  const rawConcurrencyAmount = options.concurrencyAmount ? parseInt(options.concurrencyAmount, 10) : void 0;
  const resolved = resolveConcurrency(
    {
      concurrency: options.concurrency,
      concurrencyAmount: rawConcurrencyAmount
    },
    config
  );
  const cap = evaluateSystemCapability();
  const { effectiveAmount, wasClamped, warning } = clampConcurrencyAmount(
    resolved.concurrencyAmount,
    cap
  );
  if (wasClamped && warning && resolved.concurrency) {
    console.warn(`
! ${warning}
`);
  }
  const effectiveConcurrency = resolved.concurrency;
  const finalConcurrencyAmount = effectiveAmount;
  console.log(`
\u{1F47B} Haunting ${cleanUrl}...`);
  if (effectiveConcurrency) {
    console.log(
      `\u26A1 Concurrency active: running up to ${finalConcurrencyAmount} profiles simultaneously.
`
    );
  } else {
    console.log("\u23F3 Running profiles sequentially (safe mode).\n");
  }
  const engine = new HauntViewEngine();
  await engine.initialize();
  const requestedProfiles = options.profiles ? options.profiles.split(",").map((p) => p.trim()) : void 0;
  const tracker = new TerminalProgressTracker();
  const report = await engine.executeTests({
    url: cleanUrl,
    profiles: requestedProfiles,
    concurrency: effectiveConcurrency,
    concurrencyAmount: finalConcurrencyAmount,
    includeScreenshots: true,
    onProgress: (update) => {
      tracker.update(update);
    }
  });
  tracker.finish();
  try {
    saveTestReportToDb(report);
  } catch {
  }
  const writtenFiles = [];
  for (const fmt of chosenFormats) {
    try {
      const generator = ReportFactory.createGenerator(fmt);
      const generated = await generator.generate(report, {
        format: fmt,
        includeScreenshots: true
      });
      const ext = fmt === "markdown" ? "md" : fmt;
      const fileName = `${report.id}.${ext}`;
      const destPath = path8.join(exportDir, fileName);
      fs8.writeFileSync(destPath, generated.content);
      writtenFiles.push(path8.resolve(destPath));
    } catch (err) {
      console.error(`\u2717 Failed to generate ${fmt} report: ${err.message}`);
    }
  }
  console.log("\n========================================");
  console.log(`  HauntView S\xE9ance Complete: ${report.id}`);
  console.log("========================================");
  console.log(`  Target URL:       ${report.url}`);
  console.log(`  Duration:         ${(report.duration / 1e3).toFixed(1)}s`);
  console.log(`  Profiles Run:     ${report.profileResults.length}`);
  console.log(`  Total Findings:   ${report.summary.totalFindings}`);
  console.log(`    - Errors:       ${report.summary.findingsBySeverity.error}`);
  console.log(`    - Warnings:     ${report.summary.findingsBySeverity.warning}`);
  console.log(`    - Info:         ${report.summary.findingsBySeverity.info}`);
  console.log("----------------------------------------");
  console.log("  Exported Artifacts:");
  for (const f of writtenFiles) {
    console.log(`    \u2713 ${f}`);
  }
  console.log("========================================\n");
  if (report.summary.findingsBySeverity.error > 0) {
    process.exit(1);
  }
}

// src/cli/setup.ts
import { checkbox as checkbox2, input, confirm } from "@inquirer/prompts";
async function runSetup(options) {
  const glyphs = getAdaptiveGlyphs();
  const platform = getPlatformInfo();
  if (options?.show) {
    const config = loadCliConfig();
    console.log("\nCurrent HauntView CLI Configuration:");
    console.log(JSON.stringify(config, null, 2));
    return;
  }
  if (options?.reset) {
    resetCliConfig();
    console.log(`
${glyphs.tick} HauntView configuration has been reset to factory defaults.`);
    console.log(JSON.stringify(loadCliConfig(), null, 2));
    return;
  }
  console.log(`
${glyphs.ghost} HauntView Configuration Wizard (${platform.osName})
`);
  const existing = loadCliConfig();
  const defaultFormats = await checkbox2({
    message: "Select default export types to produce on every run:",
    choices: [
      {
        name: "Zip (Complete bundle: HTML, MD, screenshots, and plates)",
        value: "zip",
        checked: existing.defaultFormats.includes("zip")
      },
      {
        name: "HTML (Standalone spectral executive report plate)",
        value: "html",
        checked: existing.defaultFormats.includes("html")
      },
      {
        name: "Markdown (Dev-ready GitHub Flavored markdown summary)",
        value: "markdown",
        checked: existing.defaultFormats.includes("markdown")
      }
    ],
    validate: (choices) => choices.length > 0 ? true : "Please select at least one default format."
  });
  const pathHint = platform.isWindows ? "Enter default export folder (. for current dir, ~/Downloads, %USERPROFILE%\\Downloads, or full path):" : "Enter default export folder (. for current dir, ~/Downloads, $HOME/Downloads, or full path):";
  const exportDir = await input({
    message: pathHint,
    default: existing.exportDir,
    validate: (val) => {
      const check = expandAndValidatePath(val, { createIfMissing: true });
      return check.valid ? true : check.error || "Invalid directory.";
    }
  });
  const enableConcurrency = await confirm({
    message: "Enable concurrent rite execution for faster local runs?",
    default: existing.concurrency
  });
  let concurrencyAmount = 2;
  if (enableConcurrency) {
    const cap = evaluateSystemCapability();
    if (cap.isConstrained) {
      console.log(`
${glyphs.warn} ${cap.constraintReason}`);
      concurrencyAmount = 1;
    } else {
      console.log(
        `
Hardware analysis: ${cap.specs.cpuModel} (${cap.specs.logicalCores} threads, ${(cap.specs.totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(1)} GB RAM)`
      );
      console.log(
        `Recommended maximum for safe execution: ${cap.recommendedMax} concurrent profile(s).
`
      );
      const chosenAmountStr = await input({
        message: `How many profiles should run at once? (1 - ${cap.recommendedMax}):`,
        default: String(
          Math.min(existing.concurrencyAmount, cap.recommendedMax) || cap.defaultSuggested
        ),
        validate: (val) => {
          const num = parseInt(val, 10);
          if (isNaN(num)) return "Please enter a valid number.";
          const res = validateConcurrencyAmount(num, cap);
          return res.valid ? true : res.errorMessage || "Invalid amount.";
        }
      });
      concurrencyAmount = parseInt(chosenAmountStr, 10);
    }
  }
  const newConfig = {
    defaultFormats,
    exportDir,
    concurrency: enableConcurrency,
    concurrencyAmount
  };
  saveCliConfig(newConfig);
  console.log(`
${glyphs.tick} Settings saved successfully to configuration store:
`);
  console.log(JSON.stringify(newConfig, null, 2));
  console.log();
}

// src/cli/doctor.ts
import * as fs9 from "fs";
function runDoctor() {
  const glyphs = getAdaptiveGlyphs();
  const platform = getPlatformInfo();
  const term = getTerminalCapabilities();
  console.log(`
HauntView Diagnostics \u2014 v${VERSION}
`);
  console.log("Environment:");
  console.log(
    `  OS:           ${platform.osName} (${platform.platform} ${platform.arch}) release ${platform.release}`
  );
  console.log(`  Shell:        ${term.shellName}`);
  console.log(
    `  Unicode:      ${term.supportsUnicode ? "Enabled (full glyphs)" : "ASCII fallback"}`
  );
  console.log(`  Node.js:      ${process.version} (>=22.12.0 LTS recommended)`);
  console.log(`  Config Dir:   ${getCliConfigDir()}`);
  const hasConfig = fs9.existsSync(getCliConfigFile());
  console.log(`  Config File:  ${hasConfig ? "present" : "not initialized (run `haunt setup`)"}`);
  console.log("\nSystem Hardware & Concurrency:");
  const cap = evaluateSystemCapability();
  const totalGb = (cap.specs.totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(1);
  const freeGb = (cap.specs.freeMemoryBytes / (1024 * 1024 * 1024)).toFixed(1);
  console.log(`  CPU:          ${cap.specs.cpuModel}`);
  console.log(`  Cores:        ${cap.specs.logicalCores} logical threads`);
  console.log(`  RAM:          ${totalGb} GB total (${freeGb} GB free)`);
  console.log(`  Max Concurrency: ${cap.recommendedMax} concurrent profile(s)`);
  console.log(`  Suggested Default: ${cap.defaultSuggested}`);
  if (cap.isConstrained) {
    console.log(`  Warning:      ${cap.constraintReason}`);
  }
  console.log("\nPlaywright Browsers:");
  const browsers = getAllBrowsersStatus();
  for (const b of browsers) {
    const symbol = b.installed ? glyphs.tick : glyphs.cross;
    let detail = "";
    if (b.name === "msedge") {
      if (b.installed) {
        detail = `${b.executablePath || "installed"} (${b.isNative ? "native Windows Edge" : "installed"})`;
      } else {
        detail = b.isNative ? "not detected in standard Windows paths (Chromium fallback will be used)" : "not installed (Chromium fallback will be used on Unix)";
      }
    } else {
      detail = b.installed ? b.executablePath || "installed" : "missing (run `haunt <url>` or `npx playwright install`)";
    }
    console.log(`  ${symbol} ${b.name.padEnd(10)}: ${detail}`);
  }
  const coreInstalled = browsers.slice(0, 3).every((b) => b.installed);
  if (coreInstalled) {
    console.log(`
${glyphs.tick} System is fully sensitised for haunting websites.
`);
  } else {
    console.log(
      `
${glyphs.warn} Some browsers are missing. Run \`haunt <url>\` to trigger first-run installation.
`
    );
  }
  const advice = getPlatformTroubleshootingAdvice();
  for (const line of advice) {
    console.log(line);
  }
  console.log();
}

// src/cli/self-update.ts
import { execSync as execSync2, spawnSync } from "node:child_process";
function detectPackageManager() {
  for (const pm of ["npm", "pnpm", "yarn"]) {
    const result = spawnSync(pm, ["--version"], { encoding: "utf8" });
    if (result.status === 0) return pm;
  }
  return "npm";
}
function fetchLatestVersion() {
  try {
    const raw = execSync2("npm view hauntview version", {
      encoding: "utf8",
      timeout: 1e4,
      stdio: ["ignore", "pipe", "ignore"]
    });
    return raw.trim();
  } catch {
    return null;
  }
}
function runSelfUpdate() {
  console.log(`
\u{1F47B} HauntView self-update`);
  console.log(`   Current version: ${VERSION}`);
  process.stdout.write("   Checking npm registry...");
  const latest = fetchLatestVersion();
  if (latest === null) {
    console.log(" (registry unreachable)\n");
    console.warn(
      "\u2717 Could not reach the npm registry. Check your internet connection and try again."
    );
    process.exit(1);
  }
  console.log(` latest is ${latest}`);
  if (latest === VERSION) {
    console.log("\n\u2713 You are already on the latest version. Nothing to do.\n");
    return;
  }
  const pm = detectPackageManager();
  const installCmd = pm === "yarn" ? "yarn global add hauntview" : `${pm} install -g hauntview`;
  console.log(`
   Updating ${VERSION} \u2192 ${latest} using ${pm}...`);
  console.log(`   Running: ${installCmd}
`);
  try {
    execSync2(installCmd, { stdio: "inherit" });
    console.log(`
\u2713 HauntView updated to ${latest}. Run 'haunt --version' to confirm.
`);
  } catch {
    console.error("\n\u2717 Update failed. You may need to run with elevated privileges:");
    console.error(`     sudo ${installCmd}
`);
    process.exit(1);
  }
}

// src/cli/index.ts
var program = new Command();
program.name("haunt").description(
  "HauntView \u2014 Local-first website resilience, accessibility, and failure-mode testing engine"
).version(VERSION, "-v, --version", "Output current HauntView version");
program.argument("[url]", "Target website URL to test (e.g. http://localhost:3000, https://example.com)").option("-o, --output <formats>", "Output formats (comma-separated: zip, html, md, json)").option(
  "-d, --out-dir <path>",
  "Export destination directory (defaults to current directory or saved setting)"
).option(
  "-p, --profiles <ids>",
  "Comma-separated profile IDs to execute (default: all optimal profiles)"
).option("-c, --concurrency", "Enable concurrent profile execution").option("--no-concurrency", "Force sequential profile execution").option("-a, --concurrency-amount <n>", "Maximum profiles running simultaneously (default: 2)").option("-i, --interactive", "Prompt for output formats interactively").option("-y, --yes", "Non-interactive mode, skip prompts and use saved defaults").action(async (url, options) => {
  if (!url) {
    program.help();
    return;
  }
  await runHaunt(url, options);
});
program.command("setup").description(
  "Interactive setup wizard to configure global defaults (export formats, destination, concurrency)"
).option("--show", "Display current saved configuration without prompting").option("--reset", "Reset configuration to factory defaults").action(async (options) => {
  await runSetup(options);
});
program.command("doctor").description(
  "Verify system environment, hardware capability heuristics, and Playwright browser installations"
).action(() => {
  runDoctor();
});
program.command("self-update").description("Update HauntView to the latest version published on npm").action(() => {
  runSelfUpdate();
});
program.parseAsync(process.argv).catch((err) => {
  console.error(`
\u2717 [haunt] Fatal error: ${err.message}
`);
  process.exit(1);
});
