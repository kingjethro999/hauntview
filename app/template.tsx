'use client';

import React from 'react';

/**
 * Route template — remounts on every navigation, so each room fades in
 * through a short wash of mist. Opacity/transform only; reduced-motion and
 * Atmosphere "off" both suppress the veil (see nocturne.css).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="hv-mist-veil" />
      <div className="hv-mist-enter flex-1 flex flex-col w-full">{children}</div>
    </>
  );
}
