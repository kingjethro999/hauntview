/**
 * src/cli/runner.ts
 *
 * Implements the core `haunt <url>` execution pipeline.
 */

import * as fs from 'fs';
import * as path from 'path';
import { checkbox } from '@inquirer/prompts';
import { HauntViewEngine } from '../engine';
import { ReportFactory } from '../reports/factory';
import { validateTargetUrl } from '../lib/server/url-safety';
import { saveTestReportToDb } from '../lib/server/database';
import { resolveConcurrency } from '../core/concurrency-resolver';
import { evaluateSystemCapability, clampConcurrencyAmount } from '../core/system-capability';
import { loadCliConfig, expandAndValidatePath, ReportFormat } from './config';
import { ensureBrowsersInstalled } from './browsers';

export interface CliRunOptions {
  output?: string;
  outDir?: string;
  profiles?: string;
  concurrency?: boolean;
  concurrencyAmount?: string;
  yes?: boolean;
}

export async function runHaunt(targetUrl: string, options: CliRunOptions): Promise<void> {
  // 1. Validate target URL
  const urlValidation = validateTargetUrl(targetUrl, { allowLocal: true });
  if (!urlValidation.valid) {
    console.error(`\n✗ [haunt] Invalid URL: ${urlValidation.error}\n`);
    process.exit(1);
  }
  const cleanUrl = urlValidation.normalizedUrl || targetUrl;

  // 2. First-run browser verification
  ensureBrowsersInstalled();

  // 3. Load config and resolve output destination
  const config = loadCliConfig();
  const exportPathResult = expandAndValidatePath(options.outDir || config.exportDir, {
    createIfMissing: true,
  });

  if (!exportPathResult.valid) {
    console.error(`\n✗ [haunt] Export directory error: ${exportPathResult.error}\n`);
    process.exit(1);
  }
  const exportDir = exportPathResult.resolvedPath;

  // 4. Resolve Output Formats
  let chosenFormats: ReportFormat[] = [];

  if (options.output) {
    const rawTokens = options.output.split(',').map((t) => t.trim().toLowerCase());
    for (const t of rawTokens) {
      if (t === 'html') chosenFormats.push('html');
      else if (t === 'md' || t === 'markdown') chosenFormats.push('markdown');
      else if (t === 'zip' || t === 'bundle') chosenFormats.push('zip');
      else if (t === 'json') chosenFormats.push('json');
    }
  }

  // Interactive selection when TTY and no flag passed
  if (chosenFormats.length === 0) {
    const isInteractive = Boolean(process.stdin.isTTY && !options.yes);
    if (isInteractive) {
      try {
        chosenFormats = (await checkbox({
          message: 'What output would you like to generate?',
          choices: [
            {
              name: 'Zip (Complete archive: HTML, Markdown, screenshots, evidence plates)',
              value: 'zip',
              checked: config.defaultFormats.includes('zip'),
            },
            {
              name: 'HTML (Interactive standalone spectral executive report plate)',
              value: 'html',
              checked: config.defaultFormats.includes('html'),
            },
            {
              name: 'Markdown (Dev-ready GitHub Flavored markdown summary)',
              value: 'markdown',
              checked: config.defaultFormats.includes('markdown'),
            },
          ],
          validate: (choices) => (choices.length > 0 ? true : 'Please select at least one format.'),
        })) as ReportFormat[];
      } catch {
        // Fallback if prompt interrupted or unsupported
        chosenFormats = config.defaultFormats;
      }
    } else {
      chosenFormats = config.defaultFormats;
    }
  }

  // 5. Resolve Concurrency & Apply System Safety Clamp
  const rawConcurrencyAmount = options.concurrencyAmount
    ? parseInt(options.concurrencyAmount, 10)
    : undefined;
  const resolved = resolveConcurrency(
    {
      concurrency: options.concurrency,
      concurrencyAmount: rawConcurrencyAmount,
    },
    config
  );

  const cap = evaluateSystemCapability();
  const { effectiveAmount, wasClamped, warning } = clampConcurrencyAmount(
    resolved.concurrencyAmount,
    cap
  );

  if (wasClamped && warning && resolved.concurrency) {
    console.warn(`\n! ${warning}\n`);
  }

  const effectiveConcurrency = resolved.concurrency;
  const finalConcurrencyAmount = effectiveAmount;

  // 6. Execute Rites
  console.log(`\n👻 Haunting ${cleanUrl}...`);
  if (effectiveConcurrency) {
    console.log(
      `⚡ Concurrency active: running up to ${finalConcurrencyAmount} profiles simultaneously.`
    );
  } else {
    console.log('⏳ Running profiles sequentially (safe mode).');
  }

  const engine = new HauntViewEngine();
  await engine.initialize();

  const requestedProfiles = options.profiles
    ? options.profiles.split(',').map((p) => p.trim())
    : undefined;

  const report = await engine.executeTests({
    url: cleanUrl,
    profiles: requestedProfiles,
    concurrency: effectiveConcurrency,
    concurrencyAmount: finalConcurrencyAmount,
    includeScreenshots: true,
  });

  // 7. Persist to SQLite store for local history
  try {
    saveTestReportToDb(report);
  } catch {
    // Non-fatal if SQLite store write fails in CLI context
  }

  // 8. Generate chosen output files
  const writtenFiles: string[] = [];

  for (const fmt of chosenFormats) {
    try {
      const generator = ReportFactory.createGenerator(fmt);
      const generated = await generator.generate(report, {
        format: fmt,
        outputPath: '',
        includeScreenshots: true,
      });

      const ext = fmt === 'markdown' ? 'md' : fmt;
      const fileName = `${report.id}.${ext}`;
      const destPath = path.join(exportDir, fileName);

      fs.writeFileSync(destPath, generated.content);
      writtenFiles.push(path.resolve(destPath));
    } catch (err) {
      console.error(`✗ Failed to generate ${fmt} report: ${(err as Error).message}`);
    }
  }

  // 9. Display Findings Summary & Written Paths
  console.log('\n========================================');
  console.log(`  HauntView Séance Complete: ${report.id}`);
  console.log('========================================');
  console.log(`  Target URL:       ${report.url}`);
  console.log(`  Duration:         ${(report.duration / 1000).toFixed(1)}s`);
  console.log(`  Profiles Run:     ${report.profileResults.length}`);
  console.log(`  Total Findings:   ${report.summary.totalFindings}`);
  console.log(`    - Errors:       ${report.summary.findingsBySeverity.error}`);
  console.log(`    - Warnings:     ${report.summary.findingsBySeverity.warning}`);
  console.log(`    - Info:         ${report.summary.findingsBySeverity.info}`);
  console.log('----------------------------------------');
  console.log('  Exported Artifacts:');
  for (const f of writtenFiles) {
    console.log(`    ✓ ${f}`);
  }
  console.log('========================================\n');

  // Exit non-zero if error-severity findings exist
  if (report.summary.findingsBySeverity.error > 0) {
    process.exit(1);
  }
}
