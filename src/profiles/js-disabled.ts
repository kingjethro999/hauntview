/**
 * JS Disabled Profile (canonical RiteId: js-disabled)
 * Tests page behaviour when JavaScript is disabled.
 */

import { Browser } from 'playwright';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding } from '../types/finding-utils';
import { Finding, ProfileResult } from '../types';

export class JsDisabledProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(browser: Browser, url: string): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const captureId = `js-disabled-${Date.now()}`;
      await page.screenshot({ fullPage: false });

      const evalResult = await page.evaluate(() => {
        const textLen = (document.body?.innerText ?? '').length;
        const hasNoscript = document.querySelector('noscript') !== null;
        const rootEmpty =
          (document.querySelector('#root,#app,[data-reactroot]')?.childElementCount ?? 1) === 0;
        const bodySnippet = (document.body?.innerHTML ?? '').slice(0, 200);
        return { textLen, hasNoscript, rootEmpty, bodySnippet };
      });

      const isEmpty = evalResult.textLen < 100 || evalResult.rootEmpty;

      if (isEmpty && !evalResult.hasNoscript) {
        const canonical = buildFinding({
          ruleId: 'js-disabled.empty-content',
          rite: 'js-disabled',
          severity: 'warning',
          confidence: 'observed',
          title: 'Page renders no content without JavaScript and has no <noscript> fallback',
          summary:
            'When JavaScript is disabled the page body contains fewer than 100 characters and no <noscript> element is present. Users on assistive technologies or with JS blocked see a blank page.',
          evidence: [
            { kind: 'screenshot', captureId },
            {
              kind: 'dom',
              selector: 'body',
              snippet: sanitizeUntrusted(evalResult.bodySnippet),
            },
          ],
          investigate: [
            'Add a <noscript> element with a meaningful fallback message.',
            'Consider server-side rendering to provide content without JavaScript.',
          ],
        });

        findings.push({
          id: `${this.profileId}-empty-content`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'resilience',
          message: canonical.title,
          details: { canonicalFinding: canonical, textLength: evalResult.textLen },
          timestamp: Date.now(),
          isClassified: false,
        });
      } else if (isEmpty && evalResult.hasNoscript) {
        const canonical = buildFinding({
          ruleId: 'js-disabled.noscript-fallback',
          rite: 'js-disabled',
          severity: 'info',
          confidence: 'observed',
          title: 'Page has a <noscript> fallback but renders little content without JavaScript',
          summary:
            'A <noscript> element is present, but the page body is nearly empty without JavaScript. The noscript fallback may need more content.',
          evidence: [
            { kind: 'screenshot', captureId },
            {
              kind: 'dom',
              selector: 'noscript',
              snippet: sanitizeUntrusted(evalResult.bodySnippet),
            },
          ],
          investigate: ['Review the <noscript> element content to ensure it is helpful to users.'],
        });

        findings.push({
          id: `${this.profileId}-noscript-fallback`,
          profileId: this.profileId,
          severity: 'info',
          category: 'resilience',
          message: canonical.title,
          details: { canonicalFinding: canonical, textLength: evalResult.textLen },
          timestamp: Date.now(),
          isClassified: false,
        });
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `JS disabled profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    } finally {
      await context.close();
    }

    const endTime = Date.now();
    const browserVersion = browser.version();

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
        browserEngine: 'chromium',
        browserVersion,
        nodeVersion: process.version,
      },
    };
  }
}
