# HauntView 👻

**See what breaks before your users do.**

HauntView photographs your website under 25 different conditions — mobile layout, JavaScript disabled, images blocked, fonts failing, offline, broken links, missing security headers, and more. Every finding carries proof. The tool refuses to flag a defect it cannot prove.

---

## Quick Start

### Option 1: Official CLI (`haunt`)

Install globally via npm to run rites directly from your terminal:

```bash
npm install -g hauntview

# Run testing rites against any URL
haunt https://example.com

# Run specific profiles directly via flags
haunt https://example.com --mobile --desktop --offline --broken-links

# Run an entire category of tests via shortcuts
haunt https://example.com --a11y
haunt https://example.com --resilience

# Run profiles by comma-separated tags
haunt https://example.com --tag mobile,resilience

# Configure default export format, destination, and concurrency
haunt setup

# Check Node version, installed browsers, and system concurrency capability
haunt doctor
```

### Option 2: Local Web Dashboard

```bash
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview
pnpm install
pnpm dev       # Victorian Parlour Web UI at http://localhost:3000
pnpm mcp       # MCP server (stdio) for Kiro integration
```

**Requirements:** Node 22 LTS, pnpm 9+. Playwright browser engines (Chromium, Firefox, WebKit) are installed automatically.

---

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

Kiro will automatically activate the Power, execute the test rites in headless browsers, analyze visual diff plates and DOM snapshots, and guide you to fix issues with verified evidence.

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

## Project Status

- **Phase 1** ✅ Core infrastructure: contracts, BrowserPool, ScreenshotManager, FindingClassifier, ProfileManager, VisualDiff, SQLite storage, safety validation.
- **Phase 2** ✅ All 25 testing profiles implemented and verified with Jest unit tests.
- **Phase 3** ✅ Official CLI (`haunt` / `hauntview`), interactive setup wizard, doctor diagnostic, and opt-in profile concurrency.
- **Phase 4** ✅ Comprehensive documentation, auto-versioning pre-commit hook, and architecture references.
- **Current Test Suite:** **39 Jest test suites, 211 tests — 100% passing.**

---

## Architecture & Faces

