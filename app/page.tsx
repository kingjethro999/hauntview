'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Container } from './components/layout/Container';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { Button } from './components/ui/Button';
import { TestLauncher } from './components/features/TestLauncher';
import { TestReportSummary } from '@/src/core/report-store';
import { useCryptStore } from '@/src/lib/client/crypt-store';
import { ArrowRightIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [serverRuns, setServerRuns] = useState<TestReportSummary[]>([]);
  const [isFetchingServer, setIsFetchingServer] = useState(false);
  const { summaries, _hasHydrated } = useCryptStore();

  const recentRuns = summaries.length > 0 ? summaries.slice(0, 6) : serverRuns.slice(0, 6);
  const isLoadingRuns = !_hasHydrated || (summaries.length === 0 && isFetchingServer);

  useEffect(() => {
    let active = true;
    if (_hasHydrated && summaries.length === 0) {
      fetch('/api/results')
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (!active) return;
          if (d?.success && Array.isArray(d.reports) && d.reports.length > 0) {
            setServerRuns(d.reports);
            useCryptStore.setState((prev) => {
              const existingIds = new Set(prev.summaries.map((s) => s.id));
              const newSummaries = d.reports.filter(
                (r: TestReportSummary) => !existingIds.has(r.id)
              );
              return { ...prev, summaries: [...prev.summaries, ...newSummaries] };
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) {
            setIsFetchingServer(false);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [_hasHydrated, summaries.length]);

  const handleStartTest = async (
    url: string,
    profiles: string[],
    format?: 'zip' | 'html' | 'markdown' | 'json'
  ) => {
    if (isRunning) return;
    setIsRunning(true);
    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, profiles, format }),
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

  return (
    <div className="relative">
      {/* ═════════════════════════════════════════
          HERO BANNER SECTION
          Responsive full-width cinematic banner:
          Desktop: Wide panoramic banner
          Mobile & Tablet: Vertical compact hero
      ═════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-[var(--midnight-veil)]">
        {/* Hidden screen-reader heading for WCAG & SEO */}
        <div className="sr-only">
          <h1>HauntView — Photograph your website twice</h1>
          <p>Kiroween 2026 · Spirit Photography Web Testing Engine</p>
          <p>
            HauntView captures the living page as you built it, and the apparition as your users
            sometimes get it — under 25 testing profiles and failure conditions with visual diffs
            and evidence-backed findings.
          </p>
          <ul>
            <li>25 Rites</li>
            <li>Deterministic Faults</li>
            <li>WCAG Audits</li>
            <li>MCP Agent-Native</li>
          </ul>
        </div>

        {/* Desktop Hero Banner (>= md breakpoint) */}
        <div className="hidden md:block relative w-full">
          <Image
            src="/hero-banner.jpg"
            alt="HauntView — Photograph your website twice. Kiroween 2026 Spirit Photography Web Testing Engine"
            width={3146}
            height={1312}
            priority
            sizes="100vw"
            className="w-full h-auto block select-none pointer-events-none"
          />

          {/* Smooth bottom feather into the séance parlour background */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 md:h-28 lg:h-40 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(10, 7, 17, 0.3) 40%, rgba(10, 7, 17, 0.8) 75%, var(--midnight-veil) 100%)',
            }}
            aria-hidden="true"
          />
        </div>

        {/* Mobile & Tablet Dedicated Hero Banner (< md breakpoint) */}
        <div className="block md:hidden relative w-full">
          <Image
            src="/hero-banner-mobile.jpg"
            alt="HauntView — Photograph your website twice. Mobile Hero"
            width={896}
            height={1200}
            priority
            sizes="100vw"
            className="w-full h-auto block select-none pointer-events-none max-h-[75vh] object-cover object-top"
          />

          {/* Smooth bottom feather into the séance parlour background */}
          <div
            className="absolute inset-x-0 bottom-0 h-20 sm:h-28 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(10, 7, 17, 0.35) 35%, rgba(10, 7, 17, 0.85) 70%, var(--midnight-veil) 100%)',
            }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ═════════════════════════════════════════
          MAIN CONTENT
      ═════════════════════════════════════════ */}
      <Container
        size="lg"
        className="relative z-10 py-8 sm:py-14 md:py-20 space-y-8 sm:space-y-12 md:space-y-20"
      >
        {/* Test Launcher */}
        <div>
          <TestLauncher onStartTest={handleStartTest} isRunning={isRunning} />
        </div>

        {/* Recent Séances */}
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h2
                className="font-semibold text-xl sm:text-2xl"
                style={{ color: 'var(--ghost-white)' }}
              >
                The Crypt
                <span className="block sm:inline sm:ml-3 font-normal text-xs sm:text-sm text-[var(--phantom-gray)]">
                  · Recent Séances
                </span>
              </h2>
              <p className="text-xs sm:text-[13px] text-[var(--phantom-gray)] mt-0.5 sm:mt-1">
                Audit history and comparative reports
              </p>
            </div>
            {recentRuns.length > 0 && (
              <Link href="/crypt" className="self-start sm:self-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm"
                  icon={<ArrowRightIcon className="w-4 h-4" />}
                >
                  Open The Crypt
                </Button>
              </Link>
            )}
          </div>

          {isLoadingRuns ? (
            <div
              className="p-8 sm:p-12 text-center"
              style={{
                color: 'var(--phantom-gray)',
                background: 'rgba(28, 21, 35, 0.5)',
                border: '1px solid rgba(255, 121, 31, 0.15)',
                borderRadius: 8,
              }}
            >
              <ClockIcon
                className="w-8 h-8 mx-auto mb-3 ember-pulse"
                style={{ color: 'var(--candle-primary)' }}
              />
              <p className="text-xs sm:text-sm font-mono">Consulting the archives…</p>
            </div>
          ) : recentRuns.length === 0 ? (
            <Card variant="default" className="text-center py-10 sm:py-16 px-4 sm:px-6">
              <DocumentTextIcon
                className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4"
                style={{ color: 'var(--phantom-gray)' }}
              />
              <h3
                className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2"
                style={{ color: 'var(--ghost-white)' }}
              >
                The Crypt Is Peaceful
              </h3>
              <p
                className="text-xs sm:text-sm max-w-md mx-auto"
                style={{ color: 'var(--phantom-gray)' }}
              >
                No past séances yet. Run your first test to begin building your gallery of
                apparitions.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {recentRuns.map((run) => {
                const isPass = run.errorCount === 0;
                return (
                  <Card
                    key={run.id}
                    hoverable
                    variant="default"
                    className="p-4 sm:p-5 flex flex-col justify-between"
                    style={{ borderColor: 'rgba(255, 121, 31, 0.15)' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2 sm:mb-3">
                        <Badge variant={isPass ? 'success' : 'error'} size="sm">
                          {isPass ? 'No Omens' : `${run.errorCount} Screams`}
                        </Badge>
                        <div className="flex items-center gap-1.5 text-xs text-[var(--phantom-gray)]">
                          <ClockIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--candle-primary)]" />
                          <span>{(run.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                      <h3
                        className="font-medium text-xs sm:text-sm truncate mb-1.5 sm:mb-2 text-[var(--ghost-white)]"
                        title={run.url}
                      >
                        {run.url}
                      </h3>
                      <p className="text-xs text-[var(--phantom-gray)]">
                        {run.successfulProfiles}/{run.totalProfiles} rites · {run.totalFindings}{' '}
                        omens
                      </p>
                    </div>

                    <div
                      className="mt-3 sm:mt-4 pt-3 sm:pt-4 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(255, 121, 31, 0.1)' }}
                    >
                      <span className="text-xs font-mono text-[var(--phantom-gray)]">
                        {new Date(run.startTime).toLocaleDateString()}
                      </span>
                      <Link href={`/results/${run.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1.5 px-3 min-h-[40px] sm:min-h-[44px]"
                        >
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
