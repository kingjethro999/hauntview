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
  LightBulbIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export interface FindingsTableProps {
  findings: Finding[];
  onExorcise?: (finding: Finding) => void;
}

export const FindingsTable: React.FC<FindingsTableProps> = ({ findings, onExorcise }) => {
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

  const getRemediation = (category: string, message: string): string => {
    const cat = category.toLowerCase();
    const msg = message.toLowerCase();

    if (cat.includes('touch') || msg.includes('touch')) {
      return 'Increase element padding, min-width, and min-height to at least 48x48px (or 44x44px for iOS HIG) to comply with WCAG 2.5.5 / 2.5.8 Target Size standards.';
    }
    if (cat.includes('contrast') || msg.includes('contrast')) {
      return 'Adjust foreground or background color to achieve a minimum contrast ratio of 4.5:1 for normal text (3:1 for large text and UI components) per WCAG 1.4.3.';
    }
    if (cat.includes('responsive') || cat.includes('scroll') || msg.includes('scroll')) {
      return 'Remove fixed pixel widths and use fluid layout containers (max-width: 100%, flex-wrap, or CSS grid) to avoid horizontal viewport scrolling.';
    }
    if (cat.includes('alt') || cat.includes('image') || msg.includes('alt')) {
      return 'Provide descriptive alt attributes on all informative images, and empty alt="" on purely decorative images per WCAG 1.1.1.';
    }
    if (cat.includes('keyboard') || msg.includes('tabindex') || msg.includes('focus')) {
      return 'Ensure all interactive elements are reachable via Tab navigation, maintain a logical DOM order, and provide high-contrast visible focus rings.';
    }
    if (cat.includes('i18n') || cat.includes('rtl')) {
      return 'Use CSS logical properties (margin-inline, padding-inline, start/end) instead of physical left/right to ensure proper bidirectional mirroring.';
    }
    if (cat.includes('performance') || msg.includes('lcp') || msg.includes('cls')) {
      return 'Defer non-critical scripts, preconnect to critical origins, size image dimensions explicitly, and compress assets to optimize Core Web Vitals.';
    }
    return 'Inspect element markup and ensure full compliance with WCAG AA accessibility standards and cross-browser styling guidelines.';
  };

  return (
    <Card variant="default" className="p-6 space-y-5">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-lg text-[#fff1dc]">
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
                    ? 'bg-[#4a2b8a] text-[#fff1dc] shadow-[0_2px_8px_rgba(74,43,138,0.4)]'
                    : 'bg-[#2d1a4a]/50 text-[#646478] hover:text-[#fff1dc] hover:bg-[#2d1a4a]'
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
          {filteredFindings.map((finding, idx) => {
            const isExpanded = expandedId === finding.id;

            return (
              <div
                key={`${finding.id}-${idx}`}
                className="rounded-lg border border-[#6C3CAA]/20 bg-[#0a0711]/50 overflow-hidden transition-colors hover:border-[#6C3CAA]/40"
              >
                <div
                  onClick={() => toggleExpand(finding.id)}
                  className="flex items-start gap-3 p-3.5 cursor-pointer select-none"
                >
                  <div className="mt-0.5 text-[#646478]">
                    {isExpanded ? (
                      <ChevronDownIcon className="w-4 h-4 text-[#ff791f]" />
                    ) : (
                      <ChevronRightIcon className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 mt-0.5">{getSeverityBadge(finding.severity)}</div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#fff1dc] leading-snug">
                        {finding.message}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-[#646478]">
                        <span className="font-mono text-[#ff791f]">{finding.profileId}</span>
                        <span>•</span>
                        <span className="bg-[#2d1a4a]/60 px-2 py-0.5 rounded text-[#fff1dc]">
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
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-6 sm:px-10 pb-5 pt-3 border-t border-[#6C3CAA]/20 bg-[#0a0711]/70 text-xs space-y-4">
                    {/* Remediation Guidance */}
                    <div className="p-3 rounded-lg bg-[#4a2b8a]/20 border border-[#6C3CAA]/30">
                      <div className="flex items-center gap-1.5 font-semibold text-[#ff791f] mb-1">
                        <LightBulbIcon className="w-4 h-4" />
                        <span>Recommended Remediation</span>
                      </div>
                      <p className="text-[#fff1dc] text-xs leading-relaxed">
                        {getRemediation(finding.category, finding.message)}
                      </p>
                    </div>

                    {/* Location Info (Only if selector or file/line exists) */}
                    {finding.location?.selector && (
                      <div>
                        <span className="text-[#646478] font-semibold block mb-1">
                          Target DOM Selector:
                        </span>
                        <code className="inline-block p-2 rounded bg-[#0a0711] border border-[#6C3CAA]/30 font-mono text-xs text-[#a855f7]">
                          {finding.location.selector}
                        </code>
                      </div>
                    )}

                    {finding.location?.file && (
                      <div>
                        <span className="text-[#646478] font-semibold block mb-1">
                          Source Location:
                        </span>
                        <code className="inline-block p-2 rounded bg-[#0a0711] border border-[#6C3CAA]/30 font-mono text-xs text-[#86efac]">
                          {finding.location.file}
                          {finding.location.line ? `:${finding.location.line}` : ''}
                        </code>
                      </div>
                    )}

                    {/* Structured Details if available */}
                    {finding.details && Object.keys(finding.details).length > 0 && (
                      <div>
                        <span className="text-[#646478] font-semibold block mb-1.5">
                          Observation Breakdown:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(finding.details).map(([key, val]) => (
                            <div
                              key={key}
                              className="p-2.5 rounded bg-[#2d1a4a]/40 border border-[#6C3CAA]/20 flex flex-col justify-between"
                            >
                              <span className="text-[10px] text-[#646478] uppercase tracking-wider font-semibold">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </span>
                              <span className="font-mono text-xs text-[#7dd3fc] mt-1 break-all">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technical Metadata Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#d9d3e0] pt-2 border-t border-[#46334b]/30">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>
                          Rite Engine:{' '}
                          <strong className="text-[#fff1dc]">{finding.profileId}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Unique ID: <code className="font-mono text-[#fff1dc]">{finding.id}</code>
                        </span>
                      </div>

                      {onExorcise && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onExorcise(finding);
                          }}
                          className="px-2.5 py-1 rounded-[4px] bg-[#ff791f]/15 border border-[#ff791f]/50 text-[#ff791f] hover:bg-[#ff791f] hover:text-[#0a0711] font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <SparklesIcon className="w-3.5 h-3.5" />
                          <span>Fix with Kiro</span>
                        </button>
                      )}
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
