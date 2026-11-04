# HauntView Testing Profiles - Implementation Design

## Overview

This design document specifies the implementation approach for HauntView's 16 testing profiles. Each profile uses Playwright browser automation to detect specific issues in web applications and report findings with evidence (screenshots, metrics, error messages). The design establishes:

1. **Common infrastructure** shared by all profiles
2. **Profile-specific algorithms** for detecting issues
3. **Playwright techniques** for browser control and monitoring
4. **Finding generation and severity classification logic**
5. **Result structures and report generation**

## Architecture

### High-Level Design

```
┌─────────────────────────────────────────────────────┐
│         HauntView Testing Framework                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌───────────────────────────────────────────┐    │
│  │  Test Orchestrator (Full Test Profile)    │    │
│  │  - Manages profile execution order        │    │
│  │  - Aggregates findings and metrics        │    │
│  │  - Generates final report                 │    │
│  └───────────────────────────────────────────┘    │
│                       │                            │
│  ┌────────────────────┴────────────────────┐      │
│  │ Sequential Profile Execution Layer      │      │
│  └────────────────────────────────────────┘      │
│                       │                            │
│  ┌────────┬──────┬──────┬─────┬──────┬────┐      │
│  │ Mobile │Tablet│Dektop│Image│Font │ ... │      │
│  │Responsive     │ Fail  │Fail │      │      │
│  └────────┴──────┴──────┴─────┴──────┴────┘      │
│                       │                            │
│  ┌───────────────────────────────────────────┐    │
│  │ Common Infrastructure Layer                │    │
│  │ - Browser Context Management             │    │
│  │ - Page Setup & Teardown                  │    │
│  │ - Screenshot Capture                     │    │
│  │ - Finding Classification                 │    │
│  │ - Report Generation                      │    │
│  └───────────────────────────────────────────┘    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Components

1. **Test Orchestrator** - Manages full test execution, profile sequencing, progress reporting
2. **Profile Executors** - Individual profile implementations (16 total)
3. **Common Infrastructure** - Shared browser management, finding classification, reporting
4. **Report Generator** - Produces HTML, Markdown, and JSON reports
5. **Finding Classifier** - Assigns severity levels and categories

### External Interfaces

- **Playwright Browser API** - Low-level browser automation and event handling
- **Chrome DevTools Protocol (CDP)** - For advanced features like network throttling, offline mode
- **Performance APIs** - Navigation Timing, Resource Timing, Web Vitals
- **Accessibility Library** - axe-core for automated accessibility checking
- **Report Templates** - HTML/CSS for report generation

## Data Models

### Core Data Structures

```typescript
// Finding - represents a single issue discovered during testing
interface Finding {
  id: string; // Unique identifier
  profileName: string; // Which profile found this
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  category: string; // e.g., 'Responsive Design', 'Accessibility'
  description: string; // Clear explanation of the issue
  location: string | ElementLocation; // Where the issue is (URL, selector, etc.)
  recommendation: string; // How to fix it
  evidence: Evidence; // Screenshot, error message, metrics
  timestamp: Date;
}

interface ElementLocation {
  selector?: string; // CSS selector for element
  xpath?: string; // XPath to element
  visuals?: { top: number; left: number; width: number; height: number };
  screenshot?: string; // Base64 or file path to image
}

interface Evidence {
  screenshots?: string[]; // File paths or base64
  errorMessages?: string[];
  metrics?: Record<string, number | string>;
  htmlContent?: string; // Relevant DOM snippet
  logs?: string[];
}

// Profile Result - collected findings and metadata from one profile
interface ProfileResult {
  profileName: string;
  status: 'passed' | 'failed' | 'error';
  executionTime: number; // milliseconds
  findings: Finding[];
  metrics: Record<string, unknown>;
  metadata: {
    targetUrl: string;
    executedAt: Date;
    profileVersion: string;
  };
}

// Test Report - complete results from all executed profiles
interface TestReport {
  reportId: string;
  targetUrl: string;
  executedAt: Date;
  totalExecutionTime: number;
  profileResults: ProfileResult[];
  aggregatedFindings: Finding[];
  summaryMetrics: SummaryMetrics;
}

interface SummaryMetrics {
  totalFindings: number;
  byCategory: Record<string, number>;
  bySeverity: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
    Info: number;
  };
  profilesExecuted: number;
  profilesSuccessful: number;
  profilesFailed: number;
}
```

## Common Infrastructure

### Browser Context Setup

All profiles follow this pattern for browser context initialization:

```typescript
async function createProfileContext(targetUrl: string): Promise<ProfileContext> {
  // 1. Validate target URL reachability
  const reachabilityCheck = await validateUrlReachable(targetUrl);
  if (!reachabilityCheck.success) {
    throw new Error(`Target URL unreachable: ${reachabilityCheck.error}`);
  }

  // 2. Create browser context with baseline configuration
  const context = await browser.createContext({
    viewport: null, // Set per-profile
    ignoreHTTPSErrors: false,
    recordVideo: { dir: 'videos/' }, // Optional video recording
    recordHar: { path: 'archive.har' }, // Network archive
    // Profile-specific options added by caller
  });

  // 3. Clear browser storage
  await context.clearCookies();

  // 4. Disable extensions and plugins
  // (Chromium restriction: only via launch options)

  return {
    context,
    targetUrl,
    startTime: Date.now(),
  };
}

// Cleanup after profile execution
async function cleanupProfileContext(context: ProfileContext): Promise<void> {
  if (context.page) {
    await context.page.close();
  }
  await context.context.close();
}
```

### Page Loading Strategy

```typescript
async function loadPageWithTimeout(
  context: ProfileContext,
  options: {
    timeout?: number;
    waitCondition?: 'domcontentloaded' | 'networkidle' | 'load';
    retries?: number;
  }
): Promise<Page> {
  const { timeout = 30000, waitCondition = 'networkidle', retries = 2 } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const page = await context.context.newPage();

      // Instrument page for monitoring
      page.on('console', (msg) => captureConsoleMessage(msg));
      page.on('pageerror', (err) => capturePageError(err));
      page.on('requestfailed', (req) => captureFailedRequest(req));

      await page.goto(context.targetUrl, {
        waitUntil: waitCondition,
        timeout,
      });

      context.page = page;
      context.loadTime = Date.now() - context.startTime;
      return page;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(`Failed to load page after ${retries} retries: ${lastError?.message}`);
}
```

### Screenshot Capture with Context

```typescript
async function captureScreenshot(
  page: Page,
  options: {
    fullPage?: boolean;
    viewport?: { width: number; height: number };
    highlightElements?: string[]; // CSS selectors to highlight
    name?: string;
  }
): Promise<ScreenshotData> {
  const { fullPage = true, highlightElements = [], name } = options;

  // Highlight problematic elements (optional)
  if (highlightElements.length > 0) {
    await page.evaluate((selectors: string[]) => {
      selectors.forEach((selector) => {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el) => {
          (el as HTMLElement).style.outline = '2px solid red';
          (el as HTMLElement).style.backgroundColor = 'rgba(255,0,0,0.2)';
        });
      });
    }, highlightElements);
  }

  const buffer = await page.screenshot({
    fullPage,
    type: 'png',
    omitBackground: false,
  });

  return {
    buffer,
    base64: buffer.toString('base64'),
    filename: name || `screenshot-${Date.now()}.png`,
    viewport: await page.viewportSize(),
    timestamp: new Date(),
  };
}
```

### Finding Classification System

```typescript
interface ClassificationContext {
  profileName: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  category: string;
  description: string;
  location: ElementLocation;
  recommendation: string;
  evidence: Evidence;
}

function classifyFinding(raw: RawFinding): Finding {
  const baseSeverity = raw.baseSeverity || 'Medium';

  // Adjust severity based on context
  let finalSeverity = baseSeverity;

  // Critical escalators
  if (raw.affectsMultipleSections) finalSeverity = 'Critical';
  if (raw.preventsCoreFunctionality) finalSeverity = 'Critical';
  if (raw.isSecurityVulnerability) finalSeverity = 'Critical';

  // High escalators (if not already Critical)
  if (finalSeverity !== 'Critical') {
    if (raw.affectsPrimaryContent) finalSeverity = 'High';
    if (raw.failsAccessibilityCheck) finalSeverity = 'High';
  }

  return {
    id: generateId(),
    profileName: raw.profileName,
    severity: finalSeverity,
    category: raw.category,
    description: raw.description,
    location: raw.location,
    recommendation: raw.recommendation,
    evidence: raw.evidence,
    timestamp: new Date(),
  };
}
```

### Report Generation

```typescript
async function generateReport(
  results: ProfileResult[],
  format: 'html' | 'md' | 'json'
): Promise<ReportFile> {
  // Aggregate findings from all profiles
  const aggregatedFindings = results
    .flatMap((r) => r.findings)
    .sort((a, b) => severityOrder(b.severity) - severityOrder(a.severity));

  // Calculate summary metrics
  const summaryMetrics = calculateSummaryMetrics(aggregatedFindings);

  const report = {
    reportId: generateId(),
    targetUrl: results[0]?.metadata.targetUrl,
    executedAt: new Date(),
    totalExecutionTime: results.reduce((sum, r) => sum + r.executionTime, 0),
    profileResults: results,
    aggregatedFindings,
    summaryMetrics,
  };

  // Format-specific generation
  let content: string;
  if (format === 'html') {
    content = renderHtmlReport(report);
  } else if (format === 'md') {
    content = await renderPdfReport(report);
  } else {
    content = JSON.stringify(report, null, 2);
  }

  const filename = `hauntview-report-${Date.now()}.${format}`;
  await fs.promises.writeFile(filename, content);

  return { filename, format, content };
}
```

---

## Individual Profile Implementations

### Profile 1: Mobile Responsive Test

#### Objective

Verify website displays correctly at mobile viewport sizes (320px, 375px, 428px width) with mobile user agents, readable text without horizontal scrolling, and proper layout.

#### Playwright Setup

```typescript
const mobileViewports = [
  { name: '320px (iPhone SE)', width: 320, height: 568 },
  { name: '375px (iPhone 12)', width: 375, height: 667 },
  { name: '428px (iPhone 14 Pro)', width: 428, height: 926 },
];

const mobileUserAgent =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) ' +
  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';

