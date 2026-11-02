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
        <div className="w-2 h-3.5 rounded-full bg-[#ff791f] shadow-[0_0_8px_#ff791f] animate-pulse -mb-0.5" />
      )}

      {status === 'ok' && (
        <div className="w-2 h-3 rounded-full bg-[#ff791f] shadow-[0_0_6px_#ff791f] -mb-0.5 opacity-90" />
      )}

      {status === 'findings' && (
        <div className="w-2 h-2.5 rounded-full bg-[#ff791f] shadow-[0_0_8px_#F28B77] animate-bounce -mb-0.5" />
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center -mb-0.5">
          <div className="w-1 h-2 bg-[#F28B77] rounded-sm opacity-60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#2d1a4a]" />
        </div>
      )}

      {status === 'unlit' && (
        <div className="w-0.5 h-2 bg-[#b9acbf] rounded-t -mb-0.5 opacity-50" />
      )}

      {status === 'skipped' && (
        <div className="w-2 h-1 border border-dashed border-[#b9acbf] -mb-0.5 opacity-40" />
      )}

      {/* Candle Body */}
      <div
        className={`w-3.5 h-4 rounded-t-sm border border-[#46334b] flex items-center justify-center ${
          status === 'error'
            ? 'bg-[#1c1629] border-[#F28B77]/40'
            : status === 'findings'
              ? 'bg-[#1c1629] border-[#ff791f]/40'
              : status === 'running'
                ? 'bg-[#1c1629] border-[#ff791f]/60'
                : 'bg-[#0a0711]'
        }`}
      >
        <div className="w-1 h-full bg-[#46334b]/30" />
      </div>

      {/* Candle Holder Base */}
      <div className="w-4 h-1 bg-[#46334b] rounded-full" />
    </div>
  );
};
