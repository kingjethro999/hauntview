# HauntView — Vibe Coding Log

This log documents complex modules that were generated from conversational prompts
using Kiro's vibe-coding mode, paired with specs and steering docs that constrained
output to meet HauntView's architectural invariants.

Format per entry:

- **Prompt** — the exact or paraphrased prompt given to Kiro
- **Generated** — file(s) produced
- **Spec criteria satisfied** — acceptance criterion IDs
- **Steering files active** — which steering docs were loaded
- **Outcome** — what was produced and any notable Kiro behavior

---

## Entry 1 — 2026-10-30 — Core Visual Diff Engine (`src/core/visual-diff.ts`)

**Prompt:**

> "Build me the visual diff engine. It takes a baseline PNG buffer and an apparition PNG
> buffer at the same viewport, runs pixelmatch, clusters changed regions, and returns a
> `DiffResult` with `changedRatio`, an ectoplasm overlay PNG, and up to 20 change
> regions sorted largest-first. Never flag a diff as a finding — that's the caller's job."

**Generated:** `src/core/visual-diff.ts`

**Spec criteria satisfied:** `engine-core 4.5`, `visual-diff-ectoplasm 1.1–1.5`

**Steering files active:** `architecture_boundaries.md`, `type_and_schema_guardrails.md`

**Outcome:** Kiro produced a fully typed module using `pngjs` + `pixelmatch`. The
`noUncheckedIndexedAccess` flag forced explicit narrowing on every pixel array
access. The clustering algorithm (union-find on adjacent changed pixels) was generated
in a single pass from the prompt. Steering guardrails prevented returning `any` and
enforced the `DiffResult` Zod schema.

---

## Entry 2 — 2026-11-03 — Haunted House SVG Component (`app/components/features/HauntedHouse.tsx`)

**Prompt:**

> "Create the HauntedHouse React component. It renders a Victorian house SVG where each
> window corresponds to a rite. Window state (queued/running/ok/findings/skipped/error)
> maps to a candle state. Clicking a window scrolls to that rite's results panel. Fog and
> bat layers are shown only when Atmosphere is Subtle or Full. All animation must respect
> prefers-reduced-motion. Use only CSS tokens from design-tokens.css — no hardcoded hex."

**Generated:** `app/components/features/HauntedHouse.tsx`

**Spec criteria satisfied:** `hauntview-ui-design 3.1, 3.2, 3.3`

**Steering files active:** `kiroween_design_system.md`, `architecture_boundaries.md`

**Outcome:** Kiro generated the SVG inline with a `<g>` per window, wired state to
CSS class variants, and used `useReducedMotion()` from the design system. The
design-lint hook immediately caught one hardcoded `fill="#582696"` and Kiro replaced
it with `fill="var(--color-haunted-purple)"` in the same turn.

---

## Entry 3 — 2026-11-10 — MCP Server Tool Registration (`src/mcp/server.ts`)

**Prompt:**

> "Wire up the MCP server using @modelcontextprotocol/sdk stdio transport. Expose five
> tools: haunt_run_rites, haunt_get_run, haunt_list_runs, haunt_get_findings,
> haunt_compare_runs. Each tool validates its input with Zod, calls the Core service,
> and returns an ok/error discriminated union. stdout is reserved for the MCP protocol —
> all logs go to stderr. Never return an internal stack trace in an error response."

**Generated:** `src/mcp/server.ts`, `src/mcp/tools/`

**Spec criteria satisfied:** `medium-mcp-server 1.1–1.7`

**Steering files active:** `architecture_boundaries.md`, `type_and_schema_guardrails.md`

**Outcome:** Kiro correctly kept all business logic in Core and wrote thin wrappers in
the MCP layer. The `exactOptionalPropertyTypes` flag forced Kiro to remove three
`| undefined` assignments that would have caused runtime issues. The discriminated
union pattern was applied consistently across all five tools.

---

## Entry 4 — 2026-11-18 — Evidence Contract Migration (`src/types/finding-utils.ts`, `src/profiles/*`)

**Prompt:**

> "Every finding must carry non-empty structured evidence — metric, DOM, console,
> header, screenshot, request, or axe items. Legacy profiles that push bare
> `{ message }` findings violate the invariant. Migrate all 25 profiles, sanitize
> every page-originated string through `UntrustedText`, and keep the
> heuristic-confidence-never-serious policy. Don't compromise code quality."

**Generated:** `src/types/finding-utils.ts` (`buildProfileFinding`,
`assertFindingHasEvidence`, `executionErrorEvidence`, `sanitizeMessage`),
`evidence: Evidence[]` on `Finding` in `src/types/profiles.ts`, runtime guard in
`src/core/finding-classifier.ts`, screenshot-evidence attachment in `src/engine.ts`,
persistence in `src/lib/server/database.ts`, and evidence-bearing findings across
all 25 profile modules.

**Spec criteria satisfied:** `type_and_schema_guardrails` evidence invariant,
`architecture_boundaries` (core owns contracts; faces stay thin)

**Steering files active:** `type_and_schema_guardrails.md`, `architecture_boundaries.md`

**Outcome:** Kiro established the bridge pattern — canonical `CanonicalFinding`s
built via `buildFinding` embedded in `details.canonicalFinding`, mirrored onto the
legacy `Finding.evidence` field so reports, the classifier, and storage all consume
the same evidence. `exactOptionalPropertyTypes` forced conditional spreads for
optional `where`/`location` fields. Non-rite profiles (i18n, browser-*) received
typed DOM evidence without extending the spec-fixed 16-rite `RiteIdSchema`.

---

## Entry 5 — 2026-11-19 — MCP Response Contract Hardening (`src/mcp/register-tools.ts`)

**Prompt:**

> "MCP tools must return the discriminated union `{ ok: true, data } |
{ ok: false, error: { code, message, hint } }`. No raw `err.message`, no stack
> traces, every error needs an actionable hint."

**Generated:** `src/mcp/register-tools.ts`

**Spec criteria satisfied:** `type_and_schema_guardrails` ApiResponse contract,
`medium-mcp-server` error hygiene

**Steering files active:** `type_and_schema_guardrails.md`, `architecture_boundaries.md`

**Outcome:** All six tools (`list-test-profiles`, `run-test-profile`,
`get-run-status`, `get-latest-report`, `compare-runs`, `export-report`) now emit
the ok/error envelope inside the MCP `content` payload. Internal error details
were replaced with stable codes (`INVALID_URL`, `EXECUTION_FAILED`,
`RUN_NOT_FOUND`, `COMPARE_FAILED`) plus recovery hints.

---

## Entry 6 — 2026-11-19 — Property-Based Invariant Tests (`src/types/__tests__/invariants.test.ts`)

**Prompt:**

> "Add fast-check property tests for every named invariant: evidence never empty,
> heuristic confidence never produces serious severity, UntrustedText always
> ≤300 chars with control chars stripped, and changedRatio alone never produces
> a finding."

**Generated:** `src/types/__tests__/invariants.test.ts`

**Spec criteria satisfied:** `type_and_schema_guardrails` §property-based
verification, AGENTS.md test requirements

**Steering files active:** `type_and_schema_guardrails.md`

**Outcome:** Eight properties at 100 runs each covering `buildFinding`,
`buildProfileFinding`, `assertFindingHasEvidence`,
`assertValidSeverityConfidence`, `sanitizeUntrusted`, `sanitizeMessage`, and the
diff/finding separation. Arbitraries respect `exactOptionalPropertyTypes` by
omitting optional fields rather than passing `undefined`.

---

<!-- Add new entries below as the build progresses -->
