# HauntView 👻

**See what breaks before your users do.**

HauntView photographs your website under 25 different conditions — mobile layout, JavaScript disabled, images blocked, fonts failing, offline, broken links, missing security headers, and more. Every finding carries proof. The tool refuses to flag a defect it cannot prove.

## Quick Start

```bash
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview
pnpm install
pnpm dev       # web UI at http://localhost:3000
pnpm mcp       # MCP server (stdio) for Kiro integration
```

**Requirements:** Node 22 LTS, pnpm 9+. Playwright's Chromium is installed automatically via the `postinstall` script.

## Kiro Power Installation

HauntView is packaged as an installable **Kiro Power** under [`power/`](power/) following the Agent Plugins specification. It bundles all 25 testing profile tools, specialized skills (`haunt-a-website`, `exorcise-findings`, `setup`), and automatic conversational activation keywords.

### Option A: Install as a Custom Power (Recommended)

1. In **Kiro IDE**, open the **Powers** sidebar and click **Add Custom Power**.
2. Select **Import power from GitHub**.
3. Paste the repository URL:
   ```text
   https://github.com/kingjethro999/hauntview
   ```
4. Confirm import.

Once installed, simply ask Kiro in chat:

> _"Test my site on mobile and check for broken links on http://localhost:3000"_  
> _"Audit accessibility and prefers-reduced-motion on https://example.com"_  
> _"Exorcise findings from the last run and verify the fix"_

Kiro will automatically activate the Power, execute the test rites in headless Chromium, analyze visual diff plates and DOM snapshots, and guide you to fix issues with verified evidence.

### Option B: Workspace MCP Setup

If you prefer configuring MCP directly in your workspace, add `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "hauntview": {
      "command": "pnpm",
      "args": ["mcp"],
      "disabled": false
    }
  }
}
```

Then ask Kiro in chat:

> `@hauntview run tests on https://yoursite.com` — it will invoke `run-test-profile`, extract structured findings, and help you fix them without leaving the IDE.

---

A local-first web resilience and accessibility testing engine with 25 automated profiles. Built with Next.js, TypeScript, Playwright, and Zod.

## Project Status

**Phase 1** ✅ Core infrastructure

- Type system with Zod contracts (canonical `CanonicalFinding`, `RiteResult`, `HauntRun`)
- Core engine modules: BrowserPool, ScreenshotManager, FindingClassifier, ProfileManager, VisualDiff (pixelmatch ectoplasm diff)
- URL safety layer (RFC 1918 / link-local blocking)
- SQLite storage via `better-sqlite3`
- API endpoints for test execution

**Phase 2** ✅ All 25 profiles implemented and tested

- 16 legacy profiles (device, accessibility, i18n, browser)
- 9 canonical rite profiles (image-failure, font-failure, js-disabled, reduced-motion, offline, broken-links, network-resilience, security-hygiene, form-resilience)
- HTML + Markdown report generation
- MCP server (stdio) for Kiro IDE integration
- 27 Jest test suites, 108 tests — all passing

## 25 Testing Profiles

### Device Testing (5 legacy + 3 canonical)

| ID                      | Viewport  | What it checks                                          |
| ----------------------- | --------- | ------------------------------------------------------- |
| `mobile-iphone15`       | 390×844   | Touch targets, responsive layout, font sizes            |
| `mobile-android`        | 360×800   | Touch targets, responsive layout                        |
| `tablet-ipad`           | 1024×1366 | Viewport-fit, double-tap delay, landscape overflow      |
| `desktop-1080p`         | 1920×1080 | Layout shift, CSS optimization                          |
| `desktop-4k`            | 3840×2160 | High-DPI images, typography legibility, container width |
| `mobile` _(canonical)_  | 390×844   | Canonical mobile rite                                   |
| `tablet` _(canonical)_  | 820×1180  | Canonical tablet rite                                   |
| `desktop` _(canonical)_ | 1280×800  | Canonical desktop rite                                  |

### Accessibility (4)

| ID                  | What it checks                                                       |
| ------------------- | -------------------------------------------------------------------- |
| `a11y-screenreader` | `lang`, landmarks, heading order, skip links, ARIA roles             |
| `a11y-keyboard`     | Positive tabindex, non-semantic clickables, focus outlines           |
| `a11y-visual`       | Luminance contrast ratios (WCAG AA), color-only state, forced-colors |
| `a11y-cognitive`    | DOM complexity, autoplay, form complexity, readability               |

### Internationalization (3)

| ID           | Locale  | What it checks                                    |
| ------------ | ------- | ------------------------------------------------- |
| `i18n-rtl`   | `ar-SA` | `dir="rtl"`, logical CSS properties, Arabic fonts |
| `i18n-cjk`   | `ja-JP` | CJK font stack, line-breaking, ruby annotations   |
| `i18n-mixed` | `hi-IN` | Devanagari fonts, ligatures, diacritics           |

### Browser Compatibility (4)

| ID                | Engine      | What it checks                                               |
| ----------------- | ----------- | ------------------------------------------------------------ |
| `browser-webkit`  | WebKit      | WebKit engine baseline                                       |
| `browser-firefox` | Gecko       | `-webkit-*` without standard fallbacks, Gecko console errors |
| `browser-edge`    | Blink/Edge  | Windows High Contrast, forced-colors, PWA manifest           |
| `browser-legacy`  | IE11 compat | CSS custom properties, Grid, ES6+ in inline scripts          |

### Canonical Resilience Rites (9)

