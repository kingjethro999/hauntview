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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
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
          <Link
            href="/docs"
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:bg-[rgba(255,121,31,0.08)]"
            style={{ color: 'var(--phantom-gray)' }}
          >
            <Image
              src="/scroll-icon.svg"
              alt="Scroll"
              width={20}
              height={20}
              className="w-5 h-5 inline mr-2 brightness-0 invert"
            />
            Scroll
          </Link>
        </div>
      </div>
    </nav>
  );
}
