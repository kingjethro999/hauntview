/**
 * HauntView Testing Engine - Main orchestrator
 * Coordinates browser pool, profile execution, and result collection
 */

import { chromium, webkit, firefox, Browser, Page } from 'playwright';
import { getChromiumLaunchOptions } from './core/browser-launch';
import { ProfileManager } from './core/profile-manager';
import { BrowserPool } from './core/browser-pool';
import { FindingClassifier } from './core/finding-classifier';
import { ScreenshotManager } from './core/screenshot-manager';
import {
  TestExecutionOptions,
  TestReport,
  ProfileResult,
  ReportGenerationOptions,
  ProfileContext,
} from './types';
import { ReportFactory } from './reports/factory';
import { MobileProfile } from './profiles/mobile';
import { DesktopProfile } from './profiles/desktop';
import { Desktop4KProfile } from './profiles/desktop-4k';
import { ConsoleErrorsProfile } from './profiles/console-errors';
import { TabletProfile } from './profiles/tablet';
import { PerformanceProfile } from './profiles/performance';
import { AccessibilityScreenReaderProfile } from './profiles/accessibility-screenreader';
import { AccessibilityKeyboardProfile } from './profiles/accessibility-keyboard';
import { AccessibilityVisualProfile } from './profiles/accessibility-visual';
import { AccessibilityCognitiveProfile } from './profiles/accessibility-cognitive';
import { I18nRTLProfile } from './profiles/i18n-rtl';
import { I18nCJKProfile } from './profiles/i18n-cjk';
import { I18nMixedProfile } from './profiles/i18n-mixed';
import { BrowserFirefoxProfile } from './profiles/browser-firefox';
import { BrowserEdgeProfile } from './profiles/browser-edge';
import { BrowserLegacyProfile } from './profiles/browser-legacy';
import { ImageFailureProfile } from './profiles/image-failure';
import { FontFailureProfile } from './profiles/font-failure';
import { JsDisabledProfile } from './profiles/js-disabled';
import { ReducedMotionProfile } from './profiles/reduced-motion';
import { OfflineProfile } from './profiles/offline';
import { BrokenLinksProfile } from './profiles/broken-links';
import { NetworkResilienceProfile } from './profiles/network-resilience';
import { SecurityHygieneProfile } from './profiles/security-hygiene';
import { FormResilienceProfile } from './profiles/form-resilience';

interface ExecutableProfile {
  execute(page: Page, url: string, context?: ProfileContext): Promise<ProfileResult>;
}

/** Profiles that manage their own BrowserContext and accept a Browser instance. */
export interface BrowserExecutableProfile {
  execute(
    browser: Browser,
    url: string,
    context?: ProfileContext,
    screenshotManager?: ScreenshotManager
  ): Promise<ProfileResult>;
}

export class HauntViewEngine {
  private profileManager: ProfileManager;
  private browserPool: BrowserPool;
  private classifier: FindingClassifier;
  private screenshotManager: ScreenshotManager;
  private browsers: Map<string, Browser> = new Map();

  constructor() {
    this.profileManager = new ProfileManager();
    this.browserPool = new BrowserPool({
      maxBrowsers: 3,
      maxPagesPerBrowser: 10,
      idleTimeout: 30000,
    });
    this.classifier = new FindingClassifier();
    this.screenshotManager = new ScreenshotManager('.hauntview/screenshots');
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    await this.screenshotManager.initialize();
  }

