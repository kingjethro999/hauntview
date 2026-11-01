/**
 * Console Errors Profile - Captures all console errors, warnings, and messages
 * Detects JavaScript errors, deprecation warnings, and debug information
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info' | 'debug';
  text: string;
  location?: string;
}

export class ConsoleErrorsProfile {
  private profileId: string;
  private profileName: string;
  private messages: ConsoleMessage[] = [];

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  /**
   * Execute console errors testing profile
   */
  async execute(page: Page, url: string, _context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];
    this.messages = [];

    try {
      // Set up console message interceptors
      page.on('console', (msg) => {
        this.messages.push({
          type: msg.type() as 'log' | 'warn' | 'error' | 'info' | 'debug',
          text: msg.text(),
          location: msg.location().url,
        });
      });

      // Set up page error handler
      page.on('pageerror', (error) => {
        this.messages.push({
          type: 'error',
          text: error.toString(),
          location: 'page-error',
        });
      });

      // Set up request failed handler
      page.on('requestfailed', (request) => {
        this.messages.push({
          type: 'error',
          text: `Request failed: ${request.url()} - ${request.failure()?.errorText}`,
          location: 'request-failed',
        });
      });

      // Navigate to page
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForLoadState('domcontentloaded');

      // Allow time for async console messages
      await page.waitForTimeout(2000);

      // Check for service worker errors
      const swErrors = await page.evaluate(() => {
        return new Promise<string[]>((resolve) => {
          const errors: string[] = [];

          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then((registrations) => {
              registrations.forEach((reg) => {
                if (reg.installing?.state === 'redundant') {
                  errors.push('Service Worker installation failed');
                }
              });
              resolve(errors);
            });
          } else {
            resolve([]);
          }
        });
      });

      // Process all console messages
      for (const msg of this.messages) {
        let severity: 'error' | 'warning' | 'info' = 'info';

        if (msg.type === 'error') {
          severity = 'error';
        } else if (msg.type === 'warn') {
          severity = 'warning';
        }

        // Filter out common benign messages
        if (this.isIgnoredMessage(msg.text)) {
          continue;
        }

        findings.push({
          id: `${this.profileId}-${msg.type}-${findings.length}`,
          profileId: this.profileId,
          severity,
          category: 'console',
          message: `${msg.type.toUpperCase()}: ${msg.text}`,
          location: msg.location ? { file: msg.location } : undefined,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Add service worker errors
      for (const swError of swErrors) {
        findings.push({
          id: `${this.profileId}-sw-error-${findings.length}`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'console',
          message: `Service Worker: ${swError}`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for unhandled promise rejections
      page.on('pageerror', (error) => {
        if (error.message.includes('Unhandled promise rejection')) {
          findings.push({
            id: `${this.profileId}-unhandled-rejection-${findings.length}`,
            profileId: this.profileId,
            severity: 'error',
            category: 'console',
            message: `Unhandled Promise Rejection: ${error.message}`,
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      });
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `Console errors profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    } finally {
      // Clean up listeners
      page.removeAllListeners();
    }

    const endTime = Date.now();
    const metadata = await page.context().browser()?.version();

    return {
      profileId: this.profileId,
      profileName: this.profileName,
      success: findings.filter((f) => f.severity === 'error').length === 0,
      startTime,
      endTime,
      duration: endTime - startTime,
      findings,
      screenshots: [],
      metadata: {
        browserEngine: 'webkit',
        browserVersion: metadata || 'unknown',
        nodeVersion: process.version,
      },
    };
  }

  /**
   * Check if message should be ignored
   */
  private isIgnoredMessage(text: string): boolean {
    const ignoredPatterns = [
      /Non-Error promise rejection captured/i,
      /Translation not found/i,
      /ResizeObserver loop limit exceeded/i,
      /Ignored an unsupported entryTypes value/i,
      /Failed to load .*google.*analytics/i,
      /Failed to load extension/i,
    ];

    return ignoredPatterns.some((pattern) => pattern.test(text));
  }
}
