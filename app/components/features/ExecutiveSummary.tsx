import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
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

  const isPassing = summary.findingsBySeverity.error === 0;

  const cards = [
    {
      title: 'Pass Rate',
      value: `${passRate}%`,
      subtitle: `${summary.successfulProfiles} of ${summary.totalProfiles} profiles passed`,
      icon: <CheckBadgeIcon className="w-5 h-5 text-[#22c55e]" />,
      valueColor: Number(passRate) >= 80 ? 'text-[#86efac]' : 'text-[#fca5a5]',
    },
    {
      title: 'Errors Found',
      value: summary.findingsBySeverity.error,
      subtitle: 'Critical issues requiring fixes',
      icon: <ExclamationCircleIcon className="w-5 h-5 text-[#ef4444]" />,
      valueColor: summary.findingsBySeverity.error === 0 ? 'text-[#86efac]' : 'text-[#fca5a5]',
    },
    {
      title: 'Warnings',
      value: summary.findingsBySeverity.warning,
      subtitle: 'Non-critical best practice alerts',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-[#f97316]" />,
      valueColor: 'text-[#fed7aa]',
    },
    {
      title: 'Info Observations',
      value: summary.findingsBySeverity.info,
      subtitle: 'Optimization recommendations',
      icon: <InformationCircleIcon className="w-5 h-5 text-[#38bdf8]" />,
      valueColor: 'text-[#7dd3fc]',
    },
    {
      title: 'Total Findings',
      value: summary.totalFindings,
      subtitle: `${summary.canonicalizedFindings} canonical clusters`,
      icon: <CpuChipIcon className="w-5 h-5 text-[#c084fc]" />,
      valueColor: 'text-[#c084fc]',
    },
    {
      title: 'Execution Time',
      value: `${(duration / 1000).toFixed(2)}s`,
      subtitle: `Completed at ${new Date(report.endTime).toLocaleTimeString()}`,
      icon: <ClockIcon className="w-5 h-5 text-[#DC6428]" />,
      valueColor: 'text-[#F5F5FA]',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div
        className={`
          flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border
          ${
            isPassing
              ? 'bg-[#16a34a]/10 border-[#16a34a]/40 shadow-[0_4px_20px_rgba(22,163,74,0.15)]'
              : 'bg-[#dc2626]/10 border-[#dc2626]/40 shadow-[0_4px_20px_rgba(220,38,38,0.15)]'
          }
        `}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold flex-shrink-0
              ${isPassing ? 'bg-[#16a34a]/20 text-[#22c55e]' : 'bg-[#dc2626]/20 text-[#ef4444]'}
            `}
          >
            {isPassing ? '✓' : '✗'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-bold text-xl text-[#F5F5FA]">
                {isPassing ? 'Test Suite Passed' : 'Issues Detected Across Profiles'}
              </h2>
              <Badge variant={isPassing ? 'success' : 'error'}>
                {isPassing ? 'PASS' : `${summary.findingsBySeverity.error} ERRORS`}
              </Badge>
            </div>
            <p className="text-xs text-[#646478] mt-1">
              Tested URL: <code className="text-[#DC6428] font-mono">{report.url}</code>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#646478] sm:self-center">
          <span>Run ID:</span>
          <span className="font-mono text-[#F5F5FA] bg-[#0F0F14]/60 px-2 py-1 rounded border border-[#6C3CAA]/30">
            {report.id}
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card, idx) => (
          <Card key={idx} variant="default" className="p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs text-[#646478] font-medium">{card.title}</span>
              {card.icon}
            </div>
            <div className={`font-display font-bold text-2xl ${card.valueColor} mb-1`}>
              {card.value}
            </div>
            <div className="text-[11px] text-[#646478] truncate" title={card.subtitle}>
              {card.subtitle}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