  /**
   * Execute test suite
   */
  async executeTests(options: TestExecutionOptions): Promise<TestReport> {
    const reportId = `hauntview-${Date.now()}`;
    const startTime = Date.now();

    // Ensure screenshot directory is ready
    await this.screenshotManager.initialize();

    // Determine which profiles to run
    let executionOrder = this.profileManager.getOptimalExecutionOrder();
    if (options.profiles && options.profiles.length > 0) {
      executionOrder = executionOrder.filter((p) => options.profiles!.includes(p.id));
    }

    const profileResults: ProfileResult[] = [];

    // Execute profiles (can be parallelized with concurrency control)
    for (const profile of executionOrder) {
      try {
        const context = this.profileManager.createExecutionContext(profile.id);
        if (!context) continue;

        const result = await this.executeProfile(profile.id, options.url, context);
        profileResults.push(result);

        // Classify findings
        for (const finding of result.findings) {
          const classified = await this.classifier.classify(finding);
          finding.canonicalHash = classified.canonical.canonicalHash;
          finding.isClassified = true;
        }

        this.profileManager.recordExecution(profile.id, result.duration);
      } catch (error) {
        console.error(`Error executing profile ${profile.id}:`, error);
      }
    }

    const endTime = Date.now();

    // Aggregate results
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
  private async executeProfile(
    profileId: string,
    url: string,
    context: ProfileContext
  ): Promise<ProfileResult> {
    let browserType = 'chromium';
    if (profileId === 'browser-webkit') {
      browserType = 'webkit';
    } else if (profileId === 'browser-firefox') {
      browserType = 'firefox';
    }

    let browser = this.browsers.get(browserType);
    if (!browser || !browser.isConnected()) {
      if (browserType === 'firefox') {
        try {
          browser = await firefox.launch({ headless: true });
        } catch {
          const options = await getChromiumLaunchOptions();
          browser = await chromium.launch({
            headless: true,
            executablePath: options.executablePath,
            args: options.args,
          });
        }
      } else if (browserType === 'webkit') {
        try {
          browser = await webkit.launch({ headless: true });
        } catch {
          const options = await getChromiumLaunchOptions();
          browser = await chromium.launch({
            headless: true,
            executablePath: options.executablePath,
            args: options.args,
          });
        }
      } else {
        const options = await getChromiumLaunchOptions();
        browser = await chromium.launch({
          headless: true,
          executablePath: options.executablePath,
          args: options.args,
        });
      }
      this.browsers.set(browserType, browser);
      this.browserPool.registerBrowser(browserType, browser);
    }

    const page = await this.browserPool.acquirePage(browserType, context, browser);

    try {
      let profile: ExecutableProfile | undefined;
      let result: ProfileResult | undefined;

      // Device profiles
      if (
        profileId === 'mobile-iphone15' ||
        profileId === 'mobile-android' ||
        profileId === 'mobile'
      ) {
        profile = new MobileProfile(profileId, 'Mobile');
      } else if (profileId === 'tablet-ipad' || profileId === 'tablet') {
        profile = new TabletProfile(profileId, 'Tablet');
      } else if (profileId === 'desktop-4k') {
        profile = new Desktop4KProfile(profileId, 'Desktop - 4K');
      } else if (profileId === 'desktop-1080p' || profileId === 'desktop') {
        profile = new DesktopProfile(profileId, 'Desktop');

        // Console errors profile
      } else if (profileId === 'console-errors') {
        profile = new ConsoleErrorsProfile(profileId, 'Console Errors');

        // Performance profile
      } else if (profileId === 'performance') {
        profile = new PerformanceProfile(profileId, 'Performance');

        // Accessibility profiles
      } else if (profileId === 'a11y-screenreader') {
        profile = new AccessibilityScreenReaderProfile(profileId, 'Accessibility - Screen Reader');
      } else if (profileId === 'a11y-keyboard') {
        profile = new AccessibilityKeyboardProfile(profileId, 'Accessibility - Keyboard');
      } else if (profileId === 'a11y-visual') {
        profile = new AccessibilityVisualProfile(profileId, 'Accessibility - Visual');
      } else if (profileId === 'a11y-cognitive') {
        profile = new AccessibilityCognitiveProfile(profileId, 'Accessibility - Cognitive');

        // Internationalization profiles
      } else if (profileId === 'i18n-rtl') {
        profile = new I18nRTLProfile(profileId, 'I18N - RTL (Arabic)');
      } else if (profileId === 'i18n-cjk') {
        profile = new I18nCJKProfile(profileId, 'I18N - CJK (Japanese)');
      } else if (profileId === 'i18n-mixed') {
        profile = new I18nMixedProfile(profileId, 'I18N - Mixed Scripts');

        // Browser compatibility profiles
      } else if (profileId === 'browser-firefox') {
        profile = new BrowserFirefoxProfile(profileId, 'Browser - Firefox');
      } else if (profileId === 'browser-edge') {
        profile = new BrowserEdgeProfile(profileId, 'Browser - Edge');
      } else if (profileId === 'browser-legacy') {
        profile = new BrowserLegacyProfile(profileId, 'Browser - Legacy');
      } else if (profileId.startsWith('browser-')) {
        profile = new ConsoleErrorsProfile(profileId, `Browser - ${profileId}`);

        // Canonical rites — Page-based
      } else if (profileId === 'image-failure') {
        profile = new ImageFailureProfile(profileId, 'Image Failure');
      } else if (profileId === 'font-failure') {
        profile = new FontFailureProfile(profileId, 'Font Failure');
      } else if (profileId === 'broken-links') {
        profile = new BrokenLinksProfile(profileId, 'Broken Links');
      } else if (profileId === 'security-hygiene') {
        profile = new SecurityHygieneProfile(profileId, 'Security Hygiene');

        // Canonical rites — Browser-based (manage their own context)
      } else if (profileId === 'js-disabled') {
        const p = new JsDisabledProfile(profileId, 'JS Disabled');
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === 'reduced-motion') {
        const p = new ReducedMotionProfile(profileId, 'Reduced Motion');
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === 'offline') {
        const p = new OfflineProfile(profileId, 'Offline');
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === 'network-resilience') {
        const p = new NetworkResilienceProfile(profileId, 'Network Resilience');
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else if (profileId === 'form-resilience') {
        const p = new FormResilienceProfile(profileId, 'Form Resilience');
        result = await p.execute(browser, url, context, this.screenshotManager);
      } else {
        // Default fallback
        profile = new ConsoleErrorsProfile(profileId, profileId);
      }

      if (!result) {
        result = await profile!.execute(page, url, context);

        // Capture actual apparition screenshot plate
        try {
          const screenshotMeta = await this.screenshotManager.captureScreenshot(
            page,
            profileId,
            url,
            context.viewport,
            { fullPage: false }
          );
          result.screenshots = [screenshotMeta];

          // Attach visual evidence to findings
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
  private aggregateResults(
    reportId: string,
    url: string,
    startTime: number,
    endTime: number,
    profileResults: ProfileResult[]
  ): TestReport {
    // Deduplicate findings
    const allFindings = profileResults.flatMap((r) => r.findings);
    const deduplicatedFindings = this.classifier.deduplicateFindings(allFindings);

    // Calculate summary
    const findingsBySeverity = {
      error: deduplicatedFindings.filter((f) => f.severity === 'error').length,
      warning: deduplicatedFindings.filter((f) => f.severity === 'warning').length,
      info: deduplicatedFindings.filter((f) => f.severity === 'info').length,
    };

    const findingsByCategory = new Map<string, number>();
    for (const finding of deduplicatedFindings) {
      const category = finding.category || 'uncategorized';
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
        canonicalizedFindings: deduplicatedFindings.filter((f) => f.canonicalHash).length,
      },
    };
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.browserPool.closeAll();

    for (const browser of this.browsers.values()) {
      await browser.close();
    }

    this.browsers.clear();
  }

  /**
   * Generate report from test results
   */
  async generateReport(report: TestReport, options: ReportGenerationOptions) {
    const generator = ReportFactory.createGenerator(options.format);
    return generator.generate(report, {
      format: options.format as 'html' | 'markdown' | 'json',
      includeScreenshots: options.includeScreenshots ?? true,
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
      profiles: this.profileManager.getProfileCount(),
    };
  }
}
