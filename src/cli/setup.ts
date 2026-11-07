/**
 * src/cli/setup.ts
 *
 * Interactive configuration wizard for HauntView CLI.
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

export async function runSetup(options?: { show?: boolean; reset?: boolean }): Promise<void> {
  if (options?.show) {
    const config = loadCliConfig();
    console.log('\nCurrent HauntView CLI Configuration:');
    console.log(JSON.stringify(config, null, 2));
    return;
  }

  if (options?.reset) {
    resetCliConfig();
    console.log('\n✓ HauntView configuration has been reset to factory defaults.');
    console.log(JSON.stringify(loadCliConfig(), null, 2));
    return;
  }

  console.log('\n🔮 HauntView Configuration Wizard\n');
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

  // 2. Export destination
  const exportDir = await input({
    message: 'Enter default export folder (. for launch folder, ~/Downloads, or full path):',
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
      console.log(`\n! ${cap.constraintReason}`);
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

  const updatedConfig: CliConfig = {
    defaultFormats,
    exportDir,
    concurrency: enableConcurrency,
    concurrencyAmount,
  };

  saveCliConfig(updatedConfig);

  console.log('\n✓ HauntView CLI configuration saved successfully:');
  console.log(JSON.stringify(updatedConfig, null, 2));
  console.log('\nYou can re-run this wizard anytime with `haunt setup`.\n');
}
