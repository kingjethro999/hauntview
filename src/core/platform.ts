/**
 * src/core/platform.ts
 *
 * Comprehensive cross-platform support module for Windows (win32) and Unix (Linux, macOS, BSD).
 * Provides robust path expansion (including Windows %VAR% and Unix $VAR), directory resolution,
 * probe-based writability verification, terminal glyph adaptation, Edge browser discovery,
 * and OS-specific diagnostics.
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

export interface PlatformInfo {
  platform: NodeJS.Platform;
  arch: string;
  isWindows: boolean;
  isMacOS: boolean;
  isLinux: boolean;
  isUnix: boolean;
  isWSL: boolean;
  release: string;
  osName: string;
}

export interface TerminalCapabilities {
  supportsUnicode: boolean;
  supportsColor: boolean;
  shellName: string;
  isWindowsTerminal: boolean;
}

export interface EdgeBrowserDetection {
  installed: boolean;
  executablePath?: string;
  isNativeToPlatform: boolean;
}

/**
 * Returns detailed operating system classification.
 */
export function getPlatformInfo(): PlatformInfo {
  const p = process.platform;
  const isWindows = p === 'win32';
  const isMacOS = p === 'darwin';
  const isLinux = p === 'linux';
  const isUnix = !isWindows;

  let isWSL = false;
  if (isLinux) {
    if (process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP) {
      isWSL = true;
    } else {
      try {
        const procVersion = fs.readFileSync('/proc/version', 'utf8');
        if (/microsoft|wsl/i.test(procVersion)) {
          isWSL = true;
        }
      } catch {
        // Not readable or not WSL
      }
    }
  }

  let osName = os.type();
  if (isWindows) {
    const rel = os.release();
    // Windows 11 kernel is 10.0.22000+
    const build = parseInt(rel.split('.')[2] || '0', 10);
    osName = build >= 22000 ? 'Windows 11' : 'Windows 10 / Server';
  } else if (isMacOS) {
    osName = 'macOS';
  } else if (isLinux) {
    osName = isWSL ? 'Linux (WSL)' : 'Linux';
  }

  return {
    platform: p,
    arch: os.arch(),
    isWindows,
    isMacOS,
    isLinux,
    isUnix,
    isWSL,
    release: os.release(),
    osName,
  };
}

/**
 * Resolves standard OS config directory:
 * - Environment override: HAUNT_CONFIG_DIR
 * - Windows: %APPDATA%\hauntview
 * - macOS: ~/Library/Preferences/hauntview
 * - Linux / Unix: $XDG_CONFIG_HOME/hauntview or ~/.config/hauntview
 */
export function getPlatformConfigDir(): string {
  if (process.env.HAUNT_CONFIG_DIR) {
    return path.resolve(process.env.HAUNT_CONFIG_DIR);
  }

  const { isWindows, isMacOS } = getPlatformInfo();
  const home = os.homedir();

  if (isWindows) {
    const appData =
      process.env.APPDATA ||
      (process.env.USERPROFILE
        ? path.join(process.env.USERPROFILE, 'AppData', 'Roaming')
        : path.join(home, 'AppData', 'Roaming'));
    return path.join(appData, 'hauntview');
  }

  if (isMacOS) {
    return path.join(home, 'Library', 'Preferences', 'hauntview');
  }

  const xdgConfig = process.env.XDG_CONFIG_HOME || path.join(home, '.config');
  return path.join(xdgConfig, 'hauntview');
}

/**
 * Resolves standard OS cache directory:
 * - Windows: %LOCALAPPDATA%\hauntview\cache
 * - macOS: ~/Library/Caches/hauntview
 * - Linux / Unix: $XDG_CACHE_HOME/hauntview or ~/.cache/hauntview
 */
export function getPlatformCacheDir(): string {
  if (process.env.HAUNT_CACHE_DIR) {
    return path.resolve(process.env.HAUNT_CACHE_DIR);
  }

  const { isWindows, isMacOS } = getPlatformInfo();
  const home = os.homedir();

  if (isWindows) {
    const localAppData =
      process.env.LOCALAPPDATA ||
      (process.env.USERPROFILE
        ? path.join(process.env.USERPROFILE, 'AppData', 'Local')
        : path.join(home, 'AppData', 'Local'));
    return path.join(localAppData, 'hauntview', 'cache');
  }

  if (isMacOS) {
    return path.join(home, 'Library', 'Caches', 'hauntview');
  }

  const xdgCache = process.env.XDG_CACHE_HOME || path.join(home, '.cache');
  return path.join(xdgCache, 'hauntview');
}

