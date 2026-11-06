/**
 * Broken Links Profile (canonical RiteId: broken-links)
 * Collects same-origin anchor hrefs and probes each with HEAD (falling back to GET).
 */

import { Page } from 'playwright';
import pLimit from 'p-limit';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding } from '../types/finding-utils';
import { Finding, ProfileResult } from '../types';

const CONCURRENCY = 5;
const TIMEOUT_MS = 8000;
const INTER_REQUEST_DELAY_MS = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probeUrl(
  url: string
): Promise<
  { status: number; method: 'HEAD' | 'GET' } | { status: 0; method: 'HEAD'; failure: string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const headRes = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timer);
    return { status: headRes.status, method: 'HEAD' };
  } catch {
    clearTimeout(timer);
    // Fallback to GET
    const controller2 = new AbortController();
    const timer2 = setTimeout(() => controller2.abort(), TIMEOUT_MS);
    try {
      const getRes = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller2.signal,
      });
      clearTimeout(timer2);
      return { status: getRes.status, method: 'GET' };
    } catch (err) {
      clearTimeout(timer2);
      return { status: 0, method: 'HEAD', failure: String(err) };
    }
  }
}

export class BrokenLinksProfile {
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
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      const pageOrigin = new URL(url).origin;

      // Collect same-origin hrefs, capped at 100
      const hrefs = await page.evaluate((origin: string) => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        const seen = new Set<string>();
        const results: string[] = [];
        for (const a of anchors) {
          const href = (a as HTMLAnchorElement).href;
          if (!href || seen.has(href)) continue;
          seen.add(href);
          try {
            const u = new URL(href);
            if (
              (u.protocol === 'http:' || u.protocol === 'https:') &&
              u.origin === origin &&
              u.hash === ''
            ) {
              results.push(href);
            }
          } catch {
            // skip malformed
          }
          if (results.length >= 100) break;
        }
        return results;
      }, pageOrigin);

      // No links — valid, zero findings
      if (hrefs.length === 0) {
        const endTime = Date.now();
        const browserVersion = page.context().browser()?.version() ?? 'unknown';
        return {
          profileId: this.profileId,
          profileName: this.profileName,
          success: true,
          startTime,
          endTime,
          duration: endTime - startTime,
          findings: [],
          screenshots: [],
          metadata: {
            browserEngine: 'chromium',
            browserVersion: browserVersion ?? 'unknown',
            nodeVersion: process.version,
          },
        };
      }

      const limit = pLimit(CONCURRENCY);

      const probeResults = await Promise.all(
        hrefs.map((href) =>
          limit(async () => {
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
            ruleId: 'broken-links.not-found',
            rite: 'broken-links',
            severity: 'warning',
            confidence: 'observed',
            title: `Same-origin link returned ${probe.status}: ${safeUrl.slice(0, 60)}`,
            summary: `A same-origin anchor link returned HTTP ${probe.status}, indicating a broken or removed page.`,
            where: { url: safeUrl },
            evidence: [
              {
                kind: 'request',
                url: safeUrl,
                method: probe.method,
                status: probe.status,
              },
            ],
            investigate: [
              `Fix or redirect the URL: ${safeUrl}`,
              'Check your sitemap and internal linking for stale references.',
            ],
          });
          findings.push({
            id: `${this.profileId}-not-found-${findings.length}`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'links',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false,
          });
        } else if (probe.status === 401 || probe.status === 403 || probe.status === 429) {
          const canonical = buildFinding({
            ruleId: 'broken-links.auth-required',
            rite: 'broken-links',
            severity: 'info',
            confidence: 'observed',
            title: `Link returned ${probe.status} (inconclusive): ${safeUrl.slice(0, 60)}`,
            summary: `A same-origin link returned HTTP ${probe.status}. This may indicate an auth wall, rate-limit, or intentional restriction rather than a broken link.`,
            where: { url: safeUrl },
            evidence: [
              {
                kind: 'request',
                url: safeUrl,
                method: probe.method,
                status: probe.status,
              },
            ],
            investigate: [
              'Verify whether this URL is intentionally restricted.',
              'If the link should be public, investigate the access control configuration.',
            ],
          });
          findings.push({
            id: `${this.profileId}-auth-required-${findings.length}`,
            profileId: this.profileId,
            severity: 'info',
            category: 'links',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false,
          });
        } else if (probe.status >= 500) {
          const canonical = buildFinding({
            ruleId: 'broken-links.server-error',
            rite: 'broken-links',
            severity: 'warning',
            confidence: 'observed',
            title: `Link returned server error ${probe.status}: ${safeUrl.slice(0, 60)}`,
            summary: `A same-origin link returned HTTP ${probe.status}, indicating a server-side error on that page.`,
            where: { url: safeUrl },
            evidence: [
              {
                kind: 'request',
                url: safeUrl,
                method: probe.method,
                status: probe.status,
              },
            ],
            investigate: [`Investigate server logs for errors on: ${safeUrl}`],
          });
          findings.push({
            id: `${this.profileId}-server-error-${findings.length}`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'links',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }
    } catch (error) {
      findings.push({
        id: `${this.profileId}-execution-error`,
        profileId: this.profileId,
        severity: 'error',
        category: 'execution',
        message: `Broken links profile error: ${error instanceof Error ? error.message : String(error)}`,
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
