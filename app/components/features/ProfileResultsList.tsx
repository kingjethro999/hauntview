import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProfileResult } from '@/src/types';
import { CheckCircleIcon, XCircleIcon, ClockIcon, PhotoIcon } from '@heroicons/react/24/outline';

export interface ProfileResultsListProps {
  profileResults: ProfileResult[];
}

export const ProfileResultsList: React.FC<ProfileResultsListProps> = ({ profileResults }) => {
  return (
    <Card variant="default" className="p-6 space-y-4">
      <div>
        <h3 className="font-display font-bold text-lg text-[#F5F5FA]">
          Profile Execution Breakdown ({profileResults.length})
        </h3>
        <p className="text-xs text-[#646478]">
          Individual result status, execution duration, and detected findings per profile
        </p>
      </div>

      <div className="space-y-3">
        {profileResults.map((result) => {
          const errorCount = result.findings.filter((f) => f.severity === 'error').length;
          const warningCount = result.findings.filter((f) => f.severity === 'warning').length;

          return (
            <div
              key={result.profileId}
              className="p-4 rounded-xl border border-[#6C3CAA]/25 bg-[#0F0F14]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#6C3CAA]/50 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {result.success ? (
                    <CheckCircleIcon className="w-5 h-5 text-[#22c55e]" />
                  ) : (
                    <XCircleIcon className="w-5 h-5 text-[#ef4444]" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#F5F5FA]">
                      {result.profileName}
                    </span>
                    <Badge variant={result.success ? 'success' : 'error'} size="sm">
                      {result.success ? 'PASSED' : 'FAILED'}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono text-[#646478] mt-0.5">{result.profileId}</p>
                </div>
              </div>

              {/* Stats & Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#646478] pl-8 sm:pl-0">
                <div className="flex items-center gap-1 font-mono">
                  <ClockIcon className="w-3.5 h-3.5 text-[#DC6428]" />
                  <span>{(result.duration / 1000).toFixed(2)}s</span>
                </div>

                {result.screenshots && result.screenshots.length > 0 && (
                  <div className="flex items-center gap-1">
                    <PhotoIcon className="w-3.5 h-3.5 text-[#c084fc]" />
                    <span>{result.screenshots.length} captured</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  {errorCount > 0 && (
                    <Badge variant="error" size="sm">
                      {errorCount} {errorCount === 1 ? 'error' : 'errors'}
                    </Badge>
                  )}
                  {warningCount > 0 && (
                    <Badge variant="warning" size="sm">
                      {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
                    </Badge>
                  )}
                  {result.findings.length === 0 && (
                    <Badge variant="success" size="sm">
                      0 findings
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
