/**
 * browser-launch.ts
 *
 * Resolves the correct Chromium launch options for the current environment.
 *
 * - Production / Render: uses @sparticuz/chromium, which ships its own binary
 *   compatible with serverless/constrained Linux environments (0.5 CPU, 512MB RAM).
 * - Local development: returns undefined executablePath so Playwright uses its own bundled binary.
 */

export interface BrowserLaunchConfig {
  executablePath?: string;
  args: string[];
}

/**
 * Returns Chromium launch options (executablePath + required flags) for the current environment.
 */
export async function getChromiumLaunchOptions(): Promise<BrowserLaunchConfig> {
  const isRender = process.env.RENDER === 'true';
  const isCI = process.env.CI === 'true';

  if (isRender || isCI) {
    // Dynamically import to avoid loading the binary in dev where it's unneeded.
    const { default: sparticuzChromium } = await import('@sparticuz/chromium');

    sparticuzChromium.setGraphicsMode = false;

    const executablePath = await sparticuzChromium.executablePath();
    const args = [
      ...sparticuzChromium.args,
      '--headless=new',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
    ];

    return {
      executablePath,
      args,
    };
  }

  // Local development: standard Playwright flags
  return {
    executablePath: undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  };
}

/**
 * Backward-compatible helper returning just the executable path.
 */
export async function getChromiumExecutablePath(): Promise<string | undefined> {
  const config = await getChromiumLaunchOptions();
  return config.executablePath;
}