/**
 * Resolves Playwright default browser cache directory for the current OS.
 */
export function getPlaywrightBrowsersDir(): string {
  if (process.env.PLAYWRIGHT_BROWSERS_PATH) {
    return path.resolve(process.env.PLAYWRIGHT_BROWSERS_PATH);
  }

  const { isWindows, isMacOS } = getPlatformInfo();
  const home = os.homedir();

  if (isWindows) {
    const localAppData =
      process.env.LOCALAPPDATA ||
      (process.env.USERPROFILE
        ? path.join(process.env.USERPROFILE, 'AppData', 'Local')
        : path.join(home, 'AppData', 'Local'));
    return path.join(localAppData, 'ms-playwright');
  }

  if (isMacOS) {
    return path.join(home, 'Library', 'Caches', 'ms-playwright');
  }

  return path.join(home, '.cache', 'ms-playwright');
}

/**
 * Expands Windows environment variables (%VAR%), Unix environment variables ($VAR),
 * and tilde (~) into full cross-platform resolved and normalized paths.
 */
export function expandEnvironmentPath(rawPath: string, baseDir: string = process.cwd()): string {
  if (!rawPath || !rawPath.trim()) {
    return path.normalize(baseDir);
  }

  let expanded = rawPath.trim();

  // 1. Expand Windows %VAR% style environment variables
  expanded = expanded.replace(/%([^%]+)%/g, (_, varName) => {
    return process.env[varName] !== undefined ? process.env[varName]! : `%${varName}%`;
  });

  // 2. Expand Unix $VAR style environment variables (when preceded by / or start of string)
  expanded = expanded.replace(/\$([A-Za-z0-9_]+)/g, (_, varName) => {
    return process.env[varName] !== undefined ? process.env[varName]! : `$${varName}`;
  });

  const home = os.homedir();

  // 3. Expand ~ and ~/... or ~\...
  if (expanded === '~' || expanded === '~/' || expanded === '~\\') {
    expanded = home;
  } else if (expanded.startsWith('~/') || expanded.startsWith('~\\')) {
    expanded = path.join(home, expanded.slice(2));
  } else if (expanded === '.') {
    expanded = baseDir;
  } else {
    // 4. Resolve relative paths
    expanded = path.resolve(baseDir, expanded);
  }

  return path.normalize(expanded);
}

/**
 * Performs a probe-write check to verify directory writability.
 * Creates and deletes a temporary file, which is 100% reliable across
 * Windows NTFS / network shares and Unix filesystems.
 */
export function probeDirectoryWritability(dirPath: string): {
  writable: boolean;
  error?: string;
} {
  const probeFile = path.join(
    dirPath,
    `.hauntview-probe-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.tmp`
  );

  try {
    fs.writeFileSync(probeFile, 'ok', 'utf8');
    fs.unlinkSync(probeFile);
    return { writable: true };
  } catch (err) {
    return {
      writable: false,
      error: (err as Error).message,
    };
  }
}

/**
 * Analyzes terminal capabilities and Unicode/color support for the current OS and shell.
 */
export function getTerminalCapabilities(): TerminalCapabilities {
  const { isWindows } = getPlatformInfo();
  const isWindowsTerminal = Boolean(process.env.WT_SESSION);

  let shellName = 'unknown';
  if (isWindows) {
    if (process.env.PSModulePath) {
      shellName = 'PowerShell';
    } else if (process.env.COMSPEC && /cmd\.exe/i.test(process.env.COMSPEC)) {
      shellName = 'Command Prompt (cmd.exe)';
    } else {
      shellName = 'Windows Console';
    }
  } else {
    shellName = process.env.SHELL ? path.basename(process.env.SHELL) : 'sh';
  }

  // Unicode support heuristic
  let supportsUnicode = false;
  if (isWindows) {
    supportsUnicode = Boolean(
      isWindowsTerminal ||
      process.env.TERMINAL_EMULATOR ||
      process.env.TERM_PROGRAM === 'vscode' ||
      process.env.TERM === 'xterm-256color' ||
      process.env.TERM === 'alacritty' ||
      process.env.ConEmuPID
    );
  } else {
    supportsUnicode = process.env.TERM !== 'linux';
  }

  // Color support
  const supportsColor = Boolean(
    process.stdout.isTTY &&
    (process.env.COLORTERM ||
      process.env.TERM ||
      isWindowsTerminal ||
      process.env.TERM_PROGRAM === 'vscode')
  );

  return {
    supportsUnicode,
    supportsColor,
    shellName,
    isWindowsTerminal,
  };
}

/**
 * Adaptive UI glyphs that render rich Unicode emojis when supported,
 * or clean ASCII fallbacks on legacy Windows cmd.exe consoles.
 */