const context = await createProfileContext(targetUrl);
context.context = await browser.createContext({
  viewport: mobileViewports[0],
  userAgent: mobileUserAgent,
  isMobile: true,
  hasTouch: true,
});
```

#### Detection Algorithm

```typescript
async function detectMobileLayoutIssues(page: Page, viewport: Viewport): Promise<MobileFinding[]> {
  const findings: MobileFinding[] = [];

  // 1. Check for horizontal scrollbar (indicates content overflow)
  const hasHorizontalScroll = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });

  if (hasHorizontalScroll) {
    findings.push({
      baseSeverity: 'Critical',
      description: 'Page requires horizontal scrolling',
      affectsMultipleSections: true,
      preventsCoreFunctionality: true,
      location: { xpath: '/html' },
    });
  }

  // 2. Detect elements that overflow viewport
  const overflowingElements = await page.evaluate((vpWidth: number) => {
    const elements = document.querySelectorAll('*');
    const overflowing = [];

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width > vpWidth || rect.right > vpWidth) {
        overflowing.push({
          selector: el.className || el.tagName.toLowerCase(),
          width: rect.width,
          right: rect.right,
          tag: el.tagName,
        });
      }
    }

    return overflowing;
  }, viewport.width);

  if (overflowingElements.length > 0) {
    findings.push({
      baseSeverity: overflowingElements.length > 3 ? 'Critical' : 'High',
      description: `${overflowingElements.length} elements overflow viewport`,
      affectsPrimaryContent: true,
      location: { selector: overflowingElements[0].selector },
      evidence: {
        metrics: { overflowingElementCount: overflowingElements.length },
        htmlContent: JSON.stringify(overflowingElements.slice(0, 3)),
      },
    });
  }

  // 3. Check text readability (no text smaller than 12px on mobile)
  const smallTextElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const small = [];

    for (const el of elements) {
      const fontSize = parseInt(window.getComputedStyle(el).fontSize || '16');
      if (fontSize < 12 && el.textContent?.trim().length > 0) {
        small.push({
          selector: el.className || el.tagName,
          fontSize,
          text: el.textContent.slice(0, 50),
        });
      }
    }

    return small;
  });

  if (smallTextElements.length > 5) {
    findings.push({
      baseSeverity: 'High',
      description: 'Text too small to read on mobile',
      location: { selector: smallTextElements[0].selector },
      recommendation: 'Increase base font size for mobile viewports to at least 16px',
      evidence: { metrics: { smallTextCount: smallTextElements.length } },
    });
  }

  // 4. Check for touch target sizes (buttons/links should be at least 48px × 48px)
  const smallTouchTargets = await page.evaluate(() => {
    const targets = document.querySelectorAll(
      'button, a, input[type="checkbox"], input[type="radio"]'
    );
    const small = [];

    for (const target of targets) {
      const rect = target.getBoundingClientRect();
      if (rect.width < 48 || rect.height < 48) {
        small.push({
          selector: target.className || target.tagName,
          width: rect.width,
          height: rect.height,
        });
      }
    }

    return small;
  });

  if (smallTouchTargets.length > 0) {
    findings.push({
      baseSeverity: smallTouchTargets.length > 5 ? 'High' : 'Medium',
      description: `${smallTouchTargets.length} interactive elements too small for touch`,
      recommendation: 'Increase button/link size to minimum 48px × 48px for mobile',
      evidence: {
        metrics: { smallTouchTargetCount: smallTouchTargets.length },
      },
    });
  }

  // 5. Measure performance metrics
  const metrics = await page.evaluate(() => {
    const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      timeToFirstPaint: perf?.responseEnd - perf?.fetchStart || 0,
      domContentLoaded: perf?.domContentLoadedEventEnd - perf?.fetchStart || 0,
      loadComplete: perf?.loadEventEnd - perf?.fetchStart || 0,
    };
  });

  return findings;
}
```

#### Execution Pattern

```typescript
async function executeProfileMobileResponsive(targetUrl: string): Promise<ProfileResult> {
  const context = await createProfileContext(targetUrl);
  const findings: Finding[] = [];
  const screenshots: string[] = [];

  for (const viewport of mobileViewports) {
    // Update context viewport
    context.context.clearCookies();
    context.page = await context.context.newPage();
    await context.page.setViewportSize(viewport);

    // Load page
    await loadPageWithTimeout(context, { waitCondition: 'networkidle' });

    // Capture screenshot
    const screenshot = await captureScreenshot(context.page, {
      fullPage: true,
      name: `mobile-${viewport.name}`,
    });
    screenshots.push(screenshot.filename);

    // Detect issues
    const issues = await detectMobileLayoutIssues(context.page, viewport);

    // Classify findings
    for (const issue of issues) {
      findings.push(
        classifyFinding({
          ...issue,
          profileName: 'Mobile Responsive Test',
          category: 'Responsive Design',
          evidence: {
            ...issue.evidence,
            screenshots: [screenshot.filename],
          },
        })
      );
    }
  }

  await cleanupProfileContext(context);

  return {
    profileName: 'Mobile Responsive Test',
    status: findings.some((f) => f.severity === 'Critical') ? 'failed' : 'passed',
    executionTime: Date.now() - context.startTime,
    findings,
    metrics: { screenshotsCaptures: screenshots.length },
    metadata: {
      targetUrl,
      executedAt: new Date(),
      profileVersion: '1.0.0',
    },
  };
}
```

---

### Profile 2 & 3: Tablet and Desktop Responsive Tests

These follow the same pattern as Mobile, with different viewport configurations.

**Tablet Viewports:**

- 768px (iPad)
- 1024px (iPad Pro)

**Desktop Viewports:**

- 1280px (Standard laptop)
- 1920px (HD monitor)

**Touch Target Check for Tablet:** Same algorithm as mobile (48px minimum).

**Space Utilization Check for Desktop:**

```typescript
async function detectDesktopSpaceUnderutilization(page: Page): Promise<Finding[]> {
  const findings: Finding[] = [];

  const spaceAnalysis = await page.evaluate(() => {
    // Check for narrow content columns with excessive side margins
    const mainContent = document.querySelector('main, [role="main"], .container, .content');
    if (!mainContent) return { maxContentWidth: window.innerWidth };

    const contentRect = mainContent.getBoundingClientRect();
    const maxContentWidth = Math.max(
      contentRect.width,
      // Check for max-width: XXXpx patterns
      ...[...document.querySelectorAll('*')]
        .map((el) => parseInt(window.getComputedStyle(el).maxWidth || '0'))
        .filter((w) => w > 0)
    );

    return {
      viewportWidth: window.innerWidth,
      maxContentWidth,
      utilizationRatio: maxContentWidth / window.innerWidth,
    };
  });

  if (spaceAnalysis.utilizationRatio < 0.7) {
    findings.push({
      baseSeverity: 'Medium',
      description: "Content doesn't utilize available desktop width",
      recommendation:
        'Consider expanding content width for larger screens or using multi-column layouts',
      evidence: { metrics: spaceAnalysis },
    });
  }

  return findings;
}
```

---

### Profile 4: Image Failure Test

#### Objective

Block all image requests and verify layout remains intact, alt text is displayed, and no content overflow occurs.

#### Request Interception Setup

```typescript
async function setupImageBlockingInterceptor(page: Page): Promise<void> {
  // Method 1: Route-based interception (recommended)
  await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,avif}', (route) => {
    // Abort image requests
    route.abort('blockedbyclient');
  });

  // Method 2: Service Worker-based (alternative)
  // Can intercept before route if needed
}

