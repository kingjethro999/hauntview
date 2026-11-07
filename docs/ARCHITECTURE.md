# HauntView — Architecture Reference

HauntView is designed as a local-first web resilience and visual chaos testing engine. It separates user interfaces (**Faces**) from orchestration and testing logic (**Core**), and uses a partitioned **Dual Storage Model** to preserve privacy and portability.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                                 FACES                                  │
│   Web UI (Next.js)      CLI (`haunt`)      MCP Server     REST API    │
│   Parlour Interface     Node.js CLI        Kiro/Claude    Endpoints   │
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

## 1. Faces Layer

The Faces layer exposes HauntView capabilities without embedding business or testing logic:

- **CLI (`src/cli/`):** Command-line tool compiled to standalone Node.js (`dist/cli.js`). Runs non-interactively in CI or interactively in terminals. Completely decoupled from web runtime packages (`zustand`, `react`, `next`).
- **Web UI (`app/`):** Victorian Parlour themed dashboard built with Next.js and Tailwind CSS. Provides interactive test launching, real-time progress indicators, and visual comparison grids.
- **MCP Server (`src/mcp/`):** Model Context Protocol implementation supporting both local stdio subprocesses and remote SSE gateways. Connects Kiro IDE, Claude Code, Cursor, and Windsurf directly to testing rites.
- **REST API (`app/api/`):** HTTP endpoints (`/api/test`) allowing headless orchestration from curl, scripts, or external test runners.

---

## 2. Core Engine Layer

- **`HauntViewEngine` ([`src/engine.ts`](file:///home/japheth/Desktop/hauntview/src/engine.ts)):** Master orchestrator. Manages test cycles, resolves profile selection, executes rites sequentially or concurrently via settled worker pools, and compiles final reports.
- **`ConcurrencyResolver` ([`src/core/concurrency-resolver.ts`](file:///home/japheth/Desktop/hauntview/src/core/concurrency-resolver.ts)):** Reconciles runtime flags, environment variables, user config, and hardware capability into safe concurrency limits. Enforces hosted environment restrictions (`RENDER=true`).
- **`SystemCapability` ([`src/core/system-capability.ts`](file:///home/japheth/Desktop/hauntview/src/core/system-capability.ts)):** Analyzes host CPU cores and memory to compute recommended concurrency limits and prevent system oversubscription.
- **`BrowserPool` ([`src/core/browser-pool.ts`](file:///home/japheth/Desktop/hauntview/src/core/browser-pool.ts)):** Manages lifecycle of Playwright Chromium, Firefox, and WebKit browser contexts, handling graceful allocation, recycling, and teardown.
- **`VisualDiff` ([`src/core/visual-diff.ts`](file:///home/japheth/Desktop/hauntview/src/core/visual-diff.ts)):** Generates side-by-side visual diffs and pixelmatch ectoplasm overlays highlighting layout shifts and visual bugs.

---

## 3. Dual Storage Architecture

HauntView deliberately partitions its storage model based on execution environment:

### Web UI: Private Client-Side Storage

- **Mechanism:** Zustand `persist` middleware backed by `localStorage` (`app/lib/crypt-store.ts`).
- **Privacy & Isolation:** Each visitor's test history is confined to their own browser. Reports and screenshots never leak between users on multi-tenant or public deployments.
- **Persistence:** Test history survives server reboots, container redeployments, and network interruptions. If a server restarts, the client automatically rehydrates reports from the browser.
- **User Control:** Includes a dedicated "Clear History" button to purge all local test runs.
- **Limitations:** Storage is bound to the specific browser and device (no cross-device cloud sync) and bounded by browser localStorage quotas (~5–10 MB).

### CLI / MCP / REST: Server-Side SQLite

- **Mechanism:** Embedded SQLite database via `better-sqlite3` located at `.hauntview/data/hauntview.db`.
- **Scope:** Persists structured test records, rite timings, and finding evidence for CLI runs, MCP tools, and server-side automation.
- **Exports:** The CLI reuses the core report pipeline (`ReportFactory` and `ZipReportGenerator`) to export standalone HTML, Markdown, and Zip bundles to the user-configured export directory (`.` or `~`).

---

## 4. Specs & Steering References

### Specs (`.kiro/specs/`)

- `hauntview-core`: Orchestrator, browser pool, visual diffing, contracts, and finding classifications.
- `hauntview-testing-profiles`: Implementations and test suites for all 25 resilience and accessibility rites.
- `hauntview-ui-design`: Victorian Parlour aesthetic, report visualization, and responsive design components.
- `submission-kit`: Packaging, distribution, documentation, and compliance verification.

### Steering Documents (`.kiro/steering/`)

- `architecture_boundaries.md`: Strict separation between Faces, Core, and Storage.
- `kiroween_design_system.md`: Visual palette, typography, and styling guidelines.
- `type_and_schema_guardrails.md`: Single source of truth typing via Zod contracts.
