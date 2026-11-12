'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from './components/layout/Container';
import { TestReportSummary } from '@/src/core/report-store';
import { useCryptStore } from '@/src/lib/client/crypt-store';
import { useCryptRuns } from '@/src/lib/client/use-crypt-runs';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import { EmptyState } from './components/ui/EmptyState';
import { GhostLoader } from './components/features/GhostLoader';
import { AVAILABLE_PROFILES } from './components/features/rites';
import { SeanceTable } from './components/features/SeanceTable';
import { CandleIndicator } from './components/features/CandleIndicator';

export default function HomePage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const { runs, loading: isLoadingRuns } = useCryptRuns();
  const recentRuns = runs.slice(0, 4);

  const handleStartTest = async (url: string, profiles: string[]) => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, profiles }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.report?.id) {
        // Save to browser persistent local storage
        useCryptStore.getState().addReport(data.report);
        setIsRunning(false);
        router.push(`/results/${data.report.id}`);
      } else {
        throw new Error('Test did not return a report ID.');
      }
    } catch (err) {
      setIsRunning(false);
      throw err;
    }
  };

  const verdictOf = (run: TestReportSummary) =>
    run.errorCount > 0
      ? { word: 'Restless', tone: 'text-[#ffb3ad]', candle: 'findings' as const }
      : run.warningCount > 0
        ? { word: 'Uneasy', tone: 'text-[#ffd79e]', candle: 'findings' as const }
        : { word: 'At peace', tone: 'text-[#b9f0c9]', candle: 'ok' as const };

  return (
    <div className="relative overflow-x-clip">
      <section className="hv-seance" aria-labelledby="seance-title">
        <Container size="lg" className="space-y-10 sm:space-y-14">
          <header className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-end">
            <div className="space-y-5">
              <p className="hv-eyebrow hv-rise">
                Local-first web testing · {AVAILABLE_PROFILES.length} rites
              </p>
              <h1
                id="seance-title"
                className="hv-display hv-rise"
                style={{ '--i': 1 } as React.CSSProperties}
              >
                Who haunts <br className="hidden sm:block" />
                your{' '}
                <em className="hv-glitch" data-text="website?">
                  website?
                </em>
              </h1>
            </div>
            <p className="hv-lede hv-rise lg:pb-3" style={{ '--i': 2 } as React.CSSProperties}>
              Name the house. Light a candle for every way it could fail: offline, on a slow phone,
              without fonts, in Arabic, by keyboard alone. HauntView runs each rite in a real
              browser and brings back what it saw.
            </p>
          </header>

          <div className="hv-rise" style={{ '--i': 3 } as React.CSSProperties}>
            <SeanceTable onStartTest={handleStartTest} isRunning={isRunning} />
          </div>
        </Container>
      </section>

      <section aria-labelledby="recent-title" className="pb-20 sm:pb-28">
        <Container size="lg" className="space-y-6">
          <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-3">
              <p className="hv-eyebrow">Recently laid to rest</p>
              <h2 id="recent-title" className="hv-h2">
                The last <em>séances</em>
              </h2>
            </div>
            {recentRuns.length > 0 && (
              <Link href="/crypt" className="hv-btn hv-btn--outline">
                Enter the crypt
                <ArrowRightIcon className="w-4 h-4" aria-hidden="true" />
              </Link>
            )}
          </header>

          {isLoadingRuns ? (
            <div className="hv-empty">
              <GhostLoader label="Reading the headstones…" />
            </div>
          ) : recentRuns.length === 0 ? (
            <EmptyState
              art="crypt"
              title="Nothing haunts this crypt yet"
              description="Every séance you hold is laid to rest here, so tonight’s apparitions can be compared with last week’s. Light a candle above and begin."
            />
          ) : (
            <ul className="hv-rows">
              {recentRuns.slice(0, 4).map((run) => {
                const v = verdictOf(run);
                return (
                  <li key={run.id} className="hv-row">
                    <CandleIndicator status={v.candle} size="sm" decorative />
                    <div className="min-w-0">
                      <p className="hv-row__url">
                        <Link href={`/results/${run.id}`}>{run.url}</Link>
                      </p>
                      <p className="hv-mono-label mt-1 !tracking-[0.08em]">
                        {new Date(run.startTime).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        · {run.totalFindings} findings · {run.successfulProfiles}/
                        {run.totalProfiles} rites
                      </p>
                    </div>
                    <span className={`hv-row__verdict ${v.tone}`}>{v.word}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>
    </div>
  );
}
