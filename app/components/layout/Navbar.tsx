'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from './Container';
import { Badge } from '../ui/Badge';
import { BeakerIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';

export const Navbar: React.FC = () => {
  const pathname = usePathname();

  const navLinks = [
    {
      name: 'Test Launcher',
      href: '/',
      icon: <BeakerIcon className="w-4 h-4" />,
      active: pathname === '/',
    },
    {
      name: 'Reports & History',
      href: '/results',
      icon: <DocumentChartBarIcon className="w-4 h-4" />,
      active: pathname.startsWith('/results'),
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F0F14]/90 backdrop-blur-md border-b border-[#6C3CAA]/25">
      <Container size="lg">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#582696] to-[#DC6428] p-0.5 shadow-[0_0_15px_rgba(88,38,150,0.4)] group-hover:shadow-[0_0_20px_rgba(220,100,40,0.5)] transition-all">
              <div className="w-full h-full bg-[#0F0F14] rounded-[10px] flex items-center justify-center text-lg">
                👻
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-xl tracking-tight text-[#F5F5FA] group-hover:text-[#DC6428] transition-colors">
                  HauntView
                </span>
                <Badge variant="primary" size="sm">
                  v0.1.0
                </Badge>
              </div>
              <p className="text-[10px] text-[#646478] tracking-wider uppercase font-medium">
                Web Testing Engine
              </p>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all
                  ${
                    link.active
                      ? 'bg-[#582696]/20 text-[#DC6428] border border-[#DC6428]/40 shadow-[0_0_12px_rgba(220,100,40,0.15)]'
                      : 'text-[#646478] hover:text-[#F5F5FA] hover:bg-[#373746]/40 border border-transparent'
                  }
                `}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </Container>
    </header>
  );
};
