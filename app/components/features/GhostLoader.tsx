import React from 'react';

export interface GhostLoaderProps {
  label: string;
  size?: number;
  className?: string;
}

/**
 * Loading indicator: a small ghost bobbing over its own shadow.
 * The label is the accessible status text, so it should say what is loading.
 */
export function GhostLoader({ label, size = 56, className = '' }: GhostLoaderProps) {
  return (
    <div className={`hv-ghost-loader ${className}`} role="status" aria-live="polite">
      <svg width={size} height={size * 1.1} viewBox="0 0 60 66" aria-hidden="true">
        <path
          d="M8 60V30a22 22 0 0 1 44 0v30l-7.3-6-7.4 6-7.3-6-7.3 6-7.4-6Z"
          fill="var(--hv-bone)"
        />
        <ellipse cx="23" cy="30" rx="3" ry="4" fill="var(--hv-void)" />
        <ellipse cx="37" cy="30" rx="3" ry="4" fill="var(--hv-void)" />
        <ellipse cx="30" cy="41" rx="3" ry="2.2" fill="var(--hv-void)" opacity="0.7" />
      </svg>
      <span className="hv-ghost-loader__shadow" aria-hidden="true" />
      <span className="font-mono text-[length:var(--hv-step--1)]">{label}</span>
    </div>
  );
}