const context = await createProfileContext(targetUrl);
context.page = await context.context.newPage();
await setupImageBlockingInterceptor(context.page);
await loadPageWithTimeout(context, { waitCondition: 'networkidle' });
```

#### Detection Algorithm

```typescript
async function detectImageFailureIssues(
  page: Page,
  baselineScreenshot?: string
): Promise<ImageFailureFinding[]> {
  const findings: ImageFailureFinding[] = [];

  // 1. Check for layout breakage caused by missing images
  const layoutAnalysis = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const layoutIssues = [];

    for (const el of elements) {
      // Elements that are likely image containers
      if (
        el.tagName === 'IMG' ||
        el.style.backgroundImage ||
        el.classList.toString().includes('image')
      ) {
        const rect = el.getBoundingClientRect();

        // Check for collapsed dimensions (image but no fallback)
        if (rect.height < 10 && rect.width > 50) {
          layoutIssues.push({
            selector: (el as HTMLElement).className || el.tagName,
            type: 'collapsed_height',
            rect: { width: rect.width, height: rect.height },
          });
        }
      }
    }

    // Check for horizontal overflow
    const hasOverflow = document.documentElement.scrollWidth > window.innerWidth;

    return { layoutIssues, hasOverflow };
  });

  if (layoutAnalysis.hasOverflow) {
    findings.push({
      baseSeverity: 'Critical',
      description: 'Missing images cause horizontal overflow',
      affectsPrimaryContent: true,
      preventsCoreFunctionality: true,
    });
  }

  // 2. Check alt text coverage
  const altTextAnalysis = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const withoutAlt = [];
    const withAlt = [];

    for (const img of images) {
      if (!img.alt || img.alt.trim() === '') {
        withoutAlt.push({
          src: img.src,
          parent: img.parentElement?.className || 'unknown',
          isVisible: img.offsetParent !== null,
        });
      } else {
        withAlt.push({ alt: img.alt });
      }
    }

    return { withoutAlt, withAlt, coverage: withAlt.length / images.length };
  });

  if (altTextAnalysis.withoutAlt.length > 0) {
    const severity = altTextAnalysis.coverage < 0.5 ? 'High' : 'Medium';
    findings.push({
      baseSeverity: severity,
      description: `${altTextAnalysis.withoutAlt.length} images missing alt text`,
      recommendation: 'Add descriptive alt text to all images',
      evidence: {
        metrics: {
          imagesTotal: altTextAnalysis.withoutAlt.length + altTextAnalysis.withAlt.length,
          imagesWithoutAlt: altTextAnalysis.withoutAlt.length,
          altTextCoverage: `${(altTextAnalysis.coverage * 100).toFixed(1)}%`,
        },
      },
    });
  }

  // 3. Check if alt text is visually displayed (when image fails)
  const displayedAltText = await page.evaluate(() => {
    const images = document.querySelectorAll('img');
    const displayed = [];

    for (const img of images) {
      // Alt text is displayed via CSS or broken image handler
      const style = window.getComputedStyle(img);
      const hasAltDisplay = style.display !== 'none' && img.offsetHeight > 0;

      if (img.alt && hasAltDisplay) {
        displayed.push(img.alt);
      }
    }

    return displayed;
  });

  return findings;
}
```

#### Execution Pattern

```typescript
async function executeProfileImageFailure(targetUrl: string): Promise<ProfileResult> {
  const context = await createProfileContext(targetUrl);

  // Create page with image blocking
  context.page = await context.context.newPage();
  await setupImageBlockingInterceptor(context.page);
  await loadPageWithTimeout(context, { waitCondition: 'networkidle' });

  // Capture screenshot with images blocked
  const screenshot = await captureScreenshot(context.page, {
    fullPage: true,
    name: 'image-failure',
  });

  // Detect issues
  const issues = await detectImageFailureIssues(context.page);

  const findings = issues.map((issue) =>
    classifyFinding({
      ...issue,
      profileName: 'Image Failure Test',
      category: 'Resilience',
      evidence: {
        screenshots: [screenshot.filename],
      },
    })
  );

  await cleanupProfileContext(context);

  return {
    profileName: 'Image Failure Test',
    status: findings.some((f) => f.severity === 'Critical') ? 'failed' : 'passed',
    executionTime: Date.now() - context.startTime,
    findings,
    metrics: { imageCount: 0 }, // Would track images found
    metadata: { targetUrl, executedAt: new Date(), profileVersion: '1.0.0' },
  };
}
```

---

### Profile 5: Font Failure Test

#### Objective

Block custom @font-face requests and verify layout doesn't shift, fallback fonts are readable, and font stacks are defined.

#### Font Blocking Setup

```typescript
async function setupFontBlockingInterceptor(page: Page): Promise<void> {
  // Intercept font file requests
  await page.route('**/*.{woff,woff2,ttf,otf,eot}', (route) => {
    // Block font files
    route.abort('blockedbyclient');
  });

  // Also block Google Fonts and other CDN font URLs
  await page.route('**/fonts.googleapis.com/**', (route) => {
    route.abort('blockedbyclient');
  });

  await page.route('**/fonts.gstatic.com/**', (route) => {
    route.abort('blockedbyclient');
  });
}
```

#### Detection Algorithm

```typescript
async function detectFontFailureIssues(
  page: Page,
  baselineScreenshot?: string
): Promise<FontFailureFinding[]> {
  const findings: FontFailureFinding[] = [];

  // 1. Analyze font stacks for fallbacks
  const fontAnalysis = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const fontStacks: Record<string, string> = {};
    const missingFallbacks: string[] = [];

    for (const el of elements) {
      const fontFamily = window.getComputedStyle(el).fontFamily;
      if (fontFamily && fontFamily !== 'monospace') {
        // Parse font stack
        const fonts = fontFamily.split(',').map((f) => f.trim());

        // Check if has system font fallback
        const hasSystemFallback = fonts.some((f) =>
          [
            'serif',
            'sans-serif',
            'monospace',
            'cursive',
            'fantasy',
            'arial',
            'helvetica',
            'times',
            'courier',
            'verdana',
          ].includes(f.toLowerCase())
        );

        if (!hasSystemFallback && fonts.length === 1) {
          missingFallbacks.push(fontFamily);
        }

        fontStacks[fontFamily] = fontFamily;
      }
    }

    return { fontStacks, missingFallbacks };
  });

  if (fontAnalysis.missingFallbacks.length > 0) {
    findings.push({
      baseSeverity: 'High',
      description: `${fontAnalysis.missingFallbacks.length} font declarations lack system fallbacks`,
      recommendation: 'Add system font fallbacks (sans-serif, serif, etc.) to all font stacks',
      evidence: {
        metrics: {
          fontStacksWithoutFallbacks: fontAnalysis.missingFallbacks.length,
        },
        htmlContent: fontAnalysis.missingFallbacks.slice(0, 5).join(', '),
      },
    });
  }

  // 2. Measure layout shift when fonts change
  const layoutShiftAnalysis = await page.evaluate(() => {
    const mainElement = document.querySelector('main, [role="main"], .container, body');
    if (!mainElement) return { layoutShift: 0 };

    return {
      beforeWidth: mainElement.scrollWidth,
      beforeHeight: mainElement.scrollHeight,
    };
  });

  // Re-measure after font loading (simulated by re-rendering)
  await page.evaluate(() => {
    // Force font reload by changing font temporarily
    document.body.style.fontFamily = 'monospace';
  });

  const afterLayout = await page.evaluate(() => {
    const mainElement = document.querySelector('main, [role="main"], .container, body');
    return {
      afterWidth: mainElement?.scrollWidth || 0,
      afterHeight: mainElement?.scrollHeight || 0,
    };
  });

  const layoutShift = Math.abs(
    (afterLayout.afterHeight - layoutShiftAnalysis.beforeHeight) / layoutShiftAnalysis.beforeHeight
  );

  if (layoutShift > 0.1) {
    // >10% shift
    findings.push({
      baseSeverity: 'High',
      description: 'Custom fonts cause significant layout shift',
      recommendation: 'Use font-display: swap or adjust line-height to reduce CLS',
      evidence: {
        metrics: {
          layoutShiftRatio: layoutShift.toFixed(3),
          heightChange: afterLayout.afterHeight - layoutShiftAnalysis.beforeHeight,
        },
      },
    });
  }

  // 3. Check text readability with fallback fonts
  const readabilityAnalysis = await page.evaluate(() => {
    const bodyText = document.querySelectorAll('p, span, div');
    const issues = [];

    for (const el of bodyText) {
      const fontSize = parseInt(window.getComputedStyle(el).fontSize || '16');
      const lineHeight = window.getComputedStyle(el).lineHeight;

      // Check if line height is reasonable (should be 1.2-1.8 of font size)
      const lineHeightValue = parseFloat(lineHeight) / fontSize;
      if (lineHeightValue < 1.2 || lineHeightValue > 2) {
        issues.push({
          selector: (el as HTMLElement).className,
          fontSize,
          lineHeight,
          ratio: lineHeightValue,
        });
      }
    }

    return { potentialReadabilityIssues: issues.length };
  });

  if (readabilityAnalysis.potentialReadabilityIssues > 5) {
    findings.push({
      baseSeverity: 'Medium',
      description: 'Line height may be inadequate for fallback fonts',
      recommendation: 'Increase line-height to at least 1.4 for better readability',
    });
  }

  return findings;
}
```

---

### Profile 6: JavaScript Disabled Test

#### Objective

Disable JavaScript execution and verify core content renders server-side, essential features work, and appropriate fallbacks exist.

#### JavaScript Disabling

```typescript
const context = await createProfileContext(targetUrl);
context.context = await browser.createContext({
  javaScriptEnabled: false, // Key option
});

// Alternative: Use CDP protocol to disable JavaScript
const client = await page.context().newCDPSession(page);
await client.send('Page.setScriptExecutionDisabled', { value: true });
```

#### Detection Algorithm

```typescript
async function detectJavaScriptDisabledIssues(page: Page): Promise<JSDisabledFinding[]> {
  const findings: JSDisabledFinding[] = [];

  // 1. Check if essential content is present in HTML
  const htmlContent = await page.content();
  const contentAnalysis = await page.evaluate(() => {
    return {
      hasMainContent: document.querySelector('main, [role="main"]') !== null,
      textContentLength: document.body.innerText.length,
      headingsCount: document.querySelectorAll('h1, h2, h3').length,
      linksCount: document.querySelectorAll('a[href]').length,
    };
  });

  if (contentAnalysis.textContentLength < 100) {
    findings.push({
      baseSeverity: 'Critical',
      description: 'Essential content missing without JavaScript',
      recommendation: 'Ensure core content is rendered server-side (SSR) or static HTML',
      affectsPrimaryContent: true,
      preventsCoreFunctionality: true,
    });
  }

  // 2. Verify navigation works (links are clickable)
  const navigationAnalysis = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href]');
    const workingLinks = [];
    const nonWorkingLinks = [];

    for (const link of links) {
      const href = (link as HTMLAnchorElement).href;
      // Links that don't require JS should have href
      if (href && !href.includes('javascript:')) {
        workingLinks.push(href);
      } else {
        nonWorkingLinks.push(href || 'no href');
      }
    }

    return {
      total: links.length,
      working: workingLinks.length,
      nonWorking: nonWorkingLinks.length,
    };
  });

  if (navigationAnalysis.nonWorking > navigationAnalysis.working) {
    findings.push({
      baseSeverity: 'High',
      description: "Navigation doesn't work without JavaScript",
      recommendation: 'Use traditional href navigation instead of JavaScript routing',
      evidence: { metrics: navigationAnalysis },
    });
  }

  // 3. Check for JavaScript-dependent UI elements
  const jsDependent = await page.evaluate(() => {
    const issues = [];

    // Look for common JS-dependent patterns
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const onclick = btn.getAttribute('onclick');
      if (onclick) {
        issues.push({
          text: btn.textContent?.slice(0, 30),
          type: 'onclick_handler',
        });
      }
    }

    // Check for click-only links (no href)
    const clickLinks = document.querySelectorAll('span[role="button"], div[role="button"]');
    if (clickLinks.length > 0) {
      issues.push({
        count: clickLinks.length,
        type: 'click_only_buttons',
      });
    }

    return issues;
  });

  if (jsDependent.length > 0) {
    findings.push({
      baseSeverity: jsDependent.length > 5 ? 'High' : 'Medium',
      description: `${jsDependent.length} interactive elements require JavaScript`,
      recommendation: 'Implement progressive enhancement - provide non-JS alternatives',
      evidence: { metrics: { jsOnlyElements: jsDependent.length } },
    });
  }

  // 4. Verify forms work without JavaScript
  const formAnalysis = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const validForms = [];
    const jsFormsCount = 0;

    for (const form of forms) {
      const action = form.getAttribute('action');
      const method = form.getAttribute('method');

      // Valid form should have action and method
      if (action && method) {
        validForms.push({ action, method });
      }
    }

    return { total: forms.length, valid: validForms.length };
  });

  if (formAnalysis.valid === 0 && formAnalysis.total > 0) {
    findings.push({
      baseSeverity: 'High',
      description: "Forms don't work without JavaScript",
      recommendation: 'Add form action attributes for server-side processing',
      evidence: { metrics: formAnalysis },
    });
  }

  return findings;
}
```

---

### Profile 7: Network Resilience Test

#### Objective

Simulate various network failure scenarios (slow 3G, 4G, packet loss, high latency, DNS failures) and verify graceful error handling.

#### Network Throttling Setup

```typescript
const networkProfiles = [
  {
    name: 'Slow 3G',
    downloadThroughput: (25 * 1024) / 8, // 25 kbps
    uploadThroughput: (3 * 1024) / 8, // 3 kbps
    latency: 300,
  },
  {
    name: 'Slow 4G',
    downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 mbps
    uploadThroughput: (750 * 1024) / 8, // 750 kbps
    latency: 50,
  },
  {
    name: 'Moderate Packet Loss (5%)',
    latency: 100,
    packetLoss: 0.05,
  },
  {
    name: 'High Latency (500ms)',
    latency: 500,
    downloadThroughput: undefined, // No throttle
  },
];

