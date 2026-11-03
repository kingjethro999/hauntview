'use client';

import React, { useState } from 'react';
import { TestReport, Finding, ProfileResult } from '@/src/types';
import { Container } from '../../components/layout/Container';
import { ExecutiveSummary } from '../../components/features/ExecutiveSummary';
import { FindingsTable } from '../../components/features/FindingsTable';
import { ProfileResultsList } from '../../components/features/ProfileResultsList';
import { ReportActions } from '../../components/features/ReportActions';
import { CameoFrame } from '../../components/features/CameoFrame';
import { TheVeil, OmenPin } from '../../components/features/TheVeil';
import { WispGhost, WispState } from '../../components/features/WispGhost';
import { ExorcismPromptModal } from '../../components/features/ExorcismPromptModal';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import {
  ListBulletIcon,
  Squares2X2Icon,
  CodeBracketIcon,
  PhotoIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export interface ReportViewClientProps {
  report: TestReport;
}

export const ReportViewClient: React.FC<ReportViewClientProps> = ({ report }) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'apparitions' | 'profiles' | 'raw'>(
    'findings'
  );
  const [selectedProfileId, setSelectedProfileId] = useState<string>(
    report.profileResults[0]?.profileId || ''
  );
  const [exorciseFinding, setExorciseFinding] = useState<Finding | null>(null);

  const allFindings = report.profileResults.flatMap((p) => p.findings);
  const errorCount = report.summary.findingsBySeverity.error;
  const warningCount = report.summary.findingsBySeverity.warning;

  // Wisp status reflection
  const wispState: WispState =
    errorCount > 0 ? 'alarmed' : warningCount > 0 ? 'curious' : 'delighted';

  const wispQuote =
    errorCount > 0
      ? 'The apparitions have breached the house! Review the omens below or command an exorcism with Kiro.'
      : warningCount > 0
        ? 'A lingering chill remains in these corridors. Non-critical warnings observed.'
        : 'The house is calm and illuminated. Not a single restless apparition was caught on the plates!';

  // Selected profile for Gallery of Apparitions / The Veil
  const selectedProfile: ProfileResult | undefined =
    report.profileResults.find((p) => p.profileId === selectedProfileId) ||
    report.profileResults[0];

  // Baseline profile (desktop baseline capture)
  const baselineProfile =
    report.profileResults.find((p) => p.profileId === 'desktop' || p.profileId === 'desktop-4k') ||
    report.profileResults[0];

  const baselineFilename =
    baselineProfile?.screenshots?.[0]?.fileName ||
    (baselineProfile?.findings?.find((f) => f.details?.screenshot)?.details?.screenshot as
      string | undefined);

  const apparitionFilename =
    selectedProfile?.screenshots?.[0]?.fileName ||
    (selectedProfile?.findings?.find((f) => f.details?.screenshot)?.details?.screenshot as
      string | undefined);

  const livingSrc = baselineFilename ? `/api/screenshots/${baselineFilename}` : undefined;
  const apparitionSrc = apparitionFilename ? `/api/screenshots/${apparitionFilename}` : undefined;

  // Map findings of selected profile to Veil pins
  const veilPins: OmenPin[] = (selectedProfile?.findings || []).map((f, idx) => ({
    id: f.id,
    title: f.message,
    severity: f.severity === 'error' ? 'serious' : f.severity === 'warning' ? 'warning' : 'info',
    xPercent: 18 + ((idx * 27) % 64),
    yPercent: 22 + ((idx * 21) % 56),
  }));

  const tabs = [
    {
      id: 'findings',
      label: `All Omens (${allFindings.length})`,
      plain: 'Findings',
      icon: <ListBulletIcon className="w-4 h-4" />,
    },
    {
      id: 'apparitions',
      label: `Gallery of Apparitions (${report.profileResults.length})`,
      plain: 'Spirit Photos & Veil',
      icon: <PhotoIcon className="w-4 h-4" />,
    },
    {
      id: 'profiles',
      label: `Rites Breakdown (${report.profileResults.length})`,
      plain: 'Profiles',
      icon: <Squares2X2Icon className="w-4 h-4" />,
    },
    {
      id: 'raw',
      label: 'Grimoire Ledger (JSON)',
      plain: 'Raw Data',
      icon: <CodeBracketIcon className="w-4 h-4" />,
    },
  ];

  return (
    <div className="py-8 md:py-12 space-y-8">
      <Container size="lg">
        {/* Folio Action Bar */}
        <div className="mb-6">
          <ReportActions report={report} />
        </div>

        {/* Wisp Ghost Folio Host Banner */}
        <div className="mb-6 p-4 rounded-[6px] border border-[#46334b] bg-[#1c1629]/60 backdrop-blur-sm flex items-center gap-4">
          <div className="flex-shrink-0">
            <WispGhost state={wispState} size="sm" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-semibold text-sm text-[#ff791f]">
                Wisp • Séance Host
              </span>
              <Badge
                variant={errorCount > 0 ? 'error' : warningCount > 0 ? 'warning' : 'success'}
                size="sm"
              >
                {errorCount > 0 ? 'ALARMED' : warningCount > 0 ? 'WATCHFUL' : 'DELIGHTED'}
              </Badge>
            </div>
            <p className="text-xs text-[#fff1dc] mt-0.5 leading-relaxed">{wispQuote}</p>
          </div>
          {allFindings.length > 0 && (
            <button
              type="button"
              onClick={() => setExorciseFinding(allFindings[0])}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#ff791f]/15 border border-[#ff791f]/50 text-[#ff791f] hover:bg-[#ff791f] hover:text-[#0a0711] text-xs font-semibold transition-all cursor-pointer flex-shrink-0"
            >
              <SparklesIcon className="w-4 h-4" />
              <span>Exorcise with Kiro</span>
            </button>
          )}
        </div>

        {/* Executive Summary Folio with Wax Seal */}
        <div className="mb-8">
          <ExecutiveSummary report={report} />
        </div>

        {/* Grimoire Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#46334b] pb-3 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() =>
                setActiveTab(tab.id as 'findings' | 'apparitions' | 'profiles' | 'raw')
              }
              className={`
                flex items-center gap-2 px-4 py-2 rounded-[6px] text-xs font-semibold transition-all cursor-pointer
                ${
                  activeTab === tab.id
                    ? 'bg-[#1c1629] text-[#ff791f] border border-[#ff791f]/60 shadow-[0_2px_12px_rgba(255,121,31,0.2)]'
                    : 'text-[#d9d3e0] hover:text-[#fff1dc] hover:bg-[#1c1629]/40 border border-transparent'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab 1: Findings Table */}
        {activeTab === 'findings' && (
          <FindingsTable
            findings={allFindings}
            onExorcise={(finding) => setExorciseFinding(finding)}
          />
        )}

        {/* Tab 2: Gallery of Apparitions & The Veil */}
        {activeTab === 'apparitions' && (
          <div className="space-y-6">
            <Card variant="default" className="p-6 bg-[#1c1629]/70 border-[#46334b]">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-lg text-[#fff1dc]">
                    Gallery of Apparitions
                  </h3>
                  <Badge variant="outline" size="sm">
                    Spirit Photography Plates
                  </Badge>
                </div>
                <p className="text-xs text-[#d9d3e0] mt-1">
                  Select an apparition plate to part The Veil and inspect visual divergence against
                  the living baseline.
                </p>
              </div>

              {/* Cameo Oval Plates Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pb-4">
                {report.profileResults.map((result) => {
                  const resultErrors = result.findings.filter((f) => f.severity === 'error').length;
                  const resultWarnings = result.findings.filter(
                    (f) => f.severity === 'warning'
                  ).length;
                  const severity =
                    resultErrors > 0 ? 'serious' : resultWarnings > 0 ? 'warning' : 'info';

                  return (
                    <CameoFrame
                      key={result.profileId}
                      title={result.profileName}
                      subtitle={result.profileId}
                      findingCount={result.findings.length}
                      severity={severity}
                      isSelected={selectedProfileId === result.profileId}
                      onClick={() => setSelectedProfileId(result.profileId)}
                    />
                  );
                })}
              </div>
            </Card>

            {/* The Veil Inspector for Selected Profile */}
            {selectedProfile && (
              <Card variant="default" className="p-6 bg-[#1c1629]/90 border-[#46334b]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#46334b]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-mono text-[#ff791f]">
                        The Veil Inspector
                      </span>
                      <span className="text-[#b9acbf]">•</span>
                      <h4 className="font-display font-bold text-base text-[#fff1dc]">
                        {selectedProfile.profileName} ({selectedProfile.profileId})
                      </h4>
                    </div>
                    <p className="text-xs text-[#d9d3e0] mt-0.5">
                      Drag the planchette handle left and right to inspect how this condition
                      manifests.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={selectedProfile.success ? 'success' : 'error'}>
                      {selectedProfile.success
                        ? 'RITE PASSED'
                        : `${selectedProfile.findings.length} OMENS`}
                    </Badge>
                  </div>
                </div>

                {/* The Veil Comparison Component */}
                <div className="max-w-4xl mx-auto">
                  <TheVeil
                    livingSrc={livingSrc}
                    apparitionSrc={apparitionSrc}
                    livingLabel={`Living Page (${baselineProfile?.profileName || 'Baseline'})`}
                    apparitionLabel={`Apparition: ${selectedProfile?.profileName || 'Under Condition'}`}
                    pins={veilPins}
                    onPinClick={(pinId) => {
                      const found = selectedProfile?.findings.find((f) => f.id === pinId);
                      if (found) setExorciseFinding(found);
                    }}
                  />
                </div>

                {/* Profile Findings List under the Veil */}
                {selectedProfile.findings.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-[#46334b]">
                    <h5 className="font-display font-semibold text-xs uppercase tracking-wider text-[#ff791f] mb-3">
                      Omens Detected in this Rite ({selectedProfile.findings.length})
                    </h5>
                    <div className="space-y-2">
                      {selectedProfile.findings.map((finding, idx) => (
                        <div
                          key={`${finding.id}-${idx}`}
                          className="p-3 rounded-[4px] bg-[#0a0711] border border-[#46334b] flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge
                              variant={
                                finding.severity === 'error'
                                  ? 'error'
                                  : finding.severity === 'warning'
                                    ? 'warning'
                                    : 'info'
                              }
                              size="sm"
                            >
                              {finding.severity.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-[#fff1dc] truncate">
                              {finding.message}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExorciseFinding(finding)}
                            className="text-xs text-[#ff791f] hover:underline font-semibold flex-shrink-0 cursor-pointer"
                          >
                            Exorcise
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </div>
        )}

        {/* Tab 3: Profile Results List */}
        {activeTab === 'profiles' && <ProfileResultsList profileResults={report.profileResults} />}

        {/* Tab 4: Raw JSON Grimoire Ledger */}
        {activeTab === 'raw' && (
          <Card variant="default" className="p-6 bg-[#1c1629] border-[#46334b] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-lg text-[#fff1dc]">
                  Grimoire Ledger Data
                </h3>
                <p className="text-xs text-[#d9d3e0]">
                  Full serialised TestReport object with complete profile breakdown and metrics
                </p>
              </div>
              <Badge variant="outline" size="sm">
                {(JSON.stringify(report).length / 1024).toFixed(1)} KB
              </Badge>
            </div>
            <pre className="p-4 rounded-[4px] bg-[#0a0711] border border-[#46334b] text-xs font-mono text-[#9aff9a] overflow-x-auto max-h-[600px] scrollbar-thin">
              {JSON.stringify(report, null, 2)}
            </pre>
          </Card>
        )}
      </Container>

      {/* Exorcism Prompt Modal */}
      <ExorcismPromptModal
        isOpen={!!exorciseFinding}
        onClose={() => setExorciseFinding(null)}
        finding={exorciseFinding}
        targetUrl={report.url}
      />
    </div>
  );
};
