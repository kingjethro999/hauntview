# Design Document — S15: Submission Kit

## Overview

The submission kit is not a software feature — it is the packaging and compliance
layer that turns a finished product into a winning submission. This design document
specifies the artifacts to produce, the audit script, and the video shot list.

## Artifacts

### 1. `DEMO_SCRIPT.md`

A shot-by-shot script for the 180-second demo video. Structure:

| Timestamp | Scene                                                                  | Purpose                  |
| --------- | ---------------------------------------------------------------------- | ------------------------ |
| 0:00–0:25 | Live HauntView scan of `promptdock-mini.vercel.app` returning findings | Visceral hook            |
| 0:25–1:00 | Parlour UI → Haunted House → The Veil → Findings panel                 | Costume quality          |
| 1:00–2:10 | Kiro IDE: `.kiro/` in action — spec, steering, hook firing             | Implementation proof     |
| 2:10–2:40 | Architecture diagram + property test run + developer utility narrative | AWS architect appeal     |
| 2:40–3:00 | Live URL load + `pnpm install && pnpm dev` under 30s                   | Zero-friction onboarding |

### 2. `docs/DEVPOST_STORY.md`

Markdown draft of the Devpost project description. Sections:

- **What it does** (Spooky Wrapper, Serious Core — AGENTS.md §2.6)
- **Spec-Driven Development** — how `.kiro/specs/` drove the build
- **Steering Docs** — three steering files and their invariants
- **Agent Hooks** — all five hooks and what they automate
- **MCP Integration** — The Medium, its five tools, Kiro Power
- **Installation** — one-command
- **Kiro category** — Costume Contest (default) or Frankenstein (if 5/7 limbs ship)

### 3. `scripts/presubmit.mjs`

Automated compliance audit script. Checks:

```
✓ GitHub repo is public (skip if not CI)
✓ LICENSE file exists and contains "MIT"
✓ .gitignore does not contain .kiro
✓ .kiro/specs/ has ≥ 3 directories
✓ .kiro/steering/ has ≥ 3 .md files
✓ .kiro/hooks/ has ≥ 3 .json files
✓ .kiro/settings/ is non-empty (mcp.json present)
✓ README.md contains "pnpm install" and "pnpm dev"
✓ docs/KIRO_USAGE.md exists
✓ docs/DEMO_SCRIPT.md exists
```

Exits with code 1 and a clear error message if any check fails.

## Entry N — {date} — {module name}

**Prompt:**

> {the conversational prompt used}

**Generated:** {file path(s)}
**Spec criteria satisfied:** {list of criteria IDs}
**Steering files active:** {list}
**Outcome:** {what it produced, any notable Kiro behavior}

```

## Correctness Properties

- The presubmit script is idempotent: running it twice produces the same exit code.
- The presubmit script fails fast: it stops at the first failing check and reports it.
- The DEMO_SCRIPT.md timestamps must sum to ≤ 180 seconds.

## Test Strategy

- `scripts/presubmit.mjs` has a unit test that runs against a fixture directory
  with known missing files and verifies each failure mode exits with code 1.
- The video script is a Markdown file reviewed by the human; no automated test.
```
