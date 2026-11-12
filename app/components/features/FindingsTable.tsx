'use client';

import React, { useState, useMemo } from 'react';
import { EmptyState } from '../ui/EmptyState';
import { Finding } from '@/src/types';
import { MagnifyingGlassIcon, ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';

export interface FindingsTableProps {
  findings: Finding[];
  onExorcise?: (finding: Finding) => void;
}

const SEV_NAME = { all: 'All', error: 'Serious', warning: 'Warning', info: 'Info' } as const;
const SEV_CHIP = { error: 'hv-chip--scream', warning: 'hv-chip--chill', info: '' } as const;

/** Strip terminal colour codes and split Playwright's call log off the headline. */
const ANSI = /\u001b\[[0-9;]*m|\[\d+m/g;
export function cleanMessage(message: string) {
  const plain = message.replace(ANSI, '');
  const cut = plain.search(/\n|Call log:/);
  if (cut === -1) return { headline: plain, rest: '' };
  return { headline: plain.slice(0, cut).trim(), rest: plain.slice(cut).trim() };
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
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="hv-segmented self-start" role="group" aria-label="Filter by severity">
          {(['all', 'error', 'warning', 'info'] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              aria-pressed={selectedSeverity === sev}
              onClick={() => setSelectedSeverity(sev)}
            >
              {SEV_NAME[sev]}
              <span className="font-mono text-xs opacity-70">{counts[sev]}</span>
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Search findings</span>
          <MagnifyingGlassIcon
            className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--hv-ash)]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search message, rite or category"
            className="hv-input !pl-11 !min-h-[44px] !rounded-full !text-sm !font-[family-name:var(--hv-font-body)]"
          />
        </label>
      </div>

      {filteredFindings.length === 0 ? (
        <EmptyState
          art={searchTerm ? 'ghost' : 'candle'}
          title={searchTerm ? 'Nothing answers to that name' : 'No findings here'}
          description={
            searchTerm
              ? 'No finding matches your search. Try a rite name like “offline”, or clear the search.'
              : 'This severity came back empty for every rite.'
          }
        />
      ) : (
        <ul className="hv-rows">
          {filteredFindings.map((finding, idx) => {
            const key = `${finding.id}-${idx}`;
            const isExpanded = expandedId === key;
            const { headline, rest } = cleanMessage(finding.message);
            return (
              <li key={key} className="border-b border-[var(--hv-seam)]">
                <button
                  type="button"
                  onClick={() => toggleExpand(key)}
                  aria-expanded={isExpanded}
                  aria-controls={`finding-${key}`}
                  className="w-full text-left grid grid-cols-[auto_1fr_auto] items-start gap-4 py-4 px-1 sm:px-2 hover:bg-[rgba(255,255,255,0.025)] transition-colors"
                >
                  <span className={`hv-chip mt-0.5 ${SEV_CHIP[finding.severity]}`}>
                    {SEV_NAME[finding.severity]}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[var(--hv-bone)] leading-snug break-words">
                      {headline}
                    </span>
                    <span className="hv-mono-label mt-1.5 block !tracking-[0.06em] !normal-case">
                      {finding.profileId} · {finding.category}
                    </span>
                  </span>
                  <ChevronDownIcon
                    className={`w-4 h-4 mt-1 text-[var(--hv-ash)] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isExpanded && (
                  <div id={`finding-${key}`} className="pb-6 px-1 sm:pl-[6.5rem] space-y-5 text-sm">
                    <div className="border-l-2 border-[var(--hv-ember)] pl-4">
                      <p className="hv-mono-label mb-1">What to do</p>
                      <p className="text-[var(--hv-bone-dim)]">
                        {getRemediation(finding.category, finding.message)}
                      </p>
                    </div>

                    {rest && (
                      <pre className="p-4 rounded-[var(--hv-radius)] bg-[var(--hv-crypt)] border border-[var(--hv-seam)] text-xs font-mono text-[var(--hv-ash)] whitespace-pre-wrap break-words max-h-60 overflow-auto">
                        {rest}
                      </pre>
                    )}

                    {(finding.location?.selector || finding.location?.file) && (
                      <p className="font-mono text-xs text-[var(--hv-moon)] break-all">
                        {finding.location?.selector}
                        {finding.location?.file &&
                          ` ${finding.location.file}${finding.location.line ? `:${finding.location.line}` : ''}`}
                      </p>
                    )}

                    {finding.details && Object.keys(finding.details).length > 0 && (
                      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
                        {Object.entries(finding.details).map(([k, val]) => (
                          <div key={k} className="min-w-0">
                            <dt className="hv-mono-label !tracking-[0.08em]">
                              {k.replace(/([A-Z])/g, ' $1')}
                            </dt>
                            <dd className="font-mono text-xs text-[var(--hv-bone-dim)] break-all mt-0.5">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}

                    {onExorcise && (
                      <button
                        type="button"
                        onClick={() => onExorcise(finding)}
                        className="hv-btn hv-btn--outline hv-btn--sm"
                      >
                        <SparklesIcon className="w-4 h-4" aria-hidden="true" />
                        Draft a fix prompt
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