// Apply network profile using CDP
async function applyNetworkThrottling(page: Page, profile: NetworkProfile) {
  const client = await page.context().newCDPSession(page);

  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: profile.downloadThroughput || -1,
    uploadThroughput: profile.uploadThroughput || -1,
    latency: profile.latency,
  });
}
```

#### Detection Algorithm

```typescript
async function detectNetworkResilienceIssues(
  page: Page,
  networkProfile: NetworkProfile
): Promise<NetworkFinding[]> {
  const findings: NetworkFinding[] = [];
  const requestMetrics = {
    succeeded: 0,
    failed: 0,
    timedOut: 0,
    failedUrls: [] as string[],
  };

  // Monitor network events
  page.on('requestfailed', (request) => {
    requestMetrics.failed++;
    requestMetrics.failedUrls.push(request.url());
  });

  // Track load time
  const startTime = Date.now();
  try {
    await page.goto(page.url(), { waitUntil: 'networkidle', timeout: 30000 });
  } catch (error) {
    requestMetrics.timedOut++;
    findings.push({
      baseSeverity: 'High',
      description: `Page load timeout under ${networkProfile.name}`,
      recommendation: 'Optimize resource loading or add loading indicators',
      evidence: {
        metrics: {
          networkProfile: networkProfile.name,
          loadTimeMs: Date.now() - startTime,
        },
      },
    });
  }

  const loadTime = Date.now() - startTime;

  // 1. Check for error handling UI
  const errorUI = await page.evaluate(() => {
    const errorElements = document.querySelectorAll(
      '[class*="error"], [class*="alert"], [role="alert"]'
    );
    return errorElements.length > 0;
  });

  if (requestMetrics.failed > 0 && !errorUI) {
    findings.push({
      baseSeverity: 'High',
      description: 'Failed requests not communicated to user',
      recommendation: 'Display error messages or retry UI when requests fail',
      evidence: { metrics: { failedRequests: requestMetrics.failed } },
    });
  }

  // 2. Check for loading indicators
  const hasLoadingIndicator = await page.evaluate(() => {
    const indicators = document.querySelectorAll(
      '[class*="loading"], [class*="spinner"], [class*="progress"]'
    );
    return indicators.length > 0;
  });

  if (loadTime > 3000 && !hasLoadingIndicator) {
    findings.push({
      baseSeverity: 'Medium',
      description: 'No loading indicator during slow load',
      recommendation: 'Add loading spinner or progress indicator for slow networks',
      evidence: { metrics: { loadTimeMs: loadTime } },
    });
  }

  // 3. Check if critical resources loaded
  const resourceLoad = await page.evaluate(() => {
    const perf = performance.getEntries() as PerformanceResourceTiming[];
    const critical = perf.filter(
      (r) => r.name.includes('bundle') || r.name.includes('vendor') || r.name.includes('styles')
    );
    return {
      totalResources: perf.length,
      criticalLoaded: critical.filter((r) => r.duration > 0).length,
    };
  });

  if (loadTime > 5000) {
    findings.push({
      baseSeverity: 'Medium',
      description: `Slow load time (${loadTime}ms) under ${networkProfile.name}`,
      recommendation: 'Consider code splitting, lazy loading, or CDN caching',
      evidence: {
        metrics: { loadTimeMs: loadTime, profile: networkProfile.name },
      },
    });
  }

  return findings;
}
```

#### Execution Pattern

```typescript
async function executeProfileNetworkResilience(targetUrl: string): Promise<ProfileResult> {
  const context = await createProfileContext(targetUrl);
  const findings: Finding[] = [];

  for (const profile of networkProfiles) {
    context.page = await context.context.newPage();
    await applyNetworkThrottling(context.page, profile);

    try {
      await loadPageWithTimeout(context, { timeout: 40000 });

      const screenshot = await captureScreenshot(context.page, {
        fullPage: true,
        name: `network-${profile.name}`,
      });

      const issues = await detectNetworkResilienceIssues(context.page, profile);

      for (const issue of issues) {
        findings.push(
          classifyFinding({
            ...issue,
            profileName: 'Network Resilience Test',
            category: 'Resilience',
            evidence: { screenshots: [screenshot.filename] },
          })
        );
      }
    } catch (error) {
      findings.push(
        classifyFinding({
          baseSeverity: 'High',
          profileName: 'Network Resilience Test',
          category: 'Resilience',
          description: `Failed to test under ${profile.name}: ${(error as Error).message}`,
          location: { selector: 'network' },
          recommendation: 'Review network conditions or optimize for slow networks',
          evidence: {},
        })
      );
    }

    await context.page.close();
  }

  await cleanupProfileContext(context);

  return {
    profileName: 'Network Resilience Test',
    status: findings.some((f) => f.severity === 'Critical') ? 'failed' : 'passed',
    executionTime: Date.now() - context.startTime,
    findings,
    metrics: { networkProfilesTested: networkProfiles.length },
    metadata: { targetUrl, executedAt: new Date(), profileVersion: '1.0.0' },
  };
}
```

---

### Profile 8: Offline Test

#### Objective

Block all network requests to simulate offline mode and verify cached content, error messages, and offline indicators.

#### Offline Mode Setup

```typescript
async function enableOfflineMode(page: Page): Promise<void> {
  // Method 1: Route blocking (simpler, works for all URLs)
  await page.route('**/*', (route) => {
    route.abort('blockedbyclient');
  });

  // Method 2: CDP Network.emulateNetworkConditions
  const client = await page.context().newCDPSession(page);
  await client.send('Network.emulateNetworkConditions', {
    offline: true,
    downloadThroughput: 0,
    uploadThroughput: 0,
    latency: 0,
  });
}
```

#### Detection Algorithm

```typescript
async function detectOfflineIssues(page: Page): Promise<OfflineFinding[]> {
  const findings: OfflineFinding[] = [];

  // 1. Check if Service Worker is active
  const swStatus = await page.evaluate(() => {
    return {
      swPresent: navigator.serviceWorker !== undefined,
      activeWorkerUrl: navigator.serviceWorker?.controller?.scriptURL || null,
    };
  });

  if (!swStatus.swPresent) {
    findings.push({
      baseSeverity: 'High',
      description: 'No Service Worker registered - offline caching not available',
      recommendation: 'Implement a Service Worker with cache-first or network-first strategy',
    });
  }

  // 2. Check for offline error messages
  const errorMessaging = await page.evaluate(() => {
    const offlineMsg = document.querySelector('[class*="offline"], [class*="no-connection"]');
    const errorAlert = document.querySelector('[role="alert"]');

    return {
      hasOfflineIndicator: offlineMsg !== null,
      alertPresent: errorAlert !== null,
      alertText: errorAlert?.textContent?.slice(0, 100) || null,
    };
  });

  if (!errorMessaging.hasOfflineIndicator && !errorMessaging.alertPresent) {
    findings.push({
      baseSeverity: 'Medium',
      description: 'No offline status message displayed to user',
      recommendation: 'Add clear offline indicator or error message',
    });
  }

  // 3. Check what content is available offline
  const contentAnalysis = await page.evaluate(() => {
    return {
      textContentLength: document.body.innerText.length,
      imagesCount: document.querySelectorAll('img').length,
      linksCount: document.querySelectorAll('a[href]').length,
      hasMainContent: document.querySelector('main') !== null,
    };
  });

  if (contentAnalysis.textContentLength < 100) {
    findings.push({
      baseSeverity: 'High',
      description: 'No meaningful content available offline',
      recommendation: 'Implement Service Worker caching strategy to serve stored content',
      evidence: { metrics: contentAnalysis },
    });
  }

  // 4. Monitor failed requests
  const failedRequests: string[] = [];
  page.on('requestfailed', (req) => {
    failedRequests.push(req.url());
  });

  if (failedRequests.length > 0) {
    findings.push({
      baseSeverity: 'Info',
      description: `${failedRequests.length} requests failed in offline mode (expected)`,
      recommendation: 'Ensure Service Worker handles failed requests gracefully',
      evidence: { metrics: { failedRequestCount: failedRequests.length } },
    });
  }

  return findings;
}
```

---

### Profile 9: Console Errors Test

#### Objective

Monitor and report all JavaScript errors, network failures, and console warnings.

#### Error Collection Setup

```typescript
async function setupErrorMonitoring(page: Page): Promise<ErrorCollector> {
  const errors: ErrorCollector = {
    jsErrors: [],
    networkErrors: [],
    warnings: [],
    timing: { pageLoadStart: Date.now() },
  };

  // Capture JavaScript errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.jsErrors.push({
        message: msg.text(),
        type: msg.type(),
        location: msg.location(),
        args: msg.args().map((a) => a.toString()),
        timestamp: Date.now() - errors.timing.pageLoadStart,
      });
    } else if (msg.type() === 'warning') {
      errors.warnings.push(msg.text());
    }
  });

  // Capture uncaught exceptions
  page.on('pageerror', (error) => {
    errors.jsErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: Date.now() - errors.timing.pageLoadStart,
    });
  });

  // Capture network failures
  page.on('requestfailed', (request) => {
    errors.networkErrors.push({
      url: request.url(),
      method: request.method(),
      failure: request.failure()?.errorText,
      timestamp: Date.now() - errors.timing.pageLoadStart,
    });
  });

  // Capture 4xx/5xx responses
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errors.networkErrors.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        timestamp: Date.now() - errors.timing.pageLoadStart,
      });
    }
  });

  return errors;
}
```

#### Detection Algorithm

```typescript
async function detectConsoleErrorIssues(
  errorCollector: ErrorCollector
): Promise<ConsoleErrorFinding[]> {
  const findings: ConsoleErrorFinding[] = [];

  // 1. Categorize errors by origin (first-party vs third-party)
  const errorsByOrigin = classifyErrorsByOrigin(errorCollector.jsErrors);

  // 2. Identify critical errors
  const criticalErrors = errorCollector.jsErrors.filter(
    (e) =>
      e.message?.includes('Cannot read') ||
      e.message?.includes('is not defined') ||
      e.message?.includes('is not a function') ||
      e.stack?.includes('undefined is not an object')
  );

  if (criticalErrors.length > 0) {
    findings.push({
      baseSeverity: criticalErrors.length > 3 ? 'Critical' : 'High',
      description: `${criticalErrors.length} critical JavaScript errors`,
      recommendation: 'Fix null reference errors and undefined function calls',
      evidence: {
        metrics: {
          criticalErrorCount: criticalErrors.length,
          firstPartyErrors: errorsByOrigin.firstParty.length,
          thirdPartyErrors: errorsByOrigin.thirdParty.length,
        },
        htmlContent: criticalErrors
          .slice(0, 3)
          .map((e) => e.message)
          .join('\n'),
      },
    });
  }

  // 3. Report network failures
  const importantNetworkFailures = errorCollector.networkErrors.filter(
    (e) =>
      e.url?.includes(window.location.host) && // First-party failures
      ![304, 401, 403].includes(e.status) // Exclude expected responses
  );

  if (importantNetworkFailures.length > 0) {
    findings.push({
      baseSeverity: 'High',
      description: `${importantNetworkFailures.length} first-party network failures`,
      recommendation: 'Verify all API endpoints and resources are accessible',
      evidence: {
        metrics: { networkFailureCount: importantNetworkFailures.length },
        htmlContent: importantNetworkFailures.map((f) => f.url).join('\n'),
      },
    });
  }

  // 4. Warn about third-party failures
  if (errorsByOrigin.thirdParty.length > 0) {
    findings.push({
      baseSeverity: 'Medium',
      description: `${errorsByOrigin.thirdParty.length} third-party errors detected`,
      recommendation: 'Review third-party scripts (analytics, ads, etc.) for errors',
      evidence: {
        metrics: { thirdPartyErrorCount: errorsByOrigin.thirdParty.length },
      },
    });
  }

  // 5. Report all warnings
  if (errorCollector.warnings.length > 5) {
    findings.push({
      baseSeverity: 'Info',
      description: `${errorCollector.warnings.length} console warnings`,
      recommendation: 'Review warnings - may indicate deprecated APIs or deprecation',
      evidence: { metrics: { warningCount: errorCollector.warnings.length } },
    });
  }

  // 6. Identify performance-impacting errors
  const slowLoadingErrors = errorCollector.networkErrors.filter((e) => e.timestamp > 5000);
  if (slowLoadingErrors.length > 0) {
    findings.push({
      baseSeverity: 'Medium',
      description: 'Network failures during slow page load',
      recommendation: 'Improve error recovery and retry logic for slow networks',
      evidence: { metrics: { slowErrorCount: slowLoadingErrors.length } },
    });
  }

  return findings;
}

