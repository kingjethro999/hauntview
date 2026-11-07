/**
 * Console Errors Profile - Captures all console errors, warnings, and messages
 * Detects JavaScript errors, deprecation warnings, and debug information
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import type { Severity } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

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
  async execute(page: Page, url: string): Promise<ProfileResult> {
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

      // Navigate to page safely without stalling on streaming/websockets
      await navigateResilient(page, url);

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

        const canonicalSeverity: Severity =
          msg.type === 'error' ? 'serious' : msg.type === 'warn' ? 'warning' : 'info';
        const canonical = buildFinding({
          ruleId: `console-errors.${msg.type}-message`,
          rite: 'console-errors',
          severity: canonicalSeverity,
          confidence: 'observed',
          title: `Console ${msg.type} emitted during page load`,
          summary: `The page logged a console.${msg.type} message during the test run. Console errors often indicate broken functionality; review the message text in evidence.`,
          ...(msg.location ? { where: { url: sanitizeUntrusted(msg.location).text } } : {}),
          evidence: [{ kind: 'console', level: msg.type, text: sanitizeUntrusted(msg.text) }],
          investigate: [
            'Open the browser DevTools console, reproduce the load, and trace the message to its source.',
          ],
        });

        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-${msg.type}-${findings.length}`,
            profileId: this.profileId,
            severity,
            category: 'console',
            message: `${msg.type.toUpperCase()}: ${msg.text}`,
            location: msg.location ? { file: msg.location } : undefined,
            details: { canonicalFinding: canonical, consoleType: msg.type },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Add service worker errors
      for (const swError of swErrors) {
        const canonical = buildFinding({
          ruleId: 'console-errors.service-worker-error',
          rite: 'console-errors',
          severity: 'warning',
          confidence: 'observed',
          title: 'Service worker reported an error during registration',
          summary: `A service worker issue was detected: ${swError}. Service worker failures can break offline support and caching.`,
          where: { url },
          evidence: [
            {
              kind: 'console',
              level: 'error',
              text: sanitizeUntrusted(`Service Worker: ${swError}`),
            },
          ],
          investigate: [
            'Check the service worker registration code and browser console for the underlying failure.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-sw-error-${findings.length}`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'console',
            message: `Service Worker: ${swError}`,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for unhandled promise rejections
      page.on('pageerror', (error) => {
        if (error.message.includes('Unhandled promise rejection')) {
          const canonical = buildFinding({
            ruleId: 'console-errors.unhandled-rejection',
            rite: 'console-errors',
            severity: 'warning',
            confidence: 'observed',
            title: 'Unhandled promise rejection during page load',
            summary:
              'A promise rejected without a catch handler. Unhandled rejections can leave UI in a broken state and are a common source of silent failures.',
            where: { url },
            evidence: [
              {
                kind: 'console',
                level: 'error',
                text: sanitizeUntrusted(error.message),
              },
            ],
            investigate: [
              'Add .catch() handlers or try/catch around the async code that rejected.',
            ],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-unhandled-rejection-${findings.length}`,
              profileId: this.profileId,
              severity: 'error',
              category: 'console',
              message: `Unhandled Promise Rejection: ${error.message}`,
              details: { canonicalFinding: canonical },
              evidence: [...canonical.evidence],
            })
          );
        }
      });
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: 'error',
          category: 'execution',
          message: `Console errors profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
        })
      );
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
