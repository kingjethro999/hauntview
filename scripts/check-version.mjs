#!/usr/bin/env node
/**
 * scripts/check-version.mjs
 *
 * Verifies that the single-source-of-truth VERSION file matches all carriers:
 * - root package.json
 * - workspace packages package.json
 * - power/plugin.json
 * - src/version.ts
 *
 * Exits 0 if all carriers match, 1 otherwise.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getWorkspacePackageDirs, ROOT_DIR } from './bump-version.mjs';

export function checkVersion(root = ROOT_DIR) {
  const versionPath = path.join(root, 'VERSION');
  if (!fs.existsSync(versionPath)) {
    throw new Error(`Root VERSION file missing at: ${versionPath}`);
  }

  const rawVersion = fs.readFileSync(versionPath, 'utf8').trim();
  if (!/^v\d+\.\d+\.\d+$/.test(rawVersion)) {
    throw new Error(`VERSION file format must be vMAJOR.MINOR.PATCH, got: "${rawVersion}"`);
  }

  const expectedSemver = rawVersion.slice(1);
  const errors = [];

  // 1. Check workspace packages package.json
  const packageDirs = getWorkspacePackageDirs(root);
  for (const dir of packageDirs) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (pkg.version !== expectedSemver) {
          errors.push(
            `${path.relative(root, pkgPath)} has version "${pkg.version}", expected "${expectedSemver}"`
          );
        }
      } catch (err) {
        errors.push(`Could not parse JSON at ${path.relative(root, pkgPath)}: ${err.message}`);
      }
    }
  }

  // 2. Check power/plugin.json
  const pluginPath = path.join(root, 'power', 'plugin.json');
  if (fs.existsSync(pluginPath)) {
    try {
      const plugin = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
      if (plugin.version !== expectedSemver) {
        errors.push(
          `power/plugin.json has version "${plugin.version}", expected "${expectedSemver}"`
        );
      }
    } catch (err) {
      errors.push(`Could not parse JSON at power/plugin.json: ${err.message}`);
    }
  }

  // 3. Check src/version.ts
  const srcVersionPath = path.join(root, 'src', 'version.ts');
  if (fs.existsSync(srcVersionPath)) {
    const content = fs.readFileSync(srcVersionPath, 'utf8');
    const match = content.match(/VERSION\s*=\s*['"]([^'"]+)['"]/);
    if (!match || match[1] !== expectedSemver) {
      errors.push(
        `src/version.ts defines VERSION="${match ? match[1] : 'undefined'}", expected "${expectedSemver}"`
      );
    }
  } else {
    errors.push(`src/version.ts does not exist at ${srcVersionPath}`);
  }

  return {
    valid: errors.length === 0,
    expectedVersion: rawVersion,
    errors,
  };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    const result = checkVersion();
    if (!result.valid) {
      console.error('[version:check] FAILED: Version inconsistency detected:');
      for (const err of result.errors) {
        console.error(`  ✗ ${err}`);
      }
      process.exit(1);
    }
    console.log(`✓ Version consistency verified across all carriers: ${result.expectedVersion}`);
    process.exit(0);
  } catch (err) {
    console.error(`[version:check] FAILED: ${err.message}`);
    process.exit(1);
  }
}
