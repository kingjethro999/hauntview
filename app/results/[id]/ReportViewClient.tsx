'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { TestReport, Finding, ProfileResult } from '@/src/types';
import { Container } from '../../components/layout/Container';
import { FindingsTable, cleanMessage } from '../../components/features/FindingsTable';
import { ReportActions } from '../../components/features/ReportActions';
import { ExorcismPromptModal } from '../../components/features/ExorcismPromptModal';
import { CandleIndicator, CandleStatus } from '../../components/features/CandleIndicator';
import { AVAILABLE_PROFILES } from '../../components/features/rites';

const riteName = (r: ProfileResult) =>
  AVAILABLE_PROFILES.find((p) => p.id === r.profileId)?.name ?? r.profileName;

export interface ReportViewClientProps {
  report: TestReport;
}

type Tab = 'findings' | 'rites' | 'raw';

const SEVERITY_LABEL = { error: 'Serious', warning: 'Warning', info: 'Info' } as const;
const SEVERITY_CHIP = {
  error: 'hv-chip--scream',
  warning: 'hv-chip--chill',
  info: '',
} as const;

function riteStatus(r: ProfileResult): CandleStatus {
  if (r.error && r.findings.length === 0) return 'error';
  if (r.findings.some((f) => f.severity === 'error')) return 'findings';
  if (r.findings.some((f) => f.severity === 'warning')) return 'findings';
  return r.success ? 'ok' : 'error';
}

/**
 * Results as a verdict: one word, one plain sentence, then the evidence.
 * The rites strip shows every rite as the candle it burned as; choosing one
 * opens its photograph and findings beneath.
 */
