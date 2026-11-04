# HauntView — 180-Second Demo Video Script

**Target runtime:** 2:57 (leave 3 seconds buffer)
**Real target URL used in demo:** `https://promptdock-mini.vercel.app`
**Screen resolution for recording:** 1280×800 (matches desktop rite viewport)

---

## 0:00 – 0:25 · The Visceral Hook (25 seconds)

**On screen:** HauntView Parlour loaded, dark background, Wisp idle.

**Script:**

> "This is HauntView. Enter a URL —"

_Type `https://promptdock-mini.vercel.app` → porch lantern lights up → click "Run rites"._

> "— and it photographs your website twice: once as you built it, and once as your users
> sometimes get it."

_Rites begin. Candle windows in the Haunted House flicker one by one._

> "Mobile layout, JavaScript disabled, images blocked, accessibility — all at once."

_First findings chip appears. Wisp shifts to `finding-warning` pose._

**Judge target:** Developer Educators / Content Creators — capture attention in first 25s.

---

## 0:25 – 1:00 · Proof of Versatility (35 seconds)

**On screen:** Run completes. The Veil animates in.

**Script:**

> "The Veil. Drag to compare the living page and the apparition."

_Drag the Veil slider left to reveal the image-failure apparition._

> "Ectoplasm shows exactly which pixels changed."

_Toggle ectoplasm mode — diff overlay appears._

> "Every finding has evidence. A screenshot, a DOM selector, a measured metric.
> No finding is ever manufactured — if the tool can't prove it, it doesn't report it."

_Click a Serious finding chip → evidence drawer opens._

**Judge target:** UX & Product Design Leaders — atmospheric polish + real utility.

---

## 1:00 – 2:10 · Live Inside the Kiro IDE (70 seconds)

**On screen:** Switch to Kiro IDE. Open `.kiro/` in the file explorer.

**Script:**

> "Let me show you how Kiro built this."

_Open `.kiro/specs/hauntview-core/requirements.md`._

> "Spec-driven development. Requirements came first —"

_Open `design.md`._

> "— then design —"

_Open `tasks.md`._

> "— then tasks. No code was written until the spec was approved."

_Open `.kiro/steering/type_and_schema_guardrails.md`._

> "Steering docs lock architectural invariants. `noUncheckedIndexedAccess`,
> Zod schemas as the single source of truth, evidence never empty."

_Open `.kiro/steering/architecture_boundaries.md`._

> "Faces contain zero business logic. Rites are isolated. The Medium is the MCP server."

_Open `.kiro/hooks/module-auto-registration.json`. Trigger it by creating a new file
in `src/core/rites/` — hook fires and auto-wires the module._

> "When I add a new rite, the Module Auto-Registration hook fires and wires it into
> the orchestrator, creates a test stub, and updates the barrel export. No manual wiring."

_Show tests running: `pnpm test` — property-based tests flash by._

> "One hundred property-based iterations per invariant. Evidence never empty. Rites
> always isolated. Diffs never cross viewports."

**Judge target:** All judges — irrefutable proof of all 5 Kiro features.

---

## 2:10 – 2:40 · Architectural Rigor & Developer Utility (30 seconds)

**On screen:** Architecture diagram from `docs/ARCHITECTURE.md`.

**Script:**

> "One engine. Four faces: web UI, CLI, MCP server, and a Kiro Power you can install."

_Show MCP tools list briefly._

> "Kiro can call `haunt_run_rites`, get structured findings, and fix them — without
> leaving the IDE. That's what 'see what breaks before your users do' actually means
> in an agentic workflow."

_Flash the property test count: "20 property tests, 100+ iterations each."_

**Judge target:** AWS Principal Architects / Industry Analysts — architectural rigor.

---

## 2:40 – 3:00 · Zero-Friction Onboarding (20 seconds)

**On screen:** Fresh terminal window.

```bash
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview && pnpm install && pnpm dev
```

_Browser opens at `http://localhost:3000` — Parlour loads._

> "Clone, install, done. No accounts, no API keys, works offline once installed."

_Show live deployed URL loading without login._

**Judge target:** Technical Repo Reviewers — removes all testing friction.

---

## Post-Recording Checklist

- [ ] Total runtime ≤ 3:00
- [ ] Real target URL (`promptdock-mini.vercel.app`) is live and accessible
- [ ] All five `.kiro` directories shown on screen
- [ ] Agent Hook triggered live and output visible
- [ ] Property test run shown with iteration count
- [ ] `pnpm install && pnpm dev` completes under 30 seconds on screen
- [ ] YouTube upload: unlisted link added to Devpost before Dec 4, 2:00 PM PT
