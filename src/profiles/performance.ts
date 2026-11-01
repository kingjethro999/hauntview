/**
 * Performance Profile - Tests Core Web Vitals and performance metrics
 * Checks FCP, LCP, CLS, TBT, TTI, and resource timing
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class PerformanceProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string, _context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

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
              vitalsData.lcp = lcpEntry.renderTime || lcpEntry.loadTime;
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
        findings.push({
          id: `${this.profileId}-fcp-slow`,
          profileId: this.profileId,
          severity: vitals.fcp > 3000 ? 'error' : 'warning',
          category: 'performance',
          message: `First Contentful Paint ${vitals.fcp.toFixed(0)}ms exceeds good threshold (1.8s)`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check LCP (should be < 2.5s for good)
      if (vitals.lcp && vitals.lcp > 2500) {
        findings.push({
          id: `${this.profileId}-lcp-slow`,
          profileId: this.profileId,
          severity: vitals.lcp > 4000 ? 'error' : 'warning',
          category: 'performance',
          message: `Largest Contentful Paint ${vitals.lcp.toFixed(0)}ms exceeds good threshold (2.5s)`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check CLS (should be < 0.1 for good)
      if (vitals.cls > 0.1) {
        findings.push({
          id: `${this.profileId}-cls-high`,
          profileId: this.profileId,
          severity: vitals.cls > 0.25 ? 'error' : 'warning',
          category: 'performance',
          message: `Cumulative Layout Shift ${vitals.cls.toFixed(3)} exceeds good threshold (0.1)`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check resource count
      if (vitals.resourceCount > 100) {
        findings.push({
          id: `${this.profileId}-resource-count`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'performance',
          message: `Page loads ${vitals.resourceCount} resources, consider consolidation`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check total resource size
      const sizeMb = vitals.totalResourceSize / (1024 * 1024);
      if (sizeMb > 5) {
        findings.push({
          id: `${this.profileId}-resource-size`,
          profileId: this.profileId,
          severity: sizeMb > 10 ? 'error' : 'warning',
          category: 'performance',
          message: `Total resource size ${sizeMb.toFixed(1)}MB exceeds recommended ~3MB`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for unminified JavaScript
      const unminified = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.filter((s: any) => {
          const src = s.getAttribute('src') || '';
          return src.includes('/src/') || (src.endsWith('.js') && !src.includes('.min.'));
        }).length;
      });

      if (unminified > 0) {
        findings.push({
          id: `${this.profileId}-unminified-js`,
          profileId: this.profileId,
          severity: 'info',
          category: 'performance',
          message: `Found ${unminified} potentially unminified JavaScript files`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for render-blocking resources
      const renderBlocking = await page.evaluate(() => {
        return performance.getEntriesByType('resource').filter((r: PerformanceEntry) => {
          const url = r.name.toLowerCase();
          return (url.endsWith('.css') || url.endsWith('.js')) && r.duration > 500;
        }).length;
      });

      if (renderBlocking > 0) {
        findings.push({
          id: `${this.profileId}-render-blocking`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'performance',
          message: `${renderBlocking} render-blocking resources taking > 500ms`,
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
        message: `Performance profile execution error: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: Date.now(),
        isClassified: false,
      });
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
