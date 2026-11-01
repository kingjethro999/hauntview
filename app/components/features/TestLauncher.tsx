'use client';

import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { ProfileSelector, AVAILABLE_PROFILES } from './ProfileSelector';
import { GlobeAltIcon, RocketLaunchIcon } from '@heroicons/react/24/outline';

export interface TestLauncherProps {
  onStartTest: (
    url: string,
    profiles: string[],
    format?: 'html' | 'markdown' | 'json'
  ) => Promise<void>;
  isRunning: boolean;
}

export const TestLauncher: React.FC<TestLauncherProps> = ({ onStartTest, isRunning }) => {
  const [url, setUrl] = useState<string>('http://localhost:3000');
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>(
    AVAILABLE_PROFILES.map((p) => p.id)
  );
  const [format, setFormat] = useState<'html' | 'markdown' | 'json'>('html');
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: 'localhost:3000', url: 'http://localhost:3000' },
    { label: 'localhost:8080', url: 'http://localhost:8080' },
    { label: 'example.com', url: 'https://example.com' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRunning) return;
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError('Target URL is required.');
      return;
    }

    try {
      new URL(trimmed);
    } catch {
      setError(
        'Please provide a valid URL including protocol (e.g. http://localhost:3000 or https://example.com)'
      );
      return;
    }

    if (selectedProfiles.length === 0) {
      setError('Please select at least one testing profile to run.');
      return;
    }

    try {
      await onStartTest(trimmed, selectedProfiles, format);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while launching tests.');
    }
  };

  return (
    <Card variant="ghostly" className="p-6 md:p-8 space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* URL Input Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <span className="text-sm font-semibold text-[#F5F5FA]">
              Target Web Application URL <span className="text-[#dc2626]">*</span>
            </span>
            <div className="flex items-center gap-1.5 text-xs text-[#646478]">
              <span>Quick pick:</span>
              {presets.map((preset) => (
                <button
                  key={preset.url}
                  type="button"
                  onClick={() => setUrl(preset.url)}
                  className="px-2 py-0.5 rounded bg-[#373746]/60 hover:text-[#DC6428] hover:bg-[#373746] transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="http://localhost:3000 or https://your-site.com"
            disabled={isRunning}
            icon={<GlobeAltIcon className="w-5 h-5" />}
            required
          />
        </div>

        {/* Profile Selector */}
        <ProfileSelector selectedProfiles={selectedProfiles} onChange={setSelectedProfiles} />

        {/* Format Selection & Submit */}
        <div className="pt-4 border-t border-[#6C3CAA]/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#646478] font-medium">Export Format:</span>
            {(['html', 'markdown', 'json'] as const).map((fmt) => (
              <label
                key={fmt}
                className="flex items-center gap-1.5 text-xs text-[#F5F5FA] cursor-pointer"
              >
                <input
                  type="radio"
                  name="format"
                  checked={format === fmt}
                  onChange={() => setFormat(fmt)}
                  className="accent-[#582696] cursor-pointer"
                />
                <span className="uppercase">{fmt}</span>
              </label>
            ))}
          </div>

          <Button
            type="submit"
            size="lg"
            variant="secondary"
            loading={isRunning}
            disabled={isRunning}
            icon={<RocketLaunchIcon className="w-5 h-5" />}
            className="w-full sm:w-auto font-display glow-orange"
          >
            {isRunning
              ? 'Running HauntView Engine...'
              : `Run ${selectedProfiles.length} Test Profiles`}
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