```
┌────────────────────────────────────────────────────────────────────────┐
│                                 FACES                                  │
│   Web UI (Next.js)      CLI (`haunt`)      MCP Server     REST API    │
│   Parlour Interface     Node.js CLI        Kiro / MCP     Endpoints   │
│   Zustand Store         Zero Web Bloat     stdio/SSE      /api/test   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ (direct / HTTP / stdio)
┌────────────────────────────────────▼───────────────────────────────────┐
│                                 CORE                                   │
│   Orchestrator (`HauntViewEngine`)      Concurrency Resolver          │
│   System Capability Evaluator           25 Resilience Profiles         │
│   BrowserPool (Playwright)              FindingClassifier             │
│   ScreenshotManager                     VisualDiff (pixelmatch)       │
│   ReportFactory (HTML/MD/Zip)           Safety & SSRF Validator      │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                          DUAL STORAGE MODEL                            │
│                                                                        │
│   Client-Side Web Storage (Private)    Server-Side Storage (Headless)  │
│   ---------------------------------    ------------------------------  │
│   • zustand/persist -> localStorage    • SQLite via better-sqlite3     │
│   • Zero cross-visitor leakage         • `.hauntview/data/hauntview.db`│
│   • Device-local privacy               • Used by CLI, MCP, and Server  │
│   • Survives server redeployments      • Structured run & finding data │
│   • Rehydrates reports on restart      • Export outputs to configured  │
│   • Manual "Clear History" button        destination directory         │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Storage Model: Privacy by Design

HauntView intentionally separates storage based on environment:

1. **Web UI (Client-Side `localStorage` via Zustand):**
   - User test history and reports are stored locally in the user's browser using Zustand's `persist` middleware ([`app/lib/crypt-store.ts`](file:///home/japheth/Desktop/hauntview/app/lib/crypt-store.ts)).
   - **Privacy:** In public or multi-tenant deployments (such as `hauntview.onrender.com`), test reports are private to each user's device and never bleed between visitors.
   - **Resilience:** If the hosting server or local container restarts, report data is safely preserved in the browser and rehydrated upon launch.
   - **Controls & Limits:** Users can clear all stored history at any time using the "Clear History" button. Storage is subject to browser localStorage quotas (~5–10 MB) and does not sync across different browsers or devices.
2. **CLI / MCP / REST API (Server-Side SQLite):**
   - Headless test executions store structured test runs and findings in an embedded SQLite database (`.hauntview/data/hauntview.db`).
   - The CLI never imports `zustand`, `window`, or browser DOM APIs, keeping the package lean and portable.
   - CLI exports (HTML, Markdown, Zip bundles) are written directly to the user's configured output directory.

---

## Profile Concurrency

HauntView includes an opt-in concurrency engine that executes browser rites in parallel using a bounded worker pool:

| Execution Mode           | Concurrency Amount | Duration (25 Profiles) | Memory Footprint   |
| :----------------------- | :----------------- | :--------------------- | :----------------- |
| **Sequential (Default)** | 1 (off)            | ~70 – 80s              | ~600 MB peak       |
| **Concurrent (Optimal)** | 2 – 4 workers      | **~25 – 30s**          | ~1.5 – 2.5 GB peak |

### Hardware Capability Heuristic

To prevent system freezing or OOM conditions, HauntView calculates safe hardware limits at runtime:

- **Formula:** $\text{maxConcurrency} = \min(\lfloor \frac{\text{logicalCores}}{2} \rfloor, \lfloor \frac{\text{totalRAM(GB)}}{2} \rfloor, 8)$
- **Low-Spec Guard:** Systems with $< 4\text{ GB}$ RAM or $< 2$ logical cores are restricted to sequential execution (`maxConcurrency = 1`). The setup wizard disallows enabling concurrency, and the CLI clamps manual overrides.
- **Setup Rejection:** `haunt setup` refuses values higher than the hardware maximum with a detailed explanation of your machine's CPU/RAM specs.

### Configuration Precedence

1. CLI Flag (`--concurrency`, `--concurrency-amount`) / API request body (`concurrency`, `concurrencyAmount`) / MCP tool arguments
2. Environment Variables (`HAUNT_CONCURRENCY=1`, `HAUNT_CONCURRENCY_AMOUNT=n`)
3. Persistent Configuration (`~/.config/hauntview/config.json`)
4. Engine Default (`concurrency: false`, `concurrencyAmount: 2`)

### ⚠️ Hosted Service Notice (`hauntview.onrender.com`)

HauntView's public demo instance runs on Render's **$7/month Starter plan with 0.5 vCPU and 512 MB RAM** (Render's free tier provides only 0.1 CPU, so we use the paid Starter tier to provide dedicated 0.5 CPU). Concurrency is strictly **disabled** on the hosted instance to protect container stability. Requests to `/api/test` with concurrency enabled are rejected with HTTP 400. Full 25-rite runs take ~70 seconds on Render. For fast concurrent testing (~20s), please [install the CLI](#option-1-official-cli-haunt) or run locally via MCP.

See [`docs/CONCURRENCY.md`](file:///home/japheth/Desktop/hauntview/docs/CONCURRENCY.md) for full details.

---

## Workspace Auto-Versioning

HauntView implements an automated workspace-wide versioning workflow:

- **Single Source of Truth:** The root [`VERSION`](file:///home/japheth/Desktop/hauntview/VERSION) file defines the project version.
- **Rollover Bump Rules:**
  - Patch rolls over at 9: `0.0.9` → `0.1.0`
  - Minor rolls over at 99: `0.99.9` → `1.0.0`
- **Synchronized Carriers:** Every version bump updates:
  - `VERSION`
  - `package.json`
  - `power/plugin.json`
  - `src/version.ts`
  - Next.js Web UI footer (via `src/version.ts`)
- **Automated Pre-Commit Hook:** Husky automatically invokes [`scripts/bump-version.mjs`](file:///home/japheth/Desktop/hauntview/scripts/bump-version.mjs) before every commit. The hook detects and skips bumps during git `amend`, `rebase`, and `merge` operations to avoid version drift.
- **Validation:**
  - Run `pnpm run version:check` to verify that all carrier files match `VERSION`.
  - Run `pnpm run setup:hooks` to reinitialize Git hooks for development.

---

## Cross-Platform Support (Windows, macOS, Linux, WSL)

HauntView provides full, first-class support for both Windows and Unix operating systems:

- **Windows Support Highlights:**
  - **Native Microsoft Edge Execution:** Automatically detects and drives the host's native Microsoft Edge installation via Playwright's `msedge` channel, testing real Windows High Contrast mode (`forced-colors`) and Edge PWA integration.
  - **Path & Environment Expansion:** Supports Windows drive letters (`C:\...`), UNC network paths (`\\server\share`), backslashes (`\`), forward slashes (`/`), and Windows environment variables (`%USERPROFILE%`, `%APPDATA%`, `%LOCALAPPDATA%`, `%TEMP%`).
  - **Adaptive Terminal Rendering:** Detects Windows Terminal, PowerShell, or legacy Command Prompt (`cmd.exe`) and adapts icons automatically (Unicode emojis in modern terminals, clean ASCII fallbacks in legacy shells).
  - **Safe Process Termination:** Cleanly intercepts Ctrl+C (`SIGINT`), `SIGTERM`, and `SIGBREAK` on Windows so no orphaned `chrome.exe` processes linger in Task Manager.
  - **OS-Standard Config Paths:** Stored in `%APPDATA%\hauntview` on Windows, `~/Library/Preferences/hauntview` on macOS, and `$XDG_CONFIG_HOME/hauntview` on Linux.

---

## 25 Testing Profiles

### Device Testing (5 legacy + 3 canonical)

| ID                      | Viewport  | What it checks                                          |
| :---------------------- | :-------- | :------------------------------------------------------ |
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
| :------------------ | :------------------------------------------------------------------- |
| `a11y-screenreader` | `lang`, landmarks, heading order, skip links, ARIA roles             |
| `a11y-keyboard`     | Positive tabindex, non-semantic clickables, focus outlines           |
| `a11y-visual`       | Luminance contrast ratios (WCAG AA), color-only state, forced-colors |
| `a11y-cognitive`    | DOM complexity, autoplay, form complexity, readability               |

### Internationalization (3)

| ID           | Locale  | What it checks                                    |
| :----------- | :------ | :------------------------------------------------ |
| `i18n-rtl`   | `ar-SA` | `dir="rtl"`, logical CSS properties, Arabic fonts |
| `i18n-cjk`   | `ja-JP` | CJK font stack, line-breaking, ruby annotations   |
| `i18n-mixed` | `hi-IN` | Devanagari fonts, ligatures, diacritics           |

### Browser Compatibility (4)

| ID                | Engine      | What it checks                                               |
| :---------------- | :---------- | :----------------------------------------------------------- |
| `browser-webkit`  | WebKit      | WebKit engine baseline                                       |
| `browser-firefox` | Gecko       | `-webkit-*` without standard fallbacks, Gecko console errors |
| `browser-edge`    | Blink/Edge  | Windows High Contrast, forced-colors, PWA manifest           |
| `browser-legacy`  | IE11 compat | CSS custom properties, Grid, ES6+ in inline scripts          |

### Canonical Resilience Rites (9)

| ID                   | Severity range | What it checks                                                                     |
| :------------------- | :------------- | :--------------------------------------------------------------------------------- |
| `image-failure`      | warning / info | All images blocked — missing alt, missing width/height                             |
| `font-failure`       | warning        | All web fonts blocked — fallback layout shift                                      |
| `js-disabled`        | warning / info | JS off — blank content vs. `<noscript>` fallback                                   |
| `reduced-motion`     | warning        | `prefers-reduced-motion: reduce` — animations still running                        |
| `offline`            | info           | Service worker absent, no offline fallback page                                    |
| `broken-links`       | warning / info | Same-origin links probed — 404/410/5xx/auth                                        |
| `network-resilience` | warning        | All XHR/fetch aborted — page errors or blank content                               |
| `security-hygiene`   | warning / info | CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, mixed content |
| `form-resilience`    | warning / info | Empty form submit — validation feedback present/absent                             |

---

## Evidence Contract & Severity Policy

Every finding carries at least one piece of verified evidence (`screenshot`, `dom`, `request`, `header`, `metric`, `axe`, `console`). The engine refuses to raise a finding without proof.

| Situation                                        | Severity  | Confidence  |
| :----------------------------------------------- | :-------- | :---------- |
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

_Rule:_ Findings with `heuristic` confidence may never exceed `warning` severity.

---

## API Usage

### Run rites via HTTP POST

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profiles": ["image-failure", "security-hygiene", "broken-links"],
    "concurrency": true,
    "concurrencyAmount": 2,
    "includeScreenshots": true
  }'
```

