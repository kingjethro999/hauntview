'use client';

import React, { useSyncExternalStore } from 'react';
import { AtmosphereLevel, setAtmosphere } from './AtmosphereLayer';
import { SparklesIcon } from '@heroicons/react/24/outline';

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

const getAtmosphereSnapshot = (): AtmosphereLevel => {
  if (typeof window === 'undefined') return 'subtle';
  const saved = localStorage.getItem('hauntview-atmosphere');
  if (saved === 'off' || saved === 'subtle' || saved === 'full') {
    return saved;
  }
  return 'subtle';
};

const getServerSnapshot = (): AtmosphereLevel => 'subtle';

export const AtmosphereToggle: React.FC = () => {
  const current = useSyncExternalStore(subscribe, getAtmosphereSnapshot, getServerSnapshot);

  const cycleAtmosphere = () => {
    const next: AtmosphereLevel =
      current === 'subtle' ? 'full' : current === 'full' ? 'off' : 'subtle';
    setAtmosphere(next);
  };

  const labels: Record<AtmosphereLevel, string> = {
    off: 'Atmosphere: Off',
    subtle: 'Atmosphere: Subtle',
    full: 'Atmosphere: Full Séance',
  };

  const statusIcons: Record<AtmosphereLevel, string> = {
    off: '🕯️',
    subtle: '✨',
    full: '👻',
  };

  return (
    <button
      type="button"
      onClick={cycleAtmosphere}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-xs font-serif border border-[var(--tombstone-gray)] bg-[var(--ghost-mist)]/80 text-[var(--bone-white)] hover:border-[var(--pumpkin-fire)] hover:text-[var(--pumpkin-fire)] transition-colors cursor-pointer select-none"
      title="Toggle haunting ambient effects (Off, Subtle, Full)"
      aria-label={labels[current]}
    >
      <SparklesIcon className="w-3.5 h-3.5 text-[var(--pumpkin-fire)]" />
      <span>{labels[current]}</span>
      <span className="text-xs" aria-hidden="true">
        {statusIcons[current]}
      </span>
    </button>
  );
};
