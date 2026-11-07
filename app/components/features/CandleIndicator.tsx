'use client';

import React from 'react';

export type CandleStatus = 'unlit' | 'running' | 'ok' | 'findings' | 'error' | 'skipped';

export interface CandleIndicatorProps {
  status: CandleStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CandleIndicator: React.FC<CandleIndicatorProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-4 h-6 text-xs',
    md: 'w-5 h-8 text-sm',
    lg: 'w-7 h-10 text-base',
  };

  return (
    <div
      className={`inline-flex flex-col items-center justify-end relative select-none ${sizeMap[size]} ${className}`}
      title={`Candle Status: ${status}`}
    >
      {/* Flame / Wick */}
      {status === 'running' && (
        <div className="w-2 h-3.5 rounded-full bg-[var(--pumpkin-fire)] shadow-[0_0_8px_var(--pumpkin-fire)] animate-pulse -mb-0.5" />
      )}

      {status === 'ok' && (
        <div className="w-2 h-3 rounded-full bg-[var(--pumpkin-fire)] shadow-[0_0_6px_var(--pumpkin-fire)] -mb-0.5 opacity-90" />
      )}

      {status === 'findings' && (
        <div className="w-2 h-2.5 rounded-full bg-[var(--pumpkin-fire)] shadow-[0_0_8px_#F28B77] animate-bounce -mb-0.5" />
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center -mb-0.5">
          <div className="w-1 h-2 bg-[#F28B77] rounded-sm opacity-60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--haunted-purple)]" />
        </div>
      )}

      {status === 'unlit' && (
        <div className="w-0.5 h-2 bg-[var(--grave-dust)] rounded-t -mb-0.5 opacity-50" />
      )}

      {status === 'skipped' && (
        <div className="w-2 h-1 border border-dashed border-[var(--grave-dust)] -mb-0.5 opacity-40" />
      )}

      {/* Candle Body */}
      <div
        className={`w-3.5 h-4 rounded-t-sm border border-[var(--tombstone-gray)] flex items-center justify-center ${
          status === 'error'
            ? 'bg-[var(--ghost-mist)] border-[#F28B77]/40'
            : status === 'findings'
              ? 'bg-[var(--ghost-mist)] border-[var(--pumpkin-fire)]/40'
              : status === 'running'
                ? 'bg-[var(--ghost-mist)] border-[var(--pumpkin-fire)]/60'
                : 'bg-[var(--midnight-veil)]'
        }`}
      >
        <div className="w-1 h-full bg-[var(--tombstone-gray)]/30" />
      </div>

      {/* Candle Holder Base */}
      <div className="w-4 h-1 bg-[var(--tombstone-gray)] rounded-full" />
    </div>
  );
};
