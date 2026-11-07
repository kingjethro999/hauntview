'use client';

import React from 'react';

export interface PlanchetteProgressProps {
  progressPercent: number; // 0 - 100
  statusMessage?: string;
  totalRites?: number;
  completedRites?: number;
  isCancelled?: boolean;
  className?: string;
}

export const PlanchetteProgress: React.FC<PlanchetteProgressProps> = ({
  progressPercent,
  statusMessage = 'Developing the plates…',
  totalRites = 15,
  completedRites = 0,
  isCancelled = false,
  className = '',
}) => {
  const clamped = Math.max(0, Math.min(100, progressPercent));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={`${clamped}% complete, ${completedRites} of ${totalRites} rites`}
      className={`plate rounded-[2px] p-5 bg-[var(--ghost-mist)] text-[var(--bone-white)] space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div>
          <span className="font-display font-semibold text-sm text-[var(--pumpkin-fire)]">
            Séance in Progress
          </span>
          <p className="text-[var(--spirit-smoke)]">{statusMessage}</p>
        </div>

        <div className="font-mono text-xs text-[var(--bone-white)] bg-[var(--midnight-veil)] px-2.5 py-1 rounded-[4px] border border-[var(--tombstone-gray)]">
          {completedRites} of {totalRites} rites · {clamped}%
        </div>
      </div>

      {/* Spirit Board Track with Planchette */}
      <div className="relative py-4 select-none">
        {/* Track Line */}
        <div className="h-1.5 w-full bg-[var(--midnight-veil)] rounded-full overflow-hidden border border-[var(--tombstone-gray)] relative">
          <div
            style={{ width: `${clamped}%` }}
            className="h-full bg-gradient-to-r from-[var(--grave-dust)] via-[var(--pumpkin-fire)] to-[var(--ectoplasm-green)] transition-all duration-300 ease-out"
          />
        </div>

        {/* Planchette Pointer (Glides across track) */}
        <div
          style={{ left: `${clamped}%` }}
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out z-20 pointer-events-none"
        >
          {/* Planchette Shape: triangular pointer with viewing lens */}
          <div className="relative w-8 h-9 flex items-center justify-center filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            <svg
              viewBox="0 0 32 36"
              className="w-full h-full fill-[var(--ghost-mist)] stroke-[var(--pumpkin-fire)] stroke-[1.5]"
            >
              {/* Heart/Shield planchette shape */}
              <path d="M16 2 C24 2, 30 10, 28 24 C26 31, 19 34, 16 35 C13 34, 6 31, 4 24 C2 10, 8 2, 16 2 Z" />
              {/* Central viewing lens */}
              <circle
                cx="16"
                cy="18"
                r="5"
                className="fill-[var(--midnight-veil)] stroke-[var(--ectoplasm-green)] stroke-1"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Spirit Board Arc Markers */}
      <div className="flex items-center justify-between text-[10px] font-mono text-[var(--grave-dust)] px-1 border-t border-[var(--tombstone-gray)]/40 pt-2">
        <span>A · B · C · D · E</span>
        <span>{isCancelled ? 'Séance Cancelled' : 'Planchette Seeking'}</span>
        <span>V · W · X · Y · Z</span>
      </div>
    </div>
  );
};
