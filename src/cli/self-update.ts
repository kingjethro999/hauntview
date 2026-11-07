/**
 * src/cli/self-update.ts
 *
 * Implements `haunt self-update` — reinstalls hauntview globally from npm,
 * effectively updating to the latest published version.
 */

import { execSync, spawnSync } from 'node:child_process';
import { VERSION } from '../version';

/**
 * Detects which package manager is available to run a global install.
 * Prefers npm, falls back to zyrk, pnpm, then yarn.
 */
function detectPackageManager(): 'npm' | 'zyrk' | 'pnpm' | 'yarn' {
  for (const pm of ['npm', 'pnpm', 'yarn'] as const) {
    const result = spawnSync(pm, ['--version'], { encoding: 'utf8' });
    if (result.status === 0) return pm;
  }
  // npm ships with every Node.js install so this is effectively unreachable,
  // but satisfies the return type.
  return 'npm';
}

/**
 * Fetches the latest published version of hauntview from the npm registry.
 * Returns null if the registry is unreachable.
 */
function fetchLatestVersion(): string | null {
  try {
    const raw = execSync('npm view hauntview version', {
      encoding: 'utf8',
      timeout: 10_000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return raw.trim();
  } catch {
    return null;
  }
}

export function runSelfUpdate(): void {
  console.log(`\n👻 HauntView self-update`);
  console.log(`   Current version: ${VERSION}`);

  // Check registry for latest version first so we can give a meaningful message.
  process.stdout.write('   Checking npm registry...');
  const latest = fetchLatestVersion();

  if (latest === null) {
    console.log(' (registry unreachable)\n');
    console.warn(
      '✗ Could not reach the npm registry. Check your internet connection and try again.'
    );
    process.exit(1);
  }

  console.log(` latest is ${latest}`);

  if (latest === VERSION) {
    console.log('\n✓ You are already on the latest version. Nothing to do.\n');
    return;
  }

  const pm = detectPackageManager();
  const installCmd =
    pm === 'yarn' ? 'yarn global add hauntview@latest' : `${pm} install -g hauntview@latest`;

  console.log(`\n   Updating ${VERSION} → ${latest} using ${pm}...`);
  console.log(`   Running: ${installCmd}\n`);

  try {
    execSync(installCmd, { stdio: 'inherit' });
    console.log(`\n✓ HauntView updated to ${latest}. Run 'haunt --version' to confirm.\n`);
  } catch {
    console.error('\n✗ Update failed. You may need to run with elevated privileges:');
    console.error(`     sudo ${installCmd}\n`);
    process.exit(1);
  }
}
