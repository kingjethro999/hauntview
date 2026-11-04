#!/usr/bin/env node
/**
 * presubmit.mjs — HauntView pre-submission compliance audit
 *
 * Run: node scripts/presubmit.mjs  (or  pnpm presubmit)
 *
 * Exits 0 with "All checks passed." when every requirement is met.
 * Exits 1 and prints the first failing check + remediation when something is missing.
 *
 * Strategy doc reference:
 *   Phase 5 – Pre-Submission Verification Audit
 *   (Kiroween 2026 Winning Strategy, pp. 20)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── helpers ──────────────────────────────────────────────────────────────────

function pass(label) {
  console.log(`  ✓  ${label}`);
}

function fail(label, remediation) {
  console.error(`\n  ✗  FAILED: ${label}`);
  console.error(`     Remediation: ${remediation}`);
  process.exit(1);
}

function fileExists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function fileContains(rel, needle) {
  try {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    return content.includes(needle);
  } catch {
    return false;
  }
}

function dirNonEmpty(rel) {
  try {
    const entries = fs.readdirSync(path.join(ROOT, rel));
    return entries.length > 0;
  } catch {
    return false;
  }
}

function dirFileCount(rel, ext) {
  try {
    return fs.readdirSync(path.join(ROOT, rel)).filter((f) => (ext ? f.endsWith(ext) : true))
      .length;
  } catch {
    return 0;
  }
}

function countOccurrences(rel, needle) {
  try {
    const content = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    return (content.match(new RegExp(needle, 'gm')) ?? []).length;
  } catch {
    return 0;
  }
}

// ─── checks ───────────────────────────────────────────────────────────────────

console.log('\nHauntView — Pre-Submission Compliance Audit\n');

// 1. LICENSE exists and contains "MIT"
if (!fileExists('LICENSE')) {
  fail('LICENSE file exists', 'Create a LICENSE file with the MIT license text.');
}
if (!fileContains('LICENSE', 'MIT')) {
  fail(
    'LICENSE contains "MIT"',
    'The LICENSE file must use the MIT license. Update it to include "MIT".'
  );
}
pass('LICENSE exists and contains "MIT"');

// 2. .gitignore does NOT exclude .kiro
if (fileContains('.gitignore', '.kiro')) {
  fail(
    '.gitignore does not exclude .kiro',
    'Remove any ".kiro" lines from .gitignore. ' +
      'The .kiro directory must be committed and visible to judges.'
  );
}
pass('.gitignore does not exclude .kiro');

// 3. .kiro/specs/ has ≥ 3 spec directories
const specCount = dirFileCount('.kiro/specs');
if (specCount < 3) {
  fail(
    `.kiro/specs/ has ≥ 3 spec directories (found ${specCount})`,
    'Ensure at least 3 spec folders exist under .kiro/specs/ with requirements.md, ' +
      'design.md, and tasks.md each.'
  );
}
pass(`.kiro/specs/ has ${specCount} spec directories`);

// 4. .kiro/steering/ has ≥ 3 .md files
const steeringCount = dirFileCount('.kiro/steering', '.md');
if (steeringCount < 3) {
  fail(
    `.kiro/steering/ has ≥ 3 .md steering files (found ${steeringCount})`,
    'Create architecture_boundaries.md, type_and_schema_guardrails.md, and ' +
      'kiroween_design_system.md in .kiro/steering/.'
  );
}
pass(`.kiro/steering/ has ${steeringCount} steering files`);

// 5. .kiro/hooks/ has ≥ 3 .json hook files
const hookCount = dirFileCount('.kiro/hooks', '.json');
if (hookCount < 3) {
  fail(
    `.kiro/hooks/ has ≥ 3 .json hook files (found ${hookCount})`,
    'Ensure at least 3 hooks exist: module-auto-registration, ' +
      'spec-to-code-quality-gate, living-docs-sync.'
  );
}
pass(`.kiro/hooks/ has ${hookCount} hook files`);

// 6. .kiro/settings/ is non-empty (mcp.json present)
if (!dirNonEmpty('.kiro/settings')) {
  fail(
    '.kiro/settings/ is non-empty (mcp.json required)',
    'Create .kiro/settings/mcp.json with hauntview-medium and context7 MCP servers. ' +
      'See README.md for the required content.'
  );
}
pass('.kiro/settings/ is non-empty');

// 7. README.md exists and contains install + run commands
if (!fileExists('README.md')) {
  fail('README.md exists', 'Create a README.md at the project root.');
}
if (!fileContains('README.md', 'pnpm install')) {
  fail(
    'README.md contains install instructions ("pnpm install")',
    'Add one-command install instructions to the top of README.md: ' + '`pnpm install && pnpm dev`'
  );
}
if (!fileContains('README.md', 'pnpm dev')) {
  fail(
    'README.md contains run instructions ("pnpm dev")',
    'Add `pnpm dev` to the README.md quick-start section.'
  );
}
pass('README.md contains install and run instructions');

// 8. docs/KIRO_USAGE.md exists
if (!fileExists('docs/KIRO_USAGE.md')) {
  fail(
    'docs/KIRO_USAGE.md exists',
    'Create docs/KIRO_USAGE.md documenting all specs, hooks, steering files, ' +
      'and known unknowns about Kiro behavior.'
  );
}
pass('docs/KIRO_USAGE.md exists');

// 9. docs/DEMO_SCRIPT.md exists
if (!fileExists('docs/DEMO_SCRIPT.md')) {
  fail(
    'docs/DEMO_SCRIPT.md exists',
    'Create docs/DEMO_SCRIPT.md with the 180-second shot-by-shot video script.'
  );
}
pass('docs/DEMO_SCRIPT.md exists');

// 10. VIBE_CODING_LOG.md exists and has ≥ 3 entries
if (!fileExists('VIBE_CODING_LOG.md')) {
  fail(
    'VIBE_CODING_LOG.md exists',
    'Create VIBE_CODING_LOG.md documenting conversational prompts ' +
      'paired with the complex modules they generated.'
  );
}
const vibeEntries = countOccurrences('VIBE_CODING_LOG.md', '^## Entry');
if (vibeEntries < 3) {
  fail(
    `VIBE_CODING_LOG.md has ≥ 3 entries (found ${vibeEntries})`,
    'Add more "## Entry N" sections to VIBE_CODING_LOG.md — ' +
      'document at least 3 vibe-coded modules.'
  );
}
pass(`VIBE_CODING_LOG.md has ${vibeEntries} entries`);

// 11. docs/DEVPOST_STORY.md exists
if (!fileExists('docs/DEVPOST_STORY.md')) {
  fail(
    'docs/DEVPOST_STORY.md exists',
    'Create docs/DEVPOST_STORY.md with all five Kiro heading sections ' +
      '(Spec-Driven Development, Steering Docs, Agent Hooks, MCP Integration, Vibe Coding).'
  );
}
pass('docs/DEVPOST_STORY.md exists');

// ─── all passed ───────────────────────────────────────────────────────────────

console.log('\n  All checks passed. Ready for Devpost submission.\n');
console.log('  Reminder: verify the live demo URL loads without a login wall,');
console.log('  and that the YouTube video link is embedded in the Devpost form.\n');
