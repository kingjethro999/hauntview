'use client';

import React from 'react';
import Link from 'next/link';
import { SparklesIcon, HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

export function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 backdrop-blur-md"
      style={{
        background: 'rgba(10, 7, 17, 0.9)',
        borderBottom: '1px solid rgba(255, 121, 31, 0.15)',
        height: 64,
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 121, 31, 0.2), rgba(45, 31, 61, 0.2))',
              border: '1px solid rgba(255, 121, 31, 0.3)',
            }}
          >
            <SparklesIcon className="w-5 h-5" style={{ color: 'var(--candle-primary)' }} />
          </div>
          <div>
            <span className="font-semibold text-lg" style={{ color: 'var(--ghost-white)' }}>
              HauntView
            </span>
            <span className="text-xs block" style={{ color: 'var(--phantom-gray)' }}>
              Spirit Photography Testing
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-1">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[rgba(255,121,31,0.08)]"
            style={{ color: 'var(--ghost-white)' }}
          >
            <HomeIcon className="w-4 h-4 inline mr-2" />
            Parlour
          </Link>
          <Link
            href="/crypt"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[rgba(255,121,31,0.08)]"
            style={{ color: 'var(--phantom-gray)' }}
          >
            <DocumentTextIcon className="w-4 h-4 inline mr-2" />
            The Crypt
          </Link>
        </div>
      </div>
    </nav>
  );
}
