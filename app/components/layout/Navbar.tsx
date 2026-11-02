'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './Container';
import { AmbientAudio } from '../features/AmbientAudio';
import { AtmosphereToggle } from '../features/AtmosphereToggle';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

/* ── SVG brand-mark: 2×2 ghost-eye grid, candle-drop-shadow ── */
const BrandMark: React.FC = () => (
  <div
    className="w-9 h-9 rounded-[5px] flex items-center justify-center flex-shrink-0"
    style={{
      background: 'linear-gradient(135deg, #2d1a4a 0%, #100e13 100%)',
      border: '1px solid rgba(255,121,31,0.35)',
      boxShadow: '0 0 14px rgba(255,121,31,0.2), inset 0 1px 0 rgba(255,157,77,0.08)',
    }}
  >
    {/* Ghost silhouette mark */}
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      {/* ghost body */}
      <path
        d="M4 20 V10 Q4 4 11 4 Q18 4 18 10 V20 L15.5 17.5 L13 20 L11 17.5 L9 20 L6.5 17.5 Z"
        fill="#ff9d4d"
        fillOpacity="0.9"
        style={{ filter: 'drop-shadow(0 0 4px rgba(255,121,31,0.7))' }}
      />
      {/* left eye */}
      <circle cx="8.5" cy="11" r="1.6" fill="#100e13" />
      {/* right eye */}
      <circle cx="13.5" cy="11" r="1.6" fill="#100e13" />
      {/* eye gleams */}
      <circle cx="9" cy="10.4" r="0.5" fill="rgba(255,241,220,0.7)" />
      <circle cx="14" cy="10.4" r="0.5" fill="rgba(255,241,220,0.7)" />
    </svg>
  </div>
);

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    {
      name: 'The Parlour',
      plain: 'Home',
      href: '/',
      active: pathname === '/',
    },
    {
      name: 'The Crypt',
      plain: 'History',
      href: '/crypt',
      icon: <ArchiveBoxIcon className="w-3.5 h-3.5" />,
      active: pathname.startsWith('/crypt') || pathname.startsWith('/results'),
    },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full backdrop-blur-md"
      style={{
        background: 'rgba(16, 14, 19, 0.92)',
        borderBottom: '1px solid #46334b',
      }}
    >
      <Container size="lg">
        <div className="flex items-center justify-between h-14">
          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="HauntView home">
            <BrandMark />
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="font-bold text-lg tracking-tight transition-colors"
                  style={{
                    color: '#fff0dc',
                    fontFamily: 'var(--font-space-grotesk, Space Grotesk, sans-serif)',
                  }}
                >
                  Haunt<span style={{ color: '#ff791f' }}>View</span>
                </span>
                {/* edition chip */}
                <span
                  className="text-[9px] font-mono tracking-widest px-1.5 py-0.5 rounded-sm"
                  style={{
                    color: '#c18bff',
                    background: 'rgba(193,139,255,0.1)',
                    border: '1px solid rgba(193,139,255,0.25)',
                  }}
                >
                  KIROWEEN&nbsp;2026
                </span>
              </div>
              <p
                className="text-[9px] tracking-widest uppercase"
                style={{ color: '#b9acbf', letterSpacing: '1.1px' }}
              >
                Spirit Photography Engine
              </p>
            </div>
          </Link>

          {/* ── Right side ── */}
          <div className="flex items-center gap-3">
            {/* Nav links */}
            <nav className="flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all"
                  style={
                    link.active
                      ? {
                          background: '#32152e',
                          color: '#ff791f',
                          border: '1px solid rgba(255,121,31,0.4)',
                          boxShadow: '0 0 12px rgba(255,121,31,0.12)',
                        }
                      : {
                          color: '#b9acbf',
                          border: '1px solid transparent',
                        }
                  }
                  onMouseEnter={(e) => {
                    if (!link.active) {
                      (e.currentTarget as HTMLElement).style.color = '#fff0dc';
                      (e.currentTarget as HTMLElement).style.background = '#1c1629';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!link.active) {
                      (e.currentTarget as HTMLElement).style.color = '#b9acbf';
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }
                  }}
                >
                  {link.icon}
                  <span>{link.name}</span>
                  <span
                    className="hidden md:inline text-[9px] opacity-60"
                    style={{ fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    ({link.plain})
                  </span>
                </Link>
              ))}
            </nav>

            {/* divider */}
            <div className="h-4 w-px hidden sm:block" style={{ background: '#46334b' }} />

            {/* Atmosphere & Audio */}
            <div className="flex items-center gap-2">
              <AtmosphereToggle />
              <AmbientAudio />
            </div>
          </div>
        </div>
      </Container>
    </header>
  );
};
