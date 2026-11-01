'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { Finding } from '@/src/types';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export interface FindingsTableProps {
  findings: Finding[];
}

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSeverity, setSelectedSeverity] = useState<'all' | 'error' | 'warning' | 'info'>(
    'all'
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      all: findings.length,
      error: findings.filter((f) => f.severity === 'error').length,
      warning: findings.filter((f) => f.severity === 'warning').length,
      info: findings.filter((f) => f.severity === 'info').length,
    };
  }, [findings]);

  const filteredFindings = useMemo(() => {
    return findings.filter((finding) => {
      const matchesSeverity = selectedSeverity === 'all' || finding.severity === selectedSeverity;
      const matchesSearch =
        searchTerm.trim() === '' ||
        finding.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        finding.profileId.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesSeverity && matchesSearch;
    });
  }, [findings, selectedSeverity, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const getSeverityBadge = (severity: Finding['severity']) => {
    switch (severity) {
      case 'error':
        return (
          <Badge variant="error" size="sm">
            ERROR
          </Badge>
        );
      case 'warning':
        return (
          <Badge variant="warning" size="sm">
            WARN
          </Badge>
        );
      case 'info':
        return (
          <Badge variant="info" size="sm">
            INFO
          </Badge>
        );
    }
  };

  return (
    <Card variant="default" className="p-6 space-y-5">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-lg text-[#F5F5FA]">
            Detected Issues & Findings ({filteredFindings.length})
          </h3>
          <p className="text-xs text-[#646478]">
            Filter findings by severity or search by keyword and category
          </p>
        </div>

        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSelectedSeverity(sev)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer flex items-center gap-1.5
                ${
                  selectedSeverity === sev
                    ? 'bg-[#582696] text-[#F5F5FA] shadow-[0_2px_8px_rgba(88,38,150,0.4)]'
                    : 'bg-[#373746]/50 text-[#646478] hover:text-[#F5F5FA] hover:bg-[#373746]'
                }
              `}
            >
              <span>{sev}</span>
              <span className="text-[10px] opacity-75 font-mono">({counts[sev]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div>
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter by keyword, profile name, or category..."
          icon={<MagnifyingGlassIcon className="w-4 h-4" />}
          className="text-xs"
        />
      </div>

      {/* Findings List */}
      {filteredFindings.length === 0 ? (
        <EmptyState
          icon={<ExclamationCircleIcon className="w-8 h-8 text-[#646478]" />}
          title="No Findings Found"
          description={
            searchTerm
              ? 'No issues match your search criteria. Try a different query or clear the filter.'
              : 'Zero issues detected in this category. Excellent test result!'
          }
        />
      ) : (
        <div className="space-y-2">
          {filteredFindings.map((finding) => {
            const isExpanded = expandedId === finding.id;

            return (
              <div
                key={finding.id}
                className="rounded-lg border border-[#6C3CAA]/20 bg-[#0F0F14]/50 overflow-hidden transition-colors hover:border-[#6C3CAA]/40"
              >
                <div
                  onClick={() => toggleExpand(finding.id)}
                  className="flex items-start gap-3 p-3.5 cursor-pointer select-none"
                >
                  <div className="mt-0.5 text-[#646478]">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-[#DC6428]" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-shrink-0 mt-0.5">{getSeverityBadge(finding.severity)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F5F5FA] leading-snug">
                      {finding.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#646478]">
                      <span className="font-mono text-[#DC6428]">{finding.profileId}</span>
                      <span>•</span>
                      <span className="bg-[#373746]/60 px-2 py-0.5 rounded text-[#F5F5FA]">
                        {finding.category}
                      </span>
                      {finding.location?.selector && (
                        <>
                          <span>•</span>
                          <span className="font-mono text-[10px] truncate max-w-xs text-[#a855f7]">
                            {finding.location.selector}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-10 pb-4 pt-1 border-t border-[#6C3CAA]/15 bg-[#373746]/10 text-xs space-y-3">
                    {finding.location && (
                      <div>
                        <span className="text-[#646478] font-semibold block mb-1">
                          Location Details:
                        </span>
                        <pre className="p-2.5 rounded bg-[#0F0F14] border border-[#6C3CAA]/20 font-mono text-[11px] text-[#86efac] overflow-x-auto">
                          {JSON.stringify(finding.location, null, 2)}
                        </pre>
                      </div>
                    )}

                    {finding.details && Object.keys(finding.details).length > 0 && (
                      <div>
                        <span className="text-[#646478] font-semibold block mb-1">
                          Observation Details:
                        </span>
                        <pre className="p-2.5 rounded bg-[#0F0F14] border border-[#6C3CAA]/20 font-mono text-[11px] text-[#7dd3fc] overflow-x-auto">
                          {JSON.stringify(finding.details, null, 2)}
                        </pre>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-[#646478] pt-2 border-t border-[#6C3CAA]/10">
                      <span>
                        Unique ID: <code className="font-mono text-[#F5F5FA]">{finding.id}</code>
                      </span>
                      <span>Detected: {new Date(finding.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
