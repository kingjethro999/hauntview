'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ProfileSelector, AVAILABLE_PROFILES } from './ProfileSelector';
import { PlanchetteProgress } from './PlanchetteProgress';
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
  const [error, setError] = useState<string | null>(null);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [activeRiteName, setActiveRiteName] = useState<string>('');
  const [completedCount, setCompletedCount] = useState<number>(0);

  useEffect(() => {
    if (!isRunning) return;

    const total = selectedProfiles.length || 1;
    const startTime = Date.now();
    // Estimate ~2.5s per profile
    const estimatedDurationMs = Math.max(8000, total * 2500);

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const ratio = Math.min(0.95, elapsed / estimatedDurationMs);
      const pct = Math.min(95, Math.round(ratio * 100));
      setProgressPercent(pct);

      const profileIndex = Math.min(total - 1, Math.floor(ratio * total));
      const currentId = selectedProfiles[profileIndex];
      const found = AVAILABLE_PROFILES.find((p) => p.id === currentId);
      if (found) {
        setActiveRiteName(found.name);
      }
      setCompletedCount(profileIndex + 1);
    }, 350);

    return () => {
      clearInterval(interval);
      setProgressPercent(0);
      setCompletedCount(0);
      setActiveRiteName('');
    };
  }, [isRunning, selectedProfiles]);

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
      await onStartTest(trimmed, selectedProfiles);
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
      <form onSubmit={handleSubmit} className="space-y-8" noValidate={false}>
        {/* Step Guide for Cognitive Accessibility */}
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--candle-primary)] bg-[rgba(255,121,31,0.08)] px-3 py-1.5 rounded border border-[rgba(255,121,31,0.2)]">
          <span>Guide:</span>
          <span>Step 1 Enter Target URL</span>
          <span>·</span>
          <span>Step 2 Select Testing Rites</span>
          <span>·</span>
          <span>Step 3 Summon Spirits</span>
        </div>

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
              className="flex items-center gap-2 text-xs flex-wrap"
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
                  className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded border hover:border-[var(--candle-primary)] transition-colors inline-flex items-center justify-center text-xs"
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
                : error
                  ? 'border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.2)]'
                  : 'border-[rgba(255,121,31,0.15)] focus-within:border-[var(--candle-primary)]'
            }`}
            style={{ background: 'rgba(10, 7, 17, 0.8)' }}
          >
            <input
              id="target-url"
              type="url"
              value={url}
              onChange={handleUrlInputChange}
              onFocus={() => onFocusChange?.(true)}
              onBlur={() => onFocusChange?.(false)}
              placeholder="http://localhost:3000 or https://your-site.com"
              disabled={isRunning}
              required
              aria-required="true"
              aria-invalid={error || (!isUrlValid && url.length > 0) ? 'true' : 'false'}
              aria-describedby={error ? 'url-error' : undefined}
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

          {/* Explicit visible error message for Form Resilience and screen readers */}
          {error && (
            <p
              id="url-error"
              role="alert"
              className="mt-2 text-xs text-red-400 flex items-center gap-1.5 font-mono"
            >
              <span aria-hidden="true">⚠</span>
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Profile Selection */}
        <div className="space-y-5">
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-3"
            style={{ borderBottom: '1px solid rgba(255, 121, 31, 0.1)' }}
          >
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--ghost-white)' }}>
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
              </h2>
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
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
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
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-2 transition-colors ${
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

        {/* Interactive Halloween Séance Progress Tracker */}
        {isRunning && (
          <div className="pt-2 animate-fadeIn">
            <PlanchetteProgress
              progressPercent={progressPercent}
              statusMessage={
                activeRiteName
                  ? `Communing with spirits · Sensitizing plate for rite: ${activeRiteName}…`
                  : 'Sensitizing photographic plates and invoking Chromium headless session…'
              }
              totalRites={selectedProfiles.length}
              completedRites={completedCount}
            />
          </div>
        )}

        {/* Action submit button */}
        <div
          className="pt-6 flex items-center justify-end"
          style={{ borderTop: '1px solid rgba(255, 121, 31, 0.1)' }}
        >
          <Button
            type="submit"
            size="lg"
            variant="candle"
            loading={isRunning}
            disabled={isRunning}
            icon={<RocketLaunchIcon className="w-5 h-5" />}
            className="w-full sm:w-auto font-semibold px-8"
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
