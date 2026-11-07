/**
 * Accessibility: Cognitive Load Profile
 * Validates cognitive accessibility (clarity, complexity, instructions)
 */

import { Page } from 'playwright';
import { Finding, ProfileResult } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

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
      await navigateResilient(page, url);

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
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.dom-too-large',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'measured',
          title: `Page has ${complexity.elements} DOM elements`,
          summary: `The DOM contains ${complexity.elements} elements, above the ~500 threshold where cognitive load and assistive-technology navigation degrade.`,
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'metric',
              name: 'domElementCount',
              value: complexity.elements,
              unit: 'elements',
              threshold: 500,
            },
          ],
          investigate: [
            'Reduce DOM size: paginate, lazy-render sections, and remove unused markup.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-too-many-elements`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical, elementCount: complexity.elements },
            evidence: [...canonical.evidence],
          })
        );
      }

      if (complexity.nested > 15) {
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.deep-nesting',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'measured',
          title: `Maximum DOM nesting depth is ${complexity.nested} levels`,
          summary: `The deepest element sits ${complexity.nested} levels below <html>, making the structure hard to parse for assistive technology and maintainers.`,
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'metric',
              name: 'maxDomDepth',
              value: complexity.nested,
              unit: 'levels',
              threshold: 15,
            },
          ],
          investigate: ['Flatten deeply nested wrappers; prefer semantic landmarks over div-soup.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-deep-nesting`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical, maxDepth: complexity.nested },
            evidence: [...canonical.evidence],
          })
        );
      }

      if (complexity.animations > 10) {
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.excessive-animation',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'measured',
          title: `${complexity.animations} animated elements on page`,
          summary: `${complexity.animations} elements use CSS animation/transition inline styles, which can overwhelm users with cognitive or vestibular sensitivities.`,
          where: { url },
          evidence: [
            {
              kind: 'metric',
              name: 'animatedElementCount',
              value: complexity.animations,
              unit: 'elements',
              threshold: 10,
            },
          ],
          investigate: [
            'Reduce simultaneous animations and ensure prefers-reduced-motion is honored.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-excessive-animation`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical, animationCount: complexity.animations },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for auto-playing audio/video
      const autoplay = await page.locator('audio[autoplay], video[autoplay]').count();
      if (autoplay > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.autoplay-media',
          rite: 'accessibility',
          severity: 'warning',
          confidence: 'observed',
          title: `${autoplay} media element(s) auto-play`,
          summary: `${autoplay} <audio>/<video> element(s) have the autoplay attribute, which can distract or distress users and violates WCAG 1.4.2 (audio control).`,
          where: { selector: 'audio[autoplay], video[autoplay]', url },
          evidence: [
            { kind: 'metric', name: 'autoplayMediaCount', value: autoplay, unit: 'elements' },
          ],
          investigate: ['Remove autoplay or require explicit user initiation before playback.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-autoplay`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: autoplay },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for prefers-reduced-motion
      const reducedMotion = await page.evaluate(() => {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      });

      if (!reducedMotion) {
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.no-reduced-motion',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'observed',
          title: 'No prefers-reduced-motion handling detected',
          summary:
            'The user agent reports no reduced-motion preference was set during testing, and the page should still honor the media query for users who do set it.',
          where: { url },
          evidence: [
            {
              kind: 'dom',
              selector: 'html',
              snippet: sanitizeUntrusted(
                'matchMedia("(prefers-reduced-motion: reduce)").matches === false'
              ),
            },
          ],
          investigate: [
            'Wrap animations/transitions in @media (prefers-reduced-motion: no-preference) or provide a reduce variant.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-reduced-motion`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
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
          const canonical = buildFinding({
            ruleId: 'accessibility-cognitive.form-complexity',
            rite: 'accessibility',
            severity: 'info',
            confidence: 'observed',
            title: `Form complexity issue: ${formComplexity[0]}`,
            summary: `A form on the page triggered complexity heuristics: ${formComplexity[0]}. Long or unlabelled forms increase cognitive load.`,
            where: { selector: 'form', url },
            evidence: [
              {
                kind: 'dom',
                selector: 'form',
                snippet: sanitizeUntrusted(formComplexity[0] ?? ''),
              },
              { kind: 'metric', name: 'formCount', value: complexity.forms, unit: 'forms' },
            ],
            investigate: [
              'Split long forms into steps and ensure every field has a visible label.',
            ],
          });
          findings.push(
            buildProfileFinding({
              id: `${this.profileId}-form-complexity`,
              profileId: this.profileId,
              severity: 'info',
              category: 'cognitive',
              message: canonical.title,
              details: { canonicalFinding: canonical, issues: formComplexity },
              evidence: [...canonical.evidence],
            })
          );
        }
      }

      // Check for clear instructions
      const instructionsCheck: { hasInstructions: boolean; snippet: string } | boolean =
        await page.evaluate(() => {
          const text = document.body.textContent?.toLowerCase() || '';
          const hasInstructions =
            text.includes('step') ||
            text.includes('instructions') ||
            text.includes('how to') ||
            text.includes('guide');
          return { hasInstructions, snippet: (document.body.textContent ?? '').slice(0, 200) };
        });

      const hasInstructions =
        typeof instructionsCheck === 'boolean'
          ? instructionsCheck
          : instructionsCheck.hasInstructions;
      const instructionsSnippet =
        typeof instructionsCheck === 'object' ? (instructionsCheck.snippet ?? '') : '';

      if (!hasInstructions) {
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.no-instructions',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'heuristic',
          title: 'Page lacks clear instructions or guidance',
          summary:
            'Body text contains no instructional keywords (step/instructions/how to/guide). Users with cognitive disabilities benefit from explicit guidance.',
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'body',
              snippet: sanitizeUntrusted(instructionsSnippet),
            },
          ],
          investigate: ['Add a short "how to" section or step-by-step guidance for key tasks.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-no-instructions`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for abbreviations explanation
      const abbreviations = await page.locator('abbr').count();
      const abbreviationsWithTitle = await page.locator('abbr[title]').count();

      if (abbreviations > 0 && abbreviationsWithTitle < abbreviations) {
        const unexplained = abbreviations - abbreviationsWithTitle;
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.unexplained-abbreviations',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'measured',
          title: `${unexplained} abbreviations lack title/explanation`,
          summary: `${unexplained} of ${abbreviations} <abbr> elements have no title attribute, so their expansions are unavailable to users.`,
          where: { selector: 'abbr', url },
          evidence: [
            {
              kind: 'metric',
              name: 'unexplainedAbbreviations',
              value: unexplained,
              unit: 'elements',
            },
          ],
          investigate: ['Add a title attribute or <dfn> markup to every abbreviation.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-unexplained-abbr`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: {
              canonicalFinding: canonical,
              total: abbreviations,
              withTitle: abbreviationsWithTitle,
            },
            evidence: [...canonical.evidence],
          })
        );
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
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.complex-language',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'measured',
          title: `Average word length ${avgWordLength.toFixed(1)} characters`,
          summary: `Body text averages ${avgWordLength.toFixed(1)} characters per word, above the ~7 char guideline for easy readability.`,
          where: { selector: 'body', url },
          evidence: [
            {
              kind: 'metric',
              name: 'averageWordLengthChars',
              value: Number(avgWordLength.toFixed(2)),
              unit: 'chars',
              threshold: 7,
            },
          ],
          investigate: ['Prefer shorter words and sentences; split long compound words.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-complex-language`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical, avgWordLength },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for paragraph length
      const paragraphs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('p')).filter((p: Element) => {
          const words = p.textContent?.split(/\s+/).length || 0;
          return words > 100;
        }).length;
      });

      if (paragraphs > 0) {
        const canonical = buildFinding({
          ruleId: 'accessibility-cognitive.long-paragraphs',
          rite: 'accessibility',
          severity: 'info',
          confidence: 'measured',
          title: `${paragraphs} paragraphs exceed 100 words`,
          summary: `${paragraphs} <p> element(s) contain over 100 words each, forming walls of text that are hard to scan.`,
          where: { selector: 'p', url },
          evidence: [
            {
              kind: 'metric',
              name: 'overlongParagraphCount',
              value: paragraphs,
              unit: 'elements',
              threshold: 100,
            },
          ],
          investigate: ['Break long paragraphs into shorter chunks with subheadings or lists.'],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-long-paragraphs`,
            profileId: this.profileId,
            severity: 'info',
            category: 'cognitive',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: paragraphs },
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
          message: `Cognitive profile error: ${error instanceof Error ? error.message : String(error)}`,
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
