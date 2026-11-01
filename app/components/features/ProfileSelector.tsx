'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import {
  DevicePhoneMobileIcon,
  EyeIcon,
  GlobeAltIcon,
  CpuChipIcon,
  BoltIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export interface ProfileMeta {
  id: string;
  name: string;
  category: 'device' | 'accessibility' | 'i18n' | 'browser' | 'performance';
  description: string;
  badge: string;
}

export const AVAILABLE_PROFILES: ProfileMeta[] = [
  // Device
  {
    id: 'mobile-iphone15',
    name: 'Mobile - iPhone 15',
    category: 'device',
    description: 'Apple iPhone 15 Pro (390x844, 3x DPR)',
    badge: 'Mobile',
  },
  {
    id: 'mobile-android',
    name: 'Mobile - Android',
    category: 'device',
    description: 'Samsung Galaxy S23 (360x800, 2x DPR)',
    badge: 'Mobile',
  },
  {
    id: 'tablet-ipad',
    name: 'Tablet - iPad Pro',
    category: 'device',
    description: 'iPad Pro 12.9" (1024x1366, Touch)',
    badge: 'Tablet',
  },
  {
    id: 'desktop-1080p',
    name: 'Desktop - 1080p',
    category: 'device',
    description: 'Full HD viewport (1920x1080)',
    badge: 'Desktop',
  },
  {
    id: 'desktop-4k',
    name: 'Desktop - 4K',
    category: 'device',
    description: 'Ultra High Definition (3840x2160)',
    badge: 'Desktop',
  },

  // Accessibility
  {
    id: 'a11y-screenreader',
    name: 'Screen Reader & ARIA',
    category: 'accessibility',
    description: 'ARIA landmarks, semantic HTML, roles and screen-reader tree',
    badge: 'WCAG AA',
  },
  {
    id: 'a11y-keyboard',
    name: 'Keyboard Navigation',
    category: 'accessibility',
    description: 'Focus indicators, Tab navigation flow, modal traps',
    badge: 'WCAG AA',
  },
  {
    id: 'a11y-visual',
    name: 'Visual Impairment',
    category: 'accessibility',
    description: 'High contrast mode, color dependency, text readability',
    badge: 'WCAG AA',
  },
  {
    id: 'a11y-cognitive',
    name: 'Cognitive Load',
    category: 'accessibility',
    description: 'DOM complexity, long paragraphs, animation distraction',
    badge: 'WCAG AA',
  },

  // Internationalization
  {
    id: 'i18n-rtl',
    name: 'I18N - RTL (Arabic)',
    category: 'i18n',
    description: 'Right-to-Left bidirectional layout, mirrored flex direction',
    badge: 'RTL',
  },
  {
    id: 'i18n-cjk',
    name: 'I18N - CJK (Japanese)',
    category: 'i18n',
    description: 'CJK typography, line-break rules, font glyph fallback',
    badge: 'CJK',
  },
  {
    id: 'i18n-mixed',
    name: 'I18N - Mixed Scripts',
    category: 'i18n',
    description: 'Devanagari and mixed Unicode script font pairing',
    badge: 'Unicode',
  },

  // Browsers
  {
    id: 'browser-webkit',
    name: 'Browser - WebKit',
    category: 'browser',
    description: 'Safari & WebKit rendering and CSS prefix compliance',
    badge: 'WebKit',
  },
  {
    id: 'browser-firefox',
    name: 'Browser - Firefox',
    category: 'browser',
    description: 'Gecko engine behavior, scrollbar, backdrop filters',
    badge: 'Gecko',
  },
  {
    id: 'browser-edge',
    name: 'Browser - Edge',
    category: 'browser',
    description: 'Chromium Edge integration and compatibility quirks',
    badge: 'Edge',
  },
  {
    id: 'browser-legacy',
    name: 'Browser - Legacy CSS',
    category: 'browser',
    description: 'Flexbox, CSS grid, and modern JS fallback resilience',
    badge: 'Compatibility',
  },

  // Performance
  {
    id: 'performance',
    name: 'Performance & Web Vitals',
    category: 'performance',
    description: 'LCP, FCP, CLS metrics, heavy assets, unminified JS',
    badge: 'Vitals',
  },
];