function classifyErrorsByOrigin(errors: any[]): {
  firstParty: any[];
  thirdParty: any[];
} {
  return {
    firstParty: errors.filter((e) => !isThirdPartyUrl(e.location?.url || e.url || '')),
    thirdParty: errors.filter((e) => isThirdPartyUrl(e.location?.url || e.url || '')),
  };
}

function isThirdPartyUrl(url: string): boolean {
  // Simple heuristic - production code would be more sophisticated
  return url.includes('cdn') || url.includes('google') || url.includes('analytics');
}
```

---

### Profile 10: Accessibility Test

#### Objective

Check for WCAG 2.1 Level AA violations including alt text, heading hierarchy, color contrast, labels, keyboard navigation, ARIA, and semantic HTML.

#### Accessibility Checking Setup

```typescript
async function loadAccessibilityLibrary(page: Page): Promise<void> {
  // Inject axe-core for automated accessibility checking
  await page.addScriptTag({
    url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.0/axe.min.js',
  });
}

// Alternative: Use Playwright's built-in accessibility testing
async function getAccessibilityTree(page: Page) {
  return await page.accessibility.snapshot();
}
```

#### Detection Algorithm

```typescript
async function detectAccessibilityIssues(page: Page): Promise<AccessibilityFinding[]> {
  const findings: AccessibilityFinding[] = [];

  // 1. Run automated accessibility checks (axe-core)
  const axeResults = await page.evaluate(() => {
    return (window as any).axe.run().then((results: any) => results);
  });

  // Map axe violations to findings
  for (const violation of axeResults.violations) {
    const severity = mapAxeSeverityToFinding(violation.impact);

    findings.push({
      baseSeverity: severity,
      description: violation.description,
      location: {
        selector: violation.nodes[0]?.html || 'unknown',
      },
      recommendation: violation.helpUrl,
      evidence: {
        metrics: {
          affectedElements: violation.nodes.length,
          wcagCriterion: violation.tags[0],
        },
      },
    });
  }

  // 2. Manual checks for issues axe can't detect
  const manualChecks = await page.evaluate(() => {
    const issues = [];

    // Check 1: Heading hierarchy (h1 -> h2 -> h3, no skips)
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let lastLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.tagName[1]);
      if (level - lastLevel > 1) {
        issues.push({
          type: 'heading_hierarchy',
          currentLevel: level,
          previousLevel: lastLevel,
          text: heading.textContent?.slice(0, 50),
        });
      }
      lastLevel = level;
    }

    // Check 2: Images without alt text
    const imagesNoAlt = document.querySelectorAll('img:not([alt]), img[alt=""]');
    if (imagesNoAlt.length > 0) {
      issues.push({
        type: 'missing_alt_text',
        count: imagesNoAlt.length,
      });
    }

    // Check 3: Form inputs without labels
    const inputsNoLabel = document.querySelectorAll('input, textarea, select');
    for (const input of inputsNoLabel) {
      const id = input.id;
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      if (!hasLabel && !input.closest('label')) {
        issues.push({
          type: 'missing_label',
          inputType: input.tagName,
          inputId: id,
        });
      }
    }

    // Check 4: Color contrast (get computed styles)
    const textElements = document.querySelectorAll('p, span, a, button, h1, h2, h3');
    for (const el of textElements) {
      const style = window.getComputedStyle(el);
      const color = style.color;
      const bgColor = style.backgroundColor;

      // Simple contrast calculation (production would use actual WCAG formula)
      const contrast = calculateContrast(color, bgColor);
      if (contrast < 4.5) {
        issues.push({
          type: 'low_contrast',
          contrast: contrast.toFixed(2),
          element: (el as HTMLElement).className || el.tagName,
        });
      }
    }

    // Check 5: Keyboard navigation
    const focusableElements = document.querySelectorAll(
      'button, a, input, [tabindex], [role="button"]'
    );
    let hasVisibleFocus = false;
    for (const el of focusableElements) {
      const style = window.getComputedStyle(el);
      if (style.outline !== 'none' || style.boxShadow) {
        hasVisibleFocus = true;
        break;
      }
    }

    return {
      issues,
      focusableCount: focusableElements.length,
      hasVisibleFocus,
    };
  });

  // 3. Report manual check findings
  for (const issue of manualChecks.issues) {
    let severity: Finding['severity'] = 'Medium';
    let description = '';

    if (issue.type === 'heading_hierarchy') {
      severity = 'Medium';
      description = `Heading hierarchy skipped from H${issue.previousLevel} to H${issue.currentLevel}`;
    } else if (issue.type === 'missing_alt_text') {
      severity = 'High';
      description = `${issue.count} images missing alt text`;
    } else if (issue.type === 'missing_label') {
      severity = 'High';
      description = 'Form input missing associated label';
    } else if (issue.type === 'low_contrast') {
      severity = 'High';
      description = `Text contrast ratio ${issue.contrast}:1 below required 4.5:1`;
    }

    findings.push({
      baseSeverity: severity,
      description,
      recommendation: 'Fix accessibility issue per WCAG 2.1 guidelines',
      evidence: { metrics: issue },
    });
  }

  // 4. Test keyboard navigation
  const keyboardTest = await testKeyboardNavigation(page);
  if (!keyboardTest.success) {
    findings.push({
      baseSeverity: 'High',
      description: 'Keyboard navigation not working properly',
      recommendation: 'Ensure all interactive elements are keyboard accessible',
      evidence: { htmlContent: keyboardTest.message },
    });
  }

  return findings;
}

function calculateContrast(color: string, bgColor: string): number {
  // Simplified contrast calculation - production would use full WCAG formula
  const parseRgb = (rgb: string): [number, number, number] => {
    const match = rgb.match(/\d+/g);
    return [parseInt(match?.[0] || '0'), parseInt(match?.[1] || '0'), parseInt(match?.[2] || '0')];
  };

  const [r1, g1, b1] = parseRgb(color);
  const [r2, g2, b2] = parseRgb(bgColor);

  const l1 = 0.299 * r1 + 0.587 * g1 + 0.114 * b1;
  const l2 = 0.299 * r2 + 0.587 * g2 + 0.114 * b2;

  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

async function testKeyboardNavigation(page: Page): Promise<{ success: boolean; message: string }> {
  // Press Tab and verify focus moves
  let focusChanged = false;

  const initialFocused = await page.evaluate(() => document.activeElement?.tagName);

  await page.keyboard.press('Tab');

  const newFocused = await page.evaluate(() => document.activeElement?.tagName);

  if (initialFocused !== newFocused) {
    focusChanged = true;
  }

  return {
    success: focusChanged,
    message: focusChanged ? 'Keyboard navigation working' : 'Tab key does not move focus',
  };
}
```

---

### Profile 11: Broken Links Test

#### Objective

Find all links on page and verify they return valid HTTP status codes, distinguish between internal/external/anchor/email/tel links.

#### Link Discovery and Validation

```typescript
async function discoverAndValidateLinks(
  page: Page,
  targetUrl: string
): Promise<LinkValidationResult[]> {
  const results: LinkValidationResult[] = [];

  // 1. Discover all links
  const links = await page.evaluate(() => {
    const discovered = [];

    // Hyperlinks
    document.querySelectorAll('a[href]').forEach((link) => {
      discovered.push({
        href: (link as HTMLAnchorElement).href,
        text: link.textContent?.slice(0, 50),
        type: 'hyperlink',
        selector: (link as HTMLElement).className || 'a',
      });
    });

    return discovered;
  });

  // 2. Categorize links
  for (const link of links) {
    const url = new URL(link.href, targetUrl);

    let category: 'internal' | 'external' | 'anchor' | 'mailto' | 'tel';
    if (link.href.startsWith('mailto:')) category = 'mailto';
    else if (link.href.startsWith('tel:')) category = 'tel';
    else if (link.href.startsWith('#')) category = 'anchor';
    else if (url.hostname === new URL(targetUrl).hostname) category = 'internal';
    else category = 'external';

    results.push({
      url: link.href,
      category,
      text: link.text,
      originalSelector: link.selector,
      status: undefined, // Will be populated after validation
    });
  }

  // 3. Validate HTTP/HTTPS links with HEAD requests
  const httpLinks = results.filter((r) => r.category === 'internal' || r.category === 'external');

  for (const link of httpLinks) {
    try {
      const response = await page.request.head(link.url, {
        timeout: 10000,
      });
      link.status = response.status();
      link.statusText = response.statusText();
    } catch (error) {
      link.status = 0;
      link.error = (error as Error).message;
    }
  }

  return results;
}
```

#### Detection Algorithm

```typescript
async function detectBrokenLinksIssues(
  links: LinkValidationResult[]
): Promise<BrokenLinksFinding[]> {
  const findings: BrokenLinksFinding[] = [];

  // 1. Identify broken links (4xx, 5xx)
  const broken = links.filter((l) => l.status && (l.status >= 400 || l.status === 0));

  if (broken.length > 0) {
    const internalBroken = broken.filter((l) => l.category === 'internal');
    const severity = internalBroken.length > 0 ? 'Critical' : 'High';

    findings.push({
      baseSeverity: severity,
      description: `${broken.length} broken links found (${internalBroken.length} internal)`,
      recommendation: 'Fix or remove broken links',
      evidence: {
        metrics: {
          brokenCount: broken.length,
          internalBrokenCount: internalBroken.length,
        },
        htmlContent: broken
          .slice(0, 5)
          .map((l) => `${l.status} ${l.url}`)
          .join('\n'),
      },
    });
  }

  // 2. Warn about redirects
  const redirects = links.filter((l) => l.status && l.status >= 300 && l.status < 400);
  if (redirects.length > 0) {
    findings.push({
      baseSeverity: 'Info',
      description: `${redirects.length} links use redirects`,
      recommendation: 'Consider updating links to point directly to final destination',
      evidence: { metrics: { redirectCount: redirects.length } },
    });
  }

  // 3. Identify slow links (timeouts)
  const timedOut = links.filter((l) => l.error?.includes('timeout'));
  if (timedOut.length > 0) {
    findings.push({
      baseSeverity: 'Medium',
      description: `${timedOut.length} links timed out during validation`,
      recommendation: 'Investigate slow external links',
      evidence: { metrics: { timedOutCount: timedOut.length } },
    });
  }

  return findings;
}
```

---

### Profile 12: Form Resilience Test

#### Objective

Identify forms, test validation scenarios without submitting real data, verify error messages and error handling.

#### Form Discovery and Testing

```typescript
async function discoverForms(page: Page): Promise<FormInfo[]> {
  return await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    const formInfos = [];

    for (const form of forms) {
      const inputs = form.querySelectorAll('input, textarea, select');
      const inputInfo = [];

      for (const input of inputs) {
        inputInfo.push({
          name: (input as HTMLInputElement).name,
          type: (input as HTMLInputElement).type,
          required: (input as HTMLInputElement).required,
          pattern: (input as HTMLInputElement).pattern,
          placeholder: (input as HTMLInputElement).placeholder,
          id: (input as HTMLInputElement).id,
        });
      }

      formInfos.push({
        selector: form.className || 'form',
        method: form.method || 'GET',
        action: form.action || '',
        inputs: inputInfo,
        submitButton: form.querySelector('button[type="submit"]')?.textContent,
      });
    }

    return formInfos;
  });
}

