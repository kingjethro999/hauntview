'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface ProgressTrackerProps {
  url: string;
  totalProfiles: number;
  onCancel?: () => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  url,
  totalProfiles,
  onCancel,
}) => {
  const [elapsed, setElapsed] = useState<number>(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Approximate simulated progress based on typical profile execution times
  const estimatedSeconds = Math.max(15, totalProfiles * 2);
  const progressPercent = Math.min(95, Math.round((elapsed / estimatedSeconds) * 90) + 5);

  return (
    <Card variant="accent" className="p-6 space-y-5 animate-pulse-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Spinner size="md" />
          <div>
            <h4 className="font-display font-bold text-base text-[#fff1dc]">
              HauntView Engine Executing Tests
            </h4>
            <p className="text-xs text-[#646478]">
              Automating Playwright headless instances against{' '}
              <code className="text-[#ff791f]">{url}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#fff1dc] font-mono bg-[#0a0711]/60 px-3 py-1.5 rounded-lg border border-[#6C3CAA]/30">
            <ClockIcon className="w-4 h-4 text-[#ff791f]" />
            <span>{elapsed}s elapsed</span>
          </div>

          {onCancel && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              icon={<XMarkIcon className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>

      <ProgressBar
        value={progressPercent}
        label={`Running test suite across ${totalProfiles} configured profiles...`}
        showPercent
      />

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#6C3CAA]/20 text-xs text-[#646478]">
        <Badge variant="primary" size="sm">
          Playwright WebKit
        </Badge>
        <Badge variant="warning" size="sm">
          Capturing Screenshots
        </Badge>
        <Badge variant="info" size="sm">
          Classifying Findings
        </Badge>
        <span className="text-[11px] ml-auto italic">
          Will automatically redirect to the interactive report upon completion
        </span>
      </div>
    </Card>
  );
};
