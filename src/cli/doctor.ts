/**
 * src/cli/doctor.ts
 *
 * Implements `haunt doctor` diagnostic report with comprehensive cross-platform
 * environment, shell, and hardware assessment for Windows and Unix.
 */

import * as fs from 'fs';
import { VERSION } from '../version';
import { getCliConfigDir, getCliConfigFile } from './config';
import { getAllBrowsersStatus } from './browsers';
import { evaluateSystemCapability } from '../core/system-capability';
import {
  getPlatformInfo,
  getTerminalCapabilities,
  getAdaptiveGlyphs,
  getPlatformTroubleshootingAdvice,
} from '../core/platform';

export function runDoctor(): void {
  const glyphs = getAdaptiveGlyphs();
  const platform = getPlatformInfo();
  const term = getTerminalCapabilities();

  console.log(`\nHauntView Diagnostics — v${VERSION}\n`);

  // 1. Operating System & Shell Environment
  console.log('Environment:');
  console.log(
    `  OS:           ${platform.osName} (${platform.platform} ${platform.arch}) release ${platform.release}`
  );
  console.log(`  Shell:        ${term.shellName}`);
  console.log(
    `  Unicode:      ${term.supportsUnicode ? 'Enabled (full glyphs)' : 'ASCII fallback'}`
  );
  console.log(`  Node.js:      ${process.version} (>=22.12.0 LTS recommended)`);
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
  const browsers = getAllBrowsersStatus();
  for (const b of browsers) {
    const symbol = b.installed ? glyphs.tick : glyphs.cross;
    let detail = '';
    if (b.name === 'msedge') {
      if (b.installed) {
        detail = `${b.executablePath || 'installed'} (${b.isNative ? 'native Windows Edge' : 'installed'})`;
      } else {
        detail = b.isNative
          ? 'not detected in standard Windows paths (Chromium fallback will be used)'
          : 'not installed (Chromium fallback will be used on Unix)';
      }
    } else {
      detail = b.installed
        ? b.executablePath || 'installed'
        : 'missing (run `haunt <url>` or `npx playwright install`)';
    }
    console.log(`  ${symbol} ${b.name.padEnd(10)}: ${detail}`);
  }

  const coreInstalled = browsers.slice(0, 3).every((b) => b.installed);
  if (coreInstalled) {
    console.log(`\n${glyphs.tick} System is fully sensitised for haunting websites.\n`);
  } else {
    console.log(
      `\n${glyphs.warn} Some browsers are missing. Run \`haunt <url>\` to trigger first-run installation.\n`
    );
  }

  // 4. Platform guidance
  const advice = getPlatformTroubleshootingAdvice();
  for (const line of advice) {
    console.log(line);
  }
  console.log();
}
