import React from 'react';
import { VERSION } from '../../../src/version';

export function Footer() {
  return (
    <footer className="graveyard-footer">
      <div className="graveyard-decorations">
        {/* Tombstone silhouettes */}
        <div className="tombstone t-1" />
        <div className="tombstone t-2" />
        <div className="tombstone t-3" />
        <div className="tombstone t-4" />
        <div className="tombstone t-5" />

        {/* Iron fence */}
        <div className="iron-fence" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--phantom-gray)' }}>
            <span>© 2026 HauntView</span>
            <span>·</span>
            <span>Kiroween 2026 Hackathon</span>
            <span>·</span>
            <span className="font-mono text-xs text-[var(--pumpkin-fire)]">
              {process.env.NEXT_PUBLIC_APP_VERSION || `v${VERSION}`}
            </span>
          </div>
          <div className="text-xs" style={{ color: 'var(--phantom-gray)' }}>
            Spirit Photography Web Testing Engine
          </div>
        </div>
      </div>
    </footer>
  );
}
