import React from 'react';

export function Footer() {
  return (
    <footer
      className="border-t"
      style={{
        background: 'rgba(10, 7, 17, 0.95)',
        borderColor: 'rgba(255, 121, 31, 0.1)',
        padding: '32px 0',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--phantom-gray)' }}>
            <span>© 2026 HauntView</span>
            <span>·</span>
            <span>Kiroween 2026 Hackathon</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--phantom-gray)' }}>
            Spirit Photography Web Testing Engine
          </div>
        </div>
      </div>
    </footer>
  );
}
