/**
 * Accessibility: Cognitive Load Profile
 * Validates cognitive accessibility (clarity, complexity, instructions)
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';

export class AccessibilityCognitiveProfile {
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

      // Analyze page complexity
      const complexity = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        return {
          elements: elements.length,
          forms: document.querySelectorAll('form').length,
          inputs: document.querySelectorAll('input, select, textarea').length,
          buttons: document.querySelectorAll('button, a[role="button"]').length,
          animations: document.querySelectorAll('[style*="animation"], [style*="transition"]')
            .length,
          nested: Math.max(
            ...Array.from(elements).map((el: Element) => {
              let depth = 0;
              let parent = el.parentElement;
              while (parent) {
                depth++;
                parent = parent.parentElement;
              }
              return depth;
            })
          ),
        };
      });

      if (complexity.elements > 500) {
        findings.push({
          id: `${this.profileId}-too-many-elements`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'cognitive',
          message: `Page has ${complexity.elements} DOM elements, consider simplification`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (complexity.nested > 15) {
        findings.push({
          id: `${this.profileId}-deep-nesting`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: `Maximum nesting depth is ${complexity.nested} levels, consider flattening`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      if (complexity.animations > 10) {
        findings.push({
          id: `${this.profileId}-excessive-animation`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: `${complexity.animations} animated elements, may overwhelm users`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for auto-playing audio/video
      const autoplay = await page.locator('audio[autoplay], video[autoplay]').count();
      if (autoplay > 0) {
        findings.push({
          id: `${this.profileId}-autoplay`,
          profileId: this.profileId,
          severity: 'warning',
          category: 'cognitive',
          message: `${autoplay} media elements auto-play, breaks cognitive accessibility`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for prefers-reduced-motion
      const reducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      if (!reducedMotion) {
        findings.push({
          id: `${this.profileId}-no-reduced-motion`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: 'Add prefers-reduced-motion media query support for animations',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check form complexity
      if (complexity.forms > 0) {
        const formComplexity = await page.evaluate(() => {
          const forms = document.querySelectorAll('form');
          const issues = [];

          for (const form of forms) {
            const inputs = form.querySelectorAll('input, select, textarea').length;
            const labels = form.querySelectorAll('label').length;

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
            severity: 'info',
            category: 'cognitive',
            message: `Form complexity issue: ${formComplexity[0]}`,
            timestamp: Date.now(),
            isClassified: false,
          });
        }
      }

      // Check for clear instructions
      const hasInstructions = await page.evaluate(() => {
        const text = document.body.textContent?.toLowerCase() || '';
        return (
          text.includes('step') ||
          text.includes('instructions') ||
          text.includes('how to') ||
          text.includes('guide')
        );
      });

      if (!hasInstructions) {
        findings.push({
          id: `${this.profileId}-no-instructions`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: 'Page lacks clear instructions or guidance for users',
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for abbreviations explanation
      const abbreviations = await page.locator('abbr').count();
      const abbreviationsWithTitle = await page.locator('abbr[title]').count();

      if (abbreviations > 0 && abbreviationsWithTitle < abbreviations) {
        findings.push({
          id: `${this.profileId}-unexplained-abbr`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: `${abbreviations - abbreviationsWithTitle} abbreviations lack title/explanation`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for readability level (simplified check)
      const avgWordLength = await page.evaluate(() => {
        const text = document.body.innerText || '';
        const words = text.split(/\s+/).filter((w) => w.length > 0);
        if (words.length === 0) return 0;
        const totalChars = words.reduce((sum, w) => sum + w.length, 0);
        return totalChars / words.length;
      });

      if (avgWordLength > 7) {
        findings.push({
          id: `${this.profileId}-complex-language`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: `Average word length ${avgWordLength.toFixed(1)} characters, consider simpler language`,
          timestamp: Date.now(),
          isClassified: false,
        });
      }

      // Check for paragraph length
      const paragraphs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('p')).filter((p: Element) => {
          const words = p.textContent?.split(/\s+/).length || 0;
          return words > 100;
        }).length;
      });

      if (paragraphs > 0) {
        findings.push({
          id: `${this.profileId}-long-paragraphs`,
          profileId: this.profileId,
          severity: 'info',
          category: 'cognitive',
          message: `${paragraphs} paragraphs with > 100 words, consider breaking up`,
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
        message: `Cognitive profile error: ${error instanceof Error ? error.message : String(error)}`,
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
