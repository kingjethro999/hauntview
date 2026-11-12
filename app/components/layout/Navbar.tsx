'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AmbientAudio } from '../features/AmbientAudio';

/**
 * Navigation as doors. Every room is a door; the room you are in stands open
 * with candlelight spilling out (aria-current drives it). Hovering a door
 * nudges it open. Desktop shows the doors in the top bar; on phones they move
 * to a bottom door-bar within thumb reach.
 */

const ROOMS = [
  { href: '/', label: 'Parlour', hint: 'Run a test' },
  { href: '/crypt', label: 'Crypt', hint: 'Past runs' },
  { href: '/docs', label: 'Scroll', hint: 'Docs' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Door() {
  return (
    <span className="hv-door" aria-hidden="true">
      <span className="hv-door__light" />
      <span className="hv-door__leaf" />
    </span>
  );
}

function DoorLinks({ pathname }: { pathname: string }) {
  return (
    <>
      {ROOMS.map((room) => {
        const active = isActive(pathname, room.href);
        return (
          <Link
            key={room.href}
            href={room.href}
            className="hv-door-link"
            aria-current={active ? 'page' : undefined}
            title={room.hint}
          >
            <Door />
            <span>{room.label}</span>
          </Link>
        );
      })}
    </>
  );
}

export function Navbar() {
  const pathname = usePathname() || '/';

  return (
    <>
      <header className="hv-topbar">
        <div className="hv-topbar__inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="rounded-md min-h-[44px] flex items-center"
            aria-label="HauntView home"
          >
            <span className="hv-wordmark hv-glitch" data-text="HauntView">
              HauntView
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden md:flex hv-doors">
            <DoorLinks pathname={pathname} />
          </nav>

          <AmbientAudio />
        </div>
      </header>

      <nav aria-label="Primary" className="hv-doorbar md:hidden">
        <DoorLinks pathname={pathname} />
      </nav>
    </>
  );
}
