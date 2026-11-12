'use client';

import React from 'react';

export type CandleStatus = 'unlit' | 'lit' | 'running' | 'ok' | 'findings' | 'error' | 'skipped';

export interface CandleIndicatorProps {
  status: CandleStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  /** Hide the visually-hidden status text when a label is rendered nearby. */
  decorative?: boolean;
}

const LABEL: Record<CandleStatus, string> = {
  unlit: 'Queued',
  lit: 'Selected',
  running: 'Running',
  ok: 'Passed',
  findings: 'Findings',
  error: 'Failed',
  skipped: 'Skipped',
};

const FLAME: Partial<Record<CandleStatus, string>> = {
  lit: 'var(--hv-ember)',
  running: 'var(--hv-ember)',
  ok: 'var(--hv-rest)',
  findings: 'var(--hv-chill)',
};

const PX = { sm: 14, md: 18, lg: 24 };

/**
 * One candle per rite. Shape changes with state, so colour is never the only cue:
 * unlit wick · flickering flame · steady flame · guttering (bent) flame ·
 * snuffed (smoke curl) · empty holder.
 */
export const CandleIndicator: React.FC<CandleIndicatorProps> = ({
  status,
  size = 'md',
  className = '',
  decorative = false,
}) => {
  const w = PX[size];
  const flame = FLAME[status];
  return (
    <span className={`inline-flex items-end ${className}`} title={LABEL[status]}>
      <svg
        width={w}
        height={w * 1.6}
        viewBox="0 0 20 32"
        className={`hv-candle--${status}`}
        aria-hidden="true"
      >
        {flame && (
          <>
            <circle cx="10" cy="9" r="7" fill={flame} opacity="0.18" />
            <path
              className="hv-candle__flame"
              d="M10 2c3.4 3.6 4 6.6 3.2 8.8A3.4 3.4 0 0 1 10 13a3.4 3.4 0 0 1-3.2-2.2C6 8.6 6.6 5.6 10 2Z"
              fill={flame}
            />
          </>
        )}
        {status === 'error' && (
          <path
            d="M10 12c-2-2 2-4 0-7m2 2c1-1 0-2 1-3"
            stroke="var(--hv-ash)"
            strokeWidth="1.2"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
        )}
        {status !== 'skipped' && (
          <>
            <path d="M10 13v2" stroke="var(--hv-ash)" strokeWidth="1.2" strokeLinecap="round" />
            <rect
              x="6"
              y="15"
              width="8"
              height="12"
              rx="1.5"
              fill={status === 'error' ? 'var(--hv-seam-strong)' : 'var(--hv-bone-dim)'}
              opacity={status === 'unlit' ? 0.45 : 0.9}
            />
          </>
        )}
        <path
          d="M3 28h14l-1.5 3h-11Z"
          fill="none"
          stroke={status === 'error' ? 'var(--hv-scream)' : 'var(--hv-ash)'}
          strokeWidth="1.2"
          strokeDasharray={status === 'skipped' ? '2 2' : undefined}
        />
      </svg>
      {!decorative && <span className="sr-only">{LABEL[status]}</span>}
    </span>
  );
};
