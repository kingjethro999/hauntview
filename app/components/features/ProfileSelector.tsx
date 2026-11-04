'use client';

import React, { useSyncExternalStore } from 'react';
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EyeIcon,
  GlobeAltIcon,
  BeakerIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

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

interface ProfileSelectorProps {
  selectedProfiles: string[];
  onChange: (profiles: string[]) => void;
  viewMode?: 'grid' | 'list';
  onSelectAll?: () => void;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'device':
      return <DevicePhoneMobileIcon className="w-4 h-4" />;
    case 'accessibility':
      return <EyeIcon className="w-4 h-4" />;
    case 'i18n':
      return <GlobeAltIcon className="w-4 h-4" />;
    case 'browser':
      return <ComputerDesktopIcon className="w-4 h-4" />;
    case 'performance':
      return <BeakerIcon className="w-4 h-4" />;
    case 'resilience':
      return <ShieldExclamationIcon className="w-4 h-4" />;
    case 'security':
      return <ShieldCheckIcon className="w-4 h-4" />;
    default:
      return <BeakerIcon className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'device':
      return 'rgba(59, 130, 246, 0.15)';
    case 'accessibility':
      return 'rgba(154, 255, 154, 0.15)';
    case 'i18n':
      return 'rgba(249, 115, 22, 0.15)';
    case 'browser':
      return 'rgba(168, 85, 247, 0.15)';
    case 'performance':
      return 'rgba(234, 88, 12, 0.15)';
    case 'resilience':
      return 'rgba(239, 68, 68, 0.15)';
    case 'security':
      return 'rgba(16, 185, 129, 0.15)';
    default:
      return 'rgba(255, 121, 31, 0.15)';
  }
};

const getCategoryBorderColor = (category: string) => {
  switch (category) {
    case 'device':
      return 'rgba(59, 130, 246, 0.3)';
    case 'accessibility':
      return 'rgba(154, 255, 154, 0.3)';
    case 'i18n':
      return 'rgba(249, 115, 22, 0.3)';
    case 'browser':
      return 'rgba(168, 85, 247, 0.3)';
    case 'performance':
      return 'rgba(234, 88, 12, 0.3)';
    case 'resilience':
      return 'rgba(239, 68, 68, 0.3)';
    case 'security':
      return 'rgba(16, 185, 129, 0.3)';
    default:
      return 'rgba(255, 121, 31, 0.3)';
  }
};

const STORAGE_KEY = 'hauntview_collapsed_categories';

const DEFAULT_COLLAPSED: Record<string, boolean> = {
  device: false,
  accessibility: true,
  i18n: true,
  browser: true,
  performance: true,
  resilience: true,
  security: true,
};

// Subscribable external store for persistent collapsed category preferences
let cachedCollapsed: Record<string, boolean> | null = null;
const collapseListeners = new Set<() => void>();

function getCollapsedSnapshot(): Record<string, boolean> {
  if (typeof window === 'undefined') return DEFAULT_COLLAPSED;
  if (!cachedCollapsed) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      cachedCollapsed = saved ? { ...DEFAULT_COLLAPSED, ...JSON.parse(saved) } : DEFAULT_COLLAPSED;
    } catch {
      cachedCollapsed = DEFAULT_COLLAPSED;
    }
  }
  return cachedCollapsed || DEFAULT_COLLAPSED;
}

function getServerSnapshot(): Record<string, boolean> {
  return DEFAULT_COLLAPSED;
}

function subscribeToCollapsed(callback: () => void) {
  collapseListeners.add(callback);
  return () => {
    collapseListeners.delete(callback);
  };
}

