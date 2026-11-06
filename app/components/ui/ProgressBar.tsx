import React from 'react';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  label?: string;
  showPercent?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  label,
  showPercent = false,
  className = '',
  ...props
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`w-full ${className}`} {...props}>
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs text-[#646478] mb-1.5 font-medium">
          {label && <span>{label}</span>}
          {showPercent && <span className="font-mono text-[#fff1dc]">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full bg-[#6C3CAA]/20 rounded-full h-2.5 overflow-hidden"
      >
        <div
          className="h-full bg-gradient-to-r from-[#4a2b8a] via-[#9333ea] to-[#ff791f] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(74,43,138,0.6)]"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};
