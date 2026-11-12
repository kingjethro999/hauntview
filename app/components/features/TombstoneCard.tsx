'use client';

import React, { useSyncExternalStore } from 'react';
import Link from 'next/link';
import { TestReportSummary } from '@/src/core/report-store';
import { CandleIndicator } from './CandleIndicator';

export interface TombstoneCardProps {
  report: TestReportSummary;
  index?: number;
  /** Shows a Banish control. Confirmation is the caller's job. */
  onBanish?: (report: TestReportSummary) => void;
  /** Plays the dissolve; the caller removes the record afterwards. */
  banishing?: boolean;
}

export type Verdict = { word: string; tone: 'restless' | 'uneasy' | 'peace' };

export function verdictFor(r: TestReportSummary): Verdict {
  if (r.errorCount > 0) return { word: 'Restless', tone: 'restless' };
  if (r.warningCount > 0) return { word: 'Uneasy', tone: 'uneasy' };
  return { word: 'At peace', tone: 'peace' };
}

const TONE_COLOR = { restless: '#ffb3ad', uneasy: '#ffd79e', peace: '#b9f0c9' };

function hostOf(url: string) {
  try {
    const u = new URL(url);
    return u.host + (u.pathname === '/' ? '' : u.pathname);
  } catch {
    return url;
  }
}

const noopSubscribe = () => () => {};

/**
 * A past run as a headstone. Its height encodes how restless the run was
 * (total findings), so a glance across the graveyard shows where the trouble
 * is. The verdict is always written out in words — never colour alone.
 */
export const TombstoneCard: React.FC<TombstoneCardProps> = ({
  report,
  index = 0,
  onBanish,
  banishing = false,
}) => {
  const v = verdictFor(report);
  const restlessness = Math.min(1, report.totalFindings / 30);
  const when = new Date(report.startTime);
  const isOld = useSyncExternalStore(
    noopSubscribe,
    () => Date.now() - report.startTime > 7 * 24 * 60 * 60 * 1000,
    () => false
  );

  return (
    <article
      className={`hv-stone hv-rise ${v.tone === 'restless' ? 'hv-stone--restless' : ''} ${
        banishing ? 'hv-dissolve' : ''
      }`}
      style={{ '--h': restlessness, '--i': Math.min(index, 10) } as React.CSSProperties}
      aria-label={`${v.word}: ${report.url}`}
    >
      <span className="hv-stone__candle">
        <CandleIndicator status={v.tone === 'peace' ? 'ok' : 'findings'} size="md" decorative />
      </span>

      {isOld && (
        <svg
          className="absolute top-0 right-3 w-14 h-14 text-[var(--hv-ash)] opacity-30"
          viewBox="0 0 60 60"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path d="M60 0 20 40M60 0 35 55M60 0 5 25M60 0v60M60 0H0" strokeWidth="0.6" />
          <path d="M48 0q2 10 12 12M36 0q4 20 24 24M24 0q6 30 36 36" strokeWidth="0.6" />
        </svg>
      )}

      <p className="hv-stone__verdict" style={{ color: TONE_COLOR[v.tone] }}>
        {v.word}
      </p>
      <h3 className="hv-stone__url" title={report.url}>
        <Link href={`/results/${report.id}`} className="hv-stone__link">
          {hostOf(report.url)}
        </Link>
      </h3>

      <dl className="hv-stone__epitaph">
        <div>
          <dt>serious</dt>
          <dd>
            <b>{report.errorCount}</b>
          </dd>
        </div>
        <div>
          <dt>warnings</dt>
          <dd>
            <b>{report.warningCount}</b>
          </dd>
        </div>
        <div>
          <dt>total</dt>
          <dd>
            <b>{report.totalFindings}</b>
          </dd>
        </div>
      </dl>

      <p className="hv-stone__date">
        <time dateTime={when.toISOString()}>
          {when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
        </time>
        {' · '}
        {report.successfulProfiles}/{report.totalProfiles} rites
      </p>

      {onBanish && (
        <button
          type="button"
          className="hv-btn hv-btn--banish hv-btn--sm hv-stone__banish"
          onClick={() => onBanish(report)}
          disabled={banishing}
          aria-label={`Banish the run for ${report.url}`}
        >
          Banish
        </button>
      )}
    </article>
  );
};
