/**
 * The rite catalogue — every failure condition HauntView can run, grouped by
 * category. Shared by the séance table (ring + ledger) and anything that needs
 * to count or label rites.
 */

export interface ProfileInfo {
  id: string;
  name: string;
  description: string;
  category:
    'device' | 'accessibility' | 'i18n' | 'browser' | 'performance' | 'resilience' | 'security';
}

export const AVAILABLE_PROFILES: ProfileInfo[] = [
  // Device profiles
  {
    id: 'mobile-iphone15',
    name: 'Mobile - iPhone 15',
    description: '390×844 touch viewport',
    category: 'device',
  },
  {
    id: 'mobile-android',
    name: 'Mobile - Android',
    description: '360×800 touch viewport',
    category: 'device',
  },
  {
    id: 'tablet-ipad',
    name: 'Tablet - iPad Pro',
    description: '1024×1366 touch viewport',
    category: 'device',
  },
  {
    id: 'desktop-1080p',
    name: 'Desktop - 1080p',
    description: '1920×1080 standard viewport',
    category: 'device',
  },
  {
    id: 'desktop-4k',
    name: 'Desktop - 4K',
    description: '3840×2160 high-resolution',
    category: 'device',
  },

  // Accessibility profiles
  {
    id: 'a11y-screenreader',
    name: 'Screen Reader',
    description: 'ARIA and semantic HTML',
    category: 'accessibility',
  },
  {
    id: 'a11y-keyboard',
    name: 'Keyboard Navigation',
    description: 'Tab order and focus management',
    category: 'accessibility',
  },
  {
    id: 'a11y-visual',
    name: 'Visual Impairment',
    description: 'High contrast and color independence',
    category: 'accessibility',
  },
  {
    id: 'a11y-cognitive',
    name: 'Cognitive Load',
    description: 'Complexity and clarity checks',
    category: 'accessibility',
  },
  {
    id: 'reduced-motion',
    name: 'Reduced Motion',
    description: 'Enforces prefers-reduced-motion; audits running animations',
    category: 'accessibility',
  },

  // Internationalization
  {
    id: 'i18n-rtl',
    name: 'RTL Language',
    description: 'Arabic right-to-left layout',
    category: 'i18n',
  },
  {
    id: 'i18n-cjk',
    name: 'CJK Language',
    description: 'Japanese East Asian script',
    category: 'i18n',
  },
  {
    id: 'i18n-mixed',
    name: 'Mixed Scripts',
    description: 'Hindi complex script rendering',
    category: 'i18n',
  },

  // Browser compatibility
  {
    id: 'browser-webkit',
    name: 'WebKit',
    description: 'Safari/Chrome engine',
    category: 'browser',
  },
  { id: 'browser-firefox', name: 'Firefox', description: 'Gecko engine', category: 'browser' },
  { id: 'browser-edge', name: 'Edge', description: 'Chromium variant', category: 'browser' },
  {
    id: 'browser-legacy',
    name: 'Legacy',
    description: 'IE 11 fallback detection',
    category: 'browser',
  },

  // Performance & Failure Modes
  {
    id: 'performance',
    name: 'Performance',
    description: 'Core Web Vitals and CLS',
    category: 'performance',
  },
  {
    id: 'font-failure',
    name: 'Font Failure',
    description: 'Blocks web fonts; detects layout shifts from font substitution',
    category: 'performance',
  },

  // Resilience Rites
  {
    id: 'image-failure',
    name: 'Image Failure',
    description: 'Blocks all images; checks alt attributes and explicit dimensions',
    category: 'resilience',
  },
  {
    id: 'js-disabled',
    name: 'JS Disabled',
    description: 'Disables JavaScript; audits meaningful content and <noscript> fallbacks',
    category: 'resilience',
  },
  {
    id: 'offline',
    name: 'Offline Resilience',
    description: 'Simulates offline mode; checks service worker and fallback UI',
    category: 'resilience',
  },
  {
    id: 'broken-links',
    name: 'Broken Links',
    description: 'Probes same-origin anchor hrefs; flags 404/410/5xx dead links',
    category: 'resilience',
  },
  {
    id: 'network-resilience',
    name: 'Network Resilience',
    description: 'Aborts API requests; checks graceful degradation and error handling',
    category: 'resilience',
  },
  {
    id: 'form-resilience',
    name: 'Form Resilience',
    description: 'Submits empty forms; audits client/server validation feedback',
    category: 'resilience',
  },

  // Security Hygiene
  {
    id: 'security-hygiene',
    name: 'Security Hygiene',
    description: 'Passively audits CSP, HSTS, X-Frame-Options, and security headers',
    category: 'security',
  },
];

export type RiteCategory = ProfileInfo['category'];

/** Display order and plain-English names for categories. */
export const RITE_CATEGORIES: { id: RiteCategory; label: string }[] = [
  { id: 'device', label: 'Devices' },
  { id: 'accessibility', label: 'Access' },
  { id: 'i18n', label: 'Languages' },
  { id: 'browser', label: 'Browsers' },
  { id: 'performance', label: 'Speed' },
  { id: 'resilience', label: 'Resilience' },
  { id: 'security', label: 'Security' },
];
