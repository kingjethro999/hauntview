/**
 * src/cli/profile-flags.ts
 *
 * Direct CLI flag and tag-based profile selection support for HauntView.
 * Enables commands like:
 *   haunt http://localhost:3000 --mobile --desktop --offline --broken-links
 *   haunt http://localhost:3000 --a11y
 *   haunt http://localhost:3000 --tags mobile,resilience
 */

/**
 * Category tag groups that expand to multiple canonical profiles.
 */
export const TAG_GROUPS: Record<string, string[]> = {
  a11y: ['a11y-screenreader', 'a11y-keyboard', 'a11y-visual', 'a11y-cognitive'],
  accessibility: ['a11y-screenreader', 'a11y-keyboard', 'a11y-visual', 'a11y-cognitive'],
  i18n: ['i18n-rtl', 'i18n-cjk', 'i18n-mixed'],
  resilience: ['offline', 'broken-links', 'network-resilience', 'form-resilience'],
  devices: [
    'mobile',
    'tablet',
    'desktop',
    'mobile-iphone15',
    'mobile-android',
    'tablet-ipad',
    'desktop-1080p',
    'desktop-4k',
  ],
  browsers: ['browser-webkit', 'browser-firefox', 'browser-edge', 'browser-legacy'],
  faults: ['image-failure', 'font-failure', 'js-disabled', 'reduced-motion'],
  security: ['security-hygiene'],
};

/**
 * Map of Commander option names to canonical HauntView profile IDs.
 */
export const PROFILE_FLAGS: Record<string, string> = {
  mobile: 'mobile',
  desktop: 'desktop',
  tablet: 'tablet',
  offline: 'offline',
  brokenLinks: 'broken-links',
  networkResilience: 'network-resilience',
  formResilience: 'form-resilience',
  imageFailure: 'image-failure',
  fontFailure: 'font-failure',
  jsDisabled: 'js-disabled',
  reducedMotion: 'reduced-motion',
  performance: 'performance',
  securityHygiene: 'security-hygiene',
  security: 'security-hygiene',
  consoleErrors: 'console-errors',
  a11yVisual: 'a11y-visual',
  a11yKeyboard: 'a11y-keyboard',
  a11yScreenreader: 'a11y-screenreader',
  a11yCognitive: 'a11y-cognitive',
  i18nRtl: 'i18n-rtl',
  i18nCjk: 'i18n-cjk',
  i18nMixed: 'i18n-mixed',
  browserWebkit: 'browser-webkit',
  webkit: 'browser-webkit',
  browserFirefox: 'browser-firefox',
  firefox: 'browser-firefox',
  browserEdge: 'browser-edge',
  edge: 'browser-edge',
  browserLegacy: 'browser-legacy',
  mobileIphone15: 'mobile-iphone15',
  mobileAndroid: 'mobile-android',
  tabletIpad: 'tablet-ipad',
  desktop1080p: 'desktop-1080p',
  desktop4k: 'desktop-4k',
};

export interface OptionRegistrar {
  option(flags: string, description?: string): this;
}

/**
 * Register all profile and tag flags onto a Commander command.
 */
