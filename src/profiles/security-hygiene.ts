/**
 * Security Hygiene Profile (canonical RiteId: security-hygiene)
 * Passive header inspection — never produces severity 'error'.
 */

import { Page } from 'playwright';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding } from '../types/finding-utils';
import { Finding, ProfileResult } from '../types';

interface HeaderRule {
  name: string;
  severity: 'warning' | 'info';
  ruleId: string;
  httpsOnly: boolean;
  title: string;
  summary: string;
}

const HEADER_RULES: HeaderRule[] = [
  {
    name: 'content-security-policy',
    severity: 'warning',
    ruleId: 'security-hygiene.missing-csp',
    httpsOnly: false,
    title: 'Content-Security-Policy header is missing',
    summary:
      'A missing CSP header leaves the page vulnerable to cross-site scripting (XSS) and data injection attacks.',
  },
  {
    name: 'x-content-type-options',
    severity: 'info',
    ruleId: 'security-hygiene.missing-xcto',
    httpsOnly: false,
    title: 'X-Content-Type-Options header is missing',
    summary:
      'Without X-Content-Type-Options: nosniff, browsers may MIME-sniff responses away from the declared content type.',
  },
  {
    name: 'referrer-policy',
    severity: 'info',
    ruleId: 'security-hygiene.missing-referrer-policy',
    httpsOnly: false,
    title: 'Referrer-Policy header is missing',
    summary:
      'A missing Referrer-Policy may leak sensitive URL information to third-party origins via the Referer header.',
  },
  {
    name: 'x-frame-options',
    severity: 'warning',
    ruleId: 'security-hygiene.missing-xfo',
    httpsOnly: false,
    title: 'X-Frame-Options header is missing',
    summary:
      'Without X-Frame-Options or an equivalent frame-ancestors CSP directive, the page is potentially vulnerable to clickjacking.',
  },
  {
    name: 'strict-transport-security',
    severity: 'warning',
    ruleId: 'security-hygiene.missing-hsts',
    httpsOnly: true,
    title: 'Strict-Transport-Security header is missing on HTTPS',
    summary:
      'HSTS is absent on an HTTPS page. Without it, browsers may allow downgrade attacks to plain HTTP.',
  },
];

export class SecurityHygieneProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      const isHttps = url.toLowerCase().startsWith('https://');
      let responseHeaders: Record<string, string> = {};
      let mixedContentDetected = false;

      // Passive: capture main document response headers
      page.on('response', (response) => {
        const req = response.request();
        if (req.isNavigationRequest() && req.resourceType() === 'document') {
          const headers = response.headers();
          responseHeaders = headers;
        }
        // Detect mixed content: http resource on https page
        if (isHttps && response.url().startsWith('http://')) {
          mixedContentDetected = true;
        }
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Check each header rule
      for (const rule of HEADER_RULES) {
        if (rule.httpsOnly && !isHttps) continue;

        const headerValue = responseHeaders[rule.name];
        if (headerValue === undefined) {
          const canonical = buildFinding({
            ruleId: rule.ruleId,
            rite: 'security-hygiene',
            severity: rule.severity,
            confidence: 'observed',
            title: rule.title,
            summary: rule.summary,
            evidence: [
              {
                kind: 'header',
                name: rule.name,
                value: undefined,
                expected: 'should be present',
              },
            ],
            investigate: [
              `Add the ${rule.name} response header to your server or CDN configuration.`,
            ],
          });

          findings.push({
            id: `${this.profileId}-${rule.ruleId}`,
            profileId: this.profileId,
            severity: rule.severity,
            category: 'security',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }

      // Mixed content finding
      if (mixedContentDetected) {
        const canonical = buildFinding({
          ruleId: 'security-hygiene.mixed-content',
          rite: 'security-hygiene',
          severity: 'warning',
          confidence: 'observed',
          title: 'Mixed content detected: HTTP resources loaded on an HTTPS page',
          summary:
            'Loading HTTP resources on an HTTPS page exposes users to network interception and may trigger browser security warnings.',
          evidence: [
            {
              kind: 'header',
              name: 'mixed-content',
              value: sanitizeUntrusted('http:// resource detected on https:// page'),
              expected: 'all resources should use HTTPS',
            },
          ],
          investigate: [
            'Update all resource URLs to use HTTPS.',
            'Enable a Content-Security-Policy with upgrade-insecure-requests directive.',
          ],
        });

        findings.push({
          id: `${this.profileId}-mixed-content`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'security',
          message: canonical.title,
          details: { canonicalFinding: canonical },
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
        message: `Security hygiene profile error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
    }

    const endTime = Date.now();
    const browserVersion = page.context().browser()?.version() ?? 'unknown';

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
        browserVersion: browserVersion ?? 'unknown',
        nodeVersion: process.version,
      },
    };
  }
}
