'use client';

import React, { useSyncExternalStore, useEffect } from 'react';

export type AtmosphereLevel = 'off' | 'subtle' | 'full';

const ATMOSPHERE_KEY = 'hauntview-atmosphere';

const subscribe = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

const getAtmosphereSnapshot = (): AtmosphereLevel => {
  if (typeof window === 'undefined') return 'subtle';
  const saved = localStorage.getItem(ATMOSPHERE_KEY);
  if (saved === 'off' || saved === 'subtle' || saved === 'full') {
    return saved;
  }
  return 'subtle';
};

const getServerSnapshot = (): AtmosphereLevel => 'subtle';

export function setAtmosphere(level: AtmosphereLevel) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ATMOSPHERE_KEY, level);
  document.documentElement.setAttribute('data-atmosphere', level);
  window.dispatchEvent(new Event('storage'));
}

export const AtmosphereLayer: React.FC = () => {
  const level = useSyncExternalStore(subscribe, getAtmosphereSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute('data-atmosphere', level);
  }, [level]);

  if (level === 'off') {
    return null;
  }

  const isFull = level === 'full';

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* 1. Séance Vignette: Subtle warm candlelight & cyanotype darkness around perimeter */}
      <div
        className={`absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(14,34,51,0.65)_90%,rgba(8,18,28,0.95)_100%)] ${
          isFull ? 'animate-[pulse_8s_ease-in-out_infinite]' : ''
        }`}
      />

      {/* 2. Floor Fog: Drifting spectral mist across the bottom of the viewport */}
      <div className="absolute -bottom-10 left-0 right-0 h-44 opacity-35 overflow-hidden">
        {/* Fog Wave Layer 1 */}
        <div
          className={`absolute bottom-0 -left-[100%] w-[300%] h-36 bg-gradient-to-t from-[#9aff9a]/20 via-[#1c1629]/40 to-transparent blur-2xl ${
            isFull ? 'animate-[drift_45s_linear_infinite]' : ''
          }`}
        />
        {/* Fog Wave Layer 2 */}
        <div
          className={`absolute bottom-0 -left-[50%] w-[250%] h-28 bg-gradient-to-t from-[#ff791f]/10 via-[#0a0711]/50 to-transparent blur-xl ${
            isFull ? 'animate-[drift-reverse_60s_linear_infinite]' : ''
          }`}
        />
      </div>

      {/* 3. Fluttering Moths & Floating Embers (Full Atmosphere only) */}
      {isFull && (
        <>
          {/* Moth 1 */}
          <div className="absolute top-1/4 left-1/6 animate-[mothFlight1_18s_ease-in-out_infinite] opacity-40">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#B9AEE0">
              <path d="M12 10 C8 3, 2 5, 4 12 C5 16, 10 13, 12 11 Z" opacity="0.7" />
              <path d="M12 10 C16 3, 22 5, 20 12 C19 16, 14 13, 12 11 Z" opacity="0.7" />
              <ellipse cx="12" cy="11" rx="1.5" ry="4" fill="#ff791f" />
            </svg>
          </div>

          {/* Moth 2 */}
          <div className="absolute top-1/3 right-1/5 animate-[mothFlight2_24s_ease-in-out_infinite] opacity-35">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff1dc">
              <path d="M12 10 C8 4, 3 6, 5 12 C6 15, 10 13, 12 11 Z" opacity="0.7" />
              <path d="M12 10 C16 4, 21 6, 19 12 C18 15, 14 13, 12 11 Z" opacity="0.7" />
              <ellipse cx="12" cy="11" rx="1.2" ry="3.5" fill="#ff791f" />
            </svg>
          </div>

          {/* Embers drifting upwards */}
          <div className="absolute bottom-20 left-1/3 w-1.5 h-1.5 rounded-full bg-[#ff791f] shadow-[0_0_8px_#ff791f] animate-[emberFloat_9s_ease-in-out_infinite] opacity-60" />
          <div className="absolute bottom-28 right-1/3 w-1 h-1 rounded-full bg-[#9aff9a] shadow-[0_0_6px_#9aff9a] animate-[emberFloat_12s_ease-in-out_infinite_2s] opacity-50" />
        </>
      )}
    </div>
  );
};