function updateCollapsedCategory(cat: string) {
  const current = getCollapsedSnapshot();
  const next = { ...current, [cat]: !current[cat] };
  cachedCollapsed = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write errors
  }
  collapseListeners.forEach((fn) => fn());
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({
  selectedProfiles,
  onChange,
  viewMode = 'grid',
}) => {
  // Synchronize state between SSR default and client preferences without cascading renders or hydration mismatch
  const collapsed = useSyncExternalStore(
    subscribeToCollapsed,
    getCollapsedSnapshot,
    getServerSnapshot
  );

  const toggleCollapse = (cat: string) => {
    updateCollapsedCategory(cat);
  };

  const toggleProfile = (id: string) => {
    if (selectedProfiles.includes(id)) {
      onChange(selectedProfiles.filter((p) => p !== id));
    } else {
      onChange([...selectedProfiles, id]);
    }
  };

  const groupedProfiles = AVAILABLE_PROFILES.reduce(
    (acc, profile) => {
      if (!acc[profile.category]) {
        acc[profile.category] = [];
      }
      acc[profile.category].push(profile);
      return acc;
    },
    {} as Record<ProfileInfo['category'], ProfileInfo[]>
  );

  if (viewMode === 'list') {
    return (
      <div className="space-y-4">
        {Object.entries(groupedProfiles).map(([category, profiles]) => {
          const isCollapsed = collapsed[category] ?? true;
          const selectedCount = profiles.filter((p) => selectedProfiles.includes(p.id)).length;

          return (
            <div
              key={category}
              className="rounded-lg border border-[#46334b]/40 bg-[#140d1e]/40 p-3"
            >
              <div
                onClick={() => toggleCollapse(category)}
                className="flex items-center justify-between cursor-pointer select-none py-1"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded" style={{ background: getCategoryColor(category) }}>
                    {getCategoryIcon(category)}
                  </div>
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--phantom-gray)' }}
                  >
                    {category}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-[rgba(255,121,31,0.1)] text-[#ff791f]">
                    {selectedCount}/{profiles.length} selected
                  </span>
                </div>
                <button
                  type="button"
                  aria-label={isCollapsed ? `Expand ${category}` : `Collapse ${category}`}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded text-[var(--phantom-gray)] hover:text-[var(--ghost-white)] transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRightIcon className="w-4 h-4 text-[var(--phantom-gray)]" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 text-[#ff791f]" />
                  )}
                </button>
              </div>

              {!isCollapsed && (
                <div className="space-y-2 mt-3 pt-2 border-t border-[#46334b]/30">
                  {profiles.map((profile) => (
                    <label
                      key={profile.id}
                      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all hover:border-[var(--candle-primary)]"
                      style={{
                        background: selectedProfiles.includes(profile.id)
                          ? getCategoryColor(category)
                          : 'rgba(28, 21, 35, 0.3)',
                        borderColor: selectedProfiles.includes(profile.id)
                          ? getCategoryBorderColor(category)
                          : 'rgba(255, 121, 31, 0.1)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedProfiles.includes(profile.id)}
                        onChange={() => toggleProfile(profile.id)}
                        className="accent-[var(--candle-primary)] w-4 h-4"
                      />
                      <div
                        className="flex items-center gap-2"
                        style={{ color: 'var(--ghost-white)' }}
                      >
                        {getCategoryIcon(category)}
                        <span className="text-sm font-medium">{profile.name}</span>
                      </div>
                      <span className="text-xs ml-auto" style={{ color: 'var(--phantom-gray)' }}>
                        {profile.description}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Grid view
  return (
    <div className="space-y-5">
      {Object.entries(groupedProfiles).map(([category, profiles]) => {
        const isCollapsed = collapsed[category] ?? true;
        const selectedCount = profiles.filter((p) => selectedProfiles.includes(p.id)).length;

        return (
          <div
            key={category}
            className="rounded-lg border border-[#46334b]/40 bg-[#140d1e]/30 p-3.5 transition-all"
          >
            {/* Collapsible Category Header */}
            <div
              onClick={() => toggleCollapse(category)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded" style={{ background: getCategoryColor(category) }}>
                  {getCategoryIcon(category)}
                </div>
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--phantom-gray)' }}
                >
                  {category}
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[rgba(255,121,31,0.1)] text-[#ff791f]">
                  {selectedCount}/{profiles.length} selected
                </span>
              </div>

              {/* Far-Right Collapse Icon */}
              <button
                type="button"
                aria-label={isCollapsed ? `Expand ${category} rites` : `Collapse ${category} rites`}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded text-[var(--phantom-gray)] hover:text-[var(--ghost-white)] transition-transform"
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="w-4 h-4 text-[var(--phantom-gray)]" />
                ) : (
                  <ChevronDownIcon className="w-4 h-4 text-[#ff791f]" />
                )}
              </button>
            </div>

            {/* Profile Tiles Grid (hidden when collapsed) */}
            {!isCollapsed && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-3 pt-3 border-t border-[#46334b]/30">
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => toggleProfile(profile.id)}
                    className="relative p-4 rounded-lg border text-left transition-all hover:border-[var(--candle-primary)] group"
                    style={{
                      background: selectedProfiles.includes(profile.id)
                        ? getCategoryColor(category)
                        : 'rgba(28, 21, 35, 0.3)',
                      borderColor: selectedProfiles.includes(profile.id)
                        ? getCategoryBorderColor(category)
                        : 'rgba(255, 121, 31, 0.1)',
                    }}
                  >
                    {selectedProfiles.includes(profile.id) && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: getCategoryBorderColor(category) }}
                      >
                        <CheckIcon className="w-3 h-3" style={{ color: 'var(--ghost-white)' }} />
                      </div>
                    )}
                    <div
                      className="flex items-center gap-2 mb-2"
                      style={{ color: 'var(--ghost-white)' }}
                    >
                      {getCategoryIcon(category)}
                      <span className="text-sm font-medium">{profile.name}</span>
                    </div>
                    <p className="text-xs leading-snug" style={{ color: 'var(--phantom-gray)' }}>
                      {profile.description}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
