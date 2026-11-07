#!/usr/bin/env node
/**
 * src/cli/index.ts
 *
 * HauntView Command Line Interface entry point.
 */

import { Command } from 'commander';
import { VERSION } from '../version';
import { runHaunt } from './runner';
import { runSetup } from './setup';
import { runDoctor } from './doctor';

const program = new Command();

program
  .name('haunt')
  .description(
    'HauntView — Local-first website resilience, accessibility, and failure-mode testing engine'
  )
  .version(VERSION, '-v, --version', 'Output current HauntView version');

// Default run command: haunt <url>
program
  .argument('[url]', 'Target website URL to test (e.g. http://localhost:3000, https://example.com)')
  .option('-o, --output <formats>', 'Output formats (comma-separated: zip, html, md, json)')
  .option(
    '-d, --out-dir <path>',
    'Export destination directory (defaults to current directory or saved setting)'
  )
  .option(
    '-p, --profiles <ids>',
    'Comma-separated profile IDs to execute (default: all optimal profiles)'
  )
  .option('-c, --concurrency', 'Enable concurrent profile execution')
  .option('--no-concurrency', 'Force sequential profile execution')
  .option('-a, --concurrency-amount <n>', 'Maximum profiles running simultaneously (default: 2)')
  .option('-y, --yes', 'Non-interactive mode, skip prompts and use saved defaults')
  .action(async (url, options) => {
    if (!url) {
      program.help();
      return;
    }
    await runHaunt(url, options);
  });

// Setup command: haunt setup
program
  .command('setup')
  .description(
    'Interactive setup wizard to configure global defaults (export formats, destination, concurrency)'
  )
  .option('--show', 'Display current saved configuration without prompting')
  .option('--reset', 'Reset configuration to factory defaults')
  .action(async (options) => {
    await runSetup(options);
  });

// Doctor command: haunt doctor
program
  .command('doctor')
  .description(
    'Verify system environment, hardware capability heuristics, and Playwright browser installations'
  )
  .action(() => {
    runDoctor();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(`\n✗ [haunt] Fatal error: ${(err as Error).message}\n`);
  process.exit(1);
});