---

## Project Structure

```
hauntview/
├── VERSION                     # Single source of truth for workspace version
├── bin/
├── dist/                       # Compiled standalone CLI bundle (dist/cli.js)
├── scripts/
│   ├── bump-version.mjs        # Version rollover bump engine
│   ├── check-version.mjs       # Carrier sync validation
│   ├── build-cli.mjs          # esbuild CLI packager
│   └── postinstall.mjs         # Safe browser setup hook
├── src/
│   ├── version.ts              # Exported version constant
│   ├── types/
│   │   ├── contracts.ts        # Zod schemas + CanonicalFinding
│   │   ├── finding-utils.ts    # buildFinding, assertions
│   │   ├── profiles.ts         # Profile types
│   │   └── results.ts          # Report types
│   ├── core/
│   │   ├── browser-pool.ts     # Playwright pool
│   │   ├── screenshot-manager.ts
│   │   ├── finding-classifier.ts
│   │   ├── profile-manager.ts  # 25 profiles configured
│   │   ├── visual-diff.ts      # pixelmatch ectoplasm diff
│   │   ├── report-store.ts     # SQLite persistence
│   │   ├── system-capability.ts # Hardware assessment & heuristic
│   │   ├── platform.ts         # Cross-platform Windows/Unix abstractions
│   │   └── concurrency-resolver.ts # Priority resolver & hosted guard
│   ├── cli/                    # HauntView CLI
│   │   ├── index.ts            # Entrypoint & command routing
│   │   ├── runner.ts           # haunt <url> runner & reporters
│   │   ├── setup.ts            # haunt setup interactive wizard
│   │   ├── doctor.ts           # haunt doctor diagnostic
│   │   ├── browsers.ts         # Playwright browser verification
│   │   └── config.ts           # Persistent config store
│   ├── profiles/               # 25 profile implementations
│   ├── reports/                # HTML, Markdown, and Zip export pipeline
│   ├── mcp/                    # MCP server (stdio / SSE)
│   └── engine.ts               # Master orchestrator with settled pool
├── app/                        # Next.js Victorian Parlour Web UI
│   ├── api/test/route.ts       # REST API with hosted concurrency guard
│   ├── lib/crypt-store.ts      # Private localStorage Zustand store
│   ├── components/             # Kiroween design system components
│   └── docs/                   # Interactive developer manual
├── docs/
│   ├── ARCHITECTURE.md         # Architecture specification
│   ├── CLI.md                  # Comprehensive haunt CLI guide
│   ├── CONCURRENCY.md          # Concurrency architecture & benchmarks
│   ├── CONTRACTS.md            # Auto-generated contract reference
│   └── KIRO_USAGE.md
├── power/                      # Kiro Power bundle (plugin.json, skills)
├── jest.config.js
└── package.json
```

---

## License

MIT — see LICENSE file.

## Built for Kiroween 2026 Hackathon

HauntView demonstrates comprehensive spec-driven development with Kiro: Zod contracts, steering documents, hooks, property-based tests, and MCP integration — all in a single local-first tool.