export interface ProfileSelectorProps {
  selectedProfiles: string[];
  onChange: (profiles: string[]) => void;
}

export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ selectedProfiles, onChange }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Profiles (17)', icon: null },
    {
      id: 'device',
      label: 'Devices (5)',
      icon: <DevicePhoneMobileIcon className="w-4 h-4" />,
    },
    {
      id: 'accessibility',
      label: 'Accessibility (4)',
      icon: <EyeIcon className="w-4 h-4" />,
    },
    {
      id: 'i18n',
      label: 'Internationalization (3)',
      icon: <GlobeAltIcon className="w-4 h-4" />,
    },
    {
      id: 'browser',
      label: 'Browsers (4)',
      icon: <CpuChipIcon className="w-4 h-4" />,
    },
    {
      id: 'performance',
      label: 'Performance (1)',
      icon: <BoltIcon className="w-4 h-4" />,
    },
  ];

  const filteredProfiles =
    activeCategory === 'all'
      ? AVAILABLE_PROFILES
      : AVAILABLE_PROFILES.filter((p) => p.category === activeCategory);

  const toggleProfile = (id: string) => {
    if (selectedProfiles.includes(id)) {
      onChange(selectedProfiles.filter((p) => p !== id));
    } else {
      onChange([...selectedProfiles, id]);
    }
  };

  const selectAll = () => {
    onChange(AVAILABLE_PROFILES.map((p) => p.id));
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectSmokeTest = () => {
    onChange([
      'mobile-iphone15',
      'desktop-1080p',
      'a11y-keyboard',
      'performance',
      'browser-webkit',
    ]);
  };

  const selectA11yOnly = () => {
    onChange(AVAILABLE_PROFILES.filter((p) => p.category === 'accessibility').map((p) => p.id));
  };

  return (
    <div className="space-y-4">
      {/* Action Header & Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#6C3CAA]/20">
        <div>
          <h4 className="font-display font-bold text-base text-[#F5F5FA]">
            Testing Profiles ({selectedProfiles.length}/{AVAILABLE_PROFILES.length} selected)
          </h4>
          <p className="text-xs text-[#646478]">
            Select individual profiles or choose a quick preset suite
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={selectAll}>
            Select All
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={selectSmokeTest}>
            Smoke Test
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={selectA11yOnly}>
            A11y Suite
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearAll}
            className="text-[#fca5a5]"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer
              ${
                activeCategory === cat.id
                  ? 'bg-[#582696] text-[#F5F5FA] shadow-[0_2px_8px_rgba(88,38,150,0.4)]'
                  : 'bg-[#373746]/40 text-[#646478] hover:text-[#F5F5FA] hover:bg-[#373746]/70'
              }
            `}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Profile Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProfiles.map((profile) => {
          const isSelected = selectedProfiles.includes(profile.id);

          return (
            <Card
              key={profile.id}
              onClick={() => toggleProfile(profile.id)}
              className={`
                p-4 cursor-pointer transition-all duration-200 select-none
                ${
                  isSelected
                    ? 'border-[#DC6428] bg-[#582696]/15 shadow-[0_4px_16px_rgba(220,100,40,0.15)] ring-1 ring-[#DC6428]/40'
                    : 'border-[#6C3CAA]/30 bg-[#373746]/40 hover:border-[#6C3CAA]/70 hover:bg-[#373746]/60'
                }
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-[#F5F5FA] truncate">
                      {profile.name}
                    </span>
                    <Badge variant={isSelected ? 'warning' : 'outline'} size="sm">
                      {profile.badge}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#646478] line-clamp-2 leading-relaxed">
                    {profile.description}
                  </p>
                </div>

                <div
                  className={`
                    w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors
                    ${
                      isSelected
                        ? 'bg-[#DC6428] text-white'
                        : 'border border-[#6C3CAA]/50 bg-[#0F0F14]/50'
                    }
                  `}
                >
                  {isSelected && <CheckIcon className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
