# Frontend UI & Split-Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-grade, Gothic Halloween-themed frontend for HauntView with a modular component architecture (`ui/`, `layout/`, `features/`) split across dedicated routes (`/` for setup & launching, `/results` for test history, and `/results/[id]` for the interactive test report).

**Architecture:** Next.js App Router with React 19 and TailwindCSS, backed by HauntView's existing `HauntViewEngine`. Test runs are persisted locally in `.hauntview/results/` via API routes so `/results/[id]` can render on demand and support direct HTML/Markdown report downloads.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, TailwindCSS v4, `@heroicons/react`, Next Fonts (`Space_Grotesk`, `Inter`).

**Spec:** `.kiro/specs/hauntview-ui-design/requirements.md` and `.kiro/specs/hauntview-ui-design/design.md`.

## Global Constraints

- Primary palette: Midnight Black (`#0F0F14`), Haunted Purple (`#582696`), Crimson Orange (`#DC6428`), Ghostly White (`#F5F5FA`), Deep Gray (`#373746`).
- Heading font: Space Grotesk 700; Body font: Inter; Monospace: JetBrains Mono / monospace.
- Spacing: 8px base unit scale (4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px).
- Icons: Heroicons outline only (no emojis).
- Accessibility: WCAG AA contrast compliance (>= 4.5:1), visible focus rings (`2px solid #DC6428 outline`).
- Zero ESLint errors or warnings (`npx eslint .`).

## Review Focus

1. Route params handling in Next.js 16 App Router (dynamic params `params: Promise<{ id: string }>` must be awaited).
2. Report persistence across route navigation (storing reports when executed so `/results/[id]` can reload).
3. Test launcher validation (enforcing valid HTTP/HTTPS URLs before execution).
4. Accessibility keyboard focus states on all interactive elements.
5. Mobile and desktop responsiveness across viewports (375px to 1440px).

---

### Task 1: Styling Foundation & Fonts

- Update `app/globals.css` to import design tokens and configure dark theme defaults.
- Update `app/layout.tsx` to load Space Grotesk and Inter fonts and establish root dark container.

### Task 2: Core UI Component Library (`app/components/ui/`)

- Create standard reusable UI atoms:
  - `Button.tsx`: Primary, secondary, ghost, danger variants with states (hover, focus ring, loading spinner).
  - `Card.tsx`: Dark elevated container with border highlight and optional header/footer.
  - `Input.tsx`: Form input with focus border `#DC6428`, error display, and icon support.
  - `Badge.tsx`: Severity and category badges (error, warning, info, success, primary).
  - `Alert.tsx`: Dismissible and static alert banners with Heroicons.
  - `ProgressBar.tsx`: Gradient progress bar (`#582696` to `#DC6428`) with pulse glow.
  - `Spinner.tsx`: Smooth SVG rotation spinner.
  - `Modal.tsx`: Accessible dialog with backdrop blur and escape key listener.
  - `EmptyState.tsx`: Centered placeholder with icon and action button.

### Task 3: Layout Components (`app/components/layout/`)

- Create layout scaffolding:
  - `Navbar.tsx`: Atmospheric navigation header with logo, active link indicators, and quick links.
  - `Footer.tsx`: Gothic themed footer with Kiroween 2026 Hackathon branding.
  - `Container.tsx`: Centered container with responsive padding.

### Task 4: Report Storage & API Routes (`app/api/results`)

- Implement report storage helper (`src/core/report-store.ts`) saving to `.hauntview/results/`.
- Update `app/api/test/route.ts` to automatically save generated reports.
- Create `app/api/results/route.ts` (list all recent test runs).
- Create `app/api/results/[id]/route.ts` (fetch single report by ID, with format export support).

### Task 5: Feature Components (`app/components/features/`)

- Create domain-specific feature modules:
  - `ProfileSelector.tsx`: Category tabs (All, Devices, Accessibility, i18n, Browsers, Performance), selection checkboxes, preset buttons ("Select All", "Smoke Test", "Clear").
  - `TestLauncher.tsx`: Target URL input, profile selection summary, format toggle, submit button.
  - `ProgressTracker.tsx`: Live execution state display with animated bar, current step, elapsed time.
  - `ExecutiveSummary.tsx`: Overview KPI cards (Pass rate %, Profiles passed/failed, Finding counts by severity).
  - `FindingsTable.tsx`: Searchable and filterable findings list with severity filters, category tags, and expandable detail drawers.
  - `ProfileResultsList.tsx`: Breakdown by individual profile with duration, success/fail badge, and findings count.
  - `ReportActions.tsx`: HTML and Markdown report download buttons.

### Task 6: Setup Route (`app/page.tsx`)

- Implement the home page:
  - Hero header introducing HauntView and its 16 automated profiles.
  - Test launcher with presets and URL validation.
  - Progress tracker during test execution with automatic redirect to `/results/[id]` on completion.
  - Quick access card showing recent test runs with links to view reports.

### Task 7: Results Routes (`app/results/page.tsx` & `app/results/[id]/page.tsx`)

- Implement `app/results/[id]/page.tsx`:
  - Full interactive report for a specific test run.
  - Executive summary KPIs.
  - Tabbed interface: "All Findings", "By Profile", and "Raw Report".
  - Export actions: Download HTML report, Download Markdown, or copy report JSON.
- Implement `app/results/page.tsx`:
  - Table of all historical test runs with timestamps, URLs, findings counts, and direct links.

### Task 8: Verification & Git Commit

- Run `npx eslint .` to guarantee 0 errors and 0 warnings.
- Run `npm run format:check` to ensure Prettier compliance.
- Test building the Next.js app (`npm run build`).
- Commit and push to `origin/main`.
