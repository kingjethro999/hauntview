import React from 'react';

export type EmptyArt = 'crypt' | 'ghost' | 'candle';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  art?: EmptyArt;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

/** An empty crypt: unmarked headstone, low moon, a little drifting mist. */
function CryptArt() {
  return (
    <svg className="hv-empty__art" viewBox="0 0 220 150" fill="none" aria-hidden="true">
      <defs>
        <radialGradient id="es-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="var(--hv-bone)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--hv-moon)" stopOpacity="0.4" />
        </radialGradient>
        <linearGradient id="es-stone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--hv-seam-strong)" />
          <stop offset="1" stopColor="var(--hv-vault)" />
        </linearGradient>
      </defs>
      <circle cx="168" cy="34" r="30" fill="var(--hv-moon)" opacity="0.08" />
      <circle cx="168" cy="34" r="16" fill="url(#es-moon)" className="hv-flicker--slow" />
      <path d="M78 128V64a32 32 0 0 1 64 0v64Z" fill="url(#es-stone)" stroke="var(--hv-moon-dim)" />
      <path d="M96 78h28M100 90h20" stroke="var(--hv-ash)" strokeLinecap="round" opacity="0.5" />
      <path d="M104 104h12" stroke="var(--hv-ember)" strokeLinecap="round" opacity="0.8" />
      <path
        d="M20 130c30-6 60-6 90-2s70 4 90-2"
        stroke="var(--hv-seam-strong)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M60 128l3-9 2 9m88 1 2-7 3 7M40 130l2-6 2 6"
        stroke="var(--hv-moon-dim)"
        strokeLinecap="round"
      />
      <ellipse cx="110" cy="134" rx="80" ry="8" fill="var(--hv-moon)" opacity="0.08" />
    </svg>
  );
}

/** A small ghost asleep on its own tail. */
function GhostArt() {
  return (
    <svg className="hv-empty__art" viewBox="0 0 220 150" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="136" rx="46" ry="6" fill="#000" opacity="0.5" />
      <g className="hv-bob">
        <path
          d="M80 120V70a30 30 0 0 1 60 0v50l-10-8-10 8-10-8-10 8-10-8Z"
          fill="var(--hv-bone)"
          opacity="0.92"
        />
        <path
          d="M98 72q4 3 8 0m8 0q4 3 8 0"
          stroke="var(--hv-void)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
      <text
        x="146"
        y="52"
        fill="var(--hv-moon)"
        fontFamily="var(--hv-font-display)"
        fontSize="16"
        fontStyle="italic"
      >
        z
      </text>
      <text
        x="156"
        y="38"
        fill="var(--hv-moon)"
        fontFamily="var(--hv-font-display)"
        fontSize="12"
        fontStyle="italic"
        opacity="0.7"
      >
        z
      </text>
    </svg>
  );
}

/** A single unlit candle — waiting for someone to strike a match. */
function CandleArt() {
  return (
    <svg className="hv-empty__art" viewBox="0 0 220 150" fill="none" aria-hidden="true">
      <ellipse cx="110" cy="132" rx="40" ry="6" fill="var(--hv-seam-strong)" />
      <rect x="98" y="66" width="24" height="64" rx="3" fill="var(--hv-bone-dim)" opacity="0.85" />
      <path
        d="M98 74c6 4 10-2 14 3s6-1 10 2"
        stroke="var(--hv-bone)"
        strokeWidth="2"
        opacity="0.6"
      />
      <path d="M110 66v-8" stroke="var(--hv-ash)" strokeWidth="2" strokeLinecap="round" />
      <path d="M112 54c6-6 0-10 6-16" stroke="var(--hv-ash)" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

const ART: Record<EmptyArt, React.FC> = { crypt: CryptArt, ghost: GhostArt, candle: CandleArt };

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  art = 'crypt',
  title,
  description,
  action,
  className = '',
}) => {
  const Art = ART[art];
  return (
    <div className={`hv-empty ${className}`} role="status">
      {icon ? <div className="text-[var(--hv-ember)]">{icon}</div> : <Art />}
      <h3 className="hv-empty__title">{title}</h3>
      <p className="hv-empty__body">{description}</p>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
};