async function testFormValidation(page: Page, form: FormInfo): Promise<FormValidationTest[]> {
  const tests: FormValidationTest[] = [];

  // Test 1: Submit with all required fields empty
  await fillFormFields(page, form, {});
  const resultEmpty = await submitAndCheckValidation(page, form);
  tests.push({
    scenario: 'All required fields empty',
    blocked: resultEmpty.submissionBlocked,
    errorMessage: resultEmpty.errorMessage,
  });

  // Test 2: Submit with partial required fields
  const partialData: Record<string, string> = {};
  const requiredInputs = form.inputs.filter((i) => i.required);
  if (requiredInputs.length > 0) {
    partialData[requiredInputs[0].name] = 'test value';
  }
  await fillFormFields(page, form, partialData);
  const resultPartial = await submitAndCheckValidation(page, form);
  tests.push({
    scenario: 'Partial required fields filled',
    blocked: resultPartial.submissionBlocked,
    errorMessage: resultPartial.errorMessage,
  });

  // Test 3: Submit with invalid email format
  const emailInputs = form.inputs.filter((i) => i.type === 'email');
  if (emailInputs.length > 0) {
    const invalidData: Record<string, string> = {};
    invalidData[emailInputs[0].name] = 'not-an-email';
    await fillFormFields(page, form, invalidData);
    const resultInvalid = await submitAndCheckValidation(page, form);
    tests.push({
      scenario: 'Invalid email format',
      blocked: resultInvalid.submissionBlocked,
      errorMessage: resultInvalid.errorMessage,
    });
  }

  // Test 4: Submit with very long input (buffer overflow attempt)
  const longData: Record<string, string> = {};
  for (const input of form.inputs) {
    longData[input.name] = 'x'.repeat(10000);
  }
  await fillFormFields(page, form, longData);
  const resultLong = await submitAndCheckValidation(page, form);
  tests.push({
    scenario: 'Very long input strings',
    blocked: resultLong.submissionBlocked,
    errorMessage: resultLong.errorMessage,
  });

  return tests;
}

async function fillFormFields(
  page: Page,
  form: FormInfo,
  data: Record<string, string>
): Promise<void> {
  // Get form element
  const formElement = await page.$(form.selector);
  if (!formElement) return;

  // Fill in form fields (without submitting)
  for (const input of form.inputs) {
    const value = data[input.name] || '';

    if (input.type === 'text' || input.type === 'email' || input.type === 'url') {
      await page.fill(`input[name="${input.name}"]`, value);
    } else if (input.type === 'checkbox') {
      if (value === 'on') {
        await page.click(`input[name="${input.name}"]`);
      }
    }
  }
}

async function submitAndCheckValidation(
  page: Page,
  form: FormInfo
): Promise<{ submissionBlocked: boolean; errorMessage?: string }> {
  const submitButton = await page.$(`${form.selector} button[type="submit"]`);
  if (!submitButton) {
    return { submissionBlocked: false };
  }

  // Listen for navigation or form submission
  let submissionOccurred = false;
  const navigationPromise = page.once('navigation', () => {
    submissionOccurred = true;
  });

  // Attempt to click submit
  await submitButton.click();

  // Check if form was actually submitted
  try {
    await Promise.race([
      navigationPromise,
      new Promise((r) => setTimeout(r, 2000)), // 2 second timeout
    ]);
  } catch (error) {
    // Timeout or error - form likely blocked
  }

  // Check for error messages
  const errorMessage = await page.evaluate(() => {
    const errorEl = document.querySelector('[role="alert"], [class*="error"]');
    return errorEl?.textContent?.slice(0, 100) || null;
  });

  return {
    submissionBlocked: !submissionOccurred,
    errorMessage: errorMessage || undefined,
  };
}
```

#### Detection Algorithm

```typescript
async function detectFormResilienceIssues(
  forms: FormInfo[],
  validationResults: FormValidationTest[][]
): Promise<FormResilienceFinding[]> {
  const findings: FormResilienceFinding[] = [];

  // 1. Check for forms that don't validate
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    const tests = validationResults[i];

    // If any validation test allowed submission with invalid data, that's critical
    const allowedInvalid = tests.filter((t) => !t.blocked && t.scenario.includes('invalid'));
    if (allowedInvalid.length > 0) {
      findings.push({
        baseSeverity: 'Critical',
        description: 'Form accepts invalid input',
        recommendation: 'Implement client-side and server-side validation',
        evidence: { metrics: { failedValidationTests: allowedInvalid.length } },
      });
    }

    // If validation blocks submission but no error message, that's poor UX
    const blockedNoMessage = tests.filter((t) => t.blocked && !t.errorMessage);
    if (blockedNoMessage.length > 0) {
      findings.push({
        baseSeverity: 'High',
        description: 'Form validation fails silently without error messages',
        recommendation: 'Display clear error messages for validation failures',
        evidence: { metrics: { silentFailures: blockedNoMessage.length } },
      });
    }
  }

  // 2. Check for missing required fields indicators
  const formsWithoutRequired = forms.filter(
    (f) => f.inputs.some((i) => i.required) && !f.inputs.some((i) => i.placeholder?.includes('*'))
  );

  if (formsWithoutRequired.length > 0) {
    findings.push({
      baseSeverity: 'Medium',
      description: 'Required fields not clearly marked',
      recommendation: 'Add asterisks or labels to indicate required fields',
      evidence: {
        metrics: { formsWithoutRequired: formsWithoutRequired.length },
      },
    });
  }

  return findings;
}
```

---

### Profile 13: Security Hygiene Test

#### Objective

Verify HTTPS, security headers, no mixed content, proper header configuration.

#### Security Checks Setup

```typescript
async function performSecurityChecks(page: Page, targetUrl: string): Promise<SecurityCheckResult> {
  const result: SecurityCheckResult = {
    isHttps: targetUrl.startsWith('https://'),
    httpRedirectsToHttps: false,
    securityHeaders: {},
    mixedContent: [],
  };

  // 1. Test HTTP to HTTPS redirect
  if (!result.isHttps) {
    const httpUrl = targetUrl.replace('https://', 'http://');
    try {
      const response = await page.request.head(httpUrl, { maxRedirects: 0 });
      result.httpRedirectsToHttps = response.status() >= 300 && response.status() < 400;
    } catch (error) {
      // Might be a valid security implementation that blocks HTTP entirely
    }
  }

  // 2. Collect security headers from response
  const interceptedHeaders: Record<string, string> = {};
  page.on('response', (response) => {
    if (response.url() === targetUrl) {
      const headers = response.headers();
      interceptedHeaders['content-security-policy'] = headers['content-security-policy'] || '';
      interceptedHeaders['x-content-type-options'] = headers['x-content-type-options'] || '';
      interceptedHeaders['x-frame-options'] = headers['x-frame-options'] || '';
      interceptedHeaders['x-xss-protection'] = headers['x-xss-protection'] || '';
      interceptedHeaders['strict-transport-security'] = headers['strict-transport-security'] || '';
      interceptedHeaders['referrer-policy'] = headers['referrer-policy'] || '';
    }
  });

  await page.goto(targetUrl);
  result.securityHeaders = interceptedHeaders;

  // 3. Detect mixed content
  page.on('response', (response) => {
    if (response.url().startsWith('http://') && targetUrl.startsWith('https://')) {
      result.mixedContent.push({
        url: response.url(),
        type: detectResourceType(response.url()),
      });
    }
  });

  return result;
}

