'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ProfileSelector, AVAILABLE_PROFILES } from './ProfileSelector';
import {
  RocketLaunchIcon,
  HomeModernIcon,
  ListBulletIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
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

  const selectAllProfiles = () => {
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
      setError('Please select at least one testing profile.');
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
      className="p-8 space-y-8"
      style={{
        borderColor: 'rgba(255, 121, 31, 0.15)',
        background: 'rgba(28, 21, 35, 0.6)',
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* URL Input Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <label
              htmlFor="target-url"
              className="text-sm font-semibold flex items-center gap-2"
              style={{ color: 'var(--ghost-white)' }}
            >
              <GlobeAltIcon className="w-4 h-4" style={{ color: 'var(--candle-primary)' }} />
              Target URL
            </label>
            <div
              className="flex items-center gap-2 text-xs"
              style={{ color: 'var(--phantom-gray)' }}
            >
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
                  className="px-3 py-1 rounded border hover:border-[var(--candle-primary)] transition-colors"
                  style={{
                    background: 'rgba(28, 21, 35, 0.5)',
                    borderColor: 'rgba(255, 121, 31, 0.15)',
                    color: 'var(--phantom-gray)',
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Styled URL Input */}
          <div
            className={`relative flex items-center rounded-lg border-2 transition-all duration-200 ${
              isUrlValid
                ? 'border-[var(--candle-primary)] shadow-[0_0_20px_rgba(255,121,31,0.2)]'
                : 'border-[rgba(255,121,31,0.15)] focus-within:border-[var(--candle-primary)]'
            }`}
            style={{ background: 'rgba(10, 7, 17, 0.8)' }}
          >
            <input
              id="target-url"
              type="text"
              value={url}
              onChange={handleUrlInputChange}
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
              placeholder="http://localhost:3000 or https://your-site.com"
              disabled={isRunning}
              required
              className="w-full py-3.5 px-4 bg-transparent text-sm font-mono focus:outline-none"
              style={{ color: 'var(--ghost-white)' }}
            />

            {/* Validation indicator */}
            <div className="pr-4 flex items-center">
              {isUrlValid ? (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium"
                  style={{ color: '#9aff9a' }}
                >
                  <div className="w-2 h-2 rounded-full bg-[#9aff9a] ember-pulse" />
                  <span>Valid</span>
                </div>
              ) : (
                <span className="text-xs italic" style={{ color: 'var(--phantom-gray)' }}>
                  Waiting...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Selection */}
        <div className="space-y-5">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3"
            style={{ borderBottom: '1px solid rgba(255, 121, 31, 0.1)' }}
          >
            <div>
              <h3 className="font-semibold text-lg" style={{ color: 'var(--ghost-white)' }}>
                Testing Rites
                <span
                  className="ml-3 text-xs font-normal px-2 py-0.5 rounded"
                  style={{
                    color: 'var(--candle-primary)',
                    background: 'rgba(255, 121, 31, 0.08)',
                    border: '1px solid rgba(255, 121, 31, 0.2)',
                  }}
                >
                  {selectedProfiles.length} / {AVAILABLE_PROFILES.length} selected
                </span>
              </h3>
              <p style={{ fontSize: 13, color: 'var(--phantom-gray)', marginTop: 2 }}>
                Choose which failure conditions to test
              </p>
            </div>

            {/* View mode toggle */}
            <div
              className="inline-flex rounded-lg p-1"
              style={{
                background: 'rgba(28, 21, 35, 0.5)',
                border: '1px solid rgba(255, 121, 31, 0.15)',
              }}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-[var(--candle-primary)] text-[#1a0c06]'
                    : 'text-[var(--phantom-gray)] hover:text-[var(--ghost-white)]'
                }`}
              >
                <HomeModernIcon className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[var(--candle-primary)] text-[#1a0c06]'
                    : 'text-[var(--phantom-gray)] hover:text-[var(--ghost-white)]'
                }`}
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Profile selector */}
          <ProfileSelector
            selectedProfiles={selectedProfiles}
            onChange={setSelectedProfiles}
            viewMode={viewMode}
            onSelectAll={selectAllProfiles}
          />
        </div>

        {/* Format selection and submit */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6"
          style={{ borderTop: '1px solid rgba(255, 121, 31, 0.1)' }}
        >
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm" style={{ color: 'var(--phantom-gray)' }}>
              Export format:
            </span>
            {(['zip', 'html', 'markdown', 'json'] as const).map((fmt) => (
              <label
                key={fmt}
                className="flex items-center gap-2 text-sm cursor-pointer"
                style={{ color: 'var(--ghost-white)' }}
              >
                <input
                  type="radio"
                  name="format"
                  checked={format === fmt}
                  onChange={() => setFormat(fmt)}
                  className="accent-[var(--candle-primary)]"
                />
                <span className="font-mono text-xs uppercase">{fmt}</span>
              </label>
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            variant="candle"
            loading={isRunning}
            disabled={isRunning}
            icon={<RocketLaunchIcon className="w-5 h-5" />}
            className="w-full sm:w-auto font-semibold"
          >
            {isRunning ? 'Conducting Séance...' : `Haunt with ${selectedProfiles.length} Rites`}
          </Button>
        </div>

        {/* Error alert */}
        {error && (
          <Alert type="error" title="Launch Error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </form>
    </Card>
  );
};
