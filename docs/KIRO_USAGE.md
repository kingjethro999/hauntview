# KIRO_USAGE.md — How Kiro Was Used to Build HauntView

This document is required by AGENTS.md §1.16. It records every Kiro spec, the
workflows used, closure status, and any Kiro behaviors that were uncertain or
surprising during the build.

---

## Spec Inventory

| ID  | Spec folder                  | Workflow           | Status | Notes                                                        |
| --- | ---------------------------- | ------------------ | ------ | ------------------------------------------------------------ |
| S01 | `hauntview-core`             | Design-first       | Closed | Core orchestrator, visual diff, browser pool, and storage    |
| S02 | `hauntview-testing-profiles` | Requirements-first | Closed | 25 automated testing profiles + 27 unit/property test suites |
| S03 | `hauntview-ui-design`        | Design-first       | Closed | Victorian parlour design system, The Veil, Haunted House     |
| S04 | `medium-mcp-server`          | Requirements-first | Closed | Stdio transport, 5 tools, dynamic profile enumeration        |
| S05 | `submission-kit`             | Requirements-first | Closed | Presubmit audit passing (11/11), VIBE log, demo script       |

---

## Steering Files

| File                            | Purpose                                                              | Status |
| ------------------------------- | -------------------------------------------------------------------- | ------ |
| `architecture_boundaries.md`    | Layer separation, evidence invariants, security                      | Active |
| `type_and_schema_guardrails.md` | TypeScript strict flags, Zod contracts, severity policy              | Active |
| `kiroween_design_system.md`     | Design tokens, motion rules, accessibility floor, component patterns | Active |

---

## Hooks

| Hook file                           | Trigger                                  | Purpose                            | Status |
| ----------------------------------- | ---------------------------------------- | ---------------------------------- | ------ |
| `format-lint-on-save.json`          | PostFileSave (`.ts`/`.tsx`/`.json`)      | ESLint + Prettier auto-fix         | Active |
| `run-tests-on-task-completion.json` | PostTaskExec                             | Lint after spec task               | Active |
| `spec-to-code-quality-gate.json`    | PostFileSave (`.ts`/`.tsx`)              | `tsc --noEmit` on every save       | Active |
| `living-docs-sync.json`             | PostFileSave (`.md`/`.json`)             | Regenerates `docs/ARCHITECTURE.md` | Active |
| `module-auto-registration.json`     | PostFileCreate (rites/findings/profiles) | Rite wiring + test stub reminder   | Active |

---

## Kiro Workflows Used

- **Spec mode (Design-first):** Used for `hauntview-core` and `hauntview-ui-design`.
  Architecture risk drove the workflow choice — the design was the primary deliverable.

- **Spec mode (Requirements-first):** Used for `hauntview-testing-profiles`,
  `medium-mcp-server`, and `submission-kit`. Behavior was better understood than the
  solution in these cases.

- **Vibe mode:** Used for scoped single-file generation (visual diff engine, Haunted
  House component, MCP server) when the module boundary was clear and steering files
  provided sufficient constraints. See `VIBE_CODING_LOG.md`.

- **Supervised mode:** Used during the TypeScript strict-mode migration to review
  each hunk before accepting, avoiding cascading type errors.

---

## Known Unknowns

Things that were uncertain about Kiro behavior during the build. These are honest
observations, not complaints.

1. **`inclusion: auto` steering files** — It is unclear whether `inclusion: auto`
   steering files are activated before or after Kiro begins processing a turn. In
   practice, all three steering files use `inclusion: always` to guarantee they are
   loaded on every interaction.

2. **Hook circular dependency detection** — The `module-auto-registration` hook fires
   on `PostFileCreate` and calls an agent prompt that may use file-writing tools.
   It is unclear whether this creates a circular trigger. Monitored during the build;
   no infinite loop observed.

3. **PostTaskExec timing** — Whether `PostTaskExec` fires before or after Kiro's
   turn ends is undocumented. The lint hook uses `|| true` to prevent blocking.

4. **MCP server lifetime in Kiro** — Whether the `hauntview-medium` MCP server
   process persists across Kiro sessions or restarts per session is undocumented.
   Documented in the README with a manual start command as a fallback.

---

## Spec Closure Log

_(A spec is closed when every task is checked and all acceptance criteria are
traceable to at least one test name.)_

| Spec                         | Closed date | Notes                                                     |
| ---------------------------- | ----------- | --------------------------------------------------------- |
| `hauntview-core`             | 2026-11-03  | Core engine, URL safety, SQLite database, pixelmatch diff |
| `hauntview-testing-profiles` | 2026-11-03  | All 25 profiles implemented; 27 Jest test suites passing  |
| `hauntview-ui-design`        | 2026-11-03  | Parlour UI, The Veil slider, Haunted House, design tokens |
| `medium-mcp-server`          | 2026-11-03  | MCP server (stdio), 5 tools, dynamic profile enumeration  |
| `submission-kit`             | 2026-11-03  | presubmit.mjs passing 11/11 checks, VIBE log, demo script |