function detectResourceType(url: string): string {
  if (url.includes('.js')) return 'JavaScript';
  if (url.includes('.css')) return 'Stylesheet';
  if (url.includes('.woff') || url.includes('.ttf')) return 'Font';
  if (url.match(/\.(png|jpg|gif|webp)/)) return 'Image';
  return 'Other';
}
```

#### Detection Algorithm

```typescript
async function detectSecurityHygieneIssues(
  securityCheck: SecurityCheckResult
): Promise<SecurityHygieneFinding[]> {
  const findings: SecurityHygieneFinding[] = [];

  // 1. Check HTTPS usage
  if (!securityCheck.isHttps) {
    findings.push({
      baseSeverity: 'Critical',
      description: 'Website not using HTTPS',
      isSecurityVulnerability: true,
      recommendation: 'Enable HTTPS and obtain SSL/TLS certificate',
    });
  }

  // 2. Check HTTP to HTTPS redirect
  if (!securityCheck.httpRedirectsToHttps) {
    findings.push({
      baseSeverity: 'Critical',
      description: 'HTTP does not redirect to HTTPS',
      isSecurityVulnerability: true,
      recommendation: 'Configure permanent redirect from HTTP to HTTPS',
    });
  }

  // 3. Check security headers
  const requiredHeaders = [
    { name: 'content-security-policy', severity: 'High' },
    { name: 'x-content-type-options', severity: 'High' },
    { name: 'x-frame-options', severity: 'High' },
    { name: 'strict-transport-security', severity: 'High' },
  ];

  for (const header of requiredHeaders) {
    if (!securityCheck.securityHeaders[header.name]) {
      findings.push({
        baseSeverity: header.severity as any,
        description: `Missing ${header.name} security header`,
        isSecurityVulnerability: true,
        recommendation: `Add ${header.name} header to HTTP responses`,
        evidence: {
          htmlContent: `Example: ${header.name}: ...`,
        },
      });
    }
  }

  // 4. Check for mixed content
  if (securityCheck.mixedContent.length > 0) {
    findings.push({
      baseSeverity: 'High',
      description: `${securityCheck.mixedContent.length} mixed content resources detected`,
      isSecurityVulnerability: true,
      recommendation: 'Upgrade all HTTP resources to HTTPS',
      evidence: {
        metrics: { mixedContentCount: securityCheck.mixedContent.length },
        htmlContent: securityCheck.mixedContent
          .slice(0, 3)
          .map((m) => m.url)
          .join('\n'),
      },
    });
  }

  return findings;
}
```

---

### Profile 14: Performance Test

#### Objective

Measure FCP, LCP, CLS, TTFB, total load time, resource metrics, and compare to thresholds.

#### Performance Measurement

```typescript
async function measurePerformanceMetrics(page: Page): Promise<PerformanceMetrics> {
  // Use Navigation Timing and Resource Timing APIs
  const metrics = await page.evaluate(() => {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const resourceTiming = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    return {
      ttfb: navTiming.responseStart - navTiming.fetchStart,
      domContentLoaded: navTiming.domContentLoadedEventEnd - navTiming.fetchStart,
      loadComplete: navTiming.loadEventEnd - navTiming.fetchStart,
      resourceCount: resourceTiming.length,
      totalBytes: resourceTiming.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      slowestResources: resourceTiming
        .sort((a, b) => (b.duration || 0) - (a.duration || 0))
        .slice(0, 5)
        .map((r) => ({ url: r.name, duration: r.duration })),
    };
  });

  // Use Web Vitals library (injected) for CLS and LCP
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {};

      // Listen for Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          vitals.lcp = (entry as PerformancePaintTiming).startTime;
        }
      }).observe({ type: 'largest-contentful-paint' });

      // Listen for Cumulative Layout Shift
      let cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            cls += (entry as any).value;
          }
        }
        vitals.cls = cls;
      }).observe({ type: 'layout-shift' });

      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      vitals.fcp = paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0;

      setTimeout(() => resolve(vitals), 5000);
    });
  });

  return { ...metrics, ...vitals } as PerformanceMetrics;
}
```

#### Detection Algorithm

```typescript
async function detectPerformanceIssues(metrics: PerformanceMetrics): Promise<PerformanceFinding[]> {
  const findings: PerformanceFinding[] = [];

  // Thresholds
  const GOOD_FCP = 1800;
  const ACCEPTABLE_FCP = 3000;
  const GOOD_LCP = 2500;
  const ACCEPTABLE_LCP = 4000;
  const GOOD_CLS = 0.1;
  const ACCEPTABLE_CLS = 0.25;
  const GOOD_LOAD_TIME = 5000;
  const ACCEPTABLE_LOAD_TIME = 10000;

  // 1. Check FCP
  if (metrics.fcp > ACCEPTABLE_FCP) {
    findings.push({
      baseSeverity: 'Critical',
      description: `First Contentful Paint too slow: ${metrics.fcp}ms`,
      recommendation: 'Defer non-critical JavaScript, optimize CSS delivery',
      evidence: { metrics: { fcp: metrics.fcp } },
    });
  } else if (metrics.fcp > GOOD_FCP) {
    findings.push({
      baseSeverity: 'High',
      description: `First Contentful Paint could be faster: ${metrics.fcp}ms`,
      recommendation: 'Optimize critical rendering path',
      evidence: { metrics: { fcp: metrics.fcp } },
    });
  }

  // 2. Check LCP
  if (metrics.lcp > ACCEPTABLE_LCP) {
    findings.push({
      baseSeverity: 'Critical',
      description: `Largest Contentful Paint too slow: ${metrics.lcp}ms`,
      recommendation: 'Optimize image loading, remove render-blocking resources',
      evidence: { metrics: { lcp: metrics.lcp } },
    });
  } else if (metrics.lcp > GOOD_LCP) {
    findings.push({
      baseSeverity: 'High',
      description: `Largest Contentful Paint could be faster: ${metrics.lcp}ms`,
      recommendation: 'Prioritize loading of main content',
      evidence: { metrics: { lcp: metrics.lcp } },
    });
  }

  // 3. Check CLS
  if (metrics.cls > ACCEPTABLE_CLS) {
    findings.push({
      baseSeverity: 'High',
      description: `Cumulative Layout Shift too high: ${metrics.cls}`,
      recommendation: 'Add size attributes to media, avoid inserting ads above content',
      evidence: { metrics: { cls: metrics.cls } },
    });
  }

  // 4. Check total load time
  if (metrics.loadComplete > ACCEPTABLE_LOAD_TIME) {
    findings.push({
      baseSeverity: 'High',
      description: `Total load time too slow: ${metrics.loadComplete}ms`,
      recommendation: 'Compress resources, enable caching, use CDN',
      evidence: { metrics: { loadTime: metrics.loadComplete } },
    });
  }

  // 5. Check resource count
  if (metrics.resourceCount > 100) {
    findings.push({
      baseSeverity: 'Medium',
      description: `Too many HTTP requests: ${metrics.resourceCount}`,
      recommendation: 'Bundle resources, reduce third-party scripts',
      evidence: { metrics: { resourceCount: metrics.resourceCount } },
    });
  }

  // 6. Identify slowest resources
  for (const resource of metrics.slowestResources) {
    if ((resource.duration || 0) > 2000) {
      findings.push({
        baseSeverity: 'Medium',
        description: `Slow resource: ${resource.url.slice(0, 50)} (${resource.duration}ms)`,
        recommendation: 'Optimize or defer loading of this resource',
        evidence: { metrics: { resourceDuration: resource.duration } },
      });
    }
  }

  return findings;
}
```

---

### Profile 15: Reduced Motion Test

#### Objective

Enable `prefers-reduced-motion: reduce` and verify animations respect the preference.

#### Reduced Motion Setup

```typescript
async function enableReducedMotion(page: Page): Promise<void> {
  // Inject media query override via CSS
  await page.addStyleTag({
    content: `
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `,
  });

  // Also simulate the media query via emulation
  await page.evaluate(() => {
    // Override matchMedia to report reduced-motion preference
    const originalMatchMedia = window.matchMedia;
    (window as any).matchMedia = (query: string) => {
      if (query === '(prefers-reduced-motion: reduce)') {
        return { matches: true, media: query, onchange: null } as any;
      }
      return originalMatchMedia(query);
    };
  });
}
```

#### Detection Algorithm

```typescript
async function detectReducedMotionIssues(
  page: Page,
  normalScreenshot: string
): Promise<ReducedMotionFinding[]> {
  const findings: ReducedMotionFinding[] = [];

  // 1. Capture page with reduced motion
  const reducedMotionScreenshot = await captureScreenshot(page, {
    fullPage: true,
    name: 'reduced-motion',
  });

  // 2. Check for animations that continue despite reduced motion
  const animationAnalysis = await page.evaluate(() => {
    const animations = [];
    const elements = document.querySelectorAll('*');

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      const animationName = style.animationName;
      const transitionDuration = style.transitionDuration;

      // Check if animations are still running
      if (animationName !== 'none' && animationName !== '') {
        animations.push({
          selector: (el as HTMLElement).className || el.tagName,
          animationName,
          animation Duration: style.animationDuration,
        });
      }

      if (transitionDuration !== '0s' && transitionDuration !== '') {
        animations.push({
          selector: (el as HTMLElement).className || el.tagName,
          transitionDuration,
        });
      }
    }

    return animations;
  });

  if (animationAnalysis.length > 0) {
    findings.push({
      baseSeverity: 'High',
      description: `${animationAnalysis.length} elements have animations despite reduced motion preference`,
      recommendation: 'Respect prefers-reduced-motion media query to disable animations',
      evidence: {
        metrics: { animationCount: animationAnalysis.length },
        screenshots: [normalScreenshot, reducedMotionScreenshot.filename],
      },
    });
  }

  // 3. Verify functionality still works
  const functionalityWorks = await page.evaluate(() => {
    // Try clicking a button to verify it's still responsive
    const button = document.querySelector('button');
    if (!button) return true; // No buttons to test

    const initialState = button.textContent;
    // (Would need to actually click and wait in real implementation)
    return true;
  });

  if (!functionalityWorks) {
    findings.push({
      baseSeverity: 'High',
      description: 'Functionality impaired with reduced motion enabled',
      recommendation: 'Ensure interactive elements work with animations disabled',
    });
  }

  return findings;
}
```

---

### Profile 16: Full Test Orchestrator

#### Objective

Run all 15 profiles sequentially, maintain state, report progress, aggregate findings, and generate comprehensive report.

#### Orchestration Logic

```typescript
async function executeFullTest(
  targetUrl: string,
  options?: {
    format?: 'html' | 'md' | 'json';
    baselineDir?: string;
    onProgress?: (message: string) => void;
  }
): Promise<TestReport> {
  const profileExecutors = [
    { name: 'Mobile Responsive Test', fn: executeProfileMobileResponsive },
    { name: 'Tablet Responsive Test', fn: executeProfileTabletResponsive },
    { name: 'Desktop Responsive Test', fn: executeProfileDesktopResponsive },
    { name: 'Image Failure Test', fn: executeProfileImageFailure },
    { name: 'Font Failure Test', fn: executeProfileFontFailure },
    { name: 'JavaScript Disabled Test', fn: executeProfileJavaScriptDisabled },
    { name: 'Network Resilience Test', fn: executeProfileNetworkResilience },
    { name: 'Offline Test', fn: executeProfileOffline },
    { name: 'Console Errors Test', fn: executeProfileConsoleErrors },
    { name: 'Accessibility Test', fn: executeProfileAccessibility },
    { name: 'Broken Links Test', fn: executeProfileBrokenLinks },
    { name: 'Form Resilience Test', fn: executeProfileFormResilience },
    { name: 'Security Hygiene Test', fn: executeProfileSecurityHygiene },
    { name: 'Performance Test', fn: executeProfilePerformance },
    { name: 'Reduced Motion Test', fn: executeProfileReducedMotion },
  ];

  const profileResults: ProfileResult[] = [];
  const startTime = Date.now();

  for (let i = 0; i < profileExecutors.length; i++) {
    const { name, fn } = profileExecutors[i];
    const progress = `Executing ${name} (${i + 1}/${profileExecutors.length})`;

    if (options?.onProgress) {
      options.onProgress(progress);
    }

    try {
      const result = await fn(targetUrl);
      profileResults.push(result);
    } catch (error) {
      // Log error and continue
      profileResults.push({
        profileName: name,
        status: 'error',
        executionTime: 0,
        findings: [
          {
            id: generateId(),
            profileName: name,
            severity: 'High',
            category: 'Test Execution',
            description: `Profile failed to execute: ${(error as Error).message}`,
            location: { selector: 'profile' },
            recommendation: 'Rerun profile or check target URL',
            evidence: { errorMessages: [(error as Error).message] },
            timestamp: new Date(),
          },
        ],
        metrics: {},
        metadata: {
          targetUrl,
          executedAt: new Date(),
          profileVersion: '1.0.0',
        },
      });
    }
  }

  const report = generateFinalReport(profileResults, targetUrl, Date.now() - startTime);

  // Generate report in requested format
  if (options?.format) {
    await generateReport(profileResults, options.format);
  }

  return report;
}

function generateFinalReport(
  profileResults: ProfileResult[],
  targetUrl: string,
  executionTime: number
): TestReport {
  // Aggregate findings
  const allFindings = profileResults.flatMap((r) => r.findings);
  const sortedFindings = allFindings.sort(
    (a, b) => severityOrder(b.severity) - severityOrder(a.severity)
  );

  // Calculate summary
  const summary = {
    totalFindings: allFindings.length,
    byCategory: groupBy(allFindings, 'category'),
    bySeverity: {
      Critical: allFindings.filter((f) => f.severity === 'Critical').length,
      High: allFindings.filter((f) => f.severity === 'High').length,
      Medium: allFindings.filter((f) => f.severity === 'Medium').length,
      Low: allFindings.filter((f) => f.severity === 'Low').length,
      Info: allFindings.filter((f) => f.severity === 'Info').length,
    },
    profilesExecuted: profileResults.length,
    profilesSuccessful: profileResults.filter((r) => r.status === 'passed').length,
    profilesFailed: profileResults.filter((r) => r.status === 'failed').length,
  };

  return {
    reportId: generateId(),
    targetUrl,
    executedAt: new Date(),
    totalExecutionTime: executionTime,
    profileResults,
    aggregatedFindings: sortedFindings,
    summaryMetrics: summary,
  };
}

