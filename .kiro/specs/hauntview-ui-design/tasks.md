# Implementation Plan: HauntView UI Design System (Costume)

## Overview

This plan drives the visual layer of HauntView — the Kiroween Costume Contest entry.
It builds the design token system, all themed components, the Veil comparison slider,
the Haunted House run-overview, Wisp the ghost host, and the full Parlour (home) and
results flows. Every task references acceptance criteria from `requirements.md`.

---

## Phase 1 — Design Token Foundation

- [ ] 1. Audit and complete `app/components/design-tokens.css`
  - Verify all tokens from the kiroween_design_system steering file are present:
    `--color-midnight-black`, `--color-haunted-purple`, `--color-crimson-orange`,
    `--color-ghostly-white`, `--color-shadow-gray`, `--color-deep-gray`
  - Add severity tokens: `--color-severity-info`, `--color-severity-warning`,
    `--color-severity-serious`
  - Add motion duration tokens: `--motion-duration-instant`, `--motion-duration-subtle`,
    `--motion-duration-normal`, `--motion-duration-slow`
  - Add font tokens: `--font-body`, `--font-display`, `--font-mono`, `--font-size-base`
  - Add breakpoint tokens: `--breakpoint-sm`, `--breakpoint-md`, `--breakpoint-lg`,
    `--breakpoint-xl`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 2. Add `prefers-reduced-motion` global reset
  - Add `@media (prefers-reduced-motion: reduce)` block disabling all animations
  - Add `@media (forced-colors: active)` baseline overrides
  - Verify the reset is imported in `app/globals.css` or the root layout
  - _Requirements: (accessibility floor, AGENTS.md §1.10)_

- [ ] 3. Verify WCAG AA contrast ratios for all palette combinations
  - Use automated contrast checker in a test (`tests/design/contrast.test.ts`)
  - Assert `--color-ghostly-white` on `--color-midnight-black` ≥ 4.5:1
  - Assert `--color-ghostly-white` on `--color-haunted-purple` ≥ 4.5:1
  - Assert `--color-ghostly-white` on `--color-deep-gray` ≥ 4.5:1
  - _Requirements: 2.2, 2.3, 2.4, 2.5_

---

## Phase 2 — Core Themed Components

- [ ] 4. Implement `CandleIndicator` component
  - SVG-based candle with six states: `queued`, `running`, `ok`, `findings`,
    `skipped`, `error`
  - `running` state uses `@keyframes flicker` (respects `prefers-reduced-motion`)
  - Props: `{ status: RiteStatus; label: string }`
  - Accessibility: `role="img"`, `aria-label="{label}: {plainStatus}"`
  - _Requirements: (AGENTS.md §3.4 candle table)_

- [ ] 5. Implement `WispGhost` component
  - SVG ghost with states: `idle`, `running`, `finding-serious`, `finding-info`,
    `error`, `complete`
  - State drives pose and glow color via CSS custom properties on the SVG
  - Atmosphere Off → static SVG only, no keyframe
  - Props: `{ state: WispState; atmosphere: AtmosphereLevel }`
  - _Requirements: (AGENTS.md §3.2 Wisp)_

- [ ] 6. Implement `SeverityChip` component
  - Renders icon shape + text label, never color alone
  - Three variants: `info` (Whisper), `warning` (Chill), `serious` (Scream)
  - Uses `--color-severity-*` tokens for background tint
  - _Requirements: (AGENTS.md §3.4 severity table)_

- [ ] 7. Implement `TheVeil` comparison slider
  - Two stacked `<img>` elements (living page left, apparition right)
  - Draggable divider updates `--veil-position` CSS custom property
  - `role="slider"` with `aria-valuenow`, operable with Left/Right arrow keys
  - Ghost pin overlay: focusable `<button>` elements with `aria-label="Finding: {title}"`
  - Entrance animation on result reveal (`--motion-duration-normal`, once only)
  - Ectoplasm overlay mode toggleable via button
  - _Requirements: (AGENTS.md §3.2 The Veil, §3.5 narrative step 6)_

- [ ] 8. Implement `HauntedHouse` run-overview component
  - Renders the house SVG with one lit window per rite
  - Window state maps to candle state (lit = ok, guttering = findings, dark = error)
  - Rite windows clickable — scrolls to that rite's results panel
  - Atmosphere level controls fog/bat layer visibility
  - _Requirements: (AGENTS.md §11.4.3, §3.2 The House)_

---

## Phase 3 — Parlour (Home Screen)

