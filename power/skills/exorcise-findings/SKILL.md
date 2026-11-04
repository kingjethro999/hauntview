---
name: exorcise-findings
description: Fix findings one by one using verified evidence, re-running the same rite to ensure issues are laid to rest.
---

# Exorcise findings

## Before you start

- Always inspect the raw evidence attached to the finding (DOM snippets, computed CSS, screenshot plate references).
- Never claim a defect is fixed without re-running the test rite.

## Steps

1. Read the specific finding with `get-run-findings` to identify the ruleId, selector, and evidence.
2. Locate the cause in the user's source code.
3. Make the minimal necessary change to address the root cause.
4. Re-run the same rite using `run-test-profile`.
5. Compare the before and after runs using `compare-runs` to confirm the defect is laid to rest.
6. Report the result with proof from the re-run.

## Rules

- Work on one finding at a time to prevent regressions.
- Verify using tests and typecheck after each code modification.
