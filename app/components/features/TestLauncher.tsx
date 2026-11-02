'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ProfileSelector, AVAILABLE_PROFILES } from './ProfileSelector';
import { HauntedHouse, HOUSE_WINDOWS } from './HauntedHouse';
import { RocketLaunchIcon, HomeModernIcon, ListBulletIcon } from '@heroicons/react/24/outline';

export interface TestLauncherProps {
  onStartTest: (
    url: string,
    profiles: string[],
    format?: 'zip' | 'html' | 'markdown' | 'json'
  ) => Promise<void>;
  isRunning: boolean;
  onUrlChange?: (url: string, isValid: boolean) => void;
  onFocusChange?: (isFocused: boolean) => void;
}

export const TestLauncher: React.FC<TestLauncherProps> = ({
  onStartTest,
  isRunning,
  onUrlChange,
  onFocusChange,
}) => {
  const [url, setUrl] = useState<string>('http://localhost:3000');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(
    AVAILABLE_PROFILES.map((p) => p.id)
  );
  const [viewMode, setViewMode] = useState<'house' | 'list'>('house');
  const [format, setFormat] = useState<'zip' | 'html' | 'markdown' | 'json'>('zip');
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: 'localhost:3000', url: 'http://localhost:3000' },
    { label: 'localhost:8080', url: 'http://localhost:8080' },
    { label: 'example.com', url: 'https://example.com' },
  ];

  const checkUrlValid = (val: string): boolean => {
    try {
      const parsed = new URL(val.trim());
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const isUrlValid = checkUrlValid(url);

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setUrl(newVal);
    const valid = checkUrlValid(newVal);
    onUrlChange?.(newVal, valid);
  };

  const toggleSingleProfile = (profileId: string) => {
    setSelectedProfiles((prev) =>
      prev.includes(profileId) ? prev.filter((p) => p !== profileId) : [...prev, profileId]
    );
  };

  const selectAllHouseProfiles = () => {
    const allIds = AVAILABLE_PROFILES.map((p) => p.id);
    if (selectedProfiles.length === allIds.length) {
      setSelectedProfiles([]);
    } else {
      setSelectedProfiles(allIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Target URL is required.');
      return;
    }

    if (!checkUrlValid(trimmed)) {
      setError(
        'Please provide a valid URL including protocol (e.g. http://localhost:3000 or https://example.com)'
      );
      return;
    }

    if (selectedProfiles.length === 0) {
      setError('Please select at least one testing profile in the Haunted House to summon.');
      return;
    }

    try {
      await onStartTest(trimmed, selectedProfiles, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while launching tests.');
    }
  };

  return (
    <Card
      variant="ghostly"
      className="p-6 md:p-8 space-y-8 border-[#46334b] bg-[#0a0711]/90 backdrop-blur-md"
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Séance Slate URL Input Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <label
              htmlFor="target-url-slate"
              className="text-sm font-serif font-bold text-[#fff1dc] flex items-center gap-2"
            >
              <span>Which House Shall We Haunt?</span>
              <span className="text-[#ff791f] font-normal text-xs">(Target URL)</span>
            </label>
            <div className="flex items-center gap-1.5 text-xs text-[#d9d3e0]">
              <span>Quick pick:</span>
              {presets.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => {
                    setUrl(preset.url);
                    const valid = checkUrlValid(preset.url);
                    onUrlChange?.(preset.url, valid);
                  }}
                  className="px-2.5 py-0.5 rounded-[4px] bg-[#1c1629] border border-[#46334b] hover:text-[#ff791f] hover:border-[#ff791f] transition-colors cursor-pointer text-[11px]"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Séance Slate Styled Input Container */}
          <div
            className={`relative flex items-center rounded-[6px] bg-[#0a0711] border-2 transition-all duration-300 ${
              isUrlValid
                ? 'border-[#ff791f] shadow-[0_0_18px_rgba(255,121,31,0.25)]'
                : 'border-[#46334b] focus-within:border-[#ff791f]'
            }`}
          >
            {/* Candle Status Flame Icon */}
            <div className="pl-3.5 pr-2 flex items-center justify-center text-lg select-none">
              {isUrlValid ? (
                <span title="Lantern & Candle Lit! Target URL valid" className="animate-bounce">
                  🕯️
                </span>
              ) : (
                <span
                  title="Unlit wick. Enter valid http:// or https:// address"
                  className="opacity-40"
                >
                  🕯️
                </span>
              )}
            </div>

            <input
              id="target-url-slate"
              type="text"
              value={url}
              onChange={handleUrlInputChange}
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
              placeholder="http://localhost:3000 or https://your-site.com"
              disabled={isRunning}
              required
              className="w-full py-3.5 pr-4 bg-transparent text-[#fff1dc] font-mono text-sm placeholder:text-[#b9acbf] placeholder:font-serif focus:outline-none"
            />

            {/* Validation Indicator Badge */}
            <div className="pr-3.5 flex items-center">
              {isUrlValid ? (
                <span className="text-[11px] font-serif font-semibold text-[#9aff9a] bg-[#1c1629] px-2 py-0.5 rounded border border-[#9aff9a]/40">
                  Porch Lantern Lit ✓
                </span>
              ) : (
                <span className="text-[11px] text-[#d9d3e0] italic">Awaiting address...</span>
              )}
            </div>
          </div>
        </div>

        {/* View Mode Toggle: The Haunted House vs Plain Rites List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#46334b] gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-[#fff1dc] flex items-center gap-2">
                <span>The Haunted House & Rites</span>
                <span className="text-xs font-mono font-normal text-[#ff791f] px-2 py-0.5 rounded bg-[#1c1629] border border-[#46334b]">
                  {selectedProfiles.length} / {HOUSE_WINDOWS.length} Rites Summoned
                </span>
              </h3>
              <p className="text-xs text-[#d9d3e0]">
                Each window of the house represents a failure-mode test profile.
              </p>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex rounded-[6px] bg-[#1c1629] p-0.5 border border-[#46334b]">
              <button
                type="button"
                onClick={() => setViewMode('house')}
                className={`px-3 py-1 rounded-[4px] text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'house'
                    ? 'bg-[#ff791f] text-[#0a0711] font-bold shadow-[0_0_8px_rgba(255,121,31,0.3)]'
                    : 'text-[#d9d3e0] hover:text-[#fff1dc]'
                }`}
                aria-pressed={viewMode === 'house'}
              >
                <HomeModernIcon className="w-3.5 h-3.5" />
                <span>Haunted House</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-[4px] text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#ff791f] text-[#0a0711] font-bold shadow-[0_0_8px_rgba(255,121,31,0.3)]'
                    : 'text-[#d9d3e0] hover:text-[#fff1dc]'
                }`}
                aria-pressed={viewMode === 'list'}
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>
            </div>
          </div>

          {/* Interactive Haunted House or List Selector */}
          {viewMode === 'house' ? (
            <div className="p-4 rounded-[6px] bg-[#1c1629]/90 border border-[#46334b] flex flex-col items-center">
              <HauntedHouse
                selectedProfiles={selectedProfiles}
                onToggleProfile={toggleSingleProfile}
                onSelectAll={selectAllHouseProfiles}
                isUrlValid={isUrlValid}
              />
            </div>
          ) : (
            <ProfileSelector selectedProfiles={selectedProfiles} onChange={setSelectedProfiles} />
          )}
        </div>

        {/* Format Selection & Submit Button */}
        <div className="pt-4 border-t border-[#46334b] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-serif text-[#d9d3e0]">Grimoire Export:</span>
            {(['zip', 'html', 'markdown', 'json'] as const).map((fmt) => (
              <label
                key={fmt}
                className="flex items-center gap-1.5 text-xs text-[#fff1dc] cursor-pointer font-mono"
              >
                <input
                  type="radio"
                  name="format"
                  checked={format === fmt}
                  onChange={() => setFormat(fmt)}
                  className="accent-[#ff791f] cursor-pointer"
                />
                <span className="uppercase">{fmt === 'zip' ? 'ZIP (Screenshots)' : fmt}</span>
              </label>
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            loading={isRunning}
            disabled={isRunning}
            icon={<RocketLaunchIcon className="w-5 h-5 text-[#0a0711]" />}
            className="w-full sm:w-auto font-serif font-bold text-[#0a0711] bg-[#ff791f] hover:bg-[#ff791f]/90 shadow-[0_0_20px_rgba(255,121,31,0.35)] cursor-pointer"
          >
            {isRunning
              ? 'Séance in Progress...'
              : `Haunt House with ${selectedProfiles.length} Rites`}
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert type="error" title="Validation or Launch Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </form>
    </Card>
  );
};
