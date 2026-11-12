import React from 'react';
import { VERSION } from '../../../src/version';

export function Footer() {
  return (
    <footer className="border-t border-[var(--hv-seam)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="hv-wordmark !text-xl">HauntView</p>
        <p className="hv-mono-label !tracking-[0.12em]">
          No websites were harmed · Kiroween 2026 ·{' '}
          <span className="text-[var(--hv-ember-bright)]">
            {process.env.NEXT_PUBLIC_APP_VERSION || `v${VERSION}`}
          </span>
        </p>
      </div>
    </footer>
  );
}
