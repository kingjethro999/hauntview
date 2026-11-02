'use client';

import React, { useSyncExternalStore, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './Container';
import { Badge } from '../ui/Badge';
import { AmbientAudio } from '../features/AmbientAudio';
import { SparklesIcon, ArchiveBoxIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const subscribe = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};

const getThemeSnapshot = (): 'parlour' | 'daylight' => {
  if (typeof window === 'undefined') return 'parlour';
  const saved = localStorage.getItem('hauntview-theme');
  return saved === 'daylight' ? 'daylight' : 'parlour';
};

const getServerSnapshot = (): 'parlour' | 'daylight' => 'parlour';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'parlour' ? 'daylight' : 'parlour';
    localStorage.setItem('hauntview-theme', next);
    document.documentElement.setAttribute('data-theme', next);
    window.dispatchEvent(new Event('storage'));
  };

  const navLinks = [
    {
      name: 'The Parlour',
      plain: 'Setup',
      href: '/',
      icon: <SparklesIcon className="w-4 h-4" />,
      active: pathname === '/',
    },
    {
      name: 'The Crypt',
      plain: 'History',
      href: '/crypt',
      icon: <ArchiveBoxIcon className="w-4 h-4" />,
      active: pathname.startsWith('/crypt') || pathname.startsWith('/results'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0E2233]/90 backdrop-blur-md border-b border-[#2C4B68]">
      <Container size="lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-[6px] bg-gradient-to-br from-[#153049] to-[#0E2233] p-0.5 border border-[#F4B860]/40 shadow-[0_0_12px_rgba(244,184,96,0.25)] group-hover:shadow-[0_0_16px_rgba(244,184,96,0.4)] transition-all">
              <div className="w-full h-full bg-[#0E2233] rounded-[4px] flex items-center justify-center text-lg">
                👻
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-[#ECE6D3] group-hover:text-[#F4B860] transition-colors">
                  HauntView
                </span>
                <Badge variant="warning" size="sm">
                  v0.1.0
                </Badge>
              </div>
              <p className="text-[10px] text-[#B4BFC8] tracking-wider uppercase font-medium">
                Spirit Photography Engine
              </p>
            </div>
          </Link>

          {/* Right Navigation & Tools */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Nav links */}
            <nav className="flex items-center gap-1 sm:gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`
                    flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all
                    ${
                      link.active
                        ? 'bg-[#153049] text-[#F4B860] border border-[#F4B860]/50 shadow-[0_0_10px_rgba(244,184,96,0.15)]'
                        : 'text-[#B4BFC8] hover:text-[#ECE6D3] hover:bg-[#153049]/50 border border-transparent'
                    }
                  `}
                >
                  {link.icon}
                  <span>{link.name}</span>
                  <span className="hidden md:inline text-[10px] opacity-70">({link.plain})</span>
                </Link>
              ))}
            </nav>

            <div className="h-4 w-[1px] bg-[#2C4B68] hidden sm:block" />

            {/* Synthesized Web Audio Toggle */}
            <div className="hidden sm:block">
              <AmbientAudio />
            </div>

            {/* Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'parlour' ? 'Daylight (Paper)' : 'Parlour (Cyanotype)'} theme`}
              className="p-1.5 rounded-[6px] text-xs border border-[#2C4B68] text-[#B4BFC8] hover:text-[#F4B860] hover:bg-[#153049]/60 transition-colors cursor-pointer"
            >
              {theme === 'parlour' ? (
                <SunIcon className="w-4 h-4" />
              ) : (
                <MoonIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </Container>
    </header>
  );
};
