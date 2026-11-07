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
import { getAdaptiveGlyphs, getTerminalCapabilities } from '../core/platform';
import { TestProgressUpdate } from '../types';
import { loadCliConfig, expandAndValidatePath, ReportFormat, DEFAULT_CLI_CONFIG } from './config';
import { ensureBrowsersInstalled } from './browsers';

export interface CliRunOptions {
  output?: string;
  outDir?: string;
  profiles?: string | string[];
  concurrency?: boolean;
  concurrencyAmount?: string;
  yes?: boolean;
  interactive?: boolean;
  [key: string]: unknown;
}

/**
 * Terminal loader and progress bar for HauntView rites.
 * Adapts automatically to Unicode/modern terminals (Windows Terminal, VS Code, Linux/macOS)
 * and legacy terminals (Windows cmd.exe) with clean ASCII glyphs and zero flickering.
 */
class TerminalProgressTracker {
  private isTTY: boolean;
  private supportsUnicode: boolean;
  private glyphs: ReturnType<typeof getAdaptiveGlyphs>;
  private spinnerFrames: string[];
  private spinnerIdx = 0;
  private timer: NodeJS.Timeout | null = null;
  private activeProfiles = new Map<string, number>();
  private completed = 0;
  private total = 0;

  constructor() {
    this.isTTY = Boolean(process.stdout.isTTY);
    const caps = getTerminalCapabilities();
    this.supportsUnicode = caps.supportsUnicode;
    this.glyphs = getAdaptiveGlyphs();
    this.spinnerFrames = this.supportsUnicode
      ? ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
      : ['-', '\\', '|', '/'];
  }

  start(total: number): void {
    this.total = total;
    this.completed = 0;
    if (this.isTTY) {
      this.timer = setInterval(() => this.render(), 100);
      this.timer.unref();
    }
  }

  update(event: TestProgressUpdate): void {
    if (event.status === 'start') {
      this.activeProfiles.set(event.profileId, Date.now());
      if (this.isTTY) {
        this.render();
      }
    } else {
      this.activeProfiles.delete(event.profileId);
      this.completed = event.completed;
      this.clearLine();

      const glyph = event.status === 'done' ? this.glyphs.tick : this.glyphs.cross;
      const durSec =
        event.durationMs !== undefined ? `${(event.durationMs / 1000).toFixed(1)}s` : '';
      const findingsSummary =
        event.findingsCount !== undefined
          ? event.findingsCount === 1
            ? '1 finding'
            : `${event.findingsCount} findings`
          : '';
      const details = [durSec, findingsSummary].filter(Boolean).join(', ');
      const padIndex = String(event.completed).padStart(2);
      const padTotal = String(event.total);

      console.log(
        `  ${glyph} [${padIndex}/${padTotal}] ${event.profileId}${details ? ` (${details})` : ''}`
      );

      if (this.isTTY && this.completed < this.total) {
        this.render();
      }
    }
  }

  finish(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.clearLine();
  }

  private clearLine(): void {
    if (this.isTTY) {
      process.stdout.write('\r\x1b[2K');
    }
  }

  private render(): void {
    if (!this.isTTY || this.total === 0) return;

    const pct = Math.floor((this.completed / this.total) * 100);
    const barWidth = 18;
    const filled = Math.min(barWidth, Math.round((barWidth * this.completed) / this.total));
    const fillChar = this.supportsUnicode ? '█' : '#';
    const emptyChar = this.supportsUnicode ? '░' : '-';
    const bar = fillChar.repeat(filled) + emptyChar.repeat(barWidth - filled);

    const spinner = this.spinnerFrames[this.spinnerIdx++ % this.spinnerFrames.length];
    const running = Array.from(this.activeProfiles.keys()).join(', ') || 'preparing rites...';

    const statusLine = `  [${bar}] ${this.completed}/${this.total} (${pct}%) ${spinner} Running: ${running}`;
    const cols = process.stdout.columns || 80;
    const truncated =
      statusLine.length > cols - 2
        ? statusLine.slice(0, Math.max(10, cols - 5)) + '...'
        : statusLine;

    process.stdout.write(`\r\x1b[2K${truncated}`);
  }
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

  // 4. Resolve Output Formats:
  // If user passed -o/--output, use specified formats.
  // If user passed -i/--interactive, show interactive prompt.
  // Otherwise, use saved config.defaultFormats directly without annoying prompts!
  let chosenFormats: ReportFormat[] = [];

  if (options.output) {
    const rawTokens = options.output.split(',').map((t) => t.trim().toLowerCase());
    for (const t of rawTokens) {
      if (t === 'html') chosenFormats.push('html');
      else if (t === 'md' || t === 'markdown') chosenFormats.push('markdown');
      else if (t === 'zip' || t === 'bundle') chosenFormats.push('zip');
      else if (t === 'json') chosenFormats.push('json');
    }
  } else if (options.interactive) {
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
      // Fallback if prompt interrupted
      chosenFormats = config.defaultFormats;
    }
  } else {
    // Respect user's configured defaults automatically
    chosenFormats =
      config.defaultFormats && config.defaultFormats.length > 0
        ? config.defaultFormats
        : DEFAULT_CLI_CONFIG.defaultFormats;
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
      `⚡ Concurrency active: running up to ${finalConcurrencyAmount} profiles simultaneously.\n`
    );
  } else {
    console.log('⏳ Running profiles sequentially (safe mode).\n');
  }

  const engine = new HauntViewEngine();
  await engine.initialize();

  const requestedProfiles = options.profiles
    ? Array.isArray(options.profiles)
      ? options.profiles
      : options.profiles.split(',').map((p) => p.trim())
    : undefined;

  const tracker = new TerminalProgressTracker();

  const report = await engine.executeTests({
    url: cleanUrl,
    profiles: requestedProfiles,
    concurrency: effectiveConcurrency,
    concurrencyAmount: finalConcurrencyAmount,
    includeScreenshots: true,
    onProgress: (update) => {
      tracker.update(update);
    },
  });

  tracker.finish();

  // Clean up browser processes to free memory immediately
  try {
    await engine.cleanup();
  } catch {
    // Non-fatal if cleanup encounters already-closed browsers
  }

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