- [ ] 9. Implement the Parlour layout (`app/page.tsx` root route)
  - `SpiritBoardBackdrop` decorative background (letter-arc motif)
  - Porch lantern SVG lights up when URL input passes validation
  - `WispGhost` in idle state by default
  - Input label: "Which house shall we haunt?" + plain subtitle "Enter a URL to test"
  - _Requirements: (AGENTS.md §3.5 step 1 Arrival)_

- [ ] 10. Implement URL input with porch lantern feedback
  - Validates URL on blur / enter; lights lantern on valid input
  - Error state: plain message, no lore (e.g. "Couldn't reach https://…")
  - `aria-describedby` wired to error message element
  - _Requirements: (AGENTS.md §3.3 error examples)_

- [ ] 11. Implement `PlanchetteProgress` component
  - Moves along a decorative arc path as rites complete
  - `aria-live="polite"` text readout: "3 of 12 rites complete"
  - Respects `prefers-reduced-motion` (no path animation → position jump only)
  - _Requirements: (AGENTS.md §3.2 Planchette)_

---

## Phase 4 — Atmosphere & Audio Layer

- [ ] 12. Implement `AtmosphereToggle` (Off / Subtle / Full)
  - Persists to `localStorage` under key `hauntview.atmosphere`
  - Broadcasts change via a custom DOM event `hauntview:atmosphere`
  - All animated components subscribe and adjust
  - _Requirements: (AGENTS.md §1.10, §3.2 Atmosphere)_

- [ ] 13. Implement `AmbientAudio` — generative Web Audio
  - Synthesized only — no audio asset files, no CDN
  - Three tracks: `idle` (low drone), `running` (tension build), `complete` (resolution)
  - Starts only on explicit user interaction (button press)
  - Volume respects Atmosphere level; Off → completely silent
  - _Requirements: (AGENTS.md §2.8 limb 6)_

- [ ] 14. Implement `HauntingEffects` atmosphere layer
  - Fog, moths, bats rendered as SVG / CSS — sit behind content (`z-index` below main)
  - Subtlety levels: Subtle → fog only; Full → fog + moths + bats
  - All effects have static fallback when `prefers-reduced-motion` is active
  - _Requirements: (AGENTS.md §1.10, §3.6)_

---

## Phase 5 — Results & Grimoire

- [ ] 15. Implement `FindingsTable` / Omen panel
  - Lists findings sorted by severity (serious → warning → info)
  - Each row: lore severity chip + plain severity label + title + rite + evidence link
  - Expandable detail drawer showing raw evidence
  - `aria-sort` on column headers
  - _Requirements: (AGENTS.md §3.2 Omen, §3.4)_

- [ ] 16. Implement `ExorcismPromptModal`
  - "Fix with Kiro" action — copies a structured prompt to clipboard
  - Prompt format: finding title, summary, selector, and `investigate` hints
  - Button label: "Copy fix prompt for Kiro" (plain)
  - Toast on copy: "Fix prompt copied."
  - _Requirements: (AGENTS.md §3.2 Exorcism, §3.5 step 8)_

- [ ] 17. Implement `ReportActions` — Grimoire export
  - "Export report" button triggers HTML download
  - Exported HTML is fully self-contained (no external URLs, no remote fonts/scripts)
  - Toast: "Report exported."
  - _Requirements: (AGENTS.md §3.2 Grimoire)_

- [ ] 18. Implement run comparison view (Fresh / Lingering / Laid to rest / Revenant)
  - Diff two runs side by side; findings tagged with comparison status
  - Revenant findings (fixed then re-introduced) shown with distinct icon
  - Route: `/crypt/:runId/compare/:prevRunId`
  - _Requirements: (AGENTS.md §3.2 compare lexicon)_

---

## Phase 6 — Accessibility Validation

- [ ] 19. Run HauntView's own Accessibility rite against every route
  - Test `/` (Parlour), `/runs/:id` (Gallery), `/crypt` (history), `/crypt/:id/compare`
  - Assert zero `serious` findings from axe-core
  - Fix any `warning` findings in the UI before marking done
  - _Requirements: (AGENTS.md §1.10)_

- [ ] 20. Keyboard-only navigation audit
  - Tab through all interactive elements on each route
  - Verify focus ring is visible on every element (`:focus-visible`)
  - Verify Veil slider is operable with Arrow keys
  - Verify modal closes with Escape
  - _Requirements: (kiroween_design_system.md §Accessibility Floor)_

- [ ] 21. Checkpoint — UI design system complete
  - All design tokens present and verified
  - All components render and pass accessibility checks
  - Contrast test suite passes
  - No hardcoded color values in component CSS (verified by `design-lint.mjs`)
