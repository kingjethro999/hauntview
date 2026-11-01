'use client';

import React, { useState } from 'react';
import { TestReport } from '@/src/types';
import { Container } from '../../components/layout/Container';
import { ExecutiveSummary } from '../../components/features/ExecutiveSummary';
import { FindingsTable } from '../../components/features/FindingsTable';
import { ProfileResultsList } from '../../components/features/ProfileResultsList';
import { ReportActions } from '../../components/features/ReportActions';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ListBulletIcon, Squares2X2Icon, CodeBracketIcon } from '@heroicons/react/24/outline';

export interface ReportViewClientProps {
  report: TestReport;
}

export const ReportViewClient: React.FC<ReportViewClientProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'profiles' | 'raw'>('findings');

  const allFindings = report.profileResults.flatMap((p) => p.findings);

  const tabs = [
    {
      id: 'findings',
      label: `All Findings (${allFindings.length})`,
      icon: <ListBulletIcon className="w-4 h-4" />,
    },
    {
      id: 'profiles',
      label: `Profile Results (${report.profileResults.length})`,
      icon: <Squares2X2Icon className="w-4 h-4" />,
    },
    {
      id: 'raw',
      label: 'Raw JSON Report',
      icon: <CodeBracketIcon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="py-8 md:py-12 space-y-8">
      <Container size="lg">
        {/* Action Header */}
        <div className="mb-6">
          <ReportActions report={report} />
        </div>

        {/* Executive Summary */}
        <div className="mb-8">
          <ExecutiveSummary report={report} />
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 border-b border-[#6C3CAA]/30 pb-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as 'findings' | 'profiles' | 'raw')}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'bg-[#582696] text-[#F5F5FA] shadow-[0_2px_10px_rgba(88,38,150,0.4)]'
                    : 'text-[#646478] hover:text-[#F5F5FA] hover:bg-[#373746]/50'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'findings' && <FindingsTable findings={allFindings} />}

        {activeTab === 'profiles' && <ProfileResultsList profileResults={report.profileResults} />}

        {activeTab === 'raw' && (
          <Card variant="default" className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-lg text-[#F5F5FA]">
                Complete TestReport JSON Data
              </h3>
              <Badge variant="outline" size="sm">
                {(JSON.stringify(report).length / 1024).toFixed(1)} KB
              </Badge>
            </div>
            <pre className="p-4 rounded-xl bg-[#0F0F14] border border-[#6C3CAA]/30 text-xs font-mono text-[#86efac] overflow-x-auto max-h-[600px] scrollbar-thin">
              {JSON.stringify(report, null, 2)}
            </pre>
          </Card>
        )}
      </Container>
    </div>
  );
};
