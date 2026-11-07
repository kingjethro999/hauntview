/**
 * src/cli/config.ts
 *
 * User configuration management and cross-platform path utilities for HauntView CLI.
 * Supports Windows (win32) and Unix systems (Linux, macOS, BSD) with environment
 * variable expansion (%VAR% and $VAR) and probe-based writability verification.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  getPlatformConfigDir,
  expandEnvironmentPath,
  probeDirectoryWritability,
} from '../core/platform';

export type ReportFormat = 'zip' | 'html' | 'markdown' | 'json';

export interface CliConfig {
  defaultFormats: ReportFormat[];
  exportDir: string;
  concurrency: boolean;
  concurrencyAmount: number;
}

export const DEFAULT_CLI_CONFIG: CliConfig = {
  defaultFormats: ['zip', 'html'],
  exportDir: '.',
  concurrency: false,
  concurrencyAmount: 2,
};

/**
 * Returns the OS-appropriate config directory:
 * - Environment override: HAUNT_CONFIG_DIR
 * - Windows: %APPDATA%\hauntview
 * - macOS: ~/Library/Preferences/hauntview
 * - Linux / Unix: $XDG_CONFIG_HOME/hauntview or ~/.config/hauntview
 */
export function getCliConfigDir(): string {
  return getPlatformConfigDir();
}

/**
 * Returns path to config.json
 */
export function getCliConfigFile(): string {
  return path.join(getCliConfigDir(), 'config.json');
}

/**
 * Loads CLI config, falling back to defaults if missing or corrupted.
 */
export function loadCliConfig(): CliConfig {
  const configFile = getCliConfigFile();
  try {
    if (fs.existsSync(configFile)) {
      const data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
      return {
        defaultFormats: Array.isArray(data.defaultFormats)
          ? data.defaultFormats
          : DEFAULT_CLI_CONFIG.defaultFormats,
        exportDir:
          typeof data.exportDir === 'string' ? data.exportDir : DEFAULT_CLI_CONFIG.exportDir,
        concurrency:
          typeof data.concurrency === 'boolean' ? data.concurrency : DEFAULT_CLI_CONFIG.concurrency,
        concurrencyAmount:
          typeof data.concurrencyAmount === 'number' && data.concurrencyAmount >= 1
            ? data.concurrencyAmount
            : DEFAULT_CLI_CONFIG.concurrencyAmount,
      };
    }
  } catch {
    // If reading fails, fall back to default
  }

  return { ...DEFAULT_CLI_CONFIG };
}

/**
 * Saves CLI config to disk atomically.
 */
export function saveCliConfig(config: CliConfig): void {
  const dir = getCliConfigDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const configFile = getCliConfigFile();
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2), 'utf8');
}

/**
 * Resets CLI config to defaults.
 */
export function resetCliConfig(): void {
  saveCliConfig(DEFAULT_CLI_CONFIG);
}

/**
 * Expands ~, ., relative, absolute, Windows %VAR%, and Unix $VAR paths cross-platform
 * and validates directory writability via probe-write.
 */
export function expandAndValidatePath(
  rawPath: string,
  options?: { createIfMissing?: boolean }
): { valid: boolean; resolvedPath: string; error?: string } {
  if (!rawPath || !rawPath.trim()) {
    return {
      valid: false,
      resolvedPath: process.cwd(),
      error: 'Path cannot be empty.',
    };
  }

  const expanded = expandEnvironmentPath(rawPath, process.cwd());
  const createIfMissing = options?.createIfMissing ?? true;

  try {
    if (!fs.existsSync(expanded)) {
      if (createIfMissing) {
        fs.mkdirSync(expanded, { recursive: true });
      } else {
        return {
          valid: false,
          resolvedPath: expanded,
          error: `Directory does not exist: ${expanded}`,
        };
      }
    }

    // Verify it is a directory
    const stat = fs.statSync(expanded);
    if (!stat.isDirectory()) {
      return {
        valid: false,
        resolvedPath: expanded,
        error: `Path exists but is not a directory: ${expanded}`,
      };
    }

    // Probe-based writability check (guaranteed accurate on Windows & Unix)
    const probe = probeDirectoryWritability(expanded);
    if (!probe.writable) {
      return {
        valid: false,
        resolvedPath: expanded,
        error: `Directory is not accessible or writable: ${probe.error || 'Access denied'}`,
      };
    }

    return {
      valid: true,
      resolvedPath: expanded,
    };
  } catch (err) {
    return {
      valid: false,
      resolvedPath: expanded,
      error: `Directory is not accessible or writable: ${(err as Error).message}`,
    };
  }
}
