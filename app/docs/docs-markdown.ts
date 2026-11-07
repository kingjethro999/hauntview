/**
 * app/docs/docs-markdown.ts
 *
 * Full Markdown export of the HauntView Developer Manual.
 * Used by the "Copy page as Markdown" button for instant LLM and agent context ingestion.
 */

import { VERSION } from '../../src/version';

export const HAUNTVIEW_DOCS_MARKDOWN = `# HauntView Developer Manual (v${VERSION})

> Deterministic failure-mode resilience, accessibility, and visual chaos testing engine with Model Context Protocol (MCP) and CLI integration.
> Primary Support for Kiro IDE, Kiro Powers, and Terminal/CI Workflows.
> Hosted Service: https://hauntview.onrender.com
> GitHub: https://github.com/kingjethro999/hauntview
> NPM Package: https://www.npmjs.com/package/hauntview
> Protocol Version: Model Context Protocol (MCP) 2024-11-05

---

## 1. Overview

HauntView photographs your website under 29 automated test profiles covering device compatibility, resilience, accessibility, internationalization, browser engines, performance, and environmental fault injection.

Every finding carries empirical proof: DOM snippets, bounding boxes, console logs, or pixelmatch visual diff plates. HauntView refuses to flag any defect it cannot prove.

---

## 2. Command-Line Interface (\`haunt\` / \`hauntview\`)

HauntView provides an official, zero-dependency command-line interface:

\`\`\`bash
# Install globally via npm
npm install -g hauntview

# Or run instantly with npx (zero permanent installation)
npx hauntview https://example.com
\`\`\`

### 2.1 Basic Execution

\`\`\`bash
# Run all 29 test rites against any target URL
haunt http://localhost:3000
haunt https://example.com
\`\`\`

### 2.2 Direct Profile Flags & Targeted Runs

Run 1, 2, or 3 specific profiles directly without needing profile IDs or configuration:

\`\`\`bash
# Run specific profiles via direct flags
haunt http://localhost:3000 --mobile --desktop --offline --broken-links

# Run fault injection profiles
haunt https://example.com --image-failure --font-failure --js-disabled

# Run security and performance audits
haunt https://example.com --performance --security-hygiene
\`\`\`

### 2.3 Category Shortcut Flags

Run entire categories of tests with a single flag:

| Shortcut Flag | Description | Included Profiles |
| :--- | :--- | :--- |
| \`--a11y\`, \`--accessibility\` | All accessibility audits | \`a11y-screenreader\`, \`a11y-keyboard\`, \`a11y-visual\`, \`a11y-cognitive\` |
| \`--resilience\` | Resilience and degradation rites | \`offline\`, \`broken-links\`, \`network-resilience\`, \`form-resilience\` |
| \`--devices\` | Responsive viewports | \`mobile\`, \`tablet\`, \`desktop\`, \`mobile-iphone15\`, \`mobile-android\`, \`tablet-ipad\`, \`desktop-1080p\`, \`desktop-4k\` |
| \`--browsers\` | Browser engine compatibility | \`browser-webkit\`, \`browser-firefox\`, \`browser-edge\`, \`browser-legacy\` |
| \`--i18n\` | Internationalization rites | \`i18n-rtl\`, \`i18n-cjk\`, \`i18n-mixed\` |
| \`--faults\` | Environmental fault injection | \`image-failure\`, \`font-failure\`, \`js-disabled\`, \`reduced-motion\` |

\`\`\`bash
# Examples:
haunt https://example.com --a11y
haunt https://example.com --resilience
haunt https://example.com --browsers
\`\`\`

### 2.4 Tag-Based Filtering

\`\`\`bash
# Comma-separated tags or profile IDs
haunt https://example.com --tag mobile,resilience
haunt https://example.com --tags devices,faults
\`\`\`

### 2.5 Non-Interactive & CI/CD Pipeline Automation

\`\`\`bash
haunt https://example.com \\
  --output zip,html \\
  --out-dir ./reports \\
  --concurrency \\
  --concurrency-amount 2 \\
  --yes
\`\`\`

#### CLI Flags Reference

| Flag | Short | Description | Default |
| :--- | :--- | :--- | :--- |
| \`--output <formats>\` | \`-o\` | Comma-separated formats (\`zip\`, \`html\`, \`md\`, \`json\`) | From saved config (\`zip,html\`) |
| \`--out-dir <path>\` | \`-d\` | Destination directory (\`.\`, \`~\`, or absolute path) | From saved config (\`.\`) |
| \`--profiles <ids>\` | \`-p\` | Comma-separated profile IDs to execute | All 29 profiles |
| \`--concurrency\` | \`-c\` | Enable concurrent profile execution | From saved config |
| \`--no-concurrency\` | | Force sequential profile execution | False |
| \`--concurrency-amount <n>\` | \`-a\` | Worker pool concurrency limit | From saved config (\`2\`) |
| \`--interactive\` | \`-i\` | Prompt for output formats interactively | False |
| \`--yes\` | \`-y\` | Non-interactive mode, skip prompts | False |

### 2.6 CLI Setup & Diagnostics

\`\`\`bash
# Interactive setup wizard to configure defaults
haunt setup

# View currently saved configuration
haunt setup --show

# Reset configuration to factory defaults
haunt setup --reset

# System diagnostics (Node version, browsers, hardware capability)
haunt doctor

# Self-update to the latest version on npm
haunt self-update
# (Aliases: haunt update, haunt upgrade)
\`\`\`

### 2.7 Exit Codes

- **\`0\`**: Success. All requested profiles executed and zero error-severity findings were discovered.
- **\`1\`**: Test failure. One or more error-severity findings were discovered (ideal for CI test gates).
- **\`2\`**: Fatal error. URL safety violation, unhandled exception, or missing permissions.

---

## 3. The 29 Testing Profiles

### Device Compatibility (8 Profiles)
- **\`mobile\`**: Canonical mobile viewport (390×844, 48px touch target validation).
- **\`desktop\`**: Canonical desktop viewport (1280×800).
- **\`tablet\`**: Canonical tablet viewport (820×1180, 44px touch target validation).
- **\`mobile-iphone15\`**: Apple iPhone 15 Pro (390×844 @3x DPR).
- **\`mobile-android\`**: Samsung Galaxy S23 (360×800 @2x DPR).
- **\`tablet-ipad\`**: Apple iPad Pro 12.9" (1024×1366 @2x DPR).
- **\`desktop-1080p\`**: Standard 1080p Full HD viewport (1920×1080).
- **\`desktop-4k\`**: High-resolution 4K UHD viewport (3840×2160).

### Resilience & Fault Tolerance (4 Profiles)
- **\`offline\`**: Loads page, severs network, inspects service worker and offline fallback.
- **\`broken-links\`**: Crawls same-origin anchor hrefs (cap 100) for 404/410/5xx status codes.
- **\`network-resilience\`**: Aborts all fetch and XHR requests; verifies page degrades gracefully.
- **\`form-resilience\`**: Submits empty and invalid forms; checks for visible validation feedback.

### Accessibility Standards (4 Profiles)
- **\`a11y-visual\`**: Evaluates color contrast (WCAG AA 4.5:1) with recursive alpha compositing.
- **\`a11y-keyboard\`**: Validates tab sequence, visible focus rings, and detects focus traps.
- **\`a11y-screenreader\`**: Audits ARIA roles, skip-to-main content links, and heading hierarchies.
- **\`a11y-cognitive\`**: Checks reading complexity, visual clutter, and motion thresholds.

### Internationalization (3 Profiles)
- **\`i18n-rtl\`**: Right-to-Left Arabic (ar-SA) layout, mirrored navigation, and numeral formats.
- **\`i18n-cjk\`**: Japanese (ja-JP) CJK font stack rendering and word-break boundary behavior.
- **\`i18n-mixed\`**: Mixed script support (Hindi Devanagari + Latin numerals and punctuation).

### Browser Engines (4 Profiles)
- **\`browser-webkit\`**: Safari / WebKit engine compatibility.
- **\`browser-firefox\`**: Mozilla Firefox Gecko engine rendering.
- **\`browser-edge\`**: Microsoft Edge Chromium compatibility.
- **\`browser-legacy\`**: Legacy browser CSS Custom Properties and Grid fallbacks.

### Performance & Security (2 Profiles)
- **\`performance\`**: Core Web Vitals (FCP < 1.8s, LCP < 2.5s, CLS < 0.1) and render-blocking scripts.
- **\`security-hygiene\`**: HTTP headers audit (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).

### Environmental Chaos (4 Profiles)
- **\`image-failure\`**: Blocks 100% of image requests; checks for missing alt attributes and layout shift.
- **\`font-failure\`**: Blocks 100% of web fonts; verifies fallback font substitution and FOUT/FOIT.
- **\`js-disabled\`**: Completely disables JavaScript execution; verifies meaningful content and <noscript>.
- **\`reduced-motion\`**: Sets prefers-reduced-motion: reduce; flags unhalted CSS/JS animations.

---

## 4. Kiro Integration (Primary IDE)

### 4.1 Option A: Install as a Kiro Power (Recommended)
1. In Kiro IDE, open the **Powers** sidebar and click **Add Custom Power**.
2. Select **Import power from GitHub**.
3. Paste repository URL: \`https://github.com/kingjethro999/hauntview\`
4. Confirm installation.

### Included Kiro Agent Skills:
- **\`haunt-a-website\`**: Automatically activated when asking Kiro to test a website or check for failure modes.
- **\`exorcise-findings\`**: Automatically activated when asking Kiro to fix or patch findings discovered in reports.
- **\`setup\`**: Configures environment, Playwright browsers, and local defaults.

### 4.2 Option B: Workspace MCP Configuration (\`.kiro/settings/mcp.json\`)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "command": "pnpm",
      "args": ["mcp"],
      "disabled": false
    }
  }
}
\`\`\`

---

## 5. Model Context Protocol Tools Reference

HauntView registers 6 tools on the MCP server:

1. **\`list-test-profiles\`**: Returns all 29 testing profiles, viewports, and timeout matrices.
2. **\`run-test-profile\`**: Executes testing profiles against a URL. Arguments: \`url\` (required), \`profileId\` (optional).
3. **\`get-run-status\`**: Checks execution progress and severity counters for an active or completed run.
4. **\`get-latest-report\`**: Retrieves the full structured JSON report from the most recent run.
5. **\`compare-runs\`**: Computes visual and finding regressions between two runs (\`runId1\`, \`runId2\`).
6. **\`export-report\`**: Generates HTML Grimoire, Markdown, or JSON export documents.

---

## 6. Local Development

\`\`\`bash
# 1. Clone repository
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview

# 2. Install dependencies (Node 22 LTS + pnpm recommended)
pnpm install

# 3. Start local development server (Victorian Parlour UI at http://localhost:3000)
pnpm dev

# 4. Run test suites (39 Jest suites, 211 tests)
pnpm test

# 5. Build standalone CLI bundle
node scripts/build-cli.mjs

# 6. Typecheck and lint
pnpm run typecheck
pnpm run lint
\`\`\`
`;
