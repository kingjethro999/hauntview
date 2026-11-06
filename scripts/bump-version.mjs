#!/usr/bin/env node
/**
 * scripts/bump-version.mjs
 *
 * Single source of truth workspace-wide auto-versioning for HauntView.
 * Rule: MAJOR.MINOR.PATCH
 * - PATCH rolls over at 9  (0.0.9 -> 0.1.0)
 * - MINOR rolls over at 99 (0.99.9 -> 1.0.0)
 * - Continues past 1.0.0  (1.0.9 -> 1.1.0, 1.99.9 -> 2.0.0)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PATCH_ROLLOVER = 9;
export const MINOR_ROLLOVER = 99;

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = path.resolve(SCRIPT_DIR, '..');

/**
 * Calculates the next version string based on HauntView rollover rules.
 * @param {string} currentVersion - e.g. "0.1.0" or "v0.1.0"
 * @returns {string} - next numeric SemVer e.g. "0.1.1"
 */
export function nextVersion(currentVersion) {
  if (!currentVersion || typeof currentVersion !== 'string') {
    throw new Error(`Invalid version input: ${currentVersion}`);
  }

  const clean = currentVersion.trim().replace(/^v/, '');
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(clean);
  if (!match) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  let [major, minor, patch] = match.slice(1).map(Number);

  patch += 1;
  if (patch > PATCH_ROLLOVER) {
    patch = 0;
    minor += 1;
  }
  if (minor > MINOR_ROLLOVER) {
    minor = 0;
    major += 1;
  }

  return `${major}.${minor}.${patch}`;
}

/**
 * Discovers all workspace package directories from pnpm-workspace.yaml.
 * @param {string} root - Repository root path
 * @returns {string[]} - Array of directory paths containing package.json
 */
export function getWorkspacePackageDirs(root) {
  const dirs = [root];
  const workspaceYamlPath = path.join(root, 'pnpm-workspace.yaml');
  if (!fs.existsSync(workspaceYamlPath)) {
    return dirs;
  }

  try {
    const content = fs.readFileSync(workspaceYamlPath, 'utf8');
    // Extract packages: items
    const packagesMatch = content.match(/packages:\s*([\s\S]*?)(?=\n\S|$)/);
    if (packagesMatch) {
      const lines = packagesMatch[1].split('\n');
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.startsWith('-')) {
          const pattern = line.replace(/^-\s*['"]?|['"]?$/g, '').trim();
          if (pattern === '.' || pattern === './') {
            continue;
          }
          if (pattern.endsWith('/*')) {
            const parentDir = path.join(root, pattern.slice(0, -2));
            if (fs.existsSync(parentDir)) {
              const entries = fs.readdirSync(parentDir, { withFileTypes: true });
              for (const entry of entries) {
                if (entry.isDirectory()) {
                  const pkgDir = path.join(parentDir, entry.name);
                  if (fs.existsSync(path.join(pkgDir, 'package.json'))) {
                    dirs.push(pkgDir);
                  }
                }
              }
            }
          } else {
            const singleDir = path.join(root, pattern);
            if (fs.existsSync(path.join(singleDir, 'package.json'))) {
              dirs.push(singleDir);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn(`[bump-version] Warning reading pnpm-workspace.yaml: ${err.message}`);
  }

  return dirs;
}

/**
 * Synchronizes the given version to all version carriers across the workspace.
 * @param {string} newVersion - Numeric SemVer without 'v', e.g. "0.1.1"
 * @param {string} [root] - Repository root
 * @returns {string[]} - List of modified relative file paths
 */
export function syncVersionToCarriers(newVersion, root = ROOT_DIR) {
  const updatedFiles = [];

  // 1. Root VERSION file (with 'v' prefix)
  const versionFile = path.join(root, 'VERSION');
  fs.writeFileSync(versionFile, `v${newVersion}\n`, 'utf8');
  updatedFiles.push('VERSION');

  // 2. All workspace package.json files
  const packageDirs = getWorkspacePackageDirs(root);
  for (const dir of packageDirs) {
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.version = newVersion;
      fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8');
      updatedFiles.push(path.relative(root, pkgPath));
    }
  }

  // 3. power/plugin.json
  const pluginJsonPath = path.join(root, 'power', 'plugin.json');
  if (fs.existsSync(pluginJsonPath)) {
    const plugin = JSON.parse(fs.readFileSync(pluginJsonPath, 'utf8'));
    plugin.version = newVersion;
    fs.writeFileSync(pluginJsonPath, `${JSON.stringify(plugin, null, 2)}\n`, 'utf8');
    updatedFiles.push(path.relative(root, pluginJsonPath));
  }

  // 4. src/version.ts
  const srcVersionPath = path.join(root, 'src', 'version.ts');
  const srcVersionContent = `/**\n * HauntView version constant\n * Automatically synchronized from root VERSION file by scripts/bump-version.mjs\n */\nexport const VERSION = '${newVersion}';\n`;
  fs.writeFileSync(srcVersionPath, srcVersionContent, 'utf8');
  updatedFiles.push(path.relative(root, srcVersionPath));

  return [...new Set(updatedFiles)];
}

/**
 * Main execution when invoked directly.
 */
export function runBump(root = ROOT_DIR) {
  const versionFile = path.join(root, 'VERSION');
  let currentRaw = '0.1.0';
  if (fs.existsSync(versionFile)) {
    currentRaw = fs.readFileSync(versionFile, 'utf8').trim();
  } else {
    const rootPkg = path.join(root, 'package.json');
    if (fs.existsSync(rootPkg)) {
      currentRaw = JSON.parse(fs.readFileSync(rootPkg, 'utf8')).version || '0.1.0';
    }
  }

  const next = nextVersion(currentRaw);
  const updated = syncVersionToCarriers(next, root);
  console.log(
    `[bump-version] Version bumped from ${currentRaw} to v${next} across ${updated.length} carriers`
  );
  return { previousVersion: currentRaw, nextVersion: next, updatedFiles: updated };
}

// Direct execution
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    runBump();
  } catch (err) {
    console.error(`[bump-version] Error: ${err.message}`);
    process.exit(1);
  }
}
