'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HomeIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-full flex items-center justify-between gap-2">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <div>
            <span
              className="font-semibold text-base sm:text-lg"
              style={{ color: 'var(--ghost-white)' }}
            >
              HauntView
            </span>
            <span className="text-[10px] sm:text-xs block" style={{ color: 'var(--phantom-gray)' }}>
              Spirit Photography
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Link
            href="/"
            className="px-2.5 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:bg-[rgba(255,121,31,0.08)] flex items-center"
            style={{ color: 'var(--ghost-white)' }}
          >
            <HomeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span>Parlour</span>
          </Link>
          <Link
            href="/crypt"
            className="px-2.5 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:bg-[rgba(255,121,31,0.08)] flex items-center"
            style={{ color: 'var(--phantom-gray)' }}
          >
            <DocumentTextIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0" />
            <span>The Crypt</span>
          </Link>
          <Link
            href="/docs"
            className="px-2.5 sm:px-3.5 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:bg-[rgba(255,121,31,0.08)] flex items-center"
            style={{ color: 'var(--phantom-gray)' }}
          >
            <Image
              src="/scroll-icon.svg"
              alt="Scroll"
              width={16}
              height={16}
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5 flex-shrink-0 brightness-0 invert"
            />
            <span>Scroll</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}
