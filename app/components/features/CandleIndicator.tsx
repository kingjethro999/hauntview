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
        <div className="w-2 h-3.5 rounded-full bg-[#F4B860] shadow-[0_0_8px_#F4B860] animate-pulse -mb-0.5" />
      )}

      {status === 'ok' && (
        <div className="w-2 h-3 rounded-full bg-[#F4B860] shadow-[0_0_6px_#F4B860] -mb-0.5 opacity-90" />
      )}

      {status === 'findings' && (
        <div className="w-2 h-2.5 rounded-full bg-[#F4B860] shadow-[0_0_8px_#F28B77] animate-bounce -mb-0.5" />
      )}

      {status === 'error' && (
        <div className="flex flex-col items-center -mb-0.5">
          <div className="w-1 h-2 bg-[#F28B77] rounded-sm opacity-60" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#373746]" />
        </div>
      )}

      {status === 'unlit' && (
        <div className="w-0.5 h-2 bg-[#5B7C99] rounded-t -mb-0.5 opacity-50" />
      )}

      {status === 'skipped' && (
        <div className="w-2 h-1 border border-dashed border-[#5B7C99] -mb-0.5 opacity-40" />
      )}

      {/* Candle Body */}
      <div
        className={`w-3.5 h-4 rounded-t-sm border border-[#2C4B68] flex items-center justify-center ${
          status === 'error'
            ? 'bg-[#153049] border-[#F28B77]/40'
            : status === 'findings'
              ? 'bg-[#153049] border-[#F4B860]/40'
              : status === 'running'
                ? 'bg-[#153049] border-[#F4B860]/60'
                : 'bg-[#0E2233]'
        }`}
      >
        <div className="w-1 h-full bg-[#2C4B68]/30" />
      </div>

      {/* Candle Holder Base */}
      <div className="w-4 h-1 bg-[#2C4B68] rounded-full" />
    </div>
  );
};
