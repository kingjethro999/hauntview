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
import { HauntingDecorations } from './components/features/HauntingDecorations';
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
          HERO LANDING BAY
          Spirit photography aesthetic with The Veil preview
      ═════════════════════════════════════════ */}
      <section className="landing-bay relative min-h-[480px] lg:min-h-[680px]">
        <HauntingDecorations />
        <div className="relative z-10 pt-16 pb-20 md:pt-24 md:pb-24 lg:pt-28 lg:pb-32">
          <Container size="lg">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
              {/* Left side - content */}
              <div className="w-full max-w-2xl lg:max-w-[520px]">
                {/* Specimen label */}
                <div className="specimen-label" style={{ marginBottom: 28 }}>
                  Kiroween 2026 · Spirit Photography Web Testing Engine
                </div>

                {/* Headline */}
                <h1
                  style={{
                    fontSize: 'clamp(3rem, 7vw, 4.5rem)',
                    fontWeight: 600,
                    lineHeight: 1.02,
                    letterSpacing: '-0.04em',
                    color: 'var(--ghost-white)',
                    marginBottom: 16,
                  }}
                >
                  Photograph your
                  <br />
                  website
                  <em
                    style={{
                      fontStyle: 'normal',
                      color: 'var(--candle-primary)',
                      textShadow: '0 0 40px rgba(255,121,31,0.3)',
                    }}
                  >
                    twice
                  </em>
                </h1>

                <p
                  style={{
                    fontSize: 15,
                    color: 'var(--phantom-gray)',
                    lineHeight: 1.8,
                    marginBottom: 36,
                    maxWidth: 440,
                  }}
                >
                  HauntView captures the living page as you built it, and the apparition as your
                  users sometimes get it — under 25 testing profiles and failure conditions with
                  visual diffs and evidence-backed findings.
                </p>

                {/* Feature badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 44 }}>
                  <Badge variant="outline" size="md">
                    25 Rites
                  </Badge>
                  <Badge variant="outline" size="md">
                    Deterministic Faults
                  </Badge>
                  <Badge variant="outline" size="md">
                    WCAG Audits
                  </Badge>
                  <Badge variant="outline" size="md">
                    MCP Agent-Native
                  </Badge>
                </div>
              </div>

              {/* Right side - pumpkins and ghost (d-none on mobile & tablet, visible on lg desktop) */}
              <div className="hidden lg:flex items-end justify-center gap-4 lg:gap-6 shrink-0">
                {/* 3 Pumpkins standalone image */}
                <Image
                  src="/pumpkins.png"
                  alt="HauntView Carved Pumpkins"
                  width={380}
                  height={253}
                  className="w-72 lg:w-96 h-auto object-contain select-none pointer-events-none drop-shadow-[0_10px_30px_rgba(255,121,31,0.25)]"
                  priority
                />

                {/* Ghost */}
                <svg
                  viewBox="0 0 75 100"
                  className="w-20 h-28 lg:w-24 lg:h-32 animate-float shrink-0 text-[#fff1dc]"
                  fill="currentColor"
                  fillRule="evenodd"
                  aria-hidden="true"
                >
                  <g transform="matrix(3.800695,0,0,4.166604,-7.598366,0.001061)">
                    <path
                      d="M4.594,6.677C6.67,-2.226 18.746,-2.211,21.16,6.632C21.513,7.929 22.885,14.214 19.487,20.379C17.942,23.176 13.646,25.869 12.497,22.262C8.6,25.477 3.315,24.1,5.789,18.609L5.471,18.752C1.901,20.057 1.608,17.544 2.298,16.239C2.748,15.399 3.025,14.904 3.235,14.342C3.588,13.367 3.693,12.774 3.828,11.844C4.098,10.007 4.105,8.237 4.593,6.677L4.594,6.677Z"
                      fill="currentColor"
                    />
                    <circle cx="12.964" cy="6.687" r="1.5" fill="#0a0711" />
                    <circle cx="17.044" cy="6.687" r="1.5" fill="#0a0711" />
                  </g>
                </svg>
              </div>
            </div>
          </Container>
        </div>

        {/* The Veil preview - signature component (work in progress - commented out) */}
        {/*
        <div className="relative z-10 px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <div className="victorian-panel p-5 md:p-6">
              <div
                className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 pb-3"
                style={{ borderBottom: '1px solid rgba(255, 121, 31, 0.15)' }}
              >
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-lg" style={{ color: 'var(--ghost-white)' }}>
                      The Veil
                    </h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--phantom-gray)' }}>
                    Part the curtain between living page and apparition
                  </p>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    padding: '5px 10px',
                    borderRadius: 4,
                    color: '#9aff9a',
                    background: 'rgba(154, 255, 154, 0.08)',
                    border: '1px solid rgba(154, 255, 154, 0.25)',
                  }}
                >
                  Interactive Preview
                </div>
              </div>

              <TheVeil
                livingSrc={DEMO_LIVING_SRC}
                apparitionSrc={DEMO_APPARITION_SRC}
                diffSrc={DEMO_DIFF_SRC}
                livingLabel="Living Page (Baseline: ExampleSite)"
                apparitionLabel="Apparition (Images Blocked &amp; Shift)"
                pins={[
                  {
                    id: '1',
                    title: 'Asset load failure — missing width/height attributes',
                    severity: 'serious',
                    xPercent: 28,
                    yPercent: 48,
                  },
                  {
                    id: '2',
                    title: 'Touch target collision: button size 24px < 44px',
                    severity: 'warning',
                    xPercent: 74,
                    yPercent: 72,
                  },
                ]}
              />
            </div>
          </div>
        </div>
        */}
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
                <Button variant="ghost" size="sm" icon={<ArrowRightIcon className="w-4 h-4" />}>
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
              <h4 className="font-semibold text-base mb-2" style={{ color: 'var(--ghost-white)' }}>
                The Crypt Is Peaceful
              </h4>
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
                      <h4
                        className="font-medium text-sm truncate mb-2"
                        style={{ color: 'var(--ghost-white)' }}
                        title={run.url}
                      >
                        {run.url}
                      </h4>
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
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: 'var(--phantom-gray)',
                        }}
                      >
                        {new Date(run.startTime).toLocaleDateString()}
                      </span>
                      <Link href={`/results/${run.id}`}>
                        <Button size="sm" variant="outline" className="text-xs py-1.5 px-3">
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
