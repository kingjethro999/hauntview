import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { WaxSeal } from './WaxSeal';
import { TestReport } from '@/src/types';
import {
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ClockIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline';

export interface ExecutiveSummaryProps {
  report: TestReport;
}

export const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ report }) => {
  const { summary, duration } = report;
  const passRate =
    summary.totalProfiles > 0
      ? ((summary.successfulProfiles / summary.totalProfiles) * 100).toFixed(1)
      : '0';

  const hasErrors = summary.findingsBySeverity.error > 0;
  const hasWarnings = summary.findingsBySeverity.warning > 0;
  const isPassing = !hasErrors;

  const sealStatus = hasErrors ? 'failed' : hasWarnings ? 'warnings' : 'passed';

  const cards = [
    {
      title: 'Pass Rate',
      loreTitle: 'Séance Cleared',
      value: `${passRate}%`,
      subtitle: `${summary.successfulProfiles} of ${summary.totalProfiles} profiles passed`,
      icon: <CheckBadgeIcon className="w-5 h-5 text-[#22c55e]" />,
      valueColor: Number(passRate) >= 80 ? 'text-[var(--success)]' : 'text-[#fca5a5]',
    },
    {
      title: 'Critical Errors',
      loreTitle: 'Screams',
      value: summary.findingsBySeverity.error,
      subtitle: 'Observed failures requiring fixes',
      icon: <ExclamationCircleIcon className="w-5 h-5 text-[#ef4444]" />,
      valueColor:
        summary.findingsBySeverity.error === 0 ? 'text-[var(--success)]' : 'text-[#fca5a5]',
    },
    {
      title: 'Warnings',
      loreTitle: 'Chills',
      value: summary.findingsBySeverity.warning,
      subtitle: 'Likely degrades user experience',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-[var(--pumpkin-fire)]" />,
      valueColor: 'text-[#fed7aa]',
    },
    {
      title: 'Info',
      loreTitle: 'Whispers',
      value: summary.findingsBySeverity.info,
      subtitle: 'Passive signals & observations',
      icon: <InformationCircleIcon className="w-5 h-5 text-[#38bdf8]" />,
      valueColor: 'text-[#7dd3fc]',
    },
    {
      title: 'Total Omens',
      loreTitle: 'Findings',
      value: summary.totalFindings,
      subtitle: `${summary.canonicalizedFindings} canonical clusters`,
      icon: <CpuChipIcon className="w-5 h-5 text-[#c084fc]" />,
      valueColor: 'text-[#c084fc]',
    },
    {
      title: 'Execution Time',
      loreTitle: 'Séance Length',
      value: `${(duration / 1000).toFixed(2)}s`,
      subtitle: `Completed at ${new Date(report.endTime).toLocaleTimeString()}`,
      icon: <ClockIcon className="w-5 h-5 text-[var(--pumpkin-fire)]" />,
      valueColor: 'text-[var(--bone-white)]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Victorian Folio Status Banner with Wax Seal */}
      <div
        className={`
          relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 p-6 rounded-[4px] border
          bg-gradient-to-r from-[var(--ghost-mist)] to-[var(--midnight-veil)]
          ${
            hasErrors
              ? 'border-[#F28B77]/60 shadow-[0_4px_24px_rgba(242,139,119,0.15)]'
              : hasWarnings
                ? 'border-[var(--pumpkin-fire)]/50 shadow-[0_4px_24px_rgba(255,121,31,0.15)]'
                : 'border-[#22c55e]/50 shadow-[0_4px_24px_rgba(34,197,94,0.15)]'
          }
        `}
      >
        {/* Decorative corner brackets */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[var(--grave-dust)]/60 pointer-events-none" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[var(--grave-dust)]/60 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[var(--grave-dust)]/60 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[var(--grave-dust)]/60 pointer-events-none" />

        <div className="flex items-center gap-4">
          {/* Stamped Wax Seal (hidden on mobile) */}
          <WaxSeal status={sealStatus} size="md" className="hidden sm:inline-flex flex-shrink-0" />

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--pumpkin-fire)]">
                Folio No. {report.id.slice(0, 8)}
              </span>
              <span className="text-[var(--grave-dust)]">•</span>
              <h2 className="font-display font-bold text-xl text-[var(--bone-white)]">
                {hasErrors
                  ? 'Apparitions Breached · Serious Errors Detected'
                  : hasWarnings
                    ? 'Chills Linger · Warnings Detected'
                    : 'The Living House Stands · All Rites Passed'}
              </h2>
              <Badge variant={isPassing ? 'success' : 'error'} size="sm">
                {isPassing ? 'CLEARED' : `${summary.findingsBySeverity.error} CRITICAL`}
              </Badge>
            </div>

            <p className="text-xs text-[var(--spirit-smoke)] mt-1.5 flex flex-wrap items-center gap-2">
              <span>Target:</span>
              <code className="text-[var(--pumpkin-fire)] font-mono bg-[var(--midnight-veil)] px-2 py-0.5 rounded border border-[var(--tombstone-gray)]">
                {report.url}
              </code>
              <span className="text-[var(--grave-dust)]">•</span>
              <span>
                {summary.successfulProfiles} of {summary.totalProfiles} rites passed cleanly
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-1.5 text-xs text-[var(--spirit-smoke)] flex-shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-[var(--tombstone-gray)]">
          <span className="text-[11px] uppercase tracking-wider text-[var(--grave-dust)]">
            Crypt Record ID
          </span>
          <span className="font-mono text-xs text-[var(--bone-white)] bg-[var(--midnight-veil)] px-2.5 py-1 rounded border border-[var(--tombstone-gray)]">
            {report.id}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, idx) => (
          <Card
            key={idx}
            variant="default"
            className="p-4 bg-[var(--ghost-mist)]/80 border-[var(--tombstone-gray)] hover:border-[var(--grave-dust)] transition-colors"
          >
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <div>
                <span className="text-xs font-semibold text-[var(--bone-white)] block">
                  {card.title}
                </span>
                <span className="text-[10px] font-mono text-[var(--pumpkin-fire)] block">
                  {card.loreTitle}
                </span>
              </div>
              {card.icon}
            </div>
            <div className={`font-display font-bold text-2xl ${card.valueColor} my-1`}>
              {card.value}
            </div>
            <div className="text-[10px] text-[var(--spirit-smoke)] truncate" title={card.subtitle}>
              {card.subtitle}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
