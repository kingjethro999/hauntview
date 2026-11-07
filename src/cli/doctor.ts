/**
 * src/cli/doctor.ts
 *
 * Implements `haunt doctor` diagnostic report.
 */

import * as os from 'os';
import * as fs from 'fs';
import { VERSION } from '../version';
import { getCliConfigDir, getCliConfigFile } from './config';
import { getBrowsersStatus } from './browsers';
import { evaluateSystemCapability } from '../core/system-capability';

export function runDoctor(): void {
  console.log(`\nHauntView Diagnostics — v${VERSION}\n`);

  // 1. Environment
  console.log('Environment:');
  console.log(`  Node.js:      ${process.version} (>=22.12.0 LTS recommended)`);
  console.log(`  OS:           ${os.platform()} (${os.arch()}) ${os.release()}`);
  console.log(`  Config Dir:   ${getCliConfigDir()}`);
  const hasConfig = fs.existsSync(getCliConfigFile());
  console.log(`  Config File:  ${hasConfig ? 'present' : 'not initialized (run `haunt setup`)'}`);

  // 2. Hardware specs & Concurrency
  console.log('\nSystem Hardware & Concurrency:');
  const cap = evaluateSystemCapability();
  const totalGb = (cap.specs.totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(1);
  const freeGb = (cap.specs.freeMemoryBytes / (1024 * 1024 * 1024)).toFixed(1);

  console.log(`  CPU:          ${cap.specs.cpuModel}`);
  console.log(`  Cores:        ${cap.specs.logicalCores} logical threads`);
  console.log(`  RAM:          ${totalGb} GB total (${freeGb} GB free)`);
  console.log(`  Max Concurrency: ${cap.recommendedMax} concurrent profile(s)`);
  console.log(`  Suggested Default: ${cap.defaultSuggested}`);
  if (cap.isConstrained) {
    console.log(`  Warning:      ${cap.constraintReason}`);
  }

  // 3. Playwright browsers
  console.log('\nPlaywright Browsers:');
  const browsers = getBrowsersStatus();
  for (const b of browsers) {
    const symbol = b.installed ? '✓' : '✗';
    const detail = b.installed
      ? b.executablePath || 'installed'
      : 'missing (run `haunt <url>` or `npx playwright install`)';
    console.log(`  ${symbol} ${b.name.padEnd(10)}: ${detail}`);
  }

  const allGood = browsers.every((b) => b.installed);
  if (allGood) {
    console.log('\n✓ System is fully sensitised for haunting websites.\n');
  } else {
    console.log(
      '\n! Some browsers are missing. Run `haunt <url>` to trigger first-run installation.\n'
    );
  }
}
