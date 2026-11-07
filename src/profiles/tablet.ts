/**
 * Tablet Profile - Tests iPad Pro (1024×1366) tablet viewport
 * Checks for tablet-specific layout, touch interactions, and orientation handling
 */

import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';
import { sanitizeUntrusted } from '../types/contracts';
import { buildFinding, buildProfileFinding, executionErrorEvidence } from '../types/finding-utils';
import { navigateResilient } from './navigation';

export class TabletProfile {
  private profileId: string;
  private profileName: string;

  constructor(profileId: string, profileName: string) {
    this.profileId = profileId;
    this.profileName = profileName;
  }

  async execute(page: Page, url: string, context: ProfileContext): Promise<ProfileResult> {
    const startTime = Date.now();
    const findings: Finding[] = [];

    try {
      await navigateResilient(page, url);

      // Check for tablet-specific meta tags
      const viewportContent = await page.locator('meta[name="viewport"]').getAttribute('content');
      if (!viewportContent?.includes('viewport-fit')) {
        const canonical = buildFinding({
          ruleId: 'tablet.viewport-fit-missing',
          rite: 'tablet',
          severity: 'info',
          confidence: 'observed',
          title: 'Missing viewport-fit=cover for tablet safe areas',
          summary:
            'The viewport meta tag lacks viewport-fit=cover, so content may render under the notch/home indicator safe areas on modern tablets.',
          where: { selector: 'meta[name="viewport"]', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'meta[name="viewport"]',
              snippet: sanitizeUntrusted(viewportContent ?? '(no viewport meta tag)'),
            },
          ],
          investigate: [
            'Add viewport-fit=cover to the viewport meta content and use env(safe-area-inset-*) in CSS.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-viewport-fit`,
            profileId: this.profileId,
            severity: 'info',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical, viewportContent },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for portrait/landscape orientation meta tag
      const orientationMeta = await page
        .locator('meta')
        .evaluateAll((metas: Element[]) =>
          metas.some((m) => m.getAttribute('name') === 'orientation')
        );
      if (!orientationMeta) {
        const canonical = buildFinding({
          ruleId: 'tablet.orientation-meta-missing',
          rite: 'tablet',
          severity: 'info',
          confidence: 'observed',
          title: 'No orientation meta tag for tablet rotation handling',
          summary:
            'The document has no <meta name="orientation"> tag, so the page does not declare how it should behave when the tablet rotates between portrait and landscape.',
          where: { selector: 'meta[name="orientation"]', url },
          evidence: [
            {
              kind: 'dom',
              selector: 'head',
              snippet: sanitizeUntrusted('no meta[name="orientation"] element present'),
            },
          ],
          investigate: [
            'Consider adding <meta name="orientation"> or ensure layout adapts via CSS media queries.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-orientation-meta`,
            profileId: this.profileId,
            severity: 'info',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for double-tap zoom delay (important for tablets)
      const touchActionStyle = await page.evaluate(() => {
        const root = document.documentElement;
        return window.getComputedStyle(root).touchAction;
      });

      if (touchActionStyle === 'pan-x pan-y') {
        const canonical = buildFinding({
          ruleId: 'tablet.touch-action-pan-only',
          rite: 'tablet',
          severity: 'info',
          confidence: 'measured',
          title: 'touch-action allows double-tap zoom delay on tablets',
          summary:
            'The root element computes touch-action: pan-x pan-y, which permits double-tap zoom and adds a ~300ms tap delay on tablets. Setting touch-action: manipulation removes the delay.',
          where: { selector: 'html', url },
          evidence: [
            {
              kind: 'metric',
              name: 'touchAction',
              value: 0,
              unit: 'computed-style',
            },
            {
              kind: 'dom',
              selector: 'html',
              snippet: sanitizeUntrusted(`touch-action: ${touchActionStyle}`),
            },
          ],
          investigate: [
            'Set touch-action: manipulation on interactive elements or the root to eliminate the double-tap delay.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-touch-action`,
            profileId: this.profileId,
            severity: 'info',
            category: 'touch-optimization',
            message: canonical.title,
            details: { canonicalFinding: canonical, touchAction: touchActionStyle },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for buttons suitable for tablet touch
      const buttons = await page.locator('button, a, input[type="button"]').all();
      let smallTouchTargets = 0;

      for (const button of buttons) {
        const box = await button.boundingBox();
        if (box && (await button.isVisible())) {
          const size = Math.min(box.width, box.height);
          if (size > 1 && size < 44) {
            // Apple's recommended minimum
            smallTouchTargets++;
          }
        }
      }

      if (smallTouchTargets > 0) {
        const canonical = buildFinding({
          ruleId: 'tablet.touch-targets-below-44px',
          rite: 'tablet',
          severity: 'warning',
          confidence: 'measured',
          title: `${smallTouchTargets} touch targets below 44px minimum`,
          summary: `${smallTouchTargets} interactive elements have a smallest dimension under 44px, below Apple's recommended minimum touch target size for tablets.`,
          where: { selector: 'button, a, input[type="button"]', url },
          evidence: [
            {
              kind: 'metric',
              name: 'undersizedTouchTargets',
              value: smallTouchTargets,
              unit: 'elements',
              threshold: 44,
            },
          ],
          investigate: [
            'Increase padding or min dimensions so every interactive element is at least 44×44px.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-small-touch-targets`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'touch-targets',
            message: canonical.title,
            details: { canonicalFinding: canonical, count: smallTouchTargets },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for landscape width handling
      const landWidth = await page.evaluate(() => {
        if (window.matchMedia('(orientation: landscape)').matches) {
          return document.documentElement.scrollWidth;
        }
        return 0;
      });

      if (landWidth > context.viewport.width * 1.1) {
        const canonical = buildFinding({
          ruleId: 'tablet.landscape-horizontal-overflow',
          rite: 'tablet',
          severity: 'warning',
          confidence: 'measured',
          title: 'Page overflows horizontally in tablet landscape',
          summary: `In landscape orientation the document scroll width (${landWidth}px) exceeds 110% of the ${context.viewport.width}px viewport width, causing horizontal scrolling.`,
          where: { selector: 'html', url },
          evidence: [
            {
              kind: 'metric',
              name: 'landscapeScrollWidthPx',
              value: landWidth,
              unit: 'px',
              threshold: Math.round(context.viewport.width * 1.1),
            },
          ],
          investigate: [
            'Constrain wide elements with max-width: 100% and audit grid/flex children for fixed widths.',
          ],
        });
        findings.push(
          buildProfileFinding({
            id: `${this.profileId}-landscape-overflow`,
            profileId: this.profileId,
            severity: 'warning',
            category: 'responsive-design',
            message: canonical.title,
            details: { canonicalFinding: canonical, landscapeWidth: landWidth },
            evidence: [...canonical.evidence],
          })
        );
      }

      // Check for modal/popover suitable sizing
      const modals = await page.locator('[role="dialog"], .modal, .popup').all();
      if (modals.length > 0) {
        for (const modal of modals) {
          const box = await modal.boundingBox();
          if (box && (await modal.isVisible())) {
            // On tablet, modals should not be > 90% of viewport
            if (box.width > context.viewport.width * 0.9) {
              const canonical = buildFinding({
                ruleId: 'tablet.modal-near-full-width',
                rite: 'tablet',
                severity: 'info',
                confidence: 'measured',
                title: 'Modal/dialog width approaches tablet screen edge',
                summary: `A dialog renders ${Math.round(box.width)}px wide, over 90% of the ${context.viewport.width}px tablet viewport, leaving little margin around it.`,
                where: { selector: '[role="dialog"], .modal, .popup', url },
                evidence: [
                  {
                    kind: 'metric',
                    name: 'modalWidthRatio',
                    value: Math.round((box.width / context.viewport.width) * 100),
                    unit: 'percent',
                    threshold: 90,
                  },
                ],
                investigate: [
                  'Cap modal width (e.g. max-width: 90vw) and center it with adequate margins.',
                ],
              });
              findings.push(
                buildProfileFinding({
                  id: `${this.profileId}-modal-width`,
                  profileId: this.profileId,
                  severity: 'info',
                  category: 'responsive-design',
                  message: canonical.title,
                  details: {
                    canonicalFinding: canonical,
                    modalWidth: Math.round(box.width),
                  },
                  evidence: [...canonical.evidence],
                })
              );
              break;
            }
          }
        }
      }
    } catch (error) {
      findings.push(
        buildProfileFinding({
          id: `${this.profileId}-execution-error`,
          profileId: this.profileId,
          severity: 'error',
          category: 'execution',
          message: `Tablet profile execution error: ${error instanceof Error ? error.message : String(error)}`,
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
