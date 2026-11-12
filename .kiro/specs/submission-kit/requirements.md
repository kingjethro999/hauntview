# Requirements Document — S15: Submission Kit

## Introduction

The submission kit is HauntView's final packaging step before the Kiroween 2026
Devpost deadline (December 4, 2026, 2:00 PM PT). It covers the demo video script,
the Devpost project story, compliance verification, bonus track capture, and the
pre-submission audit.

## Requirements

### Requirement 1: 180-Second Demo Video

**User Story:** As the submitter, I want a tight, judge-optimized 180-second video that
satisfies all three judging archetypes within their attention windows, so that HauntView
scores well on all three rubric pillars.

#### Acceptance Criteria

1. WHEN the demo video is recorded, THE Video SHALL open within the first 25 seconds
   with a live interactive demonstration of HauntView scanning a real target URL and
   returning findings (the visceral hook).
2. THE Video SHALL show both the haunted Parlour UI (Costume Contest — Quality &
   Design) and the MCP/Kiro IDE integration (Implementation) within the 180 seconds.
3. THE Video BETWEEN 1:00 and 2:10 SHALL screen-record the `.kiro` directory in
   action: specs defining structure, steering files locking architecture, and an Agent
   Hook firing live to auto-wire a module.
4. THE Video BETWEEN 2:10 and 2:40 SHALL display the system architecture diagram,
   property-based test results (100+ iterations), and the B2B/developer utility
   narrative.
5. THE Video's final 20 seconds SHALL show a judge testing the live hosted URL with
   zero login barrier and running `pnpm install && pnpm dev` to start in under 30
   seconds.
6. THE Video SHALL be no longer than 3 minutes and uploaded to YouTube (unlisted or
   public) before the Devpost deadline.

### Requirement 2: Devpost Project Story

**User Story:** As the submitter, I want the Devpost written story to map explicitly to
the four Kiro evaluation prompts, so that judges can find evidence of each feature
without hunting.

#### Acceptance Criteria

1. THE Devpost Story SHALL contain explicit headings: "Spec-Driven Development",
   "Steering Docs", "Agent Hooks", and "MCP Integration".
2. UNDER "Spec-Driven Development" THE Story SHALL describe how requirements →
   design → tasks drove implementation and prevented scope creep.
3. UNDER "Steering Docs" THE Story SHALL describe how `architecture_boundaries.md`,
   `type_and_schema_guardrails.md`, and `kiroween_design_system.md` enforced
   invariants across the build.
4. UNDER "Agent Hooks" THE Story SHALL describe all five hooks, their triggers, and
   the automation they provide.
5. UNDER "MCP Integration" THE Story SHALL describe the Medium MCP server, its tools,
   and how Kiro can run rites and interpret evidence without leaving the IDE.
6. THE Story SHALL include the live hosted URL and one-command install instructions.

### Requirement 3: Pre-Submission Compliance Audit

**User Story:** As the submitter, I want to run a forensic compliance checklist before
submitting, so that no disqualifying condition is present.

#### Acceptance Criteria

1. THE Audit SHALL verify the GitHub repository is public and carries an OSI-approved
   license (MIT — confirmed in `LICENSE`).
2. THE Audit SHALL verify `.gitignore` does NOT exclude `.kiro` or any of its
   subdirectories.
3. THE Audit SHALL verify `.kiro/specs/`, `.kiro/steering/`, `.kiro/hooks/`, and
   `.kiro/settings/` all contain files (non-empty).
4. THE Audit SHALL verify the live application URL loads without a mandatory login wall.
5. THE Audit SHALL verify `README.md` contains one-command install and run
   instructions at the top.
6. IF any audit item fails, THE Audit SHALL output the failing item and a remediation
   step. The submission SHALL NOT proceed until all items pass.

### Requirement 4: Bonus Track Capture

**User Story:** As the submitter, I want to capture as many bonus prizes as possible
alongside the primary category, so that the expected prize value is maximized.

#### Acceptance Criteria

1. THE Submitter SHALL publish a 4-to-6-minute technical build log on Medium or
   DEV.to detailing the spec-driven workflow, tagging `#kiro` and `#kiroween`, before
   the deadline.
2. THE Submitter SHALL post at least three build-in-public updates on X, LinkedIn, or
   Instagram tagging `@kirodotdev` with `#codewithkiro` during the build window.
3. THE Devpost Submission SHALL opt in to all applicable bonus tracks: Most Creative,
   Blog Post Prize, and Social Blitz Prize.
4. WHERE the Startup bonus is targeted, THE Submission SHALL include a market thesis
   section in the Devpost story describing the commercial addressable market.
