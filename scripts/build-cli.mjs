#!/usr/bin/env node
/**
 * scripts/build-cli.mjs
 *
 * Compiles and bundles HauntView CLI into a standalone executable at dist/cli.js.
 */

import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');

const outdir = path.join(ROOT, 'dist');
if (!fs.existsSync(outdir)) {
  fs.mkdirSync(outdir, { recursive: true });
}

await esbuild.build({
  entryPoints: [path.join(ROOT, 'src', 'cli', 'index.ts')],
  outfile: path.join(outdir, 'cli.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  sourcemap: false,
  logLevel: 'info',
});

// Ensure executable permission
fs.chmodSync(path.join(outdir, 'cli.js'), 0o755);
console.log('✓ HauntView CLI built successfully at dist/cli.js');
