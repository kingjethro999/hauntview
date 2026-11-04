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
// The Veil preview is a work in progress - commented out
// import { TheVeil } from './components/features/TheVeil';
// import {
//   DEMO_LIVING_SRC,
//   DEMO_APPARITION_SRC,
//   DEMO_DIFF_SRC,
// } from './components/features/veil-demo-assets';
import { TestReportSummary } from '@/src/core/report-store';
import { ArrowRightIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [recentRuns, setRecentRuns] = useState<TestReportSummary[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/results')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted && d?.success && Array.isArray(d.reports)) {
          setRecentRuns(d.reports.slice(0, 6));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoadingRuns(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

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
          Full-width, edge-to-edge cinematic banner
      ═════════════════════════════════════════ */}
      <section className="relative w-full overflow-hidden bg-[#0a0711]">
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

        {/* Hero image scaled edge-to-edge without margin or fixed width */}
        <div className="relative w-full">
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
            className="absolute inset-x-0 bottom-0 h-12 sm:h-20 md:h-28 lg:h-40 pointer-events-none"
            style={{
              background:
                'linear-gradient(to bottom, transparent 0%, rgba(10, 7, 17, 0.3) 40%, rgba(10, 7, 17, 0.8) 75%, #0a0711 100%)',
            }}
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ═════════════════════════════════════════
          MAIN CONTENT
      ═════════════════════════════════════════ */}
      <Container size="lg" className="relative z-10 py-20 space-y-20">
        {/* Test Launcher */}
        <div>
          <TestLauncher onStartTest={handleStartTest} isRunning={isRunning} />
        </div>

        {/* Recent Séances */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-2xl" style={{ color: 'var(--ghost-white)' }}>
                The Crypt
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 15,
                    color: 'var(--phantom-gray)',
                    marginLeft: 12,
                  }}
                >
                  · Recent Séances
                </span>
              </h2>
              <p style={{ fontSize: 13, color: 'var(--phantom-gray)', marginTop: 4 }}>
                Audit history and comparative reports
              </p>
            </div>
            {recentRuns.length > 0 && (
              <Link href="/crypt">
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px]"
                  icon={<ArrowRightIcon className="w-4 h-4" />}
                >
                  Open The Crypt
                </Button>
              </Link>
            )}
          </div>

          {isLoadingRuns ? (
            <div
              className="p-12 text-center"
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
              <p style={{ fontSize: 13, fontFamily: 'monospace' }}>Consulting the archives…</p>
            </div>
          ) : recentRuns.length === 0 ? (
            <Card variant="default" className="text-center py-16 px-6">
              <DocumentTextIcon
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: 'var(--phantom-gray)' }}
              />
              <h3 className="font-semibold text-base mb-2" style={{ color: 'var(--ghost-white)' }}>
                The Crypt Is Peaceful
              </h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--phantom-gray)' }}>
                No past séances yet. Run your first test to begin building your gallery of
                apparitions.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRuns.map((run) => {
                const isPass = run.errorCount === 0;
                return (
                  <Card
                    key={run.id}
                    hoverable
                    variant="default"
                    className="p-5 flex flex-col justify-between"
                    style={{ borderColor: 'rgba(255, 121, 31, 0.15)' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <Badge variant={isPass ? 'success' : 'error'} size="sm">
                          {isPass ? 'No Omens' : `${run.errorCount} Screams`}
                        </Badge>
                        <div
                          className="flex items-center gap-1.5"
                          style={{ fontSize: 12, color: 'var(--phantom-gray)' }}
                        >
                          <ClockIcon
                            className="w-4 h-4"
                            style={{ color: 'var(--candle-primary)' }}
                          />
                          <span>{(run.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                      <h3
                        className="font-medium text-sm truncate mb-2"
                        style={{ color: 'var(--ghost-white)' }}
                        title={run.url}
                      >
                        {run.url}
                      </h3>
                      <p style={{ fontSize: 12, color: 'var(--phantom-gray)' }}>
                        {run.successfulProfiles}/{run.totalProfiles} rites · {run.totalFindings}{' '}
                        omens
                      </p>
                    </div>

                    <div
                      className="mt-4 pt-4 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(255, 121, 31, 0.1)' }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontFamily: 'monospace',
                          color: 'var(--phantom-gray)',
                        }}
                      >
                        {new Date(run.startTime).toLocaleDateString()}
                      </span>
                      <Link href={`/results/${run.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs py-1.5 px-3 min-h-[44px]"
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
