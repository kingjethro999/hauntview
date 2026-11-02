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
import { WispGhost, WispState } from './components/features/WispGhost';
import HalloweenStage from './components/features/HalloweenStage';
import { TestReportSummary } from '@/src/core/report-store';
import { ArrowRightIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function HomePage() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [activeUrl, setActiveUrl] = useState('');
  const [activeCount, setActiveCount] = useState(15);
  const [isUrlValid, setIsUrlValid] = useState(true);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [recentRuns, setRecentRuns] = useState<TestReportSummary[]>([]);
  const [isLoadingRuns, setIsLoadingRuns] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetch('/api/results')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (mounted && d?.success && Array.isArray(d.reports)) setRecentRuns(d.reports.slice(0, 6));
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
    setActiveUrl(url);
    setActiveCount(profiles.length);
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

  const wispState: WispState = isRunning
    ? 'conjuring'
    : isInputFocused
      ? 'curious'
      : isUrlValid
        ? 'pleased'
        : 'idle';

  return (
    <div className="relative overflow-hidden">
      {/* ═══════════════════════════════════════════
          HERO LANDING BAY
          Full atmospheric stage with ghost / pumpkins
          / skeleton / moon / bats — all interactive
      ═══════════════════════════════════════════ */}
      <section
        className="landing-bay relative"
        style={{ minHeight: 560, borderLeft: 'none', borderRight: 'none', borderTop: 'none' }}
      >
        {/* Spirit Board backdrop (subtle arc lettering) */}
        <SpiritBoardBackdrop />

        {/* THE STAR OF THE SHOW — interactive Halloween stage */}
        <HalloweenStage isRunning={isRunning} />

        {/* Hero copy — sits in front of the stage */}
        <div className="relative" style={{ paddingTop: 52, paddingBottom: 96, zIndex: 4 }}>
          <Container size="lg">
            <div style={{ maxWidth: 480 }}>
              {/* eyebrow specimen label */}
              <div className="specimen-label" style={{ marginBottom: 16 }}>
                <span style={{ color: '#ff8d3c', fontSize: 14 }}>✦</span>
                Kiroween 2026 · Spirit Photography Web Testing Engine
              </div>

              {/* headline */}
              <h1
                style={{
                  fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: '-0.03em',
                  color: '#fff3e2',
                  textShadow: '0 0 40px rgba(255,90,16,0.2)',
                  fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)',
                  marginBottom: 16,
                }}
              >
                Which house
                <br />
                shall we{' '}
                <em
                  style={{
                    fontStyle: 'normal',
                    color: '#ff8628',
                    textShadow: '0 0 35px rgba(255,90,16,0.3)',
                  }}
                >
                  haunt?
                </em>
              </h1>

              <p
                style={{
                  color: '#d3bfd5',
                  fontSize: 13,
                  maxWidth: 420,
                  lineHeight: 1.65,
                  marginBottom: 20,
                }}
              >
                HauntView photographs your website twice: once as you built it, and once as your
                users sometimes get it — under 16 failure conditions with screenshots, diffs, and
                evidence-backed findings.
              </p>

              {/* badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                <Badge variant="warning" size="sm">
                  16 Rites
                </Badge>
                <Badge variant="info" size="sm">
                  Deterministic Faults
                </Badge>
                <Badge variant="outline" size="sm">
                  WCAG Audits
                </Badge>
                <Badge variant="success" size="sm">
                  MCP Agent-Native
                </Badge>
              </div>

              {/* Wisp greeting */}
              <WispGhost
                state={wispState}
                size="md"
                showSpeechBubble
                message={
                  isRunning
                    ? 'Conjuring rites across the windows…'
                    : isInputFocused
                      ? 'Tell me which house to haunt!'
                      : isUrlValid
                        ? 'Porch lantern is lit. Ready to haunt.'
                        : 'Welcome to the Parlour!'
                }
              />
            </div>
          </Container>
        </div>

        {/* Bay bottom status bar */}
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            zIndex: 5,
            fontSize: 10,
            fontFamily: 'monospace',
            color: '#a296aa',
            pointerEvents: 'none',
          }}
        >
          <span>
            BAY{' '}
            <span
              style={{
                background: '#ff8b30',
                color: '#190b07',
                fontWeight: 700,
                padding: '1px 4px',
                fontSize: 9,
              }}
            >
              01
            </span>{' '}
            · THE PARLOUR
          </span>
          <span style={{ color: '#5a4a64' }}>
            {isRunning ? `haunting ${activeUrl}…` : 'awaiting séance'}
          </span>
          <span>EST. 2026 → RUNNING TODAY</span>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT
      ═══════════════════════════════════════════ */}
      <Container size="lg" className="relative z-10 py-10 space-y-10">
        {/* Live Séance Progress */}
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

        {/* Test Launcher */}
        <div className="max-w-4xl mx-auto">
          <TestLauncher
            onStartTest={handleStartTest}
            isRunning={isRunning}
            onUrlChange={(_url, valid) => setIsUrlValid(valid)}
            onFocusChange={setIsInputFocused}
          />
        </div>

        {/* The Veil — spirit photography double-exposure */}
        <div className="max-w-4xl mx-auto">
          <div
            className="relative rounded-[4px] p-6 space-y-4"
            style={{
              background: 'linear-gradient(160deg, #1c1523 0%, #140e1a 100%)',
              border: '1px solid #46334b',
              boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
            }}
          >
            {/* Victorian corner brackets */}
            {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
              <div
                key={c}
                style={{
                  position: 'absolute',
                  width: 14,
                  height: 14,
                  top: c[0] === 't' ? 6 : undefined,
                  bottom: c[0] === 'b' ? 6 : undefined,
                  left: c[1] === 'l' ? 6 : undefined,
                  right: c[1] === 'r' ? 6 : undefined,
                  borderTop: c[0] === 't' ? '2px solid rgba(255,121,31,0.45)' : undefined,
                  borderBottom: c[0] === 'b' ? '2px solid rgba(255,121,31,0.45)' : undefined,
                  borderLeft: c[1] === 'l' ? '2px solid rgba(255,121,31,0.45)' : undefined,
                  borderRight: c[1] === 'r' ? '2px solid rgba(255,121,31,0.45)' : undefined,
                  pointerEvents: 'none',
                }}
              />
            ))}

            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3"
              style={{ borderBottom: '1px solid #46334b' }}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: '0.15em',
                      fontFamily: 'monospace',
                      color: '#ff791f',
                    }}
                  >
                    Spirit Photography
                  </span>
                  <span style={{ color: '#5a4a64' }}>·</span>
                  <h3 className="font-bold text-lg" style={{ color: '#fff1dc' }}>
                    The Veil
                  </h3>
                </div>
                <p style={{ fontSize: 11, color: '#b9acbf', marginTop: 2 }}>
                  Part the curtain between living page and apparition to see what breaks.
                </p>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: 'monospace',
                  padding: '4px 10px',
                  borderRadius: 3,
                  color: '#9aff9a',
                  background: '#100e13',
                  border: '1px solid rgba(154,255,154,0.3)',
                  boxShadow: '0 0 8px rgba(154,255,154,0.15)',
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              >
                Live Preview
              </span>
            </div>

            <TheVeil
              livingLabel="Living Page (Standard Baseline)"
              apparitionLabel="Apparition (Images Blocked)"
              pins={[
                {
                  id: '1',
                  title: 'Broken image — no alt text',
                  severity: 'serious',
                  xPercent: 22,
                  yPercent: 42,
                },
                {
                  id: '2',
                  title: 'Touch target smaller than 24px',
                  severity: 'warning',
                  xPercent: 82,
                  yPercent: 65,
                },
              ]}
            />
          </div>
        </div>

        {/* The Crypt — recent séances */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="font-bold text-xl"
                style={{ color: '#fff1dc', fontFamily: 'var(--font-space-grotesk, sans-serif)' }}
              >
                The Crypt
                <span style={{ fontWeight: 400, fontSize: 14, color: '#b9acbf', marginLeft: 8 }}>
                  · Recent Séances
                </span>
              </h2>
              <p style={{ fontSize: 11, color: '#b9acbf', marginTop: 2 }}>
                Audit history and comparative reports
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
            <div
              className="p-8 text-center text-xs font-mono rounded-[3px]"
              style={{
                color: '#b9acbf',
                background: 'rgba(28,22,41,0.4)',
                border: '1px solid #46334b',
              }}
            >
              Consulting the archives…
            </div>
          ) : recentRuns.length === 0 ? (
            <Card variant="default" className="text-center py-10 px-4 flex flex-col items-center">
              <WispGhost state="napping" size="md" className="mb-2" />
              <h4 className="font-bold text-sm mb-1" style={{ color: '#fff1dc' }}>
                The Crypt Is Peaceful
              </h4>
              <p className="text-xs max-w-sm mx-auto" style={{ color: '#b9acbf' }}>
                No past runs yet. Wisp is resting until you haunt your first house.
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
                    style={{ borderColor: '#46334b', background: 'rgba(28,22,41,0.7)' }}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant={isPass ? 'success' : 'error'} size="sm">
                          {isPass ? 'NO OMENS' : `${run.errorCount} SCREAMS`}
                        </Badge>
                        <div
                          className="flex items-center gap-1"
                          style={{ fontSize: 11, color: '#b9acbf' }}
                        >
                          <ClockIcon className="w-3.5 h-3.5" style={{ color: '#ff791f' }} />
                          <span>{(run.duration / 1000).toFixed(1)}s</span>
                        </div>
                      </div>
                      <h4
                        className="font-semibold text-sm truncate mb-1"
                        style={{ color: '#fff1dc' }}
                        title={run.url}
                      >
                        {run.url}
                      </h4>
                      <p style={{ fontSize: 11, color: '#b9acbf' }}>
                        {run.successfulProfiles}/{run.totalProfiles} rites · {run.totalFindings}{' '}
                        omens
                      </p>
                    </div>

                    <div
                      className="mt-4 pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid #46334b' }}
                    >
                      <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#5a4a64' }}>
                        {new Date(run.startTime).toLocaleDateString()}
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
