'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { TestReportSummary } from '@/src/core/report-store';
import { ClockIcon, SparklesIcon } from '@heroicons/react/24/outline';

export interface TombstoneCardProps {
  report: TestReportSummary;
}

const noopSubscribe = () => () => {};

export const TombstoneCard: React.FC<TombstoneCardProps> = ({ report }) => {
  const isPeaceful = report.errorCount === 0;
  const isOld = useSyncExternalStore(
    noopSubscribe,
    () => Date.now() - report.startTime > 7 * 24 * 60 * 60 * 1000,
    () => false
  );

  return (
    <div
      className={`relative group rounded-t-[45px] rounded-b-[4px] border-2 transition-all duration-300 p-5 flex flex-col justify-between overflow-hidden ${
        isPeaceful
          ? 'bg-gradient-to-b from-[#1c1629] to-[#0A1824] border-[#46334b] hover:border-[#9aff9a] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(154,255,154,0.15)]'
          : 'bg-gradient-to-b from-[#1E293B] to-[#0F172A] border-[#475569] hover:border-[#F28B77] shadow-[0_8px_24px_rgba(0,0,0,0.6)] hover:shadow-[0_8px_30px_rgba(242,139,119,0.2)]'
      }`}
    >
      {/* Cobweb Indicator for older runs */}
      {isOld && (
        <div className="absolute top-1 right-1 opacity-40 pointer-events-none select-none text-xs">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8-8z"
              opacity="0.3"
            />
            <path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8z" opacity="0.5" />
          </svg>
        </div>
      )}

      {/* Headstone Engraving Arc */}
      <div className="text-center pt-2 pb-3 border-b border-[#46334b]/40">
        <div className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-serif font-bold uppercase tracking-widest text-[#d9d3e0] bg-[#0a0711]/70 border border-[#46334b] mb-1">
          {isPeaceful ? 'Peaceful Grave' : 'Restless Ground'}
        </div>
        <h4
          className="font-serif font-bold text-base text-[#fff1dc] truncate px-2 group-hover:text-[#ff791f] transition-colors"
          title={report.url}
        >
          {report.url}
        </h4>
        <div className="text-[11px] font-mono text-[#b9acbf] mt-0.5">
          {new Date(report.startTime).toLocaleDateString()} •{' '}
          {new Date(report.startTime).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {/* Epitaph Stats */}
      <div className="my-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-serif">
          <span className="text-[#d9d3e0]">Séance Duration:</span>
          <span className="font-mono text-[#fff1dc] flex items-center gap-1">
            <ClockIcon className="w-3.5 h-3.5 text-[#ff791f]" />
            {(report.duration / 1000).toFixed(1)}s
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-serif">
          <span className="text-[#d9d3e0]">Rites Performed:</span>
          <span className="font-mono text-[#fff1dc]">
            {report.successfulProfiles} / {report.totalProfiles}
          </span>
        </div>

        {/* Severity Count Pills */}
        <div className="pt-2 flex items-center justify-between gap-1.5 text-[11px] font-mono">
          <span
            className={`px-2 py-0.5 rounded border ${
              report.errorCount > 0
                ? 'bg-[#7C2D12]/60 text-[#F28B77] border-[#F28B77]/60'
                : 'bg-[#1c1629] text-[#b9acbf] border-[#46334b]'
            }`}
          >
            {report.errorCount} Screams
          </span>
          <span
            className={`px-2 py-0.5 rounded border ${
              report.warningCount > 0
                ? 'bg-[#78350F]/60 text-[#ff791f] border-[#ff791f]/60'
                : 'bg-[#1c1629] text-[#b9acbf] border-[#46334b]'
            }`}
          >
            {report.warningCount} Chills
          </span>
          <span className="px-2 py-0.5 rounded bg-[#1c1629] text-[#B9AEE0] border border-[#46334b]">
            {report.totalFindings} Total
          </span>
        </div>
      </div>

      {/* Headstone Base / Exhume Action */}
      <div className="pt-3 border-t border-[#46334b]/40 flex items-center justify-between">
        <span className="text-[11px] font-serif text-[#d9d3e0] italic">
          {isPeaceful ? 'No omens lingering' : 'Omens remain'}
        </span>
        <Link
          href={`/results/${report.id}`}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#1c1629] border border-[#ff791f]/40 text-[#ff791f] hover:bg-[#ff791f] hover:text-[#0a0711] text-xs font-serif font-bold transition-all shadow-[0_0_8px_rgba(255,121,31,0.2)] cursor-pointer"
        >
          <SparklesIcon className="w-3.5 h-3.5" />
          <span>Read Grimoire</span>
        </Link>
      </div>
    </div>
  );
};