export function getAdaptiveGlyphs(): {
  ghost: string;
  tick: string;
  cross: string;
  wait: string;
  bullet: string;
  arrow: string;
  warn: string;
} {
  const { supportsUnicode } = getTerminalCapabilities();

  if (supportsUnicode) {
    return {
      ghost: '👻',
      tick: '✓',
      cross: '✗',
      wait: '⏳',
      bullet: '•',
      arrow: '❯',
      warn: '⚠️',
    };
  }

  return {
    ghost: '[HauntView]',
    tick: '[OK]',
    cross: '[ERR]',
    wait: '[*]',
    bullet: '-',
    arrow: '>',
    warn: '[!]',
  };
}

/**
 * Discovers Microsoft Edge installation on Windows, macOS, and Linux.
 */
export function detectEdgeBrowser(): EdgeBrowserDetection {
  const { isWindows, isMacOS, isLinux } = getPlatformInfo();

  if (isWindows) {
    const candidates = [
      process.env['ProgramFiles(x86)']
        ? path.join(
            process.env['ProgramFiles(x86)'],
            'Microsoft',
            'Edge',
            'Application',
            'msedge.exe'
          )
        : null,
      process.env.ProgramFiles
        ? path.join(process.env.ProgramFiles, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
        : null,
      process.env.LOCALAPPDATA
        ? path.join(process.env.LOCALAPPDATA, 'Microsoft', 'Edge', 'Application', 'msedge.exe')
        : null,
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return {
          installed: true,
          executablePath: candidate,
          isNativeToPlatform: true,
        };
      }
    }

    return {
      installed: false,
      isNativeToPlatform: true,
    };
  }

  if (isMacOS) {
    const macPath = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge';
    if (fs.existsSync(macPath)) {
      return {
        installed: true,
        executablePath: macPath,
        isNativeToPlatform: false,
      };
    }
    return { installed: false, isNativeToPlatform: false };
  }

  if (isLinux) {
    const linuxCandidates = [
      '/opt/microsoft/msedge/msedge',
      '/usr/bin/microsoft-edge',
      '/usr/bin/microsoft-edge-stable',
    ];
    for (const p of linuxCandidates) {
      if (fs.existsSync(p)) {
        return {
          installed: true,
          executablePath: p,
          isNativeToPlatform: false,
        };
      }
    }
    return { installed: false, isNativeToPlatform: false };
  }

  return { installed: false, isNativeToPlatform: false };
}

/**
 * Returns the correct npx invocation command and options for child_process calls.
 */
export function getNpxCommand(args: string): { command: string; options: { shell?: string } } {
  const { isWindows } = getPlatformInfo();
  if (isWindows) {
    return {
      command: `npx.cmd ${args}`,
      options: { shell: process.env.ComSpec || 'cmd.exe' },
    };
  }
  return {
    command: `npx ${args}`,
    options: { shell: process.env.SHELL || '/bin/sh' },
  };
}

/**
 * Returns OS-specific installation advice and troubleshooting tips.
 */
export function getPlatformTroubleshootingAdvice(): string[] {
  const { isWindows, isMacOS, isLinux, isWSL } = getPlatformInfo();
  const tips: string[] = [];

  if (isWindows) {
    tips.push('Windows Setup & Troubleshooting:');
    tips.push(
      '  • Execution Policy: If PowerShell scripts are blocked, execute: Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned'
    );
    tips.push(
      '  • Terminal: Use Windows Terminal (msstore) for high-fidelity Unicode glyphs and colors.'
    );
    tips.push(
      '  • Native Edge: Microsoft Edge runs with native high-contrast and Windows integration.'
    );
    tips.push(
      '  • Manual Browser Installation: run `npx.cmd playwright install chromium firefox webkit`'
    );
  } else if (isWSL) {
    tips.push('Windows Subsystem for Linux (WSL) Notes:');
    tips.push('  • Install Linux browser dependencies: sudo npx playwright install-deps');
    tips.push(
      '  • If running headless inside WSL2 without X11/Wayland, standard headless mode is used.'
    );
  } else if (isMacOS) {
    tips.push('macOS Setup & Troubleshooting:');
    tips.push('  • If necessary, install Xcode command-line tools: xcode-select --install');
    tips.push('  • Manual Browser Installation: run `npx playwright install`');
  } else if (isLinux) {
    tips.push('Linux Setup & Troubleshooting:');
    tips.push(
      '  • Shared system libraries for Chromium and WebKit can be installed via: sudo npx playwright install-deps'
    );
  }

  return tips;
}
