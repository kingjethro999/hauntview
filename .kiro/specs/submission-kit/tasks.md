# Implementation Plan — S15: Submission Kit

## Tasks

- [ ] 1. Create `scripts/presubmit.mjs` compliance audit script
  - Check LICENSE for "MIT"
  - Check `.gitignore` does not exclude `.kiro`
  - Check `.kiro/specs/`, `.kiro/steering/`, `.kiro/hooks/`, `.kiro/settings/` non-empty
  - Check `README.md` contains `pnpm install` and `pnpm dev`
  - Check `docs/KIRO_USAGE.md` exists
  - Check `docs/DEMO_SCRIPT.md` exists
  - Check `VIBE_CODING_LOG.md` exists and has ≥ 3 entries
  - Exit 0 with "All checks passed." or exit 1 with the first failing check
  - Add `"presubmit": "node scripts/presubmit.mjs"` to `package.json` scripts
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [ ] 2. Create `VIBE_CODING_LOG.md` with initial entries
  - Document at least 3 vibe-coded modules with prompt + outcome format
  - Include spec criteria IDs and steering files active for each
  - _Requirements: (strategy doc Phase 3)_

- [ ] 3. Create `docs/DEMO_SCRIPT.md`
  - Shot-by-shot script with timestamps
  - Confirm total runtime ≤ 180 seconds
  - Identify the real target URL to scan (e.g. `promptdock-mini.vercel.app`)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 4. Create `docs/DEVPOST_STORY.md`
  - All five Kiro heading sections
  - Live URL and one-command install
  - Market thesis paragraph for Startup bonus opt-in
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 5. Update `docs/KIRO_USAGE.md` with closed specs and known unknowns
  - List all completed specs with task completion status
  - List any Kiro behaviors observed during the build under "Known unknowns"
  - _Requirements: (AGENTS.md §1.16)_

- [ ] 6. Final README audit
  - One-command install at the top: `pnpm install && pnpm dev`
  - Link to live demo URL
  - Link to Devpost submission
  - Architecture summary (one paragraph)
  - _Requirements: 3.5_

- [ ] 7. Run `pnpm presubmit` and fix all failures
  - Address every failing check before proceeding to submission
  - _Requirements: 3.6_

- [ ] 8. Record 180-second demo video per `docs/DEMO_SCRIPT.md`
  - Upload to YouTube (unlisted or public)
  - Verify playback before embedding in Devpost
  - _Requirements: 1.6_

- [ ] 9. Publish DEV.to or Medium build log
  - 4–6 minutes read time
  - Tag `#kiro` and `#kiroween`
  - Include at least one code snippet showing spec-driven workflow
  - _Requirements: 4.1_

- [ ] 10. Post social updates tagging `@kirodotdev` with `#codewithkiro`
  - At least 3 posts during the build window
  - _Requirements: 4.2_

- [ ] 11. Submit on Devpost before Dec 4, 2026, 2:00 PM PT
  - Paste `docs/DEVPOST_STORY.md` content into Devpost
  - Attach YouTube video link
  - Attach GitHub repo URL
  - Opt in to: Costume Contest (primary), Most Creative, Blog Post, Social Blitz
  - _Requirements: 4.3_
