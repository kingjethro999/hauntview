'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HomeIcon, DocumentTextIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Close mobile menu on route change without triggering cascading render effects
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  const navLinks = [
    {
      href: '/',
      label: 'Parlour',
      icon: <HomeIcon className="w-4 h-4 mr-2 flex-shrink-0" />,
    },
    {
      href: '/crypt',
      label: 'The Crypt',
      icon: <DocumentTextIcon className="w-4 h-4 mr-2 flex-shrink-0" />,
    },
    {
      href: '/docs',
      label: 'Scroll',
      icon: (
        <Image
          src="/scroll-icon.svg"
          alt="Scroll"
          width={16}
          height={16}
          className="w-4 h-4 mr-2 flex-shrink-0 brightness-0 invert"
        />
      ),
    },
  ];

  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(10, 7, 17, 0.95)',
        borderBottom: '1px solid rgba(255, 121, 31, 0.15)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div>
            <span
              className="font-semibold text-lg tracking-tight"
              style={{ color: 'var(--ghost-white)' }}
            >
              HauntView
            </span>
            <span className="hidden sm:block text-xs" style={{ color: 'var(--phantom-gray)' }}>
              Spirit Photography
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center ${
                  isActive
                    ? 'bg-[rgba(255,121,31,0.12)] text-[var(--candle-primary)] font-semibold'
                    : 'text-[var(--ghost-white)] hover:bg-[rgba(255,121,31,0.08)] hover:text-[var(--candle-primary)]'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Hamburger Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
          className="md:hidden min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-lg text-[var(--ghost-white)] hover:text-[var(--candle-primary)] hover:bg-[rgba(255,121,31,0.08)] transition-colors focus:outline-none"
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6 text-[var(--candle-primary)]" />
          ) : (
            <Bars3Icon className="w-6 h-6 text-[var(--ghost-white)]" />
          )}
        </button>
      </div>

      {/* Mobile Collapsed Menu that Expands */}
      {isOpen && (
        <div className="md:hidden border-b border-[rgba(255,121,31,0.2)] bg-[rgba(10,7,17,0.98)] backdrop-blur-md px-4 pt-2 pb-4 space-y-1 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center min-h-[44px] px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[rgba(255,121,31,0.15)] text-[var(--candle-primary)] font-semibold border border-[rgba(255,121,31,0.3)]'
                    : 'text-[var(--ghost-white)] hover:bg-[rgba(255,121,31,0.08)] hover:text-[var(--candle-primary)]'
                }`}
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