export function registerProfileOptions<T extends OptionRegistrar>(command: T): T {
  return (
    command
      .option(
        '--tag <tags>',
        'Run profiles matching specified tag or category (comma-separated: a11y, devices, resilience, browsers, i18n, faults)'
      )
      .option('--tags <tags>', 'Alias for --tag')
      // Category shortcuts
      .option(
        '--a11y, --accessibility',
        'Run all accessibility profiles (screenreader, keyboard, visual, cognitive)'
      )
      .option('--i18n', 'Run all internationalization profiles (RTL, CJK, Mixed)')
      .option('--devices', 'Run all responsive device viewport profiles (mobile, tablet, desktop)')
      .option(
        '--browsers',
        'Run all browser engine compatibility profiles (WebKit, Firefox, Edge, Legacy)'
      )
      .option(
        '--resilience',
        'Run all resilience profiles (offline, broken-links, network-resilience, form-resilience)'
      )
      .option(
        '--faults',
        'Run all environmental fault injection profiles (images, fonts, JS disabled, reduced motion)'
      )
      // Direct canonical profile flags
      .option('--mobile', 'Run canonical mobile viewport profile (390x844)')
      .option('--desktop', 'Run canonical desktop viewport profile (1280x800)')
      .option('--tablet', 'Run canonical tablet viewport profile (820x1180)')
      .option('--offline', 'Run offline service worker and cache resilience profile')
      .option('--broken-links', 'Run broken same-origin link crawl profile')
      .option('--network-resilience', 'Run network failure / fetch drop resilience profile')
      .option('--form-resilience', 'Run empty & invalid form submission resilience profile')
      .option('--performance', 'Run Core Web Vitals and performance budget profile')
      .option('--security-hygiene', 'Run HTTP security hygiene headers profile')
      .option('--security', 'Alias for --security-hygiene')
      .option('--image-failure', 'Run image blocking and missing alt/dimensions profile')
      .option('--font-failure', 'Run font blocking and layout shift profile')
      .option('--js-disabled', 'Run JavaScript disabled noscript profile')
      .option('--reduced-motion', 'Run prefers-reduced-motion animation compliance profile')
      .option('--console-errors', 'Run console error and uncaught exception capture profile')
      .option('--a11y-visual', 'Run visual contrast and color accessibility profile')
      .option('--a11y-keyboard', 'Run keyboard navigation and focus trapping profile')
      .option('--a11y-screenreader', 'Run screenreader and ARIA accessibility profile')
      .option('--a11y-cognitive', 'Run cognitive readability and motion profile')
      .option('--i18n-rtl', 'Run RTL language layout profile')
      .option('--i18n-cjk', 'Run CJK font and word-break profile')
      .option('--i18n-mixed', 'Run mixed script rendering profile')
      .option('--browser-webkit', 'Run WebKit rendering engine profile')
      .option('--webkit', 'Alias for --browser-webkit')
      .option('--browser-firefox', 'Run Firefox rendering engine profile')
      .option('--firefox', 'Alias for --browser-firefox')
      .option('--browser-edge', 'Run Microsoft Edge rendering engine profile')
      .option('--edge', 'Alias for --browser-edge')
      .option('--browser-legacy', 'Run legacy browser support profile')
      .option('--mobile-iphone15', 'Run iPhone 15 Pro viewport profile (390x844)')
      .option('--mobile-android', 'Run Galaxy S23 viewport profile (360x800)')
      .option('--tablet-ipad', 'Run iPad Pro viewport profile (1024x1366)')
      .option('--desktop-1080p', 'Run standard 1080p viewport profile (1920x1080)')
      .option('--desktop-4k', 'Run 4K UHD viewport profile (3840x2160)')
  );
}

/**
 * Resolves a unified list of profile IDs from CLI options, direct flags, and tags.
 * Returns `undefined` if no specific profiles or tags were requested (indicating all default profiles should run).
 */
export function resolveProfilesFromCliOptions(
  options: Record<string, unknown>
): string[] | undefined {
  const selected = new Set<string>();

  // 1. Explicit -p / --profiles
  if (options.profiles) {
    const rawList = Array.isArray(options.profiles)
      ? options.profiles
      : String(options.profiles).split(',');
    for (const item of rawList) {
      const trimmed = item.trim();
      if (trimmed) selected.add(trimmed);
    }
  }

  // 2. --tag and --tags option
  const rawTags = [options.tag, options.tags].filter(Boolean);
  for (const tagStr of rawTags) {
    const parts = String(tagStr).split(',');
    for (const part of parts) {
      const normalized = part.trim().toLowerCase();
      if (TAG_GROUPS[normalized]) {
        for (const pid of TAG_GROUPS[normalized]) {
          selected.add(pid);
        }
      } else if (PROFILE_FLAGS[normalized]) {
        selected.add(PROFILE_FLAGS[normalized]);
      } else if (normalized) {
        // Direct profile ID passed as tag
        selected.add(normalized);
      }
    }
  }

  // 3. Category flag shortcuts (e.g. --a11y, --accessibility, --i18n, --devices, etc.)
  for (const [tag, profiles] of Object.entries(TAG_GROUPS)) {
    if (options[tag] === true) {
      for (const pid of profiles) {
        selected.add(pid);
      }
    }
  }

  // 4. Direct profile flags (e.g. --mobile, --desktop, --offline, --broken-links)
  for (const [optKey, pid] of Object.entries(PROFILE_FLAGS)) {
    if (options[optKey] === true) {
      selected.add(pid);
    }
  }

  if (selected.size === 0) {
    return undefined;
  }

  return Array.from(selected);
}
