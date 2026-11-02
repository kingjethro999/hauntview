'use client';

import React from 'react';

/**
 * Subtle atmospheric effects layer
 * Fine grain + drifting fog behind content
 * Respects prefers-reduced-motion
 */
export function AtmosphereLayer() {
  return (
    <>
      {/* Fog layer - subtle drift */}
      <div className="fog-layer" aria-hidden="true" />

      {/* Photographic grain overlay */}
      <div className="grain-overlay" aria-hidden="true" />
    </>
  );
}
