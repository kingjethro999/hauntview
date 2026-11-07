/**
 * src/cli/setup.ts
 *
 * Interactive configuration wizard for HauntView CLI.
 * Full cross-platform support for Windows and Unix paths, environment variables,
 * hardware capability analysis, and adaptive terminal symbols.
 */

import { checkbox, input, confirm } from '@inquirer/prompts';
import {
  loadCliConfig,
  saveCliConfig,
  resetCliConfig,
  expandAndValidatePath,
  ReportFormat,
  CliConfig,
} from './config';
import { evaluateSystemCapability, validateConcurrencyAmount } from '../core/system-capability';
import { getAdaptiveGlyphs, getPlatformInfo } from '../core/platform';

export async function runSetup(options?: { show?: boolean; reset?: boolean }): Promise<void> {
  const glyphs = getAdaptiveGlyphs();
  const platform = getPlatformInfo();

  if (options?.show) {
    const config = loadCliConfig();
    console.log('\nCurrent HauntView CLI Configuration:');
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (options?.reset) {
    resetCliConfig();
    console.log(`\n${glyphs.tick} HauntView configuration has been reset to factory defaults.`);
    console.log(JSON.stringify(loadCliConfig(), null, 2));
    return;
  }

  console.log(`\n${glyphs.ghost} HauntView Configuration Wizard (${platform.osName})\n`);
  const existing = loadCliConfig();

  // 1. Export types
  const defaultFormats = (await checkbox({
    message: 'Select default export types to produce on every run:',
    choices: [
      {
        name: 'Zip (Complete bundle: HTML, MD, screenshots, and plates)',
        value: 'zip',
        checked: existing.defaultFormats.includes('zip'),
      },
      {
        name: 'HTML (Standalone spectral executive report plate)',
        value: 'html',
        checked: existing.defaultFormats.includes('html'),
      },
      {
        name: 'Markdown (Dev-ready GitHub Flavored markdown summary)',
        value: 'markdown',
        checked: existing.defaultFormats.includes('markdown'),
      },
    ],
    validate: (choices) =>
      choices.length > 0 ? true : 'Please select at least one default format.',
  })) as ReportFormat[];

  // 2. Export destination (mention %USERPROFILE% on Windows)
  const pathHint = platform.isWindows
    ? 'Enter default export folder (. for current dir, ~/Downloads, %USERPROFILE%\\Downloads, or full path):'
    : 'Enter default export folder (. for current dir, ~/Downloads, $HOME/Downloads, or full path):';

  const exportDir = await input({
    message: pathHint,
    default: existing.exportDir,
    validate: (val) => {
      const check = expandAndValidatePath(val, { createIfMissing: true });
      return check.valid ? true : check.error || 'Invalid directory.';
    },
  });

  // 3. Concurrency
  const enableConcurrency = await confirm({
    message: 'Enable concurrent rite execution for faster local runs?',
    default: existing.concurrency,
  });

  let concurrencyAmount = 2;

  if (enableConcurrency) {
    const cap = evaluateSystemCapability();
    if (cap.isConstrained) {
      console.log(`\n${glyphs.warn} ${cap.constraintReason}`);
      concurrencyAmount = 1;
    } else {
      console.log(
        `\nHardware analysis: ${cap.specs.cpuModel} (${cap.specs.logicalCores} threads, ${(cap.specs.totalMemoryBytes / (1024 * 1024 * 1024)).toFixed(1)} GB RAM)`
      );
      console.log(
        `Recommended maximum for safe execution: ${cap.recommendedMax} concurrent profile(s).\n`
      );

      const chosenAmountStr = await input({
        message: `How many profiles should run at once? (1 - ${cap.recommendedMax}):`,
        default: String(
          Math.min(existing.concurrencyAmount, cap.recommendedMax) || cap.defaultSuggested
        ),
        validate: (val) => {
          const num = parseInt(val, 10);
          if (isNaN(num)) return 'Please enter a valid number.';
          const res = validateConcurrencyAmount(num, cap);
          return res.valid ? true : res.errorMessage || 'Invalid amount.';
        },
      });
      concurrencyAmount = parseInt(chosenAmountStr, 10);
    }
  }

  const newConfig: CliConfig = {
    defaultFormats,
    exportDir,
    concurrency: enableConcurrency,
    concurrencyAmount,
  };

  saveCliConfig(newConfig);

  console.log(`\n${glyphs.tick} Settings saved successfully to configuration store:\n`);
  console.log(JSON.stringify(newConfig, null, 2));
  console.log();
}