export const ReportViewClient: React.FC<ReportViewClientProps> = ({ report }) => {
  const [tab, setTab] = useState<Tab>('findings');
  const [riteId, setRiteId] = useState<string>(report.profileResults[0]?.profileId || '');
  const [exorcise, setExorcise] = useState<Finding | null>(null);
  const [brokenShots, setBrokenShots] = useState<Set<string>>(new Set());
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    findings: null,
    rites: null,
    raw: null,
  });

  const findings = report.profileResults.flatMap((p) => p.findings);
  const serious = report.summary.findingsBySeverity.error;
  const warnings = report.summary.findingsBySeverity.warning;
  const info = report.summary.findingsBySeverity.info ?? 0;
  const ritesTotal = report.profileResults.length;
  const ritesClean = report.profileResults.filter(
    (p) => p.success && p.findings.length === 0
  ).length;

  const verdict =
    serious > 0
      ? { word: 'Restless.', tone: 'restless' }
      : warnings > 0
        ? { word: 'Uneasy.', tone: 'uneasy' }
        : { word: 'At peace.', tone: 'peace' };

  const sentence =
    serious > 0
      ? `${serious} serious ${serious === 1 ? 'finding' : 'findings'} across ${ritesTotal} rites. Start with those.`
      : warnings > 0
        ? `No serious findings, but ${warnings} ${warnings === 1 ? 'warning' : 'warnings'} worth a look.`
        : `Every rite came back clean. Nothing stirred.`;

  const rite =
    report.profileResults.find((p) => p.profileId === riteId) || report.profileResults[0];
  const shot =
    rite?.screenshots?.[0]?.fileName ||
    (rite?.findings?.find((f) => f.details?.screenshot)?.details?.screenshot as string | undefined);
  const shotSrc = shot && !brokenShots.has(shot) ? `/api/screenshots/${shot}` : undefined;

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'findings', label: 'Findings', count: findings.length },
    { id: 'rites', label: 'Rites', count: ritesTotal },
    { id: 'raw', label: 'Raw data' },
  ];

  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir && e.key !== 'Home' && e.key !== 'End') return;
    e.preventDefault();
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? TABS.length - 1
          : (i + dir + TABS.length) % TABS.length;
    setTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const when = new Date(report.startTime);

  return (
    <div className="pb-24">
      {/* ── Verdict ───────────────────────────────────────────── */}
      <section className="hv-verdict" aria-labelledby="verdict-title">
        <Container size="lg" className="space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="hv-eyebrow">
              Séance of{' '}
              {when.toLocaleString(undefined, {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <ReportActions report={report} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
            <div className="space-y-4 min-w-0">
              <p className="font-mono text-[var(--hv-bone-dim)] break-all">{report.url}</p>
              <h1
                id="verdict-title"
                className={`hv-verdict__word hv-verdict__word--${verdict.tone} hv-rise`}
              >
                {verdict.word}
              </h1>
            </div>
            <div className="space-y-5 lg:pb-3">
              <p className="hv-lede">{sentence}</p>
              {findings.length > 0 && (
                <button
                  type="button"
                  className="hv-btn hv-btn--primary"
                  onClick={() =>
                    setExorcise(findings.find((f) => f.severity === 'error') || findings[0])
                  }
                >
                  Draft a fix prompt for Kiro
                </button>
              )}
            </div>
          </div>

          <dl className="hv-tally">
            <div>
              <dt>Serious</dt>
              <dd className={serious ? 'text-[#ffb3ad]' : ''}>{serious}</dd>
            </div>
            <div>
              <dt>Warnings</dt>
              <dd className={warnings ? 'text-[#ffd79e]' : ''}>{warnings}</dd>
            </div>
            <div>
              <dt>Info</dt>
              <dd>{info}</dd>
            </div>
            <div>
              <dt>Clean rites</dt>
              <dd>
                {ritesClean}
                <span className="text-[var(--hv-ash)] text-[0.5em]">/{ritesTotal}</span>
              </dd>
            </div>
            <div>
              <dt>Took</dt>
              <dd>
                {(report.duration / 1000).toFixed(1)}
                <span className="text-[var(--hv-ash)] text-[0.5em]">s</span>
              </dd>
            </div>
          </dl>
        </Container>
      </section>

      {/* ── Evidence ─────────────────────────────────────────── */}
      <Container size="lg" className="space-y-8">
        <div role="tablist" aria-label="Report sections" className="hv-segmented">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[t.id] = el;
              }}
              role="tab"
              id={`tab-${t.id}`}
              type="button"
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={tab === t.id ? 0 : -1}
              onClick={() => setTab(t.id)}
              onKeyDown={(e) => onTabKey(e, i)}
            >
              {t.label}
              {t.count !== undefined && (
                <span className="font-mono text-xs opacity-70">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'findings' && (
          <div role="tabpanel" id="panel-findings" aria-labelledby="tab-findings">
            <FindingsTable findings={findings} onExorcise={(f) => setExorcise(f)} />
          </div>
        )}

        {tab === 'rites' && (
          <div
            role="tabpanel"
            id="panel-rites"
            aria-labelledby="tab-rites"
            className="grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr]"
          >
            <ul className="hv-rows lg:max-h-[70vh] lg:overflow-y-auto" aria-label="Rites">
              {report.profileResults.map((r) => (
                <li key={r.profileId}>
                  <button
                    type="button"
                    onClick={() => setRiteId(r.profileId)}
                    aria-pressed={rite?.profileId === r.profileId}
                    className="hv-ledger__item w-full !min-h-[52px] border-b border-[var(--hv-seam)] !rounded-none aria-pressed:bg-[rgba(255,255,255,0.05)] aria-pressed:!text-[var(--hv-bone)]"
                  >
                    <CandleIndicator status={riteStatus(r)} size="sm" />
                    <span className="flex-1 min-w-0 truncate">{riteName(r)}</span>
                    <span className="font-mono text-xs">{r.findings.length}</span>
                  </button>
                </li>
              ))}
            </ul>

            {rite && (
              <article className="space-y-6 min-w-0" aria-live="polite">
                <header className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="hv-mono-label">{rite.profileId}</p>
                    <h2 className="hv-h2 mt-1">{riteName(rite)}</h2>
                  </div>
                  <span
                    className={`hv-chip ${
                      riteStatus(rite) === 'ok' ? 'hv-chip--rest' : 'hv-chip--scream'
                    }`}
                  >
                    {riteStatus(rite) === 'ok'
                      ? 'Passed clean'
                      : `${rite.findings.length} ${rite.findings.length === 1 ? 'finding' : 'findings'}`}
                  </span>
                </header>

                {shotSrc ? (
                  <figure className="rounded-[var(--hv-radius-lg)] overflow-hidden border border-[var(--hv-seam-strong)] bg-[var(--hv-crypt)]">
                    <Image
                      src={shotSrc}
                      alt={`Screenshot taken during the ${riteName(rite)} rite`}
                      width={1280}
                      height={800}
                      unoptimized
                      onError={() => shot && setBrokenShots((prev) => new Set(prev).add(shot))}
                      className="w-full h-auto max-h-[560px] object-contain"
                    />
                    <figcaption className="hv-mono-label px-4 py-3 border-t border-[var(--hv-seam)]">
                      The apparition, as captured
                    </figcaption>
                  </figure>
                ) : (
                  <p className="hv-muted border border-dashed border-[var(--hv-seam-strong)] rounded-[var(--hv-radius-lg)] p-8 text-center">
                    No photograph survived this rite
                    {rite.error ? ' — the page never loaded.' : '.'}
                  </p>
                )}

                {rite.error && (
                  <p role="note" className="font-mono text-sm text-[#ffb3ad] break-words">
                    {cleanMessage(rite.error.message).headline}
                  </p>
                )}

                {rite.findings.length > 0 && (
                  <ul className="hv-rows">
                    {rite.findings.map((f, i) => (
                      <li key={`${f.id}-${i}`} className="hv-row !grid-cols-[auto_1fr_auto]">
                        <span className={`hv-chip ${SEVERITY_CHIP[f.severity]}`}>
                          {SEVERITY_LABEL[f.severity]}
                        </span>
                        <span className="text-sm text-[var(--hv-bone)] line-clamp-2 break-words">
                          {cleanMessage(f.message).headline}
                        </span>
                        <button
                          type="button"
                          className="hv-btn hv-btn--ghost hv-btn--sm"
                          onClick={() => setExorcise(f)}
                        >
                          Fix prompt
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            )}
          </div>
        )}

        {tab === 'raw' && (
          <div role="tabpanel" id="panel-raw" aria-labelledby="tab-raw" className="space-y-3">
            <p className="hv-muted text-sm">
              The full report as JSON — {(JSON.stringify(report).length / 1024).toFixed(1)} KB.
            </p>
            <pre
              tabIndex={0}
              className="p-5 rounded-[var(--hv-radius-lg)] bg-[var(--hv-crypt)] border border-[var(--hv-seam)] text-xs font-mono text-[var(--hv-bone-dim)] overflow-auto max-h-[70vh]"
            >
              {JSON.stringify(report, null, 2)}
            </pre>
          </div>
        )}
      </Container>

      <ExorcismPromptModal
        isOpen={!!exorcise}
        onClose={() => setExorcise(null)}
        finding={exorcise}
        targetUrl={report.url}
      />
    </div>
  );
};
