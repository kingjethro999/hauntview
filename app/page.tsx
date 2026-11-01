'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from './components/layout/Container';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { TestLauncher } from './components/features/TestLauncher';
import { ProgressTracker } from './components/features/ProgressTracker';
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
  const [activeCount, setActiveCount] = useState<number>(17);
  const [recentRuns, setRecentRuns] = useState<TestReportSummary[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/results')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.reports)) {
          setRecentRuns(data.reports.slice(0, 5));
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
        // Redirect to dedicated report page
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
    <div className="py-10 md:py-14 space-y-12">
      <Container size="lg">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#582696]/20 border border-[#DC6428]/40 shadow-[0_0_12px_rgba(220,100,40,0.2)]">
            <SparklesIcon className="w-4 h-4 text-[#DC6428]" />
            <span className="text-xs font-semibold text-[#fed7aa]">
              Kiroween 2026 • Local Web Testing Engine
            </span>
          </div>

          <h1 className="font-display font-extrabold text-3xl sm:text-4xl md:text-5xl text-[#F5F5FA] tracking-tight leading-tight">
            Haunt Your Web Apps With{' '}
            <span className="text-[#DC6428]">Rigorous Automated Tests</span>
          </h1>

          <p className="text-base text-[#646478] max-w-2xl mx-auto leading-relaxed">
            Execute authentic Playwright browser checks across 16+ profiles for responsive
            viewports, WCAG AA accessibility, internationalization, and performance vitals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Badge variant="primary" size="md">
              16 Automated Profiles
            </Badge>
            <Badge variant="warning" size="md">
              Playwright Powered
            </Badge>
            <Badge variant="info" size="md">
              WCAG AA Standards
            </Badge>
            <Badge variant="success" size="md">
              Zero Configuration
            </Badge>
          </div>
        </div>

        {/* Live Progress Tracker (active when running) */}
        {isRunning && (
          <div className="mb-8">
            <ProgressTracker url={activeUrl} totalProfiles={activeCount} />
          </div>
        )}

        {/* Test Launcher */}
        <div className="mb-14">
          <TestLauncher onStartTest={handleStartTest} isRunning={isRunning} />
        </div>

        {/* Recent Runs Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-xl text-[#F5F5FA]">Recent Test Runs</h3>
              <p className="text-xs text-[#646478]">
                Access and download reports from previous testing sessions
              </p>
            </div>

            {recentRuns.length > 0 && (
              <Link href="/results">
                <Button variant="ghost" size="sm" icon={<ArrowRightIcon className="w-4 h-4" />}>
                  View All History
                </Button>
              </Link>
            )}
          </div>

          {isLoadingRuns ? (
            <div className="p-8 text-center text-xs text-[#646478] bg-[#373746]/20 rounded-xl border border-[#6C3CAA]/20">
              Loading recent sessions...
            </div>
          ) : recentRuns.length === 0 ? (
            <Card variant="default" className="text-center py-10 px-4">
              <ShieldCheckIcon className="w-10 h-10 text-[#646478] mx-auto mb-2 opacity-60" />
              <h4 className="font-semibold text-sm text-[#F5F5FA] mb-1">No Past Runs Recorded</h4>
              <p className="text-xs text-[#646478] max-w-sm mx-auto">
                Enter your target URL in the launcher above and run tests to generate your first
                report.
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
                          {isPass ? 'PASS' : `${run.errorCount} ERRORS`}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-[#646478]">
                          <ClockIcon className="w-3.5 h-3.5 text-[#DC6428]" />
                          <span>{(run.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </div>

                      <h4
                        className="font-semibold text-sm text-[#F5F5FA] truncate mb-1"
                        title={run.url}
                      >
                        {run.url}
                      </h4>

                      <p className="text-xs text-[#646478]">
                        {run.successfulProfiles}/{run.totalProfiles} profiles passed •{' '}
                        {run.totalFindings} findings
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#6C3CAA]/20 flex items-center justify-between">
                      <span className="text-[11px] text-[#646478]">
                        {new Date(run.startTime).toLocaleDateString()} at{' '}
                        {new Date(run.startTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <Link href={`/results/${run.id}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                          Report →
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
