/**
 * ProfileManager - Orchestrates execution of all 16 testing profiles
 * Manages profile registration, configuration, and execution coordination
 */

import { ProfileConfig, ProfileContext } from '../types';

/**
 * The 16 HauntView testing profiles
 */
const PROFILES: ProfileConfig[] = [
  // Device profiles (5)
  {
    id: 'mobile-iphone15',
    name: 'Mobile - iPhone 15',
    description: 'Apple iPhone 15 Pro (390x844)',
    enabled: true,
    viewport: { width: 390, height: 844, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'mobile-android',
    name: 'Mobile - Android',
    description: 'Samsung Galaxy S23 (360x800)',
    enabled: true,
    viewport: { width: 360, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-S910B) AppleWebKit/537.36',
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'tablet-ipad',
    name: 'Tablet - iPad Pro',
    description: 'iPad Pro 12.9" (1024x1366)',
    enabled: true,
    viewport: { width: 1024, height: 1366, deviceScaleFactor: 2, isMobile: false, hasTouch: true },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'desktop-1080p',
    name: 'Desktop - 1080p',
    description: 'Standard desktop (1920x1080)',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'desktop-4k',
    name: 'Desktop - 4K',
    description: 'High-resolution desktop (3840x2160)',
    enabled: true,
    viewport: { width: 3840, height: 2160, isMobile: false, hasTouch: false },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
    timeout: 30000,
    retries: 1,
  },

  // Accessibility profiles (4)
  {
    id: 'a11y-screenreader',
    name: 'Accessibility - Screen Reader',
    description: 'Screen reader compatibility check',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: 'en-US',
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'a11y-keyboard',
    name: 'Accessibility - Keyboard Navigation',
    description: 'Keyboard-only navigation support',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'a11y-visual',
    name: 'Accessibility - Visual Impairment',
    description: 'Visual impairment simulation (high contrast)',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'a11y-cognitive',
    name: 'Accessibility - Cognitive Load',
    description: 'Cognitive accessibility check',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 2,
  },

  // Localization profiles (3)
  {
    id: 'i18n-rtl',
    name: 'Internationalization - RTL',
    description: 'Right-to-left language support (Arabic)',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: 'ar-SA',
    timezone: 'Asia/Riyadh',
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'i18n-cjk',
    name: 'Internationalization - CJK',
    description: 'CJK language support (Japanese)',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: 'ja-JP',
    timezone: 'Asia/Tokyo',
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'i18n-mixed',
    name: 'Internationalization - Mixed Scripts',
    description: 'Mixed script support (Devanagari)',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    locale: 'hi-IN',
    timezone: 'Asia/Kolkata',
    timeout: 30000,
    retries: 2,
  },

  // Browser/Engine profiles (4)
  {
    id: 'browser-webkit',
    name: 'Browser - WebKit',
    description: 'WebKit engine compatibility',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15',
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'browser-firefox',
    name: 'Browser - Firefox',
    description: 'Firefox engine compatibility',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:120.0) Gecko/20100101 Firefox/120.0',
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'browser-edge',
    name: 'Browser - Edge',
    description: 'Microsoft Edge (Chromium) compatibility',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'browser-legacy',
    name: 'Browser - Legacy',
    description: 'Legacy browser support detection',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    userAgent: 'Mozilla/5.0 (Windows NT 6.3; rv:11.0) like Gecko',
    timeout: 30000,
    retries: 1,
  },

  // Performance profile
  {
    id: 'performance',
    name: 'Performance',
    description: 'Core Web Vitals and performance metrics',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },

  // Canonical rite profiles — desktop viewport (1280×800 per AGENTS.md §4.5)
  {
    id: 'image-failure',
    name: 'Image Failure',
    description: 'Blocks all images; checks missing alt attributes and missing width/height',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'font-failure',
    name: 'Font Failure',
    description: 'Blocks web fonts; detects layout shift caused by fallback font substitution',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'js-disabled',
    name: 'JS Disabled',
    description: 'Disables JavaScript; checks for meaningful content and <noscript> fallbacks',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'reduced-motion',
    name: 'Reduced Motion',
    description: 'Sets prefers-reduced-motion: reduce; detects animations still running',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'offline',
    name: 'Offline',
    description: 'Goes offline after first load; checks for service worker and offline fallback',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 45000,
    retries: 1,
  },
  {
    id: 'broken-links',
    name: 'Broken Links',
    description: 'Probes same-origin anchor hrefs (cap 100); flags 404/410/5xx links',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 60000,
    retries: 1,
  },
  {
    id: 'network-resilience',
    name: 'Network Resilience',
    description: 'Aborts all XHR/fetch requests; checks page degrades gracefully',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 45000,
    retries: 1,
  },
  {
    id: 'security-hygiene',
    name: 'Security Hygiene',
    description: 'Passively inspects response headers for CSP, HSTS, X-Frame-Options, etc.',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },
  {
    id: 'form-resilience',
    name: 'Form Resilience',
    description: 'Submits empty forms; checks whether validation feedback is shown',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 45000,
    retries: 1,
  },

  // Canonical viewport aliases (same class, canonical IDs)
  {
    id: 'mobile',
    name: 'Mobile',
    description: 'Canonical mobile viewport (390×844)',
    enabled: true,
    viewport: { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'tablet',
    name: 'Tablet',
    description: 'Canonical tablet viewport (820×1180)',
    enabled: true,
    viewport: { width: 820, height: 1180, deviceScaleFactor: 1, isMobile: false, hasTouch: true },
    timeout: 30000,
    retries: 2,
  },
  {
    id: 'desktop',
    name: 'Desktop',
    description: 'Canonical desktop viewport (1280×800)',
    enabled: true,
    viewport: { width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
    timeout: 30000,
    retries: 1,
  },
];

export class ProfileManager {
  private profiles: Map<string, ProfileConfig> = new Map();
  private executionHistory: Map<string, number[]> = new Map(); // profileId -> durations

  constructor(customProfiles?: ProfileConfig[]) {
    // Initialize with default profiles
    for (const profile of PROFILES) {
      this.profiles.set(profile.id, profile);
    }

    // Override with custom profiles if provided
    if (customProfiles) {
      for (const profile of customProfiles) {
        this.profiles.set(profile.id, profile);
      }
    }
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): ProfileConfig[] {
    return Array.from(this.profiles.values());
  }

  /**
   * Get enabled profiles
   */
  getEnabledProfiles(): ProfileConfig[] {
    return this.getAllProfiles().filter((p) => p.enabled);
  }

  /**
   * Get profile by ID
   */
  getProfile(id: string): ProfileConfig | undefined {
    return this.profiles.get(id);
  }

  /**
   * Get profiles by category (device, accessibility, etc.)
   */
  getProfilesByCategory(category: string): ProfileConfig[] {
    return this.getAllProfiles().filter((p) => p.id.startsWith(category));
  }

  /**
   * Create execution context from profile
   */
  createExecutionContext(profileId: string): ProfileContext | null {
    const profile = this.getProfile(profileId);
    if (!profile) {
      return null;
    }

    return {
      profileId: profile.id,
      profileName: profile.name,
      viewport: profile.viewport,
      userAgent: profile.userAgent,
      locale: profile.locale,
      timezone: profile.timezone,
      strictMode: profile.strictMode ?? false,
    };
  }

  /**
   * Enable profile
   */
  enableProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile) {
      return false;
    }

    profile.enabled = true;
    return true;
  }

  /**
   * Disable profile
   */
  disableProfile(id: string): boolean {
    const profile = this.profiles.get(id);
    if (!profile) {
      return false;
    }

    profile.enabled = false;
    return true;
  }

  /**
   * Record profile execution
   */
  recordExecution(profileId: string, duration: number): void {
    if (!this.executionHistory.has(profileId)) {
      this.executionHistory.set(profileId, []);
    }

    this.executionHistory.get(profileId)!.push(duration);
  }

  /**
   * Get profile execution statistics
   */
  getExecutionStats(profileId: string): {
    executions: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
  } | null {
    const durations = this.executionHistory.get(profileId);
    if (!durations || durations.length === 0) {
      return null;
    }

    const sum = durations.reduce((a, b) => a + b, 0);
    const average = sum / durations.length;

    return {
      executions: durations.length,
      averageDuration: average,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
    };
  }

  /**
   * Get optimal profile execution order for parallelization
   */
  getOptimalExecutionOrder(): ProfileConfig[] {
    const enabled = this.getEnabledProfiles();

    // Sort by average duration (descending) for better parallelization
    return enabled.sort((a, b) => {
      const statsA = this.getExecutionStats(a.id);
      const statsB = this.getExecutionStats(b.id);

      const durationA = statsA?.averageDuration ?? (a.timeout || 30000);
      const durationB = statsB?.averageDuration ?? (b.timeout || 30000);

      return durationB - durationA;
    });
  }

  /**
   * Validate profile configuration
   */
  validateProfileConfig(profile: ProfileConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.id) errors.push('Profile ID is required');
    if (!profile.name) errors.push('Profile name is required');
    if (!profile.viewport) errors.push('Viewport configuration is required');
    if (profile.viewport && profile.viewport.width < 320)
      errors.push('Viewport width must be at least 320px');
    if (profile.viewport && profile.viewport.height < 240)
      errors.push('Viewport height must be at least 240px');

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Add custom profile
   */
  addProfile(profile: ProfileConfig): { success: boolean; error?: string } {
    const validation = this.validateProfileConfig(profile);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(', ') };
    }

    this.profiles.set(profile.id, profile);
    return { success: true };
  }

  /**
   * Get profile count
   */
  getProfileCount(): { total: number; enabled: number; disabled: number } {
    const total = this.profiles.size;
    const enabled = this.getEnabledProfiles().length;

    return {
      total,
      enabled,
      disabled: total - enabled,
    };
  }
}
