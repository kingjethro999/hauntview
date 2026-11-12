#!/usr/bin/env node

// src/cli/index.ts
import { Command } from "commander";

// src/version.ts
var VERSION = "0.2.9";

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
  constructor(config = {}) {
    this.browsers = /* @__PURE__ */ new Map();
    this.pagePool = [];
    this.cleanupInterval = null;
    this.config = {
      maxBrowsers: config.maxBrowsers ?? 6,
      maxPagesPerBrowser: config.maxPagesPerBrowser ?? 10,
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
    for (const [existingKey, entry] of this.browsers.entries()) {
      if (!entry.browser.isConnected()) {
        this.browsers.delete(existingKey);
      }
    }
    if (this.browsers.has(key)) {
      const existing = this.browsers.get(key);
      existing.browser = browser;
      existing.lastUsed = Date.now();
      return;
    }
    if (this.browsers.size >= this.config.maxBrowsers) {
      let oldestKey = null;
      let oldestTime = Infinity;
      for (const [k, b] of this.browsers.entries()) {
        const activeCount = Array.from(b.activePages).filter((p) => !p.isClosed()).length;
        if (activeCount === 0 && b.lastUsed < oldestTime) {
          oldestTime = b.lastUsed;
          oldestKey = k;
        }
      }
      if (oldestKey) {
        const toEvict = this.browsers.get(oldestKey);
        try {
          toEvict?.browser.close().catch(() => {
          });
        } catch {
        }
        this.browsers.delete(oldestKey);
      }
    }
    if (this.browsers.size >= this.config.maxBrowsers) {
      this.config.maxBrowsers = this.browsers.size + 2;
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

// src/types/finding-utils.ts
import { createHash } from "crypto";

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
function assertValidSeverityConfidence(severity, confidence) {
  if (confidence === "heuristic" && severity === "serious") {
    throw new Error(
      `Invalid combination: confidence 'heuristic' cannot be paired with severity 'serious'. Heuristic findings must be 'info' or 'warning'.`
    );
  }
}
function makeFindingId(ruleId, rite, normalizedLocator) {
  return createHash("sha256").update(ruleId + rite + normalizedLocator).digest("hex").slice(0, 16);
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
var FINDING_MESSAGE_MAX_LENGTH = 500;
function sanitizeMessage(raw) {
  const stripped = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  return stripped.slice(0, FINDING_MESSAGE_MAX_LENGTH);
}
function assertFindingHasEvidence(finding) {
  if (!finding.evidence || finding.evidence.length === 0) {
    throw new Error(
      `Finding ${finding.id} (profile '${finding.profileId}') has no evidence \u2014 refused`
    );
  }
}
function executionErrorEvidence(message) {
  return [{ kind: "console", level: "error", text: sanitizeUntrusted(message) }];
}
function buildProfileFinding(params) {
  if (!params.evidence || params.evidence.length === 0) {
    throw new Error(
      `Profile finding '${params.id}' has no evidence. Every finding must carry at least one piece of evidence.`
    );
  }
  return {
    id: params.id,
    profileId: params.profileId,
    severity: params.severity,
    category: params.category,
    message: sanitizeMessage(params.message),
    ...params.location !== void 0 ? { location: params.location } : {},
    ...params.details !== void 0 ? { details: params.details } : {},
    timestamp: params.timestamp ?? Date.now(),
    isClassified: false,
    evidence: params.evidence
  };
}

// src/core/finding-classifier.ts
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
    assertFindingHasEvidence(finding);
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
        const canonical = buildFinding({
          ruleId: "mobile.viewport-meta-missing",
          rite: "mobile",
          severity: "serious",
          confidence: "observed",
          title: "Missing viewport meta tag",
          summary: 'The page has no <meta name="viewport"> tag, so mobile browsers render it at desktop width and users must zoom and pan to read content.',
          where: { selector: 'meta[name="viewport"]', url },
          evidence: [
            {
              kind: "metric",
              name: "viewportMetaCount",
              value: viewportMeta,
              unit: "elements"
            },
            {
              kind: "dom",
              selector: "head",
              snippet: sanitizeUntrusted('no meta[name="viewport"] element present')
            }
          ],
          investigate: [
            'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to the document head.'
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-viewport-missing`,
            profileId: this.profileId,
            severity: "error",
            category: "responsive-design",
            message: canonical.title,
            location: { file: url, line: 1 },
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      const interactiveElements = await page.locator("button, a, input, select, textarea").all();
      for (const element of interactiveElements) {
        const box = await element.boundingBox();
        if (box) {
          const size = Math.min(box.width, box.height);
          if (size > 1 && size < this.minTouchTargetSize && await element.isVisible()) {
            const tagName = await element.evaluate((el) => el.tagName.toLowerCase()).catch(() => "element");
            const elementId = await element.getAttribute("id");
            const classAttr = await element.getAttribute("class");
            const textContent = await element.evaluate((el) => (el.textContent || "").trim().slice(0, 30)).catch(() => "");
            const selector = elementId ? `#${elementId}` : classAttr ? `${tagName}.${classAttr.split(/\s+/).filter(Boolean).slice(0, 2).join(".")}` : `${tagName}${textContent ? `[text="${textContent}"]` : ""}`;
            const canonical = buildFinding({
              ruleId: "mobile.touch-target-too-small",
              rite: "mobile",
              severity: "warning",
              confidence: "measured",
              title: `Touch target ${Math.round(box.width)}\xD7${Math.round(box.height)}px below ${this.minTouchTargetSize}px minimum`,
              summary: `An interactive element renders at ${Math.round(box.width)}\xD7${Math.round(box.height)}px, below the WCAG-recommended ${this.minTouchTargetSize}px minimum touch target size. Users may mis-tap on touch devices.`,
              where: { selector, url },
              evidence: [
                {
                  kind: "metric",
                  name: "touchTargetMinDimension",
                  value: Math.round(size),
                  unit: "px",
                  threshold: this.minTouchTargetSize
                },
                {
                  kind: "dom",
                  selector,
                  snippet: sanitizeUntrusted(
                    `<${tagName}>${textContent ? ` "${textContent}"` : ""}`
                  )
                }
              ],
              investigate: [
                "Increase the element's padding or min-width/min-height so its smallest dimension is at least 48px."
              ]
            });
            findings.push(
              buildProfileFinding({
                id: `${this.profileId}-small-touch-target-${findings.length + 1}`,
                profileId: this.profileId,
                severity: "warning",
                category: "touch-targets",
                message: canonical.title,
                location: { selector },
                details: {
                  canonicalFinding: canonical,
                  actualSize: `${Math.round(box.width)}x${Math.round(box.height)}px`,
                  recommendedSize: `${this.minTouchTargetSize}x${this.minTouchTargetSize}px`,
                  element: `<${tagName}>${textContent ? ` "${textContent}"` : ""}`
                },
                evidence: [...canonical.evidence]
              })
            );
          }
        }
      }
      const scrollWidth = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });
      if (scrollWidth > 5) {
        const canonical = buildFinding({
          ruleId: "mobile.horizontal-overflow",
          rite: "mobile",
          severity: "warning",
          confidence: "measured",
          title: `Horizontal overflow of ${scrollWidth}px on mobile viewport`,
          summary: `The document scroll width exceeds the viewport by ${scrollWidth}px, forcing horizontal scrolling on mobile devices.`,
          where: { selector: "html", url },
          evidence: [
            {
              kind: "metric",
              name: "horizontalOverflowPx",
              value: scrollWidth,
              unit: "px",
              threshold: 5
            }
          ],
          investigate: [
            "Find the widest element (e.g. via document.elementFromPoint or devtools) and constrain it with max-width or overflow rules."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-horizontal-scroll`,
            profileId: this.profileId,
            severity: "warning",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical, overflowPx: scrollWidth },
            evidence: [...canonical.evidence]
          })
        );
      }
      const images = await page.locator("img").all();
      for (const img of images) {
        const naturalWidth = await img.evaluate((el) => el.naturalWidth);
        const displayWidth = await img.evaluate((el) => el.offsetWidth);
        if (naturalWidth > 0 && displayWidth > 0 && naturalWidth > displayWidth * 1.5) {
          const oversizePercent = Math.round(naturalWidth / displayWidth * 100);
          const canonical = buildFinding({
            ruleId: "mobile.oversized-image",
            rite: "mobile",
            severity: "info",
            confidence: "measured",
            title: `Image rendered at ${oversizePercent}% of its natural size`,
            summary: `An <img> is displayed at ${Math.round(displayWidth)}px but its natural width is ${naturalWidth}px \u2014 downloading roughly ${oversizePercent}% more pixels than needed on mobile.`,
            where: { url },
            evidence: [
              {
                kind: "metric",
                name: "imageOversizePercent",
                value: oversizePercent,
                unit: "percent",
                threshold: 150
              }
            ],
            investigate: ["Serve a responsively sized image (srcset/sizes) or compress the asset."]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-oversized-image`,
              profileId: this.profileId,
              severity: "info",
              category: "performance",
              message: canonical.title,
              details: {
                canonicalFinding: canonical,
                naturalWidth,
                displayWidth
              },
              evidence: [...canonical.evidence]
            })
          );
        }
      }
      const bodyFontSize = await page.evaluate(() => {
        return window.getComputedStyle(document.body).fontSize;
      });
      const fontSizeValue = parseInt(bodyFontSize);
      if (fontSizeValue < 16) {
        const canonical = buildFinding({
          ruleId: "mobile.base-font-too-small",
          rite: "mobile",
          severity: "warning",
          confidence: "measured",
          title: `Base font size ${bodyFontSize} below 16px readability minimum`,
          summary: `The computed body font size is ${bodyFontSize}, below the 16px minimum recommended for readable text on mobile devices.`,
          where: { selector: "body", url },
          evidence: [
            {
              kind: "metric",
              name: "baseFontSizePx",
              value: fontSizeValue,
              unit: "px",
              threshold: 16
            }
          ],
          investigate: ["Increase the base font size to at least 16px (1rem) for body text."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-small-font`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, computedFontSize: bodyFontSize },
            evidence: [...canonical.evidence]
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Mobile profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonical = buildFinding({
          ruleId: "desktop.cumulative-layout-shift",
          rite: "desktop",
          severity: "warning",
          confidence: "measured",
          title: `Cumulative Layout Shift ${clsValue.toFixed(3)} exceeds 0.1 threshold`,
          summary: `The page accumulated a CLS of ${clsValue.toFixed(3)} during load, above the 0.1 "good" threshold. Layout shifts degrade readability and can cause mis-clicks.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "cumulativeLayoutShift",
              value: Number(clsValue.toFixed(4)),
              unit: "score",
              threshold: 0.1
            }
          ],
          investigate: [
            "Reserve space for images/embeds with width/height attributes and avoid injecting content above existing content."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-cls-poor`,
            profileId: this.profileId,
            severity: "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, cls: clsValue },
            evidence: [...canonical.evidence]
          })
        );
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
          const canonical = buildFinding({
            ruleId: "desktop.unused-css-rules",
            rite: "desktop",
            severity: "info",
            confidence: "heuristic",
            title: `Approximately ${unusedStyles} CSS rules match no elements`,
            summary: `A heuristic scan found ~${unusedStyles} CSS rules whose selectors match nothing in the DOM. Unused CSS increases parse and render cost.`,
            where: { url },
            evidence: [
              {
                kind: "metric",
                name: "unusedCssRuleCount",
                value: unusedStyles,
                unit: "rules",
                threshold: 10
              }
            ],
            investigate: [
              "Audit stylesheets with DevTools coverage or a PurgeCSS-style build step."
            ]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-unused-css`,
              profileId: this.profileId,
              severity: "info",
              category: "performance",
              message: canonical.title,
              details: { canonicalFinding: canonical, unusedStyles },
              evidence: [...canonical.evidence]
            })
          );
        }
      }
      const maxWidth = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        return Math.max(body.scrollWidth, html.scrollWidth);
      });
      const viewportWidth = context.viewport.width;
      if (maxWidth > viewportWidth * 0.9) {
        const canonical = buildFinding({
          ruleId: "desktop.content-fills-viewport",
          rite: "desktop",
          severity: "info",
          confidence: "measured",
          title: `Content width ${maxWidth}px fills ${Math.round(maxWidth / viewportWidth * 100)}% of viewport`,
          summary: `The document's scroll width (${maxWidth}px) is at or beyond 90% of the ${viewportWidth}px viewport width, suggesting content stretches edge-to-edge with little breathing room.`,
          where: { selector: "body", url },
          evidence: [
            {
              kind: "metric",
              name: "contentWidthPx",
              value: maxWidth,
              unit: "px",
              threshold: Math.round(viewportWidth * 0.9)
            }
          ],
          investigate: [
            "Consider constraining main content with a max-width container for readability."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-wide-content`,
            profileId: this.profileId,
            severity: "info",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical, maxWidth, viewportWidth },
            evidence: [...canonical.evidence]
          })
        );
      }
      const imagesWithoutDimensions = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll("img"));
        return images.filter(
          (img) => !img.getAttribute("width") && !img.getAttribute("height") && !window.getComputedStyle(img).width
        ).length;
      });
      if (imagesWithoutDimensions > 0) {
        const canonical = buildFinding({
          ruleId: "desktop.images-missing-dimensions",
          rite: "desktop",
          severity: "warning",
          confidence: "measured",
          title: `${imagesWithoutDimensions} images lack width/height attributes`,
          summary: `${imagesWithoutDimensions} <img> elements have no width/height attributes or computed width, so the browser cannot reserve space before load \u2014 a common cause of layout shift.`,
          where: { selector: "img", url },
          evidence: [
            {
              kind: "metric",
              name: "imagesMissingDimensions",
              value: imagesWithoutDimensions,
              unit: "elements"
            }
          ],
          investigate: [
            "Add explicit width and height attributes (or aspect-ratio CSS) to every <img>."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-images-no-dimensions`,
            profileId: this.profileId,
            severity: "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: imagesWithoutDimensions },
            evidence: [...canonical.evidence]
          })
        );
      }
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute("content");
      if (viewportContent && viewportContent.includes("user-scalable=no")) {
        const canonical = buildFinding({
          ruleId: "desktop.user-zoom-disabled",
          rite: "desktop",
          severity: "warning",
          confidence: "observed",
          title: "Viewport meta disables user zoom",
          summary: "The viewport meta tag contains user-scalable=no, preventing pinch-zoom. This violates WCAG 1.4.4 (Resize Text) and harms low-vision users.",
          where: { selector: 'meta[name="viewport"]', url },
          evidence: [
            {
              kind: "dom",
              selector: 'meta[name="viewport"]',
              snippet: sanitizeUntrusted(viewportContent)
            }
          ],
          investigate: [
            "Remove user-scalable=no and maximum-scale restrictions from the viewport meta tag."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-user-zoom`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, viewportContent },
            evidence: [...canonical.evidence]
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Desktop profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonical = buildFinding({
          ruleId: "desktop-4k.upscaled-images",
          rite: "desktop",
          severity: "warning",
          confidence: "measured",
          title: `${imageQualityIssues.upscaledImages} images upscaled beyond natural resolution`,
          summary: `${imageQualityIssues.upscaledImages} visible <img> elements render wider than 1.5\xD7 their natural pixel width on the 4K viewport, producing blurry upscaling.`,
          where: { selector: "img", url },
          evidence: [
            {
              kind: "metric",
              name: "upscaledImageCount",
              value: imageQualityIssues.upscaledImages,
              unit: "elements"
            }
          ],
          investigate: [
            "Provide higher-resolution sources via srcset or replace the assets with 2x/3x artwork."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-upscaled-images`,
            profileId: this.profileId,
            severity: "warning",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: imageQualityIssues.upscaledImages },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (imageQualityIssues.missingSrcset > 0) {
        const canonical = buildFinding({
          ruleId: "desktop-4k.missing-srcset",
          rite: "desktop",
          severity: "info",
          confidence: "measured",
          title: `${imageQualityIssues.missingSrcset} large images lack srcset/<picture>`,
          summary: `${imageQualityIssues.missingSrcset} images wider than 500px have no srcset or <picture> wrapper, so 4K/high-DPI displays cannot fetch appropriately sized assets.`,
          where: { selector: "img", url },
          evidence: [
            {
              kind: "metric",
              name: "imagesMissingSrcset",
              value: imageQualityIssues.missingSrcset,
              unit: "elements"
            }
          ],
          investigate: [
            "Add srcset with 2x/3x candidates or wrap images in <picture> with media/density sources."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-missing-highdpi-images`,
            profileId: this.profileId,
            severity: "info",
            category: "responsive-design",
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              count: imageQualityIssues.missingSrcset
            },
            evidence: [...canonical.evidence]
          })
        );
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
        const canonical = buildFinding({
          ruleId: "desktop-4k.tiny-text",
          rite: "desktop",
          severity: "warning",
          confidence: "measured",
          title: `${typographyChecks.tinyTextCount} text elements below 12px font size`,
          summary: `${typographyChecks.tinyTextCount} visible text elements compute a font size under 12px, which is hard to read even on a large 4K display.`,
          where: { selector: "p, span, li, a, h1, h2, h3, h4, h5, h6", url },
          evidence: [
            {
              kind: "metric",
              name: "sub12pxTextElements",
              value: typographyChecks.tinyTextCount,
              unit: "elements",
              threshold: 12
            }
          ],
          investigate: [
            "Raise font sizes below 12px; consider rem-based sizing so text scales with user settings."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-tiny-text`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: typographyChecks.tinyTextCount },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (typographyChecks.excessiveLineLengthCount > 0) {
        const canonical = buildFinding({
          ruleId: "desktop-4k.excessive-line-length",
          rite: "desktop",
          severity: "info",
          confidence: "measured",
          title: `${typographyChecks.excessiveLineLengthCount} paragraphs exceed readable line length`,
          summary: `${typographyChecks.excessiveLineLengthCount} <p> elements render wider than 1600px at 4K, producing line lengths far beyond the ~75-character ergonomic reading measure.`,
          where: { selector: "p", url },
          evidence: [
            {
              kind: "metric",
              name: "overlongParagraphs",
              value: typographyChecks.excessiveLineLengthCount,
              unit: "elements",
              threshold: 1600
            }
          ],
          investigate: [
            "Constrain text columns with max-width (~65\u201375ch) so lines stay within a comfortable measure."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-excessive-line-length`,
            profileId: this.profileId,
            severity: "info",
            category: "responsive-design",
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              count: typographyChecks.excessiveLineLengthCount
            },
            evidence: [...canonical.evidence]
          })
        );
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
        const canonical = buildFinding({
          ruleId: "desktop-4k.horizontal-overflow",
          rite: "desktop",
          severity: "serious",
          confidence: "measured",
          title: `Horizontal overflow at 4K: ${layoutChecks.scrollWidth}px > ${viewportWidth}px viewport`,
          summary: `The document scroll width (${layoutChecks.scrollWidth}px) exceeds the ${viewportWidth}px 4K viewport width, forcing horizontal scrolling.`,
          where: { selector: "html", url },
          evidence: [
            {
              kind: "metric",
              name: "horizontalOverflowPx",
              value: layoutChecks.scrollWidth - viewportWidth,
              unit: "px",
              threshold: 5
            }
          ],
          investigate: [
            "Identify the widest element and constrain it; check for fixed-width grids or non-wrapping content."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-horizontal-overflow`,
            profileId: this.profileId,
            severity: "error",
            category: "responsive-design",
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              scrollWidth: layoutChecks.scrollWidth,
              viewportWidth
            },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (layoutChecks.unconstrainedContent) {
        const canonical = buildFinding({
          ruleId: "desktop-4k.unconstrained-layout",
          rite: "desktop",
          severity: "info",
          confidence: "heuristic",
          title: "Main content lacks max-width constraint at 4K",
          summary: "The primary content container has no max-width and spans ~the full 3840px viewport, producing excessively long lines and stretched layouts.",
          where: { selector: "main, #root, #__next, .container, body", url },
          evidence: [
            {
              kind: "dom",
              selector: "main, #root, #__next, .container, body",
              snippet: sanitizeUntrusted("max-width: none computed on main container")
            }
          ],
          investigate: ["Add a max-width container (e.g. 1200\u20131400px) around primary content."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-unconstrained-layout`,
            profileId: this.profileId,
            severity: "info",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (layoutChecks.fixedBackgrounds > 0) {
        const canonical = buildFinding({
          ruleId: "desktop-4k.fixed-backgrounds",
          rite: "desktop",
          severity: "info",
          confidence: "measured",
          title: `${layoutChecks.fixedBackgrounds} elements use background-attachment: fixed`,
          summary: `${layoutChecks.fixedBackgrounds} elements paint a fixed background image, which forces re-compositing on scroll and can degrade frame rates on large 4K canvases.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "fixedBackgroundCount",
              value: layoutChecks.fixedBackgrounds,
              unit: "elements"
            }
          ],
          investigate: [
            "Prefer background-attachment: scroll or a dedicated fixed layer; test scroll performance on 4K."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-fixed-background-performance`,
            profileId: this.profileId,
            severity: "info",
            category: "performance",
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              count: layoutChecks.fixedBackgrounds
            },
            evidence: [...canonical.evidence]
          })
        );
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
        const canonical = buildFinding({
          ruleId: "desktop-4k.cumulative-layout-shift",
          rite: "desktop",
          severity: "warning",
          confidence: "measured",
          title: `Cumulative Layout Shift ${clsValue.toFixed(3)} on 4K exceeds 0.1`,
          summary: `The page accumulated a CLS of ${clsValue.toFixed(3)} at the 4K viewport, above the 0.1 "good" threshold.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "cumulativeLayoutShift",
              value: Number(clsValue.toFixed(4)),
              unit: "score",
              threshold: 0.1
            }
          ],
          investigate: [
            "Reserve space for images/embeds and avoid injecting content above existing content."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-cls-poor`,
            profileId: this.profileId,
            severity: "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, cls: clsValue },
            evidence: [...canonical.evidence]
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Desktop 4K profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonicalSeverity = msg.type === "error" ? "serious" : msg.type === "warn" ? "warning" : "info";
        const canonical = buildFinding({
          ruleId: `console-errors.${msg.type}-message`,
          rite: "console-errors",
          severity: canonicalSeverity,
          confidence: "observed",
          title: `Console ${msg.type} emitted during page load`,
          summary: `The page logged a console.${msg.type} message during the test run. Console errors often indicate broken functionality; review the message text in evidence.`,
          ...msg.location ? { where: { url: sanitizeUntrusted(msg.location).text } } : {},
          evidence: [{ kind: "console", level: msg.type, text: sanitizeUntrusted(msg.text) }],
          investigate: [
            "Open the browser DevTools console, reproduce the load, and trace the message to its source."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-${msg.type}-${findings.length}`,
            profileId: this.profileId,
            severity,
            category: "console",
            message: `${msg.type.toUpperCase()}: ${msg.text}`,
            location: msg.location ? { file: msg.location } : void 0,
            details: { canonicalFinding: canonical, consoleType: msg.type },
            evidence: [...canonical.evidence]
          })
        );
      }
      for (const swError of swErrors) {
        const canonical = buildFinding({
          ruleId: "console-errors.service-worker-error",
          rite: "console-errors",
          severity: "warning",
          confidence: "observed",
          title: "Service worker reported an error during registration",
          summary: `A service worker issue was detected: ${swError}. Service worker failures can break offline support and caching.`,
          where: { url },
          evidence: [
            {
              kind: "console",
              level: "error",
              text: sanitizeUntrusted(`Service Worker: ${swError}`)
            }
          ],
          investigate: [
            "Check the service worker registration code and browser console for the underlying failure."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-sw-error-${findings.length}`,
            profileId: this.profileId,
            severity: "warning",
            category: "console",
            message: `Service Worker: ${swError}`,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      page.on("pageerror", (error) => {
        if (error.message.includes("Unhandled promise rejection")) {
          const canonical = buildFinding({
            ruleId: "console-errors.unhandled-rejection",
            rite: "console-errors",
            severity: "warning",
            confidence: "observed",
            title: "Unhandled promise rejection during page load",
            summary: "A promise rejected without a catch handler. Unhandled rejections can leave UI in a broken state and are a common source of silent failures.",
            where: { url },
            evidence: [
              {
                kind: "console",
                level: "error",
                text: sanitizeUntrusted(error.message)
              }
            ],
            investigate: [
              "Add .catch() handlers or try/catch around the async code that rejected."
            ]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-unhandled-rejection-${findings.length}`,
              profileId: this.profileId,
              severity: "error",
              category: "console",
              message: `Unhandled Promise Rejection: ${error.message}`,
              details: { canonicalFinding: canonical },
              evidence: [...canonical.evidence]
            })
          );
        }
      });
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Console errors profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonical = buildFinding({
          ruleId: "tablet.viewport-fit-missing",
          rite: "tablet",
          severity: "info",
          confidence: "observed",
          title: "Missing viewport-fit=cover for tablet safe areas",
          summary: "The viewport meta tag lacks viewport-fit=cover, so content may render under the notch/home indicator safe areas on modern tablets.",
          where: { selector: 'meta[name="viewport"]', url },
          evidence: [
            {
              kind: "dom",
              selector: 'meta[name="viewport"]',
              snippet: sanitizeUntrusted(viewportContent ?? "(no viewport meta tag)")
            }
          ],
          investigate: [
            "Add viewport-fit=cover to the viewport meta content and use env(safe-area-inset-*) in CSS."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-viewport-fit`,
            profileId: this.profileId,
            severity: "info",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical, viewportContent },
            evidence: [...canonical.evidence]
          })
        );
      }
      const orientationMeta = await page.locator("meta").evaluateAll(
        (metas) => metas.some((m) => m.getAttribute("name") === "orientation")
      );
      if (!orientationMeta) {
        const canonical = buildFinding({
          ruleId: "tablet.orientation-meta-missing",
          rite: "tablet",
          severity: "info",
          confidence: "observed",
          title: "No orientation meta tag for tablet rotation handling",
          summary: 'The document has no <meta name="orientation"> tag, so the page does not declare how it should behave when the tablet rotates between portrait and landscape.',
          where: { selector: 'meta[name="orientation"]', url },
          evidence: [
            {
              kind: "dom",
              selector: "head",
              snippet: sanitizeUntrusted('no meta[name="orientation"] element present')
            }
          ],
          investigate: [
            'Consider adding <meta name="orientation"> or ensure layout adapts via CSS media queries.'
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-orientation-meta`,
            profileId: this.profileId,
            severity: "info",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      const touchActionStyle = await page.evaluate(() => {
        const root = document.documentElement;
        return window.getComputedStyle(root).touchAction;
      });
      if (touchActionStyle === "pan-x pan-y") {
        const canonical = buildFinding({
          ruleId: "tablet.touch-action-pan-only",
          rite: "tablet",
          severity: "info",
          confidence: "measured",
          title: "touch-action allows double-tap zoom delay on tablets",
          summary: "The root element computes touch-action: pan-x pan-y, which permits double-tap zoom and adds a ~300ms tap delay on tablets. Setting touch-action: manipulation removes the delay.",
          where: { selector: "html", url },
          evidence: [
            {
              kind: "metric",
              name: "touchAction",
              value: 0,
              unit: "computed-style"
            },
            {
              kind: "dom",
              selector: "html",
              snippet: sanitizeUntrusted(`touch-action: ${touchActionStyle}`)
            }
          ],
          investigate: [
            "Set touch-action: manipulation on interactive elements or the root to eliminate the double-tap delay."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-touch-action`,
            profileId: this.profileId,
            severity: "info",
            category: "touch-optimization",
            message: canonical.title,
            details: { canonicalFinding: canonical, touchAction: touchActionStyle },
            evidence: [...canonical.evidence]
          })
        );
      }
      const buttons = await page.locator('button, a, input[type="button"]').all();
      let smallTouchTargets = 0;
      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && await button.isVisible()) {
          const size = Math.min(box.width, box.height);
          if (size > 1 && size < 44) {
            smallTouchTargets++;
          }
        }
      }
      if (smallTouchTargets > 0) {
        const canonical = buildFinding({
          ruleId: "tablet.touch-targets-below-44px",
          rite: "tablet",
          severity: "warning",
          confidence: "measured",
          title: `${smallTouchTargets} touch targets below 44px minimum`,
          summary: `${smallTouchTargets} interactive elements have a smallest dimension under 44px, below Apple's recommended minimum touch target size for tablets.`,
          where: { selector: 'button, a, input[type="button"]', url },
          evidence: [
            {
              kind: "metric",
              name: "undersizedTouchTargets",
              value: smallTouchTargets,
              unit: "elements",
              threshold: 44
            }
          ],
          investigate: [
            "Increase padding or min dimensions so every interactive element is at least 44\xD744px."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-small-touch-targets`,
            profileId: this.profileId,
            severity: "warning",
            category: "touch-targets",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: smallTouchTargets },
            evidence: [...canonical.evidence]
          })
        );
      }
      const landWidth = await page.evaluate(() => {
        if (window.matchMedia("(orientation: landscape)").matches) {
          return document.documentElement.scrollWidth;
        }
        return 0;
      });
      if (landWidth > context.viewport.width * 1.1) {
        const canonical = buildFinding({
          ruleId: "tablet.landscape-horizontal-overflow",
          rite: "tablet",
          severity: "warning",
          confidence: "measured",
          title: "Page overflows horizontally in tablet landscape",
          summary: `In landscape orientation the document scroll width (${landWidth}px) exceeds 110% of the ${context.viewport.width}px viewport width, causing horizontal scrolling.`,
          where: { selector: "html", url },
          evidence: [
            {
              kind: "metric",
              name: "landscapeScrollWidthPx",
              value: landWidth,
              unit: "px",
              threshold: Math.round(context.viewport.width * 1.1)
            }
          ],
          investigate: [
            "Constrain wide elements with max-width: 100% and audit grid/flex children for fixed widths."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-landscape-overflow`,
            profileId: this.profileId,
            severity: "warning",
            category: "responsive-design",
            message: canonical.title,
            details: { canonicalFinding: canonical, landscapeWidth: landWidth },
            evidence: [...canonical.evidence]
          })
        );
      }
      const modals = await page.locator('[role="dialog"], .modal, .popup').all();
      if (modals.length > 0) {
        for (const modal of modals) {
          const box = await modal.boundingBox();
          if (box && await modal.isVisible()) {
            if (box.width > context.viewport.width * 0.9) {
              const canonical = buildFinding({
                ruleId: "tablet.modal-near-full-width",
                rite: "tablet",
                severity: "info",
                confidence: "measured",
                title: "Modal/dialog width approaches tablet screen edge",
                summary: `A dialog renders ${Math.round(box.width)}px wide, over 90% of the ${context.viewport.width}px tablet viewport, leaving little margin around it.`,
                where: { selector: '[role="dialog"], .modal, .popup', url },
                evidence: [
                  {
                    kind: "metric",
                    name: "modalWidthRatio",
                    value: Math.round(box.width / context.viewport.width * 100),
                    unit: "percent",
                    threshold: 90
                  }
                ],
                investigate: [
                  "Cap modal width (e.g. max-width: 90vw) and center it with adequate margins."
                ]
              });
              findings.push(
                buildProfileFinding({
                  id: `${this.profileId}-modal-width`,
                  profileId: this.profileId,
                  severity: "info",
                  category: "responsive-design",
                  message: canonical.title,
                  details: {
                    canonicalFinding: canonical,
                    modalWidth: Math.round(box.width)
                  },
                  evidence: [...canonical.evidence]
                })
              );
              break;
            }
          }
        }
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Tablet profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonical = buildFinding({
          ruleId: "performance.fcp-slow",
          rite: "performance",
          severity: vitals.fcp > 3e3 ? "serious" : "warning",
          confidence: "measured",
          title: `First Contentful Paint ${Math.round(vitals.fcp)}ms exceeds 1.8s`,
          summary: `FCP was ${Math.round(vitals.fcp)}ms, above the 1800ms "good" threshold${vitals.fcp > 3e3 ? ' and into the "poor" range' : ""}. Users see a blank page until first paint.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "firstContentfulPaint",
              value: Math.round(vitals.fcp),
              unit: "ms",
              threshold: 1800
            }
          ],
          investigate: [
            "Reduce render-blocking resources, optimize critical CSS, and defer non-essential JS."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-fcp-slow`,
            profileId: this.profileId,
            severity: vitals.fcp > 3e3 ? "error" : "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, fcp: vitals.fcp },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (vitals.lcp && vitals.lcp > 2500) {
        const canonical = buildFinding({
          ruleId: "performance.lcp-slow",
          rite: "performance",
          severity: vitals.lcp > 4e3 ? "serious" : "warning",
          confidence: "measured",
          title: `Largest Contentful Paint ${Math.round(vitals.lcp)}ms exceeds 2.5s`,
          summary: `LCP was ${Math.round(vitals.lcp)}ms, above the 2500ms "good" threshold${vitals.lcp > 4e3 ? ' and into the "poor" range' : ""}. The main content took too long to render.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "largestContentfulPaint",
              value: Math.round(vitals.lcp),
              unit: "ms",
              threshold: 2500
            }
          ],
          investigate: [
            "Optimize the LCP element (usually a hero image or heading): preload it, compress it, and remove render-blocking chains."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-lcp-slow`,
            profileId: this.profileId,
            severity: vitals.lcp > 4e3 ? "error" : "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, lcp: vitals.lcp },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (vitals.cls > 0.1) {
        const canonical = buildFinding({
          ruleId: "performance.cls-high",
          rite: "performance",
          severity: vitals.cls > 0.25 ? "serious" : "warning",
          confidence: "measured",
          title: `Cumulative Layout Shift ${vitals.cls.toFixed(3)} exceeds 0.1`,
          summary: `CLS was ${vitals.cls.toFixed(3)}, above the 0.1 "good" threshold${vitals.cls > 0.25 ? ' and into the "poor" range' : ""}. Visible content shifts during load.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "cumulativeLayoutShift",
              value: Number(vitals.cls.toFixed(4)),
              unit: "score",
              threshold: 0.1
            }
          ],
          investigate: [
            "Set width/height on images and embeds; avoid inserting content above existing content after load."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-cls-high`,
            profileId: this.profileId,
            severity: vitals.cls > 0.25 ? "error" : "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, cls: vitals.cls },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (vitals.resourceCount > 100) {
        const canonical = buildFinding({
          ruleId: "performance.resource-count-high",
          rite: "performance",
          severity: "warning",
          confidence: "measured",
          title: `Page loads ${vitals.resourceCount} resources`,
          summary: `The page requested ${vitals.resourceCount} subresources, above the recommended ~100. Excessive requests increase load time and failure surface.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "resourceCount",
              value: vitals.resourceCount,
              unit: "requests",
              threshold: 100
            }
          ],
          investigate: [
            "Bundle and consolidate assets; audit third-party scripts and unused resources."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-resource-count`,
            profileId: this.profileId,
            severity: "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, resourceCount: vitals.resourceCount },
            evidence: [...canonical.evidence]
          })
        );
      }
      const sizeMb = vitals.totalResourceSize / (1024 * 1024);
      if (sizeMb > 5) {
        const canonical = buildFinding({
          ruleId: "performance.resource-size-high",
          rite: "performance",
          severity: sizeMb > 10 ? "serious" : "warning",
          confidence: "measured",
          title: `Total resource size ${sizeMb.toFixed(1)}MB exceeds 5MB`,
          summary: `The page transferred ${sizeMb.toFixed(1)}MB of resources, above the ~3MB recommendation${sizeMb > 10 ? " and into double digits" : ""}. Large payloads slow load, especially on mobile networks.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "totalResourceSize",
              value: Number(sizeMb.toFixed(2)),
              unit: "MB",
              threshold: 5
            }
          ],
          investigate: [
            "Compress images, enable Brotli/gzip, code-split JS, and lazy-load below-fold assets."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-resource-size`,
            profileId: this.profileId,
            severity: sizeMb > 10 ? "error" : "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, sizeMb },
            evidence: [...canonical.evidence]
          })
        );
      }
      const unminified = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll("script[src]"));
        return scripts.filter((s) => {
          const src = s.getAttribute("src") || "";
          return src.includes("/src/") || src.endsWith(".js") && !src.includes(".min.");
        }).length;
      });
      if (unminified > 0) {
        const canonical = buildFinding({
          ruleId: "performance.unminified-js",
          rite: "performance",
          severity: "info",
          confidence: "heuristic",
          title: `${unminified} script(s) appear unminified`,
          summary: `${unminified} <script src> URLs look unminified (no .min. or /src/ path heuristics). Unminified JS ships extra bytes to every user.`,
          where: { selector: "script[src]", url },
          evidence: [
            {
              kind: "metric",
              name: "unminifiedScriptCount",
              value: unminified,
              unit: "scripts"
            }
          ],
          investigate: [
            "Serve minified production bundles; verify build output includes minification."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-unminified-js`,
            profileId: this.profileId,
            severity: "info",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: unminified },
            evidence: [...canonical.evidence]
          })
        );
      }
      const renderBlocking = await page.evaluate(() => {
        return performance.getEntriesByType("resource").filter((r) => {
          const url2 = r.name.toLowerCase();
          return (url2.endsWith(".css") || url2.endsWith(".js")) && r.duration > 500;
        }).length;
      });
      if (renderBlocking > 0) {
        const canonical = buildFinding({
          ruleId: "performance.render-blocking-resources",
          rite: "performance",
          severity: "warning",
          confidence: "measured",
          title: `${renderBlocking} render-blocking resources over 500ms`,
          summary: `${renderBlocking} CSS/JS resources each took over 500ms and block first render. Render-blocking chains directly delay FCP and LCP.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "slowRenderBlockingResources",
              value: renderBlocking,
              unit: "resources",
              threshold: 500
            }
          ],
          investigate: [
            "Inline critical CSS, defer non-critical JS with async/defer, and reduce chain depth."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-render-blocking`,
            profileId: this.profileId,
            severity: "warning",
            category: "performance",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: renderBlocking },
            evidence: [...canonical.evidence]
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Performance profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonical = buildFinding({
          ruleId: "accessibility.html-lang-missing",
          rite: "accessibility",
          severity: "serious",
          confidence: "observed",
          title: "Missing lang attribute on <html>",
          summary: "The document element has no lang attribute, so screen readers cannot select the correct pronunciation rules for the page content.",
          where: { selector: "html", url },
          evidence: [
            {
              kind: "dom",
              selector: "html",
              snippet: sanitizeUntrusted("<html> without lang attribute")
            }
          ],
          investigate: ['Add lang="\u2026" to the <html> element matching the page language.']
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-lang`,
            profileId: this.profileId,
            severity: "error",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      const hasMain = await page.locator('main, [role="main"]').count();
      if (hasMain === 0) {
        const canonical = buildFinding({
          ruleId: "accessibility.main-landmark-missing",
          rite: "accessibility",
          severity: "warning",
          confidence: "observed",
          title: "Page has no main landmark",
          summary: 'No <main> element or role="main" landmark exists, so screen reader users cannot jump directly to the primary content.',
          where: { selector: 'main, [role="main"]', url },
          evidence: [
            {
              kind: "metric",
              name: "mainLandmarkCount",
              value: hasMain,
              unit: "elements"
            }
          ],
          investigate: ['Wrap primary content in <main> or add role="main" to the main container.']
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-main`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      const headings = await page.evaluate(() => {
        const h = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"));
        return h.map((el) => parseInt(el.tagName[1]));
      });
      if (headings.length === 0) {
        const canonical = buildFinding({
          ruleId: "accessibility.no-headings",
          rite: "accessibility",
          severity: "warning",
          confidence: "observed",
          title: "Page contains no heading elements",
          summary: "No h1\u2013h6 elements were found. Headings provide the primary navigation structure for screen reader users.",
          where: { selector: "h1, h2, h3, h4, h5, h6", url },
          evidence: [
            {
              kind: "metric",
              name: "headingCount",
              value: headings.length,
              unit: "elements"
            }
          ],
          investigate: ["Add a logical heading hierarchy starting with a single <h1>."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-headings`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      } else if (headings[0] !== 1) {
        const canonical = buildFinding({
          ruleId: "accessibility.h1-not-first",
          rite: "accessibility",
          severity: "warning",
          confidence: "observed",
          title: "First heading is not <h1>",
          summary: `The document's first heading is h${headings[0] ?? 0}, not h1. Pages should begin their outline with a single top-level heading.`,
          where: { selector: "h1, h2, h3, h4, h5, h6", url },
          evidence: [
            {
              kind: "dom",
              selector: "h1, h2, h3, h4, h5, h6",
              snippet: sanitizeUntrusted(
                `first heading level: h${headings[0] ?? "none"} of ${headings.length} total`
              )
            }
          ],
          investigate: ["Start the heading outline with one <h1> describing the page."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-h1-missing`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, firstHeading: headings[0] },
            evidence: [...canonical.evidence]
          })
        );
      }
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i - 1] + 1) {
          const canonical = buildFinding({
            ruleId: "accessibility.heading-level-skip",
            rite: "accessibility",
            severity: "warning",
            confidence: "observed",
            title: `Heading order skips from h${headings[i - 1]} to h${headings[i]}`,
            summary: `The heading outline jumps a level (h${headings[i - 1]} \u2192 h${headings[i]}), which disorients screen reader navigation.`,
            where: { selector: "h1, h2, h3, h4, h5, h6", url },
            evidence: [
              {
                kind: "dom",
                selector: "h1, h2, h3, h4, h5, h6",
                snippet: sanitizeUntrusted(
                  `heading sequence contains h${headings[i - 1]} followed by h${headings[i]}`
                )
              }
            ],
            investigate: ["Do not skip heading levels; use one level at a time down the outline."]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-heading-order`,
              profileId: this.profileId,
              severity: "warning",
              category: "accessibility",
              message: canonical.title,
              details: {
                canonicalFinding: canonical,
                fromLevel: headings[i - 1],
                toLevel: headings[i]
              },
              evidence: [...canonical.evidence]
            })
          );
          break;
        }
      }
      const imgsNoAlt = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("img")).filter(
          (img) => !img.getAttribute("alt") || (img.getAttribute("alt") || "").trim() === ""
        ).length;
      });
      if (imgsNoAlt > 0) {
        const canonical = buildFinding({
          ruleId: "accessibility.images-missing-alt",
          rite: "accessibility",
          severity: "serious",
          confidence: "measured",
          title: `${imgsNoAlt} images missing alt text`,
          summary: `${imgsNoAlt} <img> elements have no alt attribute or an empty one. Screen readers announce them as unlabelled graphics.`,
          where: { selector: "img", url },
          evidence: [
            {
              kind: "metric",
              name: "imagesMissingAlt",
              value: imgsNoAlt,
              unit: "elements"
            }
          ],
          investigate: ['Add descriptive alt text, or alt="" for purely decorative images.']
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-img-alt`,
            profileId: this.profileId,
            severity: "error",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: imgsNoAlt },
            evidence: [...canonical.evidence]
          })
        );
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
        const canonical = buildFinding({
          ruleId: "accessibility.inputs-missing-labels",
          rite: "accessibility",
          severity: "serious",
          confidence: "measured",
          title: `${missingLabels} form inputs missing accessible names`,
          summary: `${missingLabels} input/select/textarea elements have no associated <label>, aria-label, or aria-labelledby. Screen readers cannot announce their purpose.`,
          where: { selector: "input, textarea, select", url },
          evidence: [
            {
              kind: "metric",
              name: "unlabeledInputs",
              value: missingLabels,
              unit: "elements"
            }
          ],
          investigate: [
            "Associate a <label for>, or add aria-label / aria-labelledby to each input."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-form-labels`,
            profileId: this.profileId,
            severity: "error",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: missingLabels },
            evidence: [...canonical.evidence]
          })
        );
      }
      const skipLink = await page.locator('a[href="#main"], a[href="#content"], a[href="#main-content"], a[href^="#main"]').count();
      if (skipLink === 0) {
        const canonical = buildFinding({
          ruleId: "accessibility.skip-link-missing",
          rite: "accessibility",
          severity: "warning",
          confidence: "observed",
          title: "Missing skip-to-main-content link",
          summary: "No skip link targeting #main, #main-content, or #content was found. Keyboard and screen reader users must tab through the entire header/navigation on every page.",
          where: {
            selector: 'a[href="#main"], a[href="#content"], a[href="#main-content"]',
            url
          },
          evidence: [
            {
              kind: "metric",
              name: "skipLinkCount",
              value: skipLink,
              unit: "elements"
            }
          ],
          investigate: [
            'Add a visually-hidden "Skip to main content" link as the first focusable element.'
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-skip-link`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
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
        const canonical = buildFinding({
          ruleId: "accessibility.aria-semantic-conflicts",
          rite: "accessibility",
          severity: "warning",
          confidence: "heuristic",
          title: `${ariaErrors.length} potential ARIA/semantic role conflicts`,
          summary: `${ariaErrors.length} elements combine a semantic HTML tag with a conflicting ARIA role, which can confuse assistive technology. First conflict: ${sanitizeUntrusted(ariaErrors[0] ?? "").text}`,
          where: { selector: "[role]", url },
          evidence: [
            {
              kind: "dom",
              selector: "[role]",
              snippet: sanitizeUntrusted(ariaErrors.slice(0, 3).join(" | "))
            }
          ],
          investigate: [
            "Prefer native semantic elements over redundant ARIA roles; audit flagged elements."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-aria-conflicts`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: ariaErrors.length },
            evidence: [...canonical.evidence]
          })
        );
      }
      const focusableCount = await page.locator("a, button, input, select, textarea, [tabindex]").count();
      if (focusableCount === 0) {
        const canonical = buildFinding({
          ruleId: "accessibility.no-focusable-elements",
          rite: "accessibility",
          severity: "info",
          confidence: "observed",
          title: "Page has no keyboard-focusable elements",
          summary: "No links, buttons, inputs, or [tabindex] elements exist, so keyboard users have nothing to interact with.",
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "focusableElementCount",
              value: focusableCount,
              unit: "elements"
            }
          ],
          investigate: [
            "If the page is purely informational this may be acceptable; otherwise add interactive controls."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-focusable`,
            profileId: this.profileId,
            severity: "info",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Screen reader profile error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        const canonical = buildFinding({
          ruleId: "accessibility.positive-tabindex",
          rite: "accessibility",
          severity: "warning",
          confidence: "measured",
          title: `${positiveTabindex} elements use positive tabindex`,
          summary: `${positiveTabindex} elements have tabindex > 0, which overrides the natural tab order and disorients keyboard users.`,
          where: { selector: "[tabindex]", url },
          evidence: [
            {
              kind: "metric",
              name: "positiveTabindexCount",
              value: positiveTabindex,
              unit: "elements"
            }
          ],
          investigate: [
            'Remove positive tabindex values; use tabindex="0" or fix DOM order instead.'
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-positive-tabindex`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: positiveTabindex },
            evidence: [...canonical.evidence]
          })
        );
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
        const canonical = buildFinding({
          ruleId: "accessibility.non-keyboard-interactive",
          rite: "accessibility",
          severity: "warning",
          confidence: "heuristic",
          title: `${nonKeyboardAccessible} clickable elements lack keyboard handlers`,
          summary: `${nonKeyboardAccessible} elements have click handlers but no keyboard equivalent, making them unreachable without a mouse.`,
          where: { selector: "[onclick]", url },
          evidence: [
            {
              kind: "metric",
              name: "nonKeyboardAccessibleCount",
              value: nonKeyboardAccessible,
              unit: "elements"
            }
          ],
          investigate: [
            "Use native <button>/<a> elements or add keydown handlers for Enter/Space."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-non-keyboard-buttons`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: nonKeyboardAccessible },
            evidence: [...canonical.evidence]
          })
        );
      }
      const focusStyles = await page.evaluate(() => {
        const styles = getComputedStyle(document.body);
        return {
          hasFocus: styles.outline !== "none"
        };
      });
      if (!focusStyles.hasFocus) {
        const canonical = buildFinding({
          ruleId: "accessibility.focus-indicator-missing",
          rite: "accessibility",
          severity: "warning",
          confidence: "heuristic",
          title: "Focus indicator may not be visible",
          summary: "The body computed style reports outline: none, suggesting focus outlines may be suppressed without a visible replacement (WCAG 2.4.7).",
          where: { selector: "body", url },
          evidence: [
            {
              kind: "dom",
              selector: "body",
              snippet: sanitizeUntrusted("computed outline-style on body is none")
            }
          ],
          investigate: ["Ensure :focus-visible styles provide a clear, high-contrast indicator."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-focus-styles`,
            profileId: this.profileId,
            severity: "warning",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      const hasAccessKey = await page.evaluate(() => {
        return document.querySelectorAll("[accesskey]").length > 0;
      });
      if (hasAccessKey) {
        const canonical = buildFinding({
          ruleId: "accessibility.accesskey-undocumented",
          rite: "accessibility",
          severity: "info",
          confidence: "observed",
          title: "Page uses accesskey attributes",
          summary: "One or more elements define accesskey shortcuts. These should be documented for users and checked for conflicts with browser/AT shortcuts.",
          where: { selector: "[accesskey]", url },
          evidence: [{ kind: "metric", name: "accesskeyElementCount", value: 1, unit: "present" }],
          investigate: [
            "Document keyboard shortcuts in help text; prefer single-key alternatives."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-accesskey`,
            profileId: this.profileId,
            severity: "info",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
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
          const canonical = buildFinding({
            ruleId: "accessibility.modal-no-focusable",
            rite: "accessibility",
            severity: "warning",
            confidence: "observed",
            title: "Modal dialog has no focusable elements",
            summary: 'An element matching [role="dialog"] or .modal contains no focusable descendants, trapping keyboard users with no way to interact or dismiss it.',
            where: { selector: '[role="dialog"], .modal', url },
            evidence: [{ kind: "metric", name: "modalFocusableCount", value: 0, unit: "elements" }],
            investigate: ["Ensure dialogs contain at least one focusable control and trap focus."]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-modal-focus`,
              profileId: this.profileId,
              severity: "warning",
              category: "accessibility",
              message: canonical.title,
              details: { canonicalFinding: canonical },
              evidence: [...canonical.evidence]
            })
          );
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
        const canonical = buildFinding({
          ruleId: "accessibility.custom-tab-handling",
          rite: "accessibility",
          severity: "info",
          confidence: "heuristic",
          title: `${tabHandled} inputs intercept the Tab key`,
          summary: `${tabHandled} text inputs have custom Tab keydown handlers. Custom tab handling can break expected focus order if not carefully implemented.`,
          where: { selector: 'input[type="text"], textarea', url },
          evidence: [
            { kind: "metric", name: "tabInterceptingInputs", value: tabHandled, unit: "elements" }
          ],
          investigate: [
            "Verify custom Tab handlers preserve logical focus order and Escape behavior."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-tab-handling`,
            profileId: this.profileId,
            severity: "info",
            category: "accessibility",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: tabHandled },
            evidence: [...canonical.evidence]
          })
        );
      }
      const overlays = await page.locator('[role="dialog"], .modal, .popover').all();
      if (overlays.length > 0) {
        const hasEscapeHandler = await overlays[0].evaluate(() => {
          const el = document.querySelector('[role="dialog"], .modal, .popover');
          const listeners = window.getEventListeners?.(el);
          return listeners?.keydown?.some((l) => l.listener.toString().includes("Escape")) ?? false;
        });
        if (!hasEscapeHandler) {
          const canonical = buildFinding({
            ruleId: "accessibility.overlay-no-escape",
            rite: "accessibility",
            severity: "info",
            confidence: "heuristic",
            title: "Overlay/modal lacks detected Escape handler",
            summary: "An overlay element exists but no Escape keydown listener was detected. Users expect Escape to dismiss modals and popovers.",
            where: { selector: '[role="dialog"], .modal, .popover', url },
            evidence: [
              {
                kind: "dom",
                selector: '[role="dialog"], .modal, .popover',
                snippet: sanitizeUntrusted("no Escape keydown listener detected")
              }
            ],
            investigate: ["Add an Escape key handler that closes the overlay and returns focus."]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-escape-close`,
              profileId: this.profileId,
              severity: "info",
              category: "accessibility",
              message: canonical.title,
              details: { canonicalFinding: canonical },
              evidence: [...canonical.evidence]
            })
          );
        }
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Keyboard profile error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
        function parseRgba(str) {
          const match = str.match(
            /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/
          );
          if (!match) return [0, 0, 0, 1];
          return [
            parseInt(match[1], 10),
            parseInt(match[2], 10),
            parseInt(match[3], 10),
            match[4] !== void 0 ? parseFloat(match[4]) : 1
          ];
        }
        function composite(fgRgba, bgRgb) {
          const [r, g, b, a] = fgRgba;
          return [
            Math.round(r * a + bgRgb[0] * (1 - a)),
            Math.round(g * a + bgRgb[1] * (1 - a)),
            Math.round(b * a + bgRgb[2] * (1 - a))
          ];
        }
        function getContrast(rgb1, rgb2) {
          const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
          const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
          const lighter = Math.max(l1, l2);
          const darker = Math.min(l1, l2);
          return (lighter + 0.05) / (darker + 0.05);
        }
        const textElements = document.querySelectorAll(
          "p, span, a, button, label, h1, h2, h3, h4, h5, h6"
        );
        function getEffectiveBg(element) {
          const layers = [];
          let current = element;
          while (current) {
            const style = window.getComputedStyle(current);
            const bg = style.backgroundColor;
            if (bg && bg !== "transparent") {
              const rgba = parseRgba(bg);
              if (rgba[3] > 0) {
                layers.unshift(rgba);
                if (rgba[3] >= 0.99) break;
              }
            }
            const bgImg = style.backgroundImage;
            if (bgImg && bgImg.includes("gradient")) {
              const m = bgImg.match(/rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/);
              if (m) {
                const rgba = parseRgba(m[0]);
                if (rgba[3] > 0) {
                  layers.unshift(rgba);
                  if (rgba[3] >= 0.99) break;
                }
              }
            }
            current = current.parentElement;
          }
          let acc = [10, 7, 17];
          for (const layer of layers) {
            acc = composite(layer, acc);
          }
          return acc;
        }
        for (const el of textElements) {
          const style = window.getComputedStyle(el);
          const bgRgb = getEffectiveBg(el);
          const fgRgba = parseRgba(style.color);
          const fgRgb = [fgRgba[0], fgRgba[1], fgRgba[2]];
          if (el.offsetHeight > 0 && (el.textContent?.trim().length ?? 0) > 0) {
            const contrast = getContrast(fgRgb, bgRgb);
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("contrast ratio") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("color only") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("high contrast") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("forced colors") }
          ],
          timestamp: Date.now(),
          isClassified: false
        });
      }
      const bgImageText = await page.evaluate(() => {
        let count = 0;
        const allElements = document.querySelectorAll("*");
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const bgImg = style.backgroundImage || "";
          if (bgImg.includes("url(") && (el.textContent?.trim().length ?? 0) > 0) {
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("bg image text") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no zoom") }],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.dom-too-large",
          rite: "accessibility",
          severity: "warning",
          confidence: "measured",
          title: `Page has ${complexity.elements} DOM elements`,
          summary: `The DOM contains ${complexity.elements} elements, above the ~500 threshold where cognitive load and assistive-technology navigation degrade.`,
          where: { selector: "body", url },
          evidence: [
            {
              kind: "metric",
              name: "domElementCount",
              value: complexity.elements,
              unit: "elements",
              threshold: 500
            }
          ],
          investigate: [
            "Reduce DOM size: paginate, lazy-render sections, and remove unused markup."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-too-many-elements`,
            profileId: this.profileId,
            severity: "warning",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical, elementCount: complexity.elements },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (complexity.nested > 15) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.deep-nesting",
          rite: "accessibility",
          severity: "info",
          confidence: "measured",
          title: `Maximum DOM nesting depth is ${complexity.nested} levels`,
          summary: `The deepest element sits ${complexity.nested} levels below <html>, making the structure hard to parse for assistive technology and maintainers.`,
          where: { selector: "body", url },
          evidence: [
            {
              kind: "metric",
              name: "maxDomDepth",
              value: complexity.nested,
              unit: "levels",
              threshold: 15
            }
          ],
          investigate: ["Flatten deeply nested wrappers; prefer semantic landmarks over div-soup."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-deep-nesting`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical, maxDepth: complexity.nested },
            evidence: [...canonical.evidence]
          })
        );
      }
      if (complexity.animations > 10) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.excessive-animation",
          rite: "accessibility",
          severity: "info",
          confidence: "measured",
          title: `${complexity.animations} animated elements on page`,
          summary: `${complexity.animations} elements use CSS animation/transition inline styles, which can overwhelm users with cognitive or vestibular sensitivities.`,
          where: { url },
          evidence: [
            {
              kind: "metric",
              name: "animatedElementCount",
              value: complexity.animations,
              unit: "elements",
              threshold: 10
            }
          ],
          investigate: [
            "Reduce simultaneous animations and ensure prefers-reduced-motion is honored."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-excessive-animation`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical, animationCount: complexity.animations },
            evidence: [...canonical.evidence]
          })
        );
      }
      const autoplay = await page.locator("audio[autoplay], video[autoplay]").count();
      if (autoplay > 0) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.autoplay-media",
          rite: "accessibility",
          severity: "warning",
          confidence: "observed",
          title: `${autoplay} media element(s) auto-play`,
          summary: `${autoplay} <audio>/<video> element(s) have the autoplay attribute, which can distract or distress users and violates WCAG 1.4.2 (audio control).`,
          where: { selector: "audio[autoplay], video[autoplay]", url },
          evidence: [
            { kind: "metric", name: "autoplayMediaCount", value: autoplay, unit: "elements" }
          ],
          investigate: ["Remove autoplay or require explicit user initiation before playback."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-autoplay`,
            profileId: this.profileId,
            severity: "warning",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: autoplay },
            evidence: [...canonical.evidence]
          })
        );
      }
      const reducedMotion = await page.evaluate(() => {
        return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      });
      if (!reducedMotion) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.no-reduced-motion",
          rite: "accessibility",
          severity: "info",
          confidence: "observed",
          title: "No prefers-reduced-motion handling detected",
          summary: "The user agent reports no reduced-motion preference was set during testing, and the page should still honor the media query for users who do set it.",
          where: { url },
          evidence: [
            {
              kind: "dom",
              selector: "html",
              snippet: sanitizeUntrusted(
                'matchMedia("(prefers-reduced-motion: reduce)").matches === false'
              )
            }
          ],
          investigate: [
            "Wrap animations/transitions in @media (prefers-reduced-motion: no-preference) or provide a reduce variant."
          ]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-reduced-motion`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
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
          const canonical = buildFinding({
            ruleId: "accessibility-cognitive.form-complexity",
            rite: "accessibility",
            severity: "info",
            confidence: "observed",
            title: `Form complexity issue: ${formComplexity[0]}`,
            summary: `A form on the page triggered complexity heuristics: ${formComplexity[0]}. Long or unlabelled forms increase cognitive load.`,
            where: { selector: "form", url },
            evidence: [
              {
                kind: "dom",
                selector: "form",
                snippet: sanitizeUntrusted(formComplexity[0] ?? "")
              },
              { kind: "metric", name: "formCount", value: complexity.forms, unit: "forms" }
            ],
            investigate: [
              "Split long forms into steps and ensure every field has a visible label."
            ]
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-form-complexity`,
              profileId: this.profileId,
              severity: "info",
              category: "cognitive",
              message: canonical.title,
              details: { canonicalFinding: canonical, issues: formComplexity },
              evidence: [...canonical.evidence]
            })
          );
        }
      }
      const instructionsCheck = await page.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || "";
        const hasInstructions2 = text.includes("step") || text.includes("instructions") || text.includes("how to") || text.includes("guide");
        return { hasInstructions: hasInstructions2, snippet: (document.body.textContent ?? "").slice(0, 200) };
      });
      const hasInstructions = typeof instructionsCheck === "boolean" ? instructionsCheck : instructionsCheck.hasInstructions;
      const instructionsSnippet = typeof instructionsCheck === "object" ? instructionsCheck.snippet ?? "" : "";
      if (!hasInstructions) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.no-instructions",
          rite: "accessibility",
          severity: "info",
          confidence: "heuristic",
          title: "Page lacks clear instructions or guidance",
          summary: "Body text contains no instructional keywords (step/instructions/how to/guide). Users with cognitive disabilities benefit from explicit guidance.",
          where: { selector: "body", url },
          evidence: [
            {
              kind: "dom",
              selector: "body",
              snippet: sanitizeUntrusted(instructionsSnippet)
            }
          ],
          investigate: ['Add a short "how to" section or step-by-step guidance for key tasks.']
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-instructions`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence]
          })
        );
      }
      const abbreviations = await page.locator("abbr").count();
      const abbreviationsWithTitle = await page.locator("abbr[title]").count();
      if (abbreviations > 0 && abbreviationsWithTitle < abbreviations) {
        const unexplained = abbreviations - abbreviationsWithTitle;
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.unexplained-abbreviations",
          rite: "accessibility",
          severity: "info",
          confidence: "measured",
          title: `${unexplained} abbreviations lack title/explanation`,
          summary: `${unexplained} of ${abbreviations} <abbr> elements have no title attribute, so their expansions are unavailable to users.`,
          where: { selector: "abbr", url },
          evidence: [
            {
              kind: "metric",
              name: "unexplainedAbbreviations",
              value: unexplained,
              unit: "elements"
            }
          ],
          investigate: ["Add a title attribute or <dfn> markup to every abbreviation."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-unexplained-abbr`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              total: abbreviations,
              withTitle: abbreviationsWithTitle
            },
            evidence: [...canonical.evidence]
          })
        );
      }
      const avgWordLength = await page.evaluate(() => {
        const text = document.body.innerText || "";
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 0) return 0;
        const totalChars = words.reduce((sum, w) => sum + w.length, 0);
        return totalChars / words.length;
      });
      if (avgWordLength > 7) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.complex-language",
          rite: "accessibility",
          severity: "info",
          confidence: "measured",
          title: `Average word length ${avgWordLength.toFixed(1)} characters`,
          summary: `Body text averages ${avgWordLength.toFixed(1)} characters per word, above the ~7 char guideline for easy readability.`,
          where: { selector: "body", url },
          evidence: [
            {
              kind: "metric",
              name: "averageWordLengthChars",
              value: Number(avgWordLength.toFixed(2)),
              unit: "chars",
              threshold: 7
            }
          ],
          investigate: ["Prefer shorter words and sentences; split long compound words."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-complex-language`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical, avgWordLength },
            evidence: [...canonical.evidence]
          })
        );
      }
      const paragraphs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll("p")).filter((p) => {
          const words = p.textContent?.split(/\s+/).length || 0;
          return words > 100;
        }).length;
      });
      if (paragraphs > 0) {
        const canonical = buildFinding({
          ruleId: "accessibility-cognitive.long-paragraphs",
          rite: "accessibility",
          severity: "info",
          confidence: "measured",
          title: `${paragraphs} paragraphs exceed 100 words`,
          summary: `${paragraphs} <p> element(s) contain over 100 words each, forming walls of text that are hard to scan.`,
          where: { selector: "p", url },
          evidence: [
            {
              kind: "metric",
              name: "overlongParagraphCount",
              value: paragraphs,
              unit: "elements",
              threshold: 100
            }
          ],
          investigate: ["Break long paragraphs into shorter chunks with subheadings or lists."]
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-long-paragraphs`,
            profileId: this.profileId,
            severity: "info",
            category: "cognitive",
            message: canonical.title,
            details: { canonicalFinding: canonical, count: paragraphs },
            evidence: [...canonical.evidence]
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: "error",
          category: "execution",
          message: `Cognitive profile error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error))
        })
      );
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no rtl dir") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("hardcoded text align") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("physical properties") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("directional images") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("rounded checks") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("flexbox direction") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("no arabic numerals") }
          ],
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
            evidence: [
              { kind: "dom", selector: "body", snippet: sanitizeUntrusted("form no dir") }
            ],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no ja lang") }],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no cjk font") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("line breaking") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no ruby") }],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no cjk punct") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("vertical text") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("letter spacing") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("number format") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("date format") }],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no hi lang") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("no devanagari font") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("no diacritics") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("no ligatures") }],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("line height") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("text rendering") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("word spacing") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("script mixing") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("currency") }],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("vowel order") }],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("webkit scrollbar") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("webkit backdrop") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("background clip text") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("check") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("appearance property") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("console errors") }
          ],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("forced colors none") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("svg high contrast") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("ua sniffing") }],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("pwa manifest") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("console errors") }
          ],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
          evidence: [
            {
              kind: "dom",
              selector: "body",
              snippet: sanitizeUntrusted("missing x ua compatible")
            }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("css variables") }
          ],
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
          evidence: [{ kind: "dom", selector: "body", snippet: sanitizeUntrusted("css grid") }],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("css clamp min max") }
          ],
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
          evidence: [
            { kind: "dom", selector: "body", snippet: sanitizeUntrusted("untranspiled ") }
          ],
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
          evidence: [
            {
              kind: "dom",
              selector: "body",
              snippet: sanitizeUntrusted("no unsupported browser warning")
            }
          ],
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
        evidence: [
          { kind: "dom", selector: "body", snippet: sanitizeUntrusted("execution error") }
        ],
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
          evidence: [...canonical.evidence],
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
          evidence: [...canonical.evidence],
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
            evidence: [...canonical.evidence],
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
            evidence: [...canonical.evidence],
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
            evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
            evidence: [...canonical.evidence],
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
          evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
              evidence: [...canonical.evidence],
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
              evidence: [...canonical.evidence],
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
        evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
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
      maxBrowsers: 6,
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
            if (!Array.isArray(finding.evidence)) {
              finding.evidence = [];
            }
            finding.evidence.push({ kind: "screenshot", captureId: screenshotMeta.fileName });
            const canonical = finding.details.canonicalFinding;
            if (canonical && Array.isArray(canonical.evidence)) {
              canonical.evidence.push({
                kind: "screenshot",
                captureId: screenshotMeta.fileName
              });
            }
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
          JSON.stringify({ details: finding.details ?? null, evidence: finding.evidence }),
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
  const requestedProfiles = options.profiles ? Array.isArray(options.profiles) ? options.profiles : options.profiles.split(",").map((p) => p.trim()) : void 0;
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
    await engine.cleanup();
  } catch {
  }
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
  const installCmd = pm === "yarn" ? "yarn global add hauntview@latest" : `${pm} install -g hauntview@latest`;
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

// src/cli/profile-flags.ts
var TAG_GROUPS = {
  a11y: ["a11y-screenreader", "a11y-keyboard", "a11y-visual", "a11y-cognitive"],
  accessibility: ["a11y-screenreader", "a11y-keyboard", "a11y-visual", "a11y-cognitive"],
  i18n: ["i18n-rtl", "i18n-cjk", "i18n-mixed"],
  resilience: ["offline", "broken-links", "network-resilience", "form-resilience"],
  devices: [
    "mobile",
    "tablet",
    "desktop",
    "mobile-iphone15",
    "mobile-android",
    "tablet-ipad",
    "desktop-1080p",
    "desktop-4k"
  ],
  browsers: ["browser-webkit", "browser-firefox", "browser-edge", "browser-legacy"],
  faults: ["image-failure", "font-failure", "js-disabled", "reduced-motion"],
  security: ["security-hygiene"]
};
var PROFILE_FLAGS = {
  mobile: "mobile",
  desktop: "desktop",
  tablet: "tablet",
  offline: "offline",
  brokenLinks: "broken-links",
  networkResilience: "network-resilience",
  formResilience: "form-resilience",
  imageFailure: "image-failure",
  fontFailure: "font-failure",
  jsDisabled: "js-disabled",
  reducedMotion: "reduced-motion",
  performance: "performance",
  securityHygiene: "security-hygiene",
  security: "security-hygiene",
  consoleErrors: "console-errors",
  a11yVisual: "a11y-visual",
  a11yKeyboard: "a11y-keyboard",
  a11yScreenreader: "a11y-screenreader",
  a11yCognitive: "a11y-cognitive",
  i18nRtl: "i18n-rtl",
  i18nCjk: "i18n-cjk",
  i18nMixed: "i18n-mixed",
  browserWebkit: "browser-webkit",
  webkit: "browser-webkit",
  browserFirefox: "browser-firefox",
  firefox: "browser-firefox",
  browserEdge: "browser-edge",
  edge: "browser-edge",
  browserLegacy: "browser-legacy",
  mobileIphone15: "mobile-iphone15",
  mobileAndroid: "mobile-android",
  tabletIpad: "tablet-ipad",
  desktop1080p: "desktop-1080p",
  desktop4k: "desktop-4k"
};
function registerProfileOptions(command) {
  return command.option(
    "--tag <tags>",
    "Run profiles matching specified tag or category (comma-separated: a11y, devices, resilience, browsers, i18n, faults)"
  ).option("--tags <tags>", "Alias for --tag").option(
    "--a11y, --accessibility",
    "Run all accessibility profiles (screenreader, keyboard, visual, cognitive)"
  ).option("--i18n", "Run all internationalization profiles (RTL, CJK, Mixed)").option("--devices", "Run all responsive device viewport profiles (mobile, tablet, desktop)").option(
    "--browsers",
    "Run all browser engine compatibility profiles (WebKit, Firefox, Edge, Legacy)"
  ).option(
    "--resilience",
    "Run all resilience profiles (offline, broken-links, network-resilience, form-resilience)"
  ).option(
    "--faults",
    "Run all environmental fault injection profiles (images, fonts, JS disabled, reduced motion)"
  ).option("--mobile", "Run canonical mobile viewport profile (390x844)").option("--desktop", "Run canonical desktop viewport profile (1280x800)").option("--tablet", "Run canonical tablet viewport profile (820x1180)").option("--offline", "Run offline service worker and cache resilience profile").option("--broken-links", "Run broken same-origin link crawl profile").option("--network-resilience", "Run network failure / fetch drop resilience profile").option("--form-resilience", "Run empty & invalid form submission resilience profile").option("--performance", "Run Core Web Vitals and performance budget profile").option("--security-hygiene", "Run HTTP security hygiene headers profile").option("--security", "Alias for --security-hygiene").option("--image-failure", "Run image blocking and missing alt/dimensions profile").option("--font-failure", "Run font blocking and layout shift profile").option("--js-disabled", "Run JavaScript disabled noscript profile").option("--reduced-motion", "Run prefers-reduced-motion animation compliance profile").option("--console-errors", "Run console error and uncaught exception capture profile").option("--a11y-visual", "Run visual contrast and color accessibility profile").option("--a11y-keyboard", "Run keyboard navigation and focus trapping profile").option("--a11y-screenreader", "Run screenreader and ARIA accessibility profile").option("--a11y-cognitive", "Run cognitive readability and motion profile").option("--i18n-rtl", "Run RTL language layout profile").option("--i18n-cjk", "Run CJK font and word-break profile").option("--i18n-mixed", "Run mixed script rendering profile").option("--browser-webkit", "Run WebKit rendering engine profile").option("--webkit", "Alias for --browser-webkit").option("--browser-firefox", "Run Firefox rendering engine profile").option("--firefox", "Alias for --browser-firefox").option("--browser-edge", "Run Microsoft Edge rendering engine profile").option("--edge", "Alias for --browser-edge").option("--browser-legacy", "Run legacy browser support profile").option("--mobile-iphone15", "Run iPhone 15 Pro viewport profile (390x844)").option("--mobile-android", "Run Galaxy S23 viewport profile (360x800)").option("--tablet-ipad", "Run iPad Pro viewport profile (1024x1366)").option("--desktop-1080p", "Run standard 1080p viewport profile (1920x1080)").option("--desktop-4k", "Run 4K UHD viewport profile (3840x2160)");
}
function resolveProfilesFromCliOptions(options) {
  const selected = /* @__PURE__ */ new Set();
  if (options.profiles) {
    const rawList = Array.isArray(options.profiles) ? options.profiles : String(options.profiles).split(",");
    for (const item of rawList) {
      const trimmed = item.trim();
      if (trimmed) selected.add(trimmed);
    }
  }
  const rawTags = [options.tag, options.tags].filter(Boolean);
  for (const tagStr of rawTags) {
    const parts = String(tagStr).split(",");
    for (const part of parts) {
      const normalized = part.trim().toLowerCase();
      if (TAG_GROUPS[normalized]) {
        for (const pid of TAG_GROUPS[normalized]) {
          selected.add(pid);
        }
      } else if (PROFILE_FLAGS[normalized]) {
        selected.add(PROFILE_FLAGS[normalized]);
      } else if (normalized) {
        selected.add(normalized);
      }
    }
  }
  for (const [tag, profiles] of Object.entries(TAG_GROUPS)) {
    if (options[tag] === true) {
      for (const pid of profiles) {
        selected.add(pid);
      }
    }
  }
  for (const [optKey, pid] of Object.entries(PROFILE_FLAGS)) {
    if (options[optKey] === true) {
      selected.add(pid);
    }
  }
  if (selected.size === 0) {
    return void 0;
  }
  return Array.from(selected);
}

// src/cli/index.ts
var program = new Command();
program.name("haunt").description(
  "HauntView \u2014 Local-first website resilience, accessibility, and failure-mode testing engine"
).version(VERSION, "-v, --version", "Output current HauntView version");
registerProfileOptions(program);
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
  if (url === "self-update" || url === "update" || url === "upgrade") {
    runSelfUpdate();
    return;
  }
  if (url === "doctor") {
    runDoctor();
    return;
  }
  if (url === "setup") {
    await runSetup(options);
    return;
  }
  const resolvedProfiles = resolveProfilesFromCliOptions(options);
  const runOptions = {
    ...options,
    profiles: resolvedProfiles
  };
  await runHaunt(url, runOptions);
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
program.command("self-update").alias("update").alias("upgrade").description("Update HauntView to the latest version published on npm").action(() => {
  runSelfUpdate();
});
program.parseAsync(process.argv).catch((err) => {
  console.error(`
\u2717 [haunt] Fatal error: ${err.message}
`);
  process.exit(1);
});
