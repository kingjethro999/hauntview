# HauntView — Devpost Project Story

> Paste this content into the Devpost submission form.
> Replace `<YOUTUBE_LINK>` before submitting.

---

## What it does

**HauntView photographs your website twice: once as you built it, and once as your
users sometimes get it.**

Developers test the happy path. Real users arrive on a narrow phone, with images
blocked, a font CDN down, JavaScript failing, or reduced motion switched on. Setting
up those scenarios means writing and maintaining browser tests — and most teams skip
it.

HauntView fixes that in one dropdown. Enter a URL, pick rites (test profiles), and
it drives a real Chromium browser through each failure condition. It returns
screenshots of the living page and each apparition, a visual diff, factual findings
with attached evidence, and an exportable report.

**Every finding carries proof. The tool refuses to flag a defect it cannot prove.**

---

## Spec-Driven Development

HauntView was built spec-first. No line of application code was written before the
corresponding spec was approved.

The `.kiro/specs/` directory contains five spec suites:

| Spec                         | Workflow           | What it covers                      |
| ---------------------------- | ------------------ | ----------------------------------- |
| `hauntview-core`             | Design-first       | Engine architecture, error handling |
| `hauntview-testing-profiles` | Requirements-first | All 25 testing profiles & rites     |
| `hauntview-ui-design`        | Design-first       | Design tokens, Veil, House, Wisp    |
| `medium-mcp-server`          | Requirements-first | MCP tools and contracts             |
| `submission-kit`             | Requirements-first | Demo, compliance, bonus tracks      |

Each spec produced requirements → design → tasks in sequence, with human approval
between each phase. Kiro's task list became the implementation checklist, and every
acceptance criterion maps to at least one test name.

The result: zero scope creep, no mystery code, and a traceable line from "the UI must
pass HauntView's own accessibility rite" to the test that proves it.

---

## Steering Docs

Three steering files in `.kiro/steering/` enforced hard technical invariants across
the entire build:

**`architecture_boundaries.md`** locked strict layer separation: Faces (web UI, CLI,
MCP) contain zero business logic. Each rite runs in an isolated `BrowserContext`.
`UntrustedText` wrapping is mandatory for any string originating from a tested page.

**`type_and_schema_guardrails.md`** enforced TypeScript strict mode with
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. All shared contracts are
Zod schemas; TypeScript types are derived with `z.infer<>`. Findings with empty
`evidence[]` are refused at runtime. The severity policy table (heuristic confidence
may never produce serious severity) is stated as a constraint, not a guideline.

**`kiroween_design_system.md`** codified zero hardcoded colors — every value must
reference a CSS custom property. It defined motion rules (no animation above 3 Hz,
`prefers-reduced-motion` reset), accessibility floor (WCAG AA, 44×44 touch targets,
`forced-colors` support), and every component pattern from the Veil slider to the
CandleIndicator to Wisp.

These steering files did not suggest style — they acted as deterministic compilers.
When Kiro tried to emit `fill="#582696"` the design-lint hook caught it and Kiro
replaced it with `fill="var(--color-haunted-purple)"` in the same turn.

---

## Agent Hooks

Five hooks in `.kiro/hooks/` turned the repository into a self-wiring developer
template:

| Hook                                | Trigger                                     | What it does                                                                 |
| ----------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------- |
| `module-auto-registration.json`     | `PostFileCreate` on rites/profiles/findings | Reminds Kiro to register, create test stub, update barrel export             |
| `spec-to-code-quality-gate.json`    | `PostFileSave` on `.ts`/`.tsx`              | Runs `tsc --noEmit` and surfaces type errors immediately                     |
| `living-docs-sync.json`             | `PostFileSave` on `.md`/`.json`             | Regenerates `docs/ARCHITECTURE.md` with current spec/steering/hook inventory |
| `run-tests-on-task-completion.json` | `PostTaskExec`                              | Runs lint after each spec task completes                                     |
| `format-lint-on-save.json`          | `PostFileSave` on `.ts`/`.tsx`/`.json`      | Auto-formats and lint-fixes on every save                                    |

The Module Auto-Registration hook meant that adding a new rite to
`src/core/rites/` automatically triggered a check for orchestrator registration,
test stubs, and contract updates — eliminating the most common source of "I forgot
to wire this in" bugs during rapid development.

---

## MCP Integration

HauntView ships **The Medium** — a stdio MCP server exposing five tools:

| Tool                 | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `haunt_run_rites`    | Runs one or more rites against a target URL; returns a run ID          |
| `haunt_get_run`      | Returns the full `HauntRun` struct with all captures and findings      |
| `haunt_list_runs`    | Lists recent runs for a target URL                                     |
| `haunt_get_findings` | Returns findings for a run, filterable by severity                     |
| `haunt_compare_runs` | Compares two runs; returns fresh/lingering/laid-to-rest/revenant diffs |

Kiro can call `haunt_run_rites`, receive structured findings with evidence, and fix
the code — without leaving the IDE. The MCP server is configured in
`.kiro/settings/mcp.json` alongside Context7 (live Playwright and axe-core docs to
eliminate library hallucinations).

This is what "use your own Kiro as the AI engine" looks like in practice: HauntView
makes no AI API calls, holds no API keys, and sends no telemetry. Kiro is the
interpreter; HauntView is the evidence provider.

---

## Installation

```bash
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview
pnpm install
pnpm dev       # web UI at http://localhost:3000
```

To connect the MCP server in Kiro, add `.kiro/settings/mcp.json` (contents in the
repo README).

**Live demo:** https://hauntview.onrender.com

---

## Category

**Primary:** Best Costume Contest — the haunted-house interface, the Veil comparison
slider, and the Grimoire report are the clearest difference from prior chaos-testing
entries.

**Also entered:** Most Creative, Blog Post Prize, Social Blitz Prize.
