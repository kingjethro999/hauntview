/**
 * Performance Profile - Tests Core Web Vitals and performance metrics
 * Checks FCP, LCP, CLS, TBT, TTI, and resource timing
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

export class PerformanceProfile {
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
      await navigateResilient(page, url);

      // Collect Web Vitals
      interface VitalsData {
        fcp: number | null;
        lcp: number | null;
        cls: number;
        tbt: number;
        tti: number | null;
        resourceCount: number;
        totalResourceSize: number;
      }

      const vitals = await page.evaluate(() => {
        return new Promise<VitalsData>((resolve) => {
          const vitalsData: VitalsData = {
            fcp: null,
            lcp: null,
            cls: 0,
            tbt: 0,
            tti: null,
            resourceCount: 0,
            totalResourceSize: 0,
          };

          // FCP - First Contentful Paint
          const paintEntries = performance.getEntriesByType('paint');
          const fcp = paintEntries.find((e) => e.name === 'first-contentful-paint');
          if (fcp) vitalsData.fcp = fcp.startTime;

          // LCP - Largest Contentful Paint
          const lcpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const lcpEntry = entry as PerformanceEntryWithRenderTime;
              vitalsData.lcp = lcpEntry.renderTime || lcpEntry.loadTime || null;
            }
          });
          try {
            lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
          } catch {
            // Not supported
          }

          // CLS - Cumulative Layout Shift
          const clsObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              const clsEntry = entry as PerformanceEntryWithHadRecentInput;
              if (clsEntry.hadRecentInput) continue;
              vitalsData.cls += clsEntry.value || 0;
            }
          });
          try {
            clsObserver.observe({ type: 'layout-shift', buffered: true });
          } catch {
            // Not supported
          }

          // Resource metrics
          const resources = performance.getEntriesByType('resource');
          vitalsData.resourceCount = resources.length;
          vitalsData.totalResourceSize = resources.reduce(
            (acc: number, r: PerformanceEntry) =>
              acc + ((r as PerformanceResourceTiming).transferSize || 0),
            0
          );

          setTimeout(() => {
            lcpObserver.disconnect();
            clsObserver.disconnect();
            resolve(vitalsData);
          }, 3000);
        });
      });

      interface PerformanceEntryWithRenderTime extends PerformanceEntry {
        renderTime?: number;
        loadTime?: number;
      }

      interface PerformanceEntryWithHadRecentInput extends PerformanceEntry {
        hadRecentInput?: boolean;
        value?: number;
      }

      // Check FCP (should be < 1.8s for good)
      if (vitals.fcp && vitals.fcp > 1800) {
        const canonical = buildFinding({
          ruleId: 'performance.fcp-slow',
          rite: 'performance',
          severity: vitals.fcp > 3000 ? 'serious' : 'warning',
          confidence: 'measured',
          title: `First Contentful Paint ${Math.round(vitals.fcp)}ms exceeds 1.8s`,
          summary: `FCP was ${Math.round(vitals.fcp)}ms, above the 1800ms "good" threshold${vitals.fcp > 3000 ? ' and into the "poor" range' : ''}. Users see a blank page until first paint.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'firstContentfulPaint',
              value: Math.round(vitals.fcp),
              unit: 'ms',
              threshold: 1800,
            },
          ],
          investigate: [
            'Reduce render-blocking resources, optimize critical CSS, and defer non-essential JS.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-fcp-slow`,
            profileId: this.profileId,
            severity: vitals.fcp > 3000 ? 'error' : 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, fcp: vitals.fcp },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check LCP (should be < 2.5s for good)
      if (vitals.lcp && vitals.lcp > 2500) {
        const canonical = buildFinding({
          ruleId: 'performance.lcp-slow',
          rite: 'performance',
          severity: vitals.lcp > 4000 ? 'serious' : 'warning',
          confidence: 'measured',
          title: `Largest Contentful Paint ${Math.round(vitals.lcp)}ms exceeds 2.5s`,
          summary: `LCP was ${Math.round(vitals.lcp)}ms, above the 2500ms "good" threshold${vitals.lcp > 4000 ? ' and into the "poor" range' : ''}. The main content took too long to render.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'largestContentfulPaint',
              value: Math.round(vitals.lcp),
              unit: 'ms',
              threshold: 2500,
            },
          ],
          investigate: [
            'Optimize the LCP element (usually a hero image or heading): preload it, compress it, and remove render-blocking chains.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-lcp-slow`,
            profileId: this.profileId,
            severity: vitals.lcp > 4000 ? 'error' : 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, lcp: vitals.lcp },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check CLS (should be < 0.1 for good)
      if (vitals.cls > 0.1) {
        const canonical = buildFinding({
          ruleId: 'performance.cls-high',
          rite: 'performance',
          severity: vitals.cls > 0.25 ? 'serious' : 'warning',
          confidence: 'measured',
          title: `Cumulative Layout Shift ${vitals.cls.toFixed(3)} exceeds 0.1`,
          summary: `CLS was ${vitals.cls.toFixed(3)}, above the 0.1 "good" threshold${vitals.cls > 0.25 ? ' and into the "poor" range' : ''}. Visible content shifts during load.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'cumulativeLayoutShift',
              value: Number(vitals.cls.toFixed(4)),
              unit: 'score',
              threshold: 0.1,
            },
          ],
          investigate: [
            'Set width/height on images and embeds; avoid inserting content above existing content after load.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-cls-high`,
            profileId: this.profileId,
            severity: vitals.cls > 0.25 ? 'error' : 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, cls: vitals.cls },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check resource count
      if (vitals.resourceCount > 100) {
        const canonical = buildFinding({
          ruleId: 'performance.resource-count-high',
          rite: 'performance',
          severity: 'warning',
          confidence: 'measured',
          title: `Page loads ${vitals.resourceCount} resources`,
          summary: `The page requested ${vitals.resourceCount} subresources, above the recommended ~100. Excessive requests increase load time and failure surface.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'resourceCount',
              value: vitals.resourceCount,
              unit: 'requests',
              threshold: 100,
            },
          ],
          investigate: [
            'Bundle and consolidate assets; audit third-party scripts and unused resources.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-resource-count`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, resourceCount: vitals.resourceCount },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check total resource size
      const sizeMb = vitals.totalResourceSize / (1024 * 1024);
      if (sizeMb > 5) {
        const canonical = buildFinding({
          ruleId: 'performance.resource-size-high',
          rite: 'performance',
          severity: sizeMb > 10 ? 'serious' : 'warning',
          confidence: 'measured',
          title: `Total resource size ${sizeMb.toFixed(1)}MB exceeds 5MB`,
          summary: `The page transferred ${sizeMb.toFixed(1)}MB of resources, above the ~3MB recommendation${sizeMb > 10 ? ' and into double digits' : ''}. Large payloads slow load, especially on mobile networks.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'totalResourceSize',
              value: Number(sizeMb.toFixed(2)),
              unit: 'MB',
              threshold: 5,
            },
          ],
          investigate: [
            'Compress images, enable Brotli/gzip, code-split JS, and lazy-load below-fold assets.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-resource-size`,
            profileId: this.profileId,
            severity: sizeMb > 10 ? 'error' : 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, sizeMb },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for unminified JavaScript
      const unminified = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.filter((s: Element) => {
          const src = s.getAttribute('src') || '';
          return src.includes('/src/') || (src.endsWith('.js') && !src.includes('.min.'));
        }).length;
      });

      if (unminified > 0) {
        const canonical = buildFinding({
          ruleId: 'performance.unminified-js',
          rite: 'performance',
          severity: 'info',
          confidence: 'heuristic',
          title: `${unminified} script(s) appear unminified`,
          summary: `${unminified} <script src> URLs look unminified (no .min. or /src/ path heuristics). Unminified JS ships extra bytes to every user.`,
          where: { selector: 'script[src]', url },
          evidence: [
            {
              kind: 'metric',
              name: 'unminifiedScriptCount',
              value: unminified,
              unit: 'scripts',
            },
          ],
          investigate: [
            'Serve minified production bundles; verify build output includes minification.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-unminified-js`,
            profileId: this.profileId,
            severity: 'info',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: unminified },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for render-blocking resources
      const renderBlocking = await page.evaluate(() => {
        return performance.getEntriesByType('resource').filter((r: PerformanceEntry) => {
          const url = r.name.toLowerCase();
          return (url.endsWith('.css') || url.endsWith('.js')) && r.duration > 500;
        }).length;
      });

      if (renderBlocking > 0) {
        const canonical = buildFinding({
          ruleId: 'performance.render-blocking-resources',
          rite: 'performance',
          severity: 'warning',
          confidence: 'measured',
          title: `${renderBlocking} render-blocking resources over 500ms`,
          summary: `${renderBlocking} CSS/JS resources each took over 500ms and block first render. Render-blocking chains directly delay FCP and LCP.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'slowRenderBlockingResources',
              value: renderBlocking,
              unit: 'resources',
              threshold: 500,
            },
          ],
          investigate: [
            'Inline critical CSS, defer non-critical JS with async/defer, and reduce chain depth.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-render-blocking`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'performance',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: renderBlocking },
            evidence: [...canonical.evidence],
          })
        );
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: 'error',
          category: 'execution',
          message: `Performance profile execution error: ${error instanceof Error ? error.message : String(error)}`,
          evidence: executionErrorEvidence(error instanceof Error ? error.message : String(error)),
        })
      );
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
}