function severityOrder(severity: string): number {
  const order: Record<string, number> = {
    Critical: 5,
    High: 4,
    Medium: 3,
    Low: 2,
    Info: 1,
  };
  return order[severity] || 0;
}
```

---

## Shared Utility Functions

### Screenshot Comparison (for Responsive Profiles)

```typescript
async function compareScreenshots(
  baseline: Buffer,
  current: Buffer,
  threshold: number = 0.05 // 5% difference threshold
): Promise<ComparisonResult> {
  // Use pixelmatch or similar library
  // Returns diff percentage and diff image

  const diff = await pixelmatch(baseline, current, null, {
    threshold: 0.1,
  });

  const totalPixels = baseline.length;
  const diffPercentage = diff / totalPixels;

  return {
    diffPercentage,
    exceeds Threshold: diffPercentage > threshold,
    message: `${(diffPercentage * 100).toFixed(2)}% difference from baseline`,
  };
}
```

### Error Classification

```typescript
function classifyErrorsbyOrigin(
  errors: Error[],
  targetUrl: string
): { firstParty: Error[]; thirdParty: Error[] } {
  const targetHost = new URL(targetUrl).hostname;

  return {
    firstParty: errors.filter((e) => {
      const source = e.stack || e.toString();
      return source.includes(targetHost) || !source.includes(':/');
    }),
    thirdParty: errors.filter((e) => {
      const source = e.stack || e.toString();
      return !source.includes(targetHost) && source.includes('://');
    }),
  };
}
```

### Report HTML Template

```typescript
function renderHtmlReport(report: TestReport): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>HauntView Report - ${report.targetUrl}</title>
      <style>
        /* Professional report styling */
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .critical { color: #d32f2f; }
        .high { color: #f57c00; }
        .medium { color: #fbc02d; }
        .low { color: #388e3c; }
        .info { color: #0288d1; }
      </style>
    </head>
    <body>
      <header>
        <h1>HauntView Security & Performance Report</h1>
        <p>Target: ${report.targetUrl}</p>
        <p>Generated: ${report.executedAt.toISOString()}</p>
      </header>
      
      <section class="summary">
        <h2>Executive Summary</h2>
        <div class="metrics">
          <p><strong>Total Findings:</strong> ${report.summaryMetrics.totalFindings}</p>
          <p class="critical"><strong>Critical:</strong> ${report.summaryMetrics.bySeverity.Critical}</p>
          <p class="high"><strong>High:</strong> ${report.summaryMetrics.bySeverity.High}</p>
          <p class="medium"><strong>Medium:</strong> ${report.summaryMetrics.bySeverity.Medium}</p>
          <p class="low"><strong>Low:</strong> ${report.summaryMetrics.bySeverity.Low}</p>
          <p class="info"><strong>Info:</strong> ${report.summaryMetrics.bySeverity.Info}</p>
        </div>
      </section>
      
      <section class="findings">
        <h2>Detailed Findings</h2>
        ${report.aggregatedFindings
          .map(
            (finding) => `
          <article class="finding ${finding.severity.toLowerCase()}">
            <h3>${finding.severity}: ${finding.description}</h3>
            <p><strong>Category:</strong> ${finding.category}</p>
            <p><strong>Location:</strong> ${JSON.stringify(finding.location)}</p>
            <p><strong>Recommendation:</strong> ${finding.recommendation}</p>
            ${finding.evidence.screenshots?.map((s) => `<img src="${s}" alt="Evidence">`).join('') || ''}
          </article>
        `
          )
          .join('')}
      </section>
      
      <footer>
        <p>Report ID: ${report.reportId}</p>
        <p>Execution Time: ${report.totalExecutionTime}ms</p>
      </footer>
    </body>
    </html>
  `;
}
```

---

## Error Handling

### Error Handling Strategy

All profiles implement consistent error handling following these principles:

**1. Transient Error Recovery**

- Network timeouts: Retry up to 2 times with exponential backoff (1s, 2s)
- Browser crashes: Restart browser context and retry profile
- Page load failures: Continue with reduced functionality if critical content loads

**2. Persistent Error Reporting**

- Errors that persist after retries are reported as findings, not test failures
- Provides specific error messages and recommendations to user
- Allows remaining profiles to continue executing

**3. Critical Failure Handling**

- Browser fails to initialize: Abort Full Test, return error
- Target URL completely unreachable: Abort all profiles
- Report generation failure: Return results in JSON format as fallback

**4. Error Classification**

```typescript
type ErrorSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

function classifyError(error: Error, context: string): ErrorSeverity {
  const message = error.message.toLowerCase();

  // Critical: Test cannot proceed
  if (
    message.includes('target url unreachable') ||
    message.includes('browser initialization failed')
  ) {
    return 'Critical';
  }

  // High: Major functionality impaired
  if (message.includes('navigation timeout') || message.includes('screenshot capture failed')) {
    return 'High';
  }

  // Medium: Specific check failed
  if (message.includes('request timeout') || message.includes('element not found')) {
    return 'Medium';
  }

  // Low: Non-critical data collection issue
  return 'Low';
}
```

**5. Per-Profile Error Handling Specifics**

- **Responsive Tests**: If screenshot fails, report and skip that viewport
- **Network Tests**: If throttling fails, skip network profile, continue with others
- **Accessibility**: If axe-core fails to load, fall back to manual checks
- **Performance**: If metrics unavailable, report as Info finding
- **Console Errors**: If listener setup fails, continue with HTTP validation
- **Broken Links**: If HEAD request fails, report as timeout (not broken link)

---

## Testing Strategy

### Unit Testing Approach

Unit tests verify individual components in isolation:

**1. Finding Classification Tests**

```typescript
describe('Finding Classification', () => {
  test('Critical severity for layout breakage', () => {
    const finding = classifyFinding({
      baseSeverity: 'High',
      preventsCoreFunctionality: true,
      profileName: 'Mobile',
    });
    expect(finding.severity).toBe('Critical');
  });

  test('High severity for primary content issues', () => {
    const finding = classifyFinding({
      baseSeverity: 'Medium',
      affectsPrimaryContent: true,
    });
    expect(finding.severity).toBe('High');
  });
});
```

**2. Browser Setup Tests**

```typescript
describe('Browser Context Setup', () => {
  test('Creates context with correct viewport', async () => {
    const context = await createProfileContext(testUrl);
    expect(context.context).toBeDefined();
  });

  test('Validates target URL reachability', async () => {
    const context = await createProfileContext('http://invalid-url-xyz.com');
    expect(context).rejects.toThrow('unreachable');
  });
});
```

**3. Screenshot Capture Tests**

```typescript
describe('Screenshot Capture', () => {
  test('Captures full page screenshot', async () => {
    const screenshot = await captureScreenshot(page, { fullPage: true });
    expect(screenshot.buffer).toBeDefined();
    expect(screenshot.buffer.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing Approach

Integration tests verify complete profile execution:

**1. Profile Execution Tests**

```typescript
describe('Mobile Responsive Profile', () => {
  test('Executes and returns ProfileResult', async () => {
    const result = await executeProfileMobileResponsive(testUrl);

    expect(result).toHaveProperty('profileName', 'Mobile Responsive Test');
    expect(result).toHaveProperty('findings');
    expect(result).toHaveProperty('executionTime');
    expect(result.status).toMatch(/passed|failed|error/);
  });

  test('Detects layout overflow in mobile viewport', async () => {
    const result = await executeProfileMobileResponsive(brokenLayoutUrl);
    const overflowFinding = result.findings.find((f) => f.description.includes('overflow'));
    expect(overflowFinding).toBeDefined();
    expect(overflowFinding?.severity).toBe('Critical');
  });
});
```

**2. Full Test Orchestration Tests**

```typescript
describe('Full Test Orchestrator', () => {
  test('Executes all 15 profiles', async () => {
    const report = await executeFullTest(testUrl);

    expect(report.profileResults).toHaveLength(15);
    expect(report.summaryMetrics.profilesExecuted).toBe(15);
  });

  test('Continues after profile failure', async () => {
    const report = await executeFullTest(testUrl);

    const failedProfiles = report.profileResults.filter((p) => p.status === 'failed');
    const remainingProfiles = report.profileResults.filter((p) => p.status === 'passed');

    // Even if one fails, others should execute
    expect(remainingProfiles.length + failedProfiles.length).toBe(15);
  });

  test('Aggregates findings by severity', async () => {
    const report = await executeFullTest(testUrl);

    const totals = Object.values(report.summaryMetrics.bySeverity).reduce((a, b) => a + b, 0);
    expect(totals).toBe(report.aggregatedFindings.length);
  });
});
```

**3. Report Generation Tests**

```typescript
describe('Report Generation', () => {
  test('Generates valid HTML report', async () => {
    const report = await generateReport(profileResults, 'html');

    expect(report.content).toContain('<html');
    expect(report.content).toContain('HauntView');
    expect(report.content).toContain('Executive Summary');
  });

  test('Generates valid JSON report', async () => {
    const report = await generateReport(profileResults, 'json');

    const parsed = JSON.parse(report.content);
    expect(parsed).toHaveProperty('reportId');
    expect(parsed).toHaveProperty('aggregatedFindings');
  });
});
```

### Performance Testing

**1. Profile Execution Time Benchmarks**

```typescript
describe('Performance Benchmarks', () => {
  test('Mobile Responsive completes in < 10s', async () => {
    const start = Date.now();
    await executeProfileMobileResponsive(testUrl);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(10000);
  });

  test('Full Test completes in < 5 minutes', async () => {
    const start = Date.now();
    await executeFullTest(testUrl);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(300000);
  });
});
```

**2. Resource Usage Tests**

```typescript
describe('Resource Management', () => {
  test('Browser contexts are properly cleaned up', async () => {
    const initialContexts = await browser.contexts().length;

    await executeProfileMobileResponsive(testUrl);

    const finalContexts = await browser.contexts().length;
    expect(finalContexts).toBeLessThanOrEqual(initialContexts);
  });
});
```

### End-to-End Testing

**1. Real Website Testing**

```typescript
describe('End-to-End Testing', () => {
  test('Runs full test against real website', async () => {
    const report = await executeFullTest('https://example.com');

    expect(report).toHaveProperty('reportId');
    expect(report.profileResults.length).toBeGreaterThan(0);

    // Verify specific profile findings
    const performanceResults = report.profileResults.find(
      (p) => p.profileName === 'Performance Test'
    );
    expect(performanceResults?.metrics).toHaveProperty('fcp');
  });
});
```

### Test Coverage Goals

- **Common Infrastructure**: 90%+ coverage (critical for reliability)
- **Individual Profiles**: 80%+ coverage (each profile's detection logic)
- **Report Generation**: 95%+ coverage (output correctness)
- **Error Handling**: 85%+ coverage (recovery scenarios)

### Continuous Testing

- Unit tests run on every code change
- Integration tests run against staging environment nightly
- Performance benchmarks tracked over time
- Results profiles validated with known-good websites weekly

---

## Implementation Notes

This design establishes a robust, maintainable framework for automated testing of web applications. Key characteristics:

**Strengths:**

- Modular profile architecture allows independent development
- Consistent finding classification ensures reliable severity assessment
- Common infrastructure reduces code duplication
- Comprehensive error handling enables production reliability
- Multiple report formats support different stakeholder needs

**Trade-offs:**

- Sequential profile execution (not parallel) ensures browser stability but increases total runtime
- Browser-based testing cannot detect server-side issues
- Some checks (contrast ratio) use simplified algorithms vs. full WCAG calculations

**Future Enhancements:**

- Parallel profile execution with resource pooling
- Baseline comparison and regression detection
- Custom profile creation framework for users
- Integration with CI/CD pipelines
- Real-time monitoring dashboard