| ID                   | Severity range | What it checks                                                                     |
| -------------------- | -------------- | ---------------------------------------------------------------------------------- |
| `image-failure`      | warning / info | All images blocked — missing alt, missing width/height                             |
| `font-failure`       | warning        | All web fonts blocked — fallback layout shift                                      |
| `js-disabled`        | warning / info | JS off — blank content vs. `<noscript>` fallback                                   |
| `reduced-motion`     | warning        | `prefers-reduced-motion: reduce` — animations still running                        |
| `offline`            | info           | Service worker absent, no offline fallback page                                    |
| `broken-links`       | warning / info | Same-origin links probed — 404/410/5xx/auth                                        |
| `network-resilience` | warning        | All XHR/fetch aborted — page errors or blank content                               |
| `security-hygiene`   | warning / info | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, mixed content |
| `form-resilience`    | warning / info | Empty form submit — validation feedback present/absent                             |

## Evidence Contract

Every finding carries at least one piece of evidence. The engine refuses to raise a finding without proof:

```ts
// All findings are validated at build time
if (finding.evidence.length === 0) {
  throw new Error(`Finding ${finding.id} has no evidence — refused`);
}
```

Evidence kinds: `screenshot`, `dom`, `request`, `header`, `metric`, `axe`, `console`.

## Severity Policy

| Situation                                        | Severity  | Confidence  |
| ------------------------------------------------ | --------- | ----------- |
| Missing alt attribute                            | `warning` | `observed`  |
| Font fallback layout shift                       | `warning` | `measured`  |
| JS-disabled blank page, no noscript              | `warning` | `observed`  |
| Animations under reduced-motion                  | `warning` | `observed`  |
| No service worker / offline fallback             | `info`    | `observed`  |
| 404/410/5xx same-origin link                     | `warning` | `observed`  |
| 401/403/429 link (inconclusive)                  | `info`    | `observed`  |
| Missing CSP / X-Frame-Options / HSTS             | `warning` | `observed`  |
| Missing X-Content-Type-Options / Referrer-Policy | `info`    | `observed`  |
| Form submits without validation                  | `warning` | `heuristic` |

**Rule: `heuristic` confidence may never produce `serious` severity.**

## Architecture

```
┌──────────────────────────────────────────────────┐
│  FACES  — Web UI (Next.js), CLI, MCP server      │
│  No business logic. Calls Core via HTTP / direct. │
├──────────────────────────────────────────────────┤
│  CORE  — src/core/, src/engine.ts                 │
│  Orchestrator · Rites · FindingClassifier         │
│  VisualDiff (pixelmatch) · ScreenshotManager      │
│  ProfileManager · ReportStore (SQLite)            │
├──────────────────────────────────────────────────┤
│  STORAGE  — SQLite via better-sqlite3             │
│  Accessed only through CryptService / ReportStore │
└──────────────────────────────────────────────────┘
```

## API Usage

### Check engine status

```bash
curl http://localhost:3000/api/test
```

### Run rites

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profiles": ["image-failure", "security-hygiene", "broken-links"],
    "includeScreenshots": true
  }'
```

Response shape:

```json
{
  "success": true,
  "report": {
    "id": "hauntview-1704067200000",
    "url": "https://example.com",
    "duration": 18000,
    "summary": {
      "totalProfiles": 3,
      "totalFindings": 7,
      "findingsBySeverity": { "error": 0, "warning": 4, "info": 3 }
    }
  }
}
```

## Project Structure

```
hauntview/
├── src/
│   ├── types/
│   │   ├── contracts.ts        # Zod schemas + CanonicalFinding (single source of truth)
│   │   ├── finding-utils.ts    # buildFinding, makeFindingId, assertValidSeverityConfidence
│   │   ├── profiles.ts         # Legacy Finding / ProfileResult types
│   │   └── results.ts          # Report types
│   ├── core/
│   │   ├── browser-pool.ts
│   │   ├── screenshot-manager.ts
│   │   ├── finding-classifier.ts
│   │   ├── profile-manager.ts  # 25 profiles configured
│   │   ├── visual-diff.ts      # pixelmatch ectoplasm diff
│   │   └── report-store.ts     # SQLite persistence
│   ├── profiles/               # 25 profile implementations
│   │   ├── mobile.ts, desktop.ts, tablet.ts, desktop-4k.ts
│   │   ├── accessibility-*.ts  (4 profiles)
│   │   ├── i18n-*.ts           (3 profiles)
│   │   ├── browser-*.ts        (4 profiles)
│   │   ├── image-failure.ts, font-failure.ts, js-disabled.ts
│   │   ├── reduced-motion.ts, offline.ts, broken-links.ts
│   │   ├── network-resilience.ts, security-hygiene.ts, form-resilience.ts
│   │   └── __tests__/          # Jest unit tests for every profile
│   ├── mcp/
│   │   └── server.ts           # MCP server (stdio)
│   ├── engine.ts               # Main orchestrator
│   └── __tests__/              # Core unit tests
├── app/                        # Next.js web UI
│   ├── api/test/route.ts       # REST API
│   └── components/             # Kiroween design system components
├── docs/
│   ├── ARCHITECTURE.md
│   ├── CONTRACTS.md            # Auto-generated contract reference
│   └── KIRO_USAGE.md
├── .kiro/
│   ├── specs/                  # hauntview-core, hauntview-testing-profiles
│   ├── steering/               # architecture_boundaries, kiroween_design_system, type_and_schema_guardrails
│   └── hooks/                  # format-lint-on-save, run-tests-on-task-completion, etc.
├── jest.config.js
└── package.json
```

## Performance

- Single canonical rite: ~5–15 seconds
- Full legacy suite (16 profiles): ~2–8 minutes
- Full rite set (25 profiles): ~3–12 minutes

## License

MIT — see LICENSE file.

## Built for Kiroween 2026 Hackathon

HauntView demonstrates comprehensive spec-driven development with Kiro: Zod contracts, steering documents, hooks, property-based tests, and MCP integration — all in a single local-first tool.
