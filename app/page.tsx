'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from './components/layout/Container';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { TestLauncher } from './components/features/TestLauncher';
import { PlanchetteProgress } from './components/features/PlanchetteProgress';
import { TheVeil } from './components/features/TheVeil';
import { SpiritBoardBackdrop } from './components/features/SpiritBoardBackdrop';
import { TestReportSummary } from '@/src/core/report-store';
import {
  SparklesIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeUrl, setActiveUrl] = useState<string>('');
  const [activeCount, setActiveCount] = useState<number>(15);
  const [recentRuns, setRecentRuns] = useState<TestReportSummary[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/results')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.reports)) {
          setRecentRuns(data.reports.slice(0, 6));
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch recent test runs:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingRuns(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStartTest = async (
    url: string,
    profiles: string[],
    format?: 'html' | 'markdown' | 'json'
  ) => {
    if (isRunning) return;
    setIsRunning(true);
    setActiveUrl(url);
    setActiveCount(profiles.length);

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, profiles, format }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.report?.id) {
        setIsRunning(false);
        router.push(`/results/${data.report.id}`);
      } else {
        throw new Error('Test execution did not return a valid report ID.');
      }
    } catch (err) {
      setIsRunning(false);
      throw err;
    }
  };

  return (
    <div className="relative py-8 md:py-12 space-y-12 overflow-hidden">
      {/* Decorative Spirit Board Letter-Arc Motif (aria-hidden) */}
      <SpiritBoardBackdrop />

      <Container size="lg" className="relative z-10 space-y-12">
        {/* The Parlour Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#153049] border border-[#F4B860]/40 shadow-[0_0_12px_rgba(244,184,96,0.15)]">
            <SparklesIcon className="w-4 h-4 text-[#F4B860]" />
            <span className="text-xs font-semibold text-[#F4B860] tracking-wide">
              Kiroween 2026 • Spirit Photography Web Testing Engine
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#ECE6D3] tracking-tight leading-tight">
            Which house shall we haunt?
          </h1>

          <p className="text-base text-[#B4BFC8] max-w-2xl mx-auto leading-relaxed">
            HauntView photographs your website twice: once as you built it, and once as your users
            sometimes get it. Enter a target URL below to begin the séance.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Badge variant="warning" size="md">
              16 Selectable Rites
            </Badge>
            <Badge variant="info" size="md">
              Deterministic Faults
            </Badge>
            <Badge variant="outline" size="md">
              WCAG AA Audits
            </Badge>
            <Badge variant="success" size="md">
              Agent-Native via MCP
            </Badge>
          </div>
        </div>

        {/* Live Séance Progress (active during run) */}
        {isRunning && (
          <div className="max-w-4xl mx-auto">
            <PlanchetteProgress
              progressPercent={65}
              statusMessage={`Haunting ${activeUrl} across ${activeCount} configured rites…`}
              totalRites={activeCount}
              completedRites={Math.round(activeCount * 0.65)}
            />
          </div>
        )}

        {/* Test Launcher Card */}
        <div className="max-w-4xl mx-auto">
          <TestLauncher onStartTest={handleStartTest} isRunning={isRunning} />
        </div>

        {/* Interactive Example Plate: The Veil Signature Demo */}
        <div className="max-w-4xl mx-auto space-y-3">
          <div className="flex items-center justify-between border-b border-[#2C4B68] pb-2">
            <div>
              <h3 className="font-display font-bold text-lg text-[#ECE6D3]">
                Example Plate · Experience The Veil
              </h3>
              <p className="text-xs text-[#B4BFC8]">
                Drag the curtain below to see how HauntView exposes baseline vs failure apparitions
              </p>
            </div>
            <span className="text-[10px] font-mono text-[#F4B860] border border-[#F4B860]/40 px-2 py-0.5 rounded">
              Interactive Preview
            </span>
          </div>

          <TheVeil
            livingLabel="Living Page (Clean Baseline)"
            apparitionLabel="Apparition (Missing Alt & Touch Targets < 24px)"
            pins={[
              {
                id: '1',
                title: 'Broken Image Without Alt Tag',
                severity: 'serious',
                xPercent: 22,
                yPercent: 42,
              },
              {
                id: '2',
                title: 'Touch Target Smaller Than 24px',
                severity: 'warning',
                xPercent: 82,
                yPercent: 65,
              },
            ]}
          />
        </div>

        {/* The Crypt: Recent Séances */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-xl text-[#ECE6D3]">
                The Crypt · Recent Séances
              </h3>
              <p className="text-xs text-[#B4BFC8]">
                Audit history and comparative reports from previous hauntings
              </p>
            </div>

            {recentRuns.length > 0 && (
              <Link href="/crypt">
                <Button variant="ghost" size="sm" icon={<ArrowRightIcon className="w-4 h-4" />}>
                  Open The Crypt →
                </Button>
              </Link>
            )}
          </div>

          {isLoadingRuns ? (
            <div className="p-8 text-center text-xs text-[#B4BFC8] bg-[#153049]/40 rounded-[2px] border border-[#2C4B68]">
              Consulting the archives...
            </div>
          ) : recentRuns.length === 0 ? (
            <Card variant="default" className="text-center py-10 px-4">
              <ShieldCheckIcon className="w-10 h-10 text-[#5B7C99] mx-auto mb-2 opacity-60" />
              <h4 className="font-semibold text-sm text-[#ECE6D3] mb-1">The Crypt Is Peaceful</h4>
              <p className="text-xs text-[#B4BFC8] max-w-sm mx-auto">
                No past runs recorded yet. Enter a website address in the launcher above to begin
                your first séance.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentRuns.map((run) => {
                const isPass = run.errorCount === 0;

                return (
                  <Card
                    key={run.id}
                    hoverable
                    variant="default"
                    className="p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant={isPass ? 'success' : 'error'} size="sm">
                          {isPass ? 'NO OMENS' : `${run.errorCount} SCREAMS`}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-[#B4BFC8]">
                          <ClockIcon className="w-3.5 h-3.5 text-[#F4B860]" />
                          <span>{(run.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </div>

                      <h4
                        className="font-semibold text-sm text-[#ECE6D3] truncate mb-1"
                        title={run.url}
                      >
                        {run.url}
                      </h4>

                      <p className="text-xs text-[#B4BFC8]">
                        {run.successfulProfiles}/{run.totalProfiles} rites passed •{' '}
                        {run.totalFindings} omens
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#2C4B68] flex items-center justify-between">
                      <span className="text-[11px] text-[#5B7C99]">
                        {new Date(run.startTime).toLocaleDateString()} at{' '}
                        {new Date(run.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Link href={`/results/${run.id}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                          Grimoire →
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
