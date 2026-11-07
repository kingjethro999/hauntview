'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CommandLineIcon,
  SparklesIcon,
  CpuChipIcon,
  ServerStackIcon,
  ChevronRightIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  BoltIcon,
  CodeBracketIcon,
  DevicePhoneMobileIcon,
  WrenchScrewdriverIcon,
  ShieldCheckIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { CodeBlock } from '../components/ui/CodeBlock';
import { FloatingDraggableGhost } from '../components/features/FloatingDraggableGhost';
import { HAUNTVIEW_DOCS_MARKDOWN } from './docs-markdown';
import { VERSION } from '../../src/version';

type ClientTab = 'kiro' | 'remote' | 'claude' | 'cursor' | 'windsurf' | 'vscode';

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<ClientTab>('kiro');
  const [copiedMd, setCopiedMd] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [scrollProgress, setScrollProgress] = useState(0);

  const handleCopyPageAsMd = async () => {
    try {
      await navigator.clipboard.writeText(HAUNTVIEW_DOCS_MARKDOWN.trim());
      setCopiedMd(true);
      setTimeout(() => setCopiedMd(false), 2500);
    } catch (err) {
      console.error('Failed to copy documentation as Markdown:', err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      setScrollProgress(progress);

      const sections = [
        'overview',
        'cli',
        'profiles',
        'clients',
        'kiro-power',
        'transports',
        'tools',
        'local-setup',
      ];
      const scrollPosition = window.scrollY + 160;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen py-8 md:py-12 bg-[#060309] text-[var(--spirit-smoke)]">
      {/* On-Page Reading Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 z-[60] h-[3px] pointer-events-none transition-all duration-75 ease-out"
        style={{
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, var(--pumpkin-fire) 0%, #ffaa55 100%)',
          boxShadow: '0 0 10px var(--pumpkin-fire), 0 0 5px var(--pumpkin-fire)',
        }}
        role="progressbar"
        aria-valuenow={Math.round(scrollProgress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Documentation reading scroll progress"
      />

      {/* Draggable wandering ghost companion */}
      <FloatingDraggableGhost />

      {/* Outer Docs Frame (Wide responsive layout) */}
      <div className="mx-auto w-full max-w-[1520px] px-4 sm:px-6 md:px-8 lg:px-10">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* ========================================================= */}
          {/* LEFT STICKY SIDEBAR NAVIGATION                           */}
          {/* ========================================================= */}
          <aside className="shrink-0 lg:w-[260px] lg:sticky lg:top-24 lg:self-start lg:max-h-[calc(100vh-7rem)] overflow-y-auto space-y-8 pr-2 pb-10">
            <div className="space-y-6">
              {/* Navigation Group 1: Getting Started */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-2">
                  <h4 className="text-[11px] font-mono uppercase tracking-wider text-[var(--pumpkin-fire)]/80 font-semibold">
                    Getting Started
                  </h4>
                  {scrollProgress > 0 && (
                    <span className="text-[10px] font-mono text-[var(--pumpkin-fire)]/90 bg-[var(--pumpkin-fire)]/10 px-1.5 py-0.5 rounded border border-[var(--pumpkin-fire)]/20">
                      {Math.round(scrollProgress)}% read
                    </span>
                  )}
                </div>
                <nav className="space-y-1">
                  <a
                    href="#overview"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'overview'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--pumpkin-fire)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Overview</span>
                  </a>
                  <a
                    href="#cli"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'cli'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--pumpkin-fire)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <CommandLineIcon className="w-3.5 h-3.5 text-[var(--pumpkin-fire)]" />
                    <span className="font-semibold text-[var(--bone-white)]">
                      Official CLI (haunt)
                    </span>
                  </a>
                  <a
                    href="#profiles"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'profiles'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--pumpkin-fire)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <DevicePhoneMobileIcon className="w-3.5 h-3.5 text-[var(--ectoplasm-green)]" />
                    <span>29 Testing Profiles</span>
                  </a>
                </nav>
              </div>

              {/* Navigation Group 2: Client Integration (KIRO FIRST) */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#a855f7]/80 mb-2.5 font-semibold px-2 flex items-center justify-between">
                  <span>Client Integration</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--pumpkin-fire)]/20 text-[var(--pumpkin-fire)] font-mono">
                    Kiro First
                  </span>
                </h4>
                <nav className="space-y-1">
                  {/* Kiro IDE First */}
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('kiro')}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'kiro'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--pumpkin-fire)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span className="text-[var(--bone-white)] font-semibold">Kiro IDE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--pumpkin-fire)]/20 text-[var(--pumpkin-fire)] font-mono">
                      Primary
                    </span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('remote')}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'remote'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Remote HTTP / SSE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[var(--ectoplasm-green)]/20 text-[var(--ectoplasm-green)] font-mono">
                      Cloud
                    </span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('claude')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'claude'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Claude Code CLI</span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('cursor')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'cursor'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Cursor IDE</span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('windsurf')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'windsurf'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Windsurf</span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('vscode')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'vscode'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>VS Code</span>
                  </a>
                </nav>
              </div>

              {/* Navigation Group 3: Kiro Power & Reference */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-[var(--ectoplasm-green)]/80 mb-2.5 font-semibold px-2">
                  Kiro Power &amp; Architecture
                </h4>
                <nav className="space-y-1">
                  <a
                    href="#kiro-power"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'kiro-power'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--ectoplasm-green)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-[var(--pumpkin-fire)]" />
                    <span className="text-[var(--bone-white)] font-semibold">Kiro Power Pack</span>
                  </a>
                  <a
                    href="#transports"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'transports'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--pumpkin-fire)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Remote URL vs. Stdio</span>
                  </a>
                  <a
                    href="#tools"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'tools'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--ectoplasm-green)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>MCP Tools (6 Tools)</span>
                  </a>
                  <a
                    href="#local-setup"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'local-setup'
                        ? 'bg-[#1e1329] text-[var(--bone-white)] border-l-2 border-[var(--ectoplasm-green)]'
                        : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Local Development Setup</span>
                  </a>
                </nav>
              </div>
            </div>

            {/* Quick Actions Panel in Sidebar */}
            <div className="pt-4 border-t border-[var(--tombstone-gray)]/40 space-y-2">
              <button
                type="button"
                onClick={handleCopyPageAsMd}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-[#1e1329] text-[var(--bone-white)] border border-[rgba(255,121,31,0.25)] hover:border-[var(--pumpkin-fire)] hover:bg-[rgba(255,121,31,0.1)] transition-all shadow-sm"
              >
                {copiedMd ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-[var(--ectoplasm-green)]" />
                    <span className="text-[var(--ectoplasm-green)] font-semibold">
                      Copied Markdown!
                    </span>
                  </>
                ) : (
                  <>
                    <DocumentDuplicateIcon className="w-4 h-4 text-[var(--pumpkin-fire)]" />
                    <span>Copy docs as Markdown</span>
                  </>
                )}
              </button>

              <Link
                href="/"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs text-[#9c8ea3] hover:text-[var(--bone-white)] transition-colors"
              >
                <span>Return to Parlour</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* MAIN ARTICLE CONTENT                                      */}
          {/* ========================================================= */}
          <main className="flex-1 min-w-0 space-y-12 pb-20">
            {/* Header with Title and Metadata */}
            <header className="space-y-4 pb-6 border-b border-[var(--tombstone-gray)]/40">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-[#7a6a82] font-mono">
                  <span>Documentation</span>
                  <span>/</span>
                  <span className="text-[var(--pumpkin-fire)] font-medium">Developer Manual</span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://www.npmjs.com/package/hauntview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#cb3837]/15 border border-[#cb3837]/30 text-xs font-mono text-[#ff8b89] hover:bg-[#cb3837]/25 transition-colors"
                  >
                    <span>npm: hauntview@{VERSION}</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href="https://github.com/kingjethro999/hauntview"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1e1329] border border-[var(--tombstone-gray)]/40 text-xs font-mono text-[var(--spirit-smoke)] hover:text-[var(--bone-white)] hover:border-[var(--pumpkin-fire)] transition-colors"
                  >
                    <span>GitHub</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </header>

            {/* ========================================================= */}
            {/* SECTION 1: OVERVIEW                                       */}
            {/* ========================================================= */}
            <section id="overview" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(255,121,31,0.12)] text-[var(--pumpkin-fire)] border border-[rgba(255,121,31,0.3)]">
                  HauntView v{VERSION}
                </span>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(154,255,154,0.12)] text-[var(--ectoplasm-green)] border border-[rgba(154,255,154,0.3)]">
                  Hosted Service Active
                </span>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(168,85,247,0.12)] text-[#a855f7] border border-[rgba(168,85,247,0.3)]">
                  MCP Protocol 2024-11-05
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[var(--bone-white)]">
                HauntView Developer Manual
              </h1>

              <p className="text-sm sm:text-base text-[var(--grave-dust)] leading-relaxed max-w-3xl">
                The authoritative manual for orchestrating HauntView across autonomous coding agents
                and terminal workflows. Built for the <strong>Kiro Hackathon</strong> to equip your{' '}
                <strong>Kiro agents</strong> with deterministic failure-mode resilience testing,
                responsive viewport audits, and accessibility defect detection across{' '}
                <strong>29 automated testing profiles</strong>.
              </p>
            </section>

            {/* ========================================================= */}
            {/* SECTION 2: OFFICIAL CLI (haunt)                           */}
            {/* ========================================================= */}
            <section id="cli" className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--pumpkin-fire)]/15 text-[var(--pumpkin-fire)]">
                  <CommandLineIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    1. Command-Line Interface (
                    <code className="text-[var(--pumpkin-fire)]">haunt</code>)
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Official zero-dependency CLI compiled for Node 22 LTS or newer. Install globally
                    or run instantly with npx.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="victorian-panel p-4 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--pumpkin-fire)] font-bold">
                    Global Installation via npm
                  </span>
                  <CodeBlock
                    title="Install Globally"
                    language="bash"
                    code="npm install -g hauntview"
                  />
                  <p className="text-xs text-[#9c8ea3]">
                    Installs the <code className="text-[var(--bone-white)]">haunt</code> and{' '}
                    <code className="text-[var(--bone-white)]">hauntview</code> commands to your
                    system path.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[var(--ectoplasm-green)] font-bold">
                    Zero-Install Execution via npx
                  </span>
                  <CodeBlock
                    title="Instant Run"
                    language="bash"
                    code="npx hauntview http://localhost:3000"
                  />
                  <p className="text-xs text-[#9c8ea3]">
                    Runs the latest release directly without permanent machine modifications.
                  </p>
                </div>
              </div>

              {/* Direct Profile Flags & Targeted Runs */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-semibold text-[var(--bone-white)] flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-[var(--pumpkin-fire)]" />
                  <span>Direct Profile Flags &amp; Targeted Runs</span>
                </h3>
                <p className="text-xs text-[var(--grave-dust)] leading-relaxed">
                  Want to run just 1, 2, or 3 profiles? You don&apos;t have to remember profile IDs
                  or configure a JSON file. Pass direct flags right in the command line:
                </p>

                <CodeBlock
                  title="Direct Flag Examples"
                  language="bash"
                  code={`# Run specific profiles directly via flags
haunt http://localhost:3000 --mobile --desktop --offline --broken-links

# Run fault injection profiles
haunt https://example.com --image-failure --font-failure --js-disabled

# Run security header audits and performance checks
haunt https://example.com --performance --security-hygiene`}
                />
              </div>

              {/* Category Shortcut Flags */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-semibold text-[var(--bone-white)] flex items-center gap-2">
                  <BoltIcon className="w-4 h-4 text-[#a855f7]" />
                  <span>Category Shortcut Flags</span>
                </h3>
                <p className="text-xs text-[var(--grave-dust)] leading-relaxed">
                  Run entire testing categories with a single shorthand flag:
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--tombstone-gray)] text-[#9c8ea3]">
                        <th className="py-2.5 px-3 font-mono font-medium">Shortcut Flag</th>
                        <th className="py-2.5 px-3 font-medium">Category Description</th>
                        <th className="py-2.5 px-3 font-mono">Included Profiles</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--tombstone-gray)]/30 text-[var(--spirit-smoke)]">
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-[var(--pumpkin-fire)] font-bold">
                          --a11y, --accessibility
                        </td>
                        <td className="py-2.5 px-3">All 4 accessibility audits</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          screenreader, keyboard, visual, cognitive
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-[var(--pumpkin-fire)] font-bold">
                          --resilience
                        </td>
                        <td className="py-2.5 px-3">Network &amp; fault resilience</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          offline, broken-links, network-resilience, form-resilience
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-[var(--pumpkin-fire)] font-bold">
                          --devices
                        </td>
                        <td className="py-2.5 px-3">Responsive device viewports</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          mobile, tablet, desktop, iphone15, android, ipad, 1080p, 4k
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-[var(--pumpkin-fire)] font-bold">
                          --browsers
                        </td>
                        <td className="py-2.5 px-3">Browser engine compatibility</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          webkit, firefox, edge, legacy
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-[var(--pumpkin-fire)] font-bold">
                          --i18n
                        </td>
                        <td className="py-2.5 px-3">Internationalization &amp; scripts</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          i18n-rtl, i18n-cjk, i18n-mixed
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2.5 px-3 font-mono text-[var(--pumpkin-fire)] font-bold">
                          --faults
                        </td>
                        <td className="py-2.5 px-3">Environmental chaos faults</td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          image-failure, font-failure, js-disabled, reduced-motion
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <CodeBlock
                  title="Category Shortcut Commands"
                  language="bash"
                  code={`# Run all accessibility audits
haunt http://localhost:3000 --a11y

# Run resilience and recovery rites
haunt http://localhost:3000 --resilience

# Run by tag or combine multiple tags
haunt http://localhost:3000 --tag mobile,resilience
haunt http://localhost:3000 --tags devices,faults`}
                />
              </div>

              {/* CI/CD & Automation Options */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-semibold text-[var(--bone-white)] flex items-center gap-2">
                  <ShieldCheckIcon className="w-4 h-4 text-[var(--ectoplasm-green)]" />
                  <span>CI/CD Pipeline Automation &amp; Flags</span>
                </h3>

                <CodeBlock
                  title="CI/CD Pipeline Run"
                  language="bash"
                  code={`# Complete CI run with custom outputs, export directory, and concurrency
haunt https://example.com \\
  --output zip,html \\
  --out-dir ./reports \\
  --concurrency \\
  --concurrency-amount 2 \\
  --yes`}
                />

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[var(--tombstone-gray)] text-[#9c8ea3]">
                        <th className="py-2.5 px-3 font-mono font-medium">Flag</th>
                        <th className="py-2.5 px-3 font-mono font-medium">Short</th>
                        <th className="py-2.5 px-3 font-medium">Description</th>
                        <th className="py-2.5 px-3 font-mono">Default</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--tombstone-gray)]/30 text-[var(--spirit-smoke)]">
                      <tr>
                        <td className="py-2 px-3 font-mono text-[var(--bone-white)]">
                          --output &lt;formats&gt;
                        </td>
                        <td className="py-2 px-3 font-mono text-[var(--pumpkin-fire)]">-o</td>
                        <td className="py-2 px-3">
                          Comma-separated output formats (
                          <code className="font-mono text-xs">zip, html, md, json</code>)
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">
                          Saved config (<code className="text-[var(--pumpkin-fire)]">zip,html</code>
                          )
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-[var(--bone-white)]">
                          --out-dir &lt;path&gt;
                        </td>
                        <td className="py-2 px-3 font-mono text-[var(--pumpkin-fire)]">-d</td>
                        <td className="py-2 px-3">
                          Destination directory (supports{' '}
                          <code className="font-mono text-xs">.</code>,{' '}
                          <code className="font-mono text-xs">~</code>, or absolute path)
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">
                          Saved config (<code className="text-[var(--pumpkin-fire)]">.</code>)
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-[var(--bone-white)]">
                          --concurrency
                        </td>
                        <td className="py-2 px-3 font-mono text-[var(--pumpkin-fire)]">-c</td>
                        <td className="py-2 px-3">
                          Enable parallel profile execution across browser pool
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">
                          Active by default if &gt;= 4 cores
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-[var(--bone-white)]">
                          --concurrency-amount &lt;n&gt;
                        </td>
                        <td className="py-2 px-3 font-mono text-[var(--pumpkin-fire)]">-a</td>
                        <td className="py-2 px-3">
                          Worker pool concurrency limit (subject to hardware cap)
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">2 (dynamic up to 4)</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono text-[var(--bone-white)]">--yes</td>
                        <td className="py-2 px-3 font-mono text-[var(--pumpkin-fire)]">-y</td>
                        <td className="py-2 px-3">
                          Non-interactive mode, skip interactive prompts and accept saved defaults
                        </td>
                        <td className="py-2 px-3 font-mono text-xs">false</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Subcommands: Setup, Doctor, Self-Update */}
              <div className="space-y-3 pt-2">
                <h3 className="text-base font-semibold text-[var(--bone-white)] flex items-center gap-2">
                  <WrenchScrewdriverIcon className="w-4 h-4 text-[var(--pumpkin-fire)]" />
                  <span>Built-in Utility Commands</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="victorian-panel p-4 space-y-1.5">
                    <span className="font-mono text-xs text-[var(--pumpkin-fire)] font-bold">
                      haunt setup
                    </span>
                    <p className="text-xs text-[#9c8ea3]">
                      Interactive wizard to configure global defaults (export formats, destination
                      folder, concurrency pool size).
                    </p>
                    <code className="text-[11px] font-mono text-[var(--grave-dust)] block pt-1">
                      --show · --reset
                    </code>
                  </div>

                  <div className="victorian-panel p-4 space-y-1.5">
                    <span className="font-mono text-xs text-[var(--ectoplasm-green)] font-bold">
                      haunt doctor
                    </span>
                    <p className="text-xs text-[#9c8ea3]">
                      Verifies system health: Node.js version, Playwright browser installations, and
                      hardware capability heuristics.
                    </p>
                    <code className="text-[11px] font-mono text-[var(--grave-dust)] block pt-1">
                      Hardware &amp; browser probe
                    </code>
                  </div>

                  <div className="victorian-panel p-4 space-y-1.5">
                    <span className="font-mono text-xs text-[#a855f7] font-bold">
                      haunt self-update
                    </span>
                    <p className="text-xs text-[#9c8ea3]">
                      Checks the npm registry and updates the global installation to the latest
                      published release.
                    </p>
                    <code className="text-[11px] font-mono text-[var(--grave-dust)] block pt-1">
                      Aliases: update, upgrade
                    </code>
                  </div>
                </div>
              </div>

              {/* Predictable Exit Codes */}
              <div className="victorian-panel p-4 space-y-2 border-l-2 border-l-[var(--pumpkin-fire)]">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--pumpkin-fire)] font-bold">
                  Predictable Exit Codes for Test Gates
                </span>
                <ul className="text-xs space-y-1 text-[var(--spirit-smoke)]">
                  <li>
                    <code className="font-mono font-bold text-[var(--ectoplasm-green)]">0</code> —{' '}
                    <strong>Success:</strong> All requested profiles executed and zero
                    error-severity findings were discovered (warnings or info suggestions may
                    exist).
                  </li>
                  <li>
                    <code className="font-mono font-bold text-[#ff4538]">1</code> —{' '}
                    <strong>Test Failure:</strong> One or more error-severity defects were proven
                    (ideal for CI test gates).
                  </li>
                  <li>
                    <code className="font-mono font-bold text-[#eab308]">2</code> —{' '}
                    <strong>Runtime Error:</strong> URL safety violation (private network IP
                    blocked), unhandled exception, or missing permissions.
                  </li>
                </ul>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 3: 29 TESTING PROFILES                            */}
            {/* ========================================================= */}
            <section
              id="profiles"
              className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--ectoplasm-green)]/15 text-[var(--ectoplasm-green)]">
                  <DevicePhoneMobileIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    2. The 29 Testing Profiles Reference
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Exhaustive matrix of device viewports, accessibility standards,
                    internationalization, performance, and chaos rites.
                  </p>
                </div>
              </div>

              {/* Profiles Categorized Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category 1: Devices */}
                <div className="victorian-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--pumpkin-fire)]">
                      Device Viewports (8 Profiles)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--pumpkin-fire)]/10 text-[var(--pumpkin-fire)] border border-[var(--pumpkin-fire)]/20">
                      --devices
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-[var(--spirit-smoke)]">
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">mobile</code>: Canonical
                      390×844 mobile viewport with 48px touch target enforcement.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">desktop</code>: Canonical
                      1280×800 desktop standard viewport.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">tablet</code>: Canonical
                      820×1180 tablet viewport with 44px Apple touch target minimum.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">mobile-iphone15</code>:
                      Apple iPhone 15 Pro (390×844 @3x DPR).
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">mobile-android</code>:
                      Samsung Galaxy S23 (360×800 @2x DPR).
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">tablet-ipad</code>: Apple
                      iPad Pro 12.9&quot; (1024×1366 @2x DPR).
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">desktop-1080p</code>:
                      Standard Full HD 1920×1080 desktop.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">desktop-4k</code>: Ultra
                      HD 4K 3840×2160 high-resolution desktop.
                    </li>
                  </ul>
                </div>

                {/* Category 2: Resilience */}
                <div className="victorian-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ectoplasm-green)]">
                      Resilience &amp; Degradation (4 Profiles)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--ectoplasm-green)]/10 text-[var(--ectoplasm-green)] border border-[var(--ectoplasm-green)]/20">
                      --resilience
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-[var(--spirit-smoke)]">
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">offline</code>: Loads
                      page, severs all network connectivity, and checks for service worker caches.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">broken-links</code>:
                      Crawls same-origin anchor hrefs (cap 100) flagging 404/410/5xx errors.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">network-resilience</code>
                      : Aborts all XHR and fetch requests to verify graceful degradation.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">form-resilience</code>:
                      Submits empty and invalid forms, verifying that visual feedback is shown.
                    </li>
                  </ul>
                </div>

                {/* Category 3: Accessibility */}
                <div className="victorian-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#a855f7]">
                      Accessibility Standards (4 Profiles)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20">
                      --a11y
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-[var(--spirit-smoke)]">
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">a11y-visual</code>: Color
                      contrast (WCAG AA 4.5:1) with recursive alpha compositing and gradient
                      detection.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">a11y-keyboard</code>: Tab
                      stop sequence, visible focus rings, and focus trap detection.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">a11y-screenreader</code>:
                      ARIA roles, skip-to-main-content link, and heading outline hierarchy.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">a11y-cognitive</code>:
                      Reading complexity, paragraph density, and motion thresholds.
                    </li>
                  </ul>
                </div>

                {/* Category 4: Internationalization */}
                <div className="victorian-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#60a5fa]">
                      Internationalization (3 Profiles)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20">
                      --i18n
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-[var(--spirit-smoke)]">
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">i18n-rtl</code>:
                      Right-to-Left Arabic (ar-SA) layout, mirrored navigation, and numeral formats.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">i18n-cjk</code>: Japanese
                      (ja-JP) CJK font stack rendering and word-break boundary wrapping.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">i18n-mixed</code>:
                      Multi-script rendering (Hindi Devanagari mixed with Latin numerals).
                    </li>
                  </ul>
                </div>

                {/* Category 5: Browser Engines */}
                <div className="victorian-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#f59e0b]">
                      Browser Engines (4 Profiles)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20">
                      --browsers
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-[var(--spirit-smoke)]">
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">browser-webkit</code>{' '}
                      (alias <code className="text-[var(--pumpkin-fire)]">--webkit</code>): Apple
                      Safari / WebKit engine compatibility.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">browser-firefox</code>{' '}
                      (alias <code className="text-[var(--pumpkin-fire)]">--firefox</code>): Mozilla
                      Firefox Gecko engine rendering.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">browser-edge</code>{' '}
                      (alias <code className="text-[var(--pumpkin-fire)]">--edge</code>): Microsoft
                      Edge Chromium channel compatibility.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">browser-legacy</code>:
                      Legacy CSS custom properties and Modern Grid fallback verification.
                    </li>
                  </ul>
                </div>

                {/* Category 6: Environmental Fault Injection */}
                <div className="victorian-panel p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#ec4899]">
                      Environmental Faults &amp; Chaos (4 Profiles)
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ec4899]/10 text-[#ec4899] border border-[#ec4899]/20">
                      --faults
                    </span>
                  </div>
                  <ul className="text-xs space-y-2 text-[var(--spirit-smoke)]">
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">image-failure</code>:
                      Blocks 100% of images; validates alt attributes and layout stability.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">font-failure</code>:
                      Blocks 100% of web fonts; audits fallback font layout shift (CLS).
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">js-disabled</code>:
                      Disables JavaScript execution; audits readable content &amp; &lt;noscript&gt;
                      fallbacks.
                    </li>
                    <li>
                      <code className="font-mono text-[var(--bone-white)]">reduced-motion</code>:
                      Sets prefers-reduced-motion: reduce; checks for running CSS/JS animations.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 4: CLIENT CONFIGURATION TABS (KIRO FIRST)         */}
            {/* ========================================================= */}
            <section
              id="clients"
              className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--pumpkin-fire)]/15 text-[var(--pumpkin-fire)]">
                  <BoltIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    3. Client Integration Guides (Kiro First)
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Connect your autonomous AI coding agents to HauntView via Model Context Protocol
                    (MCP).
                  </p>
                </div>
              </div>

              {/* Tabs Navigation */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[var(--tombstone-gray)]/40">
                <button
                  type="button"
                  onClick={() => setActiveTab('kiro')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'kiro'
                      ? 'bg-[var(--pumpkin-fire)] text-[var(--midnight-veil)] shadow-[0_0_12px_rgba(255,121,31,0.4)]'
                      : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                  }`}
                >
                  <SparklesIcon className="w-4 h-4" />
                  <span>Kiro IDE (Primary)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('remote')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    activeTab === 'remote'
                      ? 'bg-[#a855f7] text-[var(--midnight-veil)] shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                  }`}
                >
                  <GlobeAltIcon className="w-4 h-4" />
                  <span>Remote HTTP / SSE</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('claude')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'claude'
                      ? 'bg-[#a855f7] text-[var(--midnight-veil)]'
                      : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                  }`}
                >
                  Claude Code CLI
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('cursor')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'cursor'
                      ? 'bg-[#a855f7] text-[var(--midnight-veil)]'
                      : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                  }`}
                >
                  Cursor IDE
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('windsurf')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'windsurf'
                      ? 'bg-[#a855f7] text-[var(--midnight-veil)]'
                      : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                  }`}
                >
                  Windsurf
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('vscode')}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    activeTab === 'vscode'
                      ? 'bg-[#a855f7] text-[var(--midnight-veil)]'
                      : 'text-[#9c8ea3] hover:text-[var(--bone-white)] hover:bg-[#120a1c]'
                  }`}
                >
                  VS Code
                </button>
              </div>

              {/* Tab 1: Kiro IDE Content */}
              {activeTab === 'kiro' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="victorian-panel p-5 space-y-3 border-l-2 border-l-[var(--pumpkin-fire)]">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs uppercase tracking-wider text-[var(--pumpkin-fire)] font-bold">
                        Native Kiro Configuration
                      </span>
                      <span className="text-[11px] font-mono text-[var(--pumpkin-fire)] px-2 py-0.5 rounded bg-[var(--pumpkin-fire)]/10 border border-[var(--pumpkin-fire)]/30">
                        Target: .kiro/settings/mcp.json
                      </span>
                    </div>
                    <p className="text-xs text-[var(--spirit-smoke)] leading-relaxed">
                      Add HauntView to your project&apos;s workspace settings in{' '}
                      <code className="text-[var(--bone-white)] font-mono">
                        .kiro/settings/mcp.json
                      </code>
                      . Your Kiro agents will gain access to all 29 testing tools and skills.
                    </p>
                  </div>

                  <CodeBlock
                    title=".kiro/settings/mcp.json"
                    language="json"
                    code={`{
  "mcpServers": {
    "hauntview": {
      "command": "pnpm",
      "args": ["mcp"],
      "disabled": false
    }
  }
}`}
                  />
                </div>
              )}

              {/* Tab 2: Remote HTTP / SSE */}
              {activeTab === 'remote' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="victorian-panel p-5 space-y-3 border-l-2 border-l-[#a855f7]">
                    <span className="font-mono text-xs uppercase tracking-wider text-[#a855f7] font-bold">
                      Hosted Render Cloud Endpoint
                    </span>
                    <p className="text-xs text-[var(--spirit-smoke)] leading-relaxed">
                      Connect any MCP client over Server-Sent Events (SSE) directly to the hosted
                      engine.
                    </p>
                  </div>

                  <CodeBlock
                    title="mcp.json (Remote SSE)"
                    language="json"
                    code={`{
  "mcpServers": {
    "hauntview-remote": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}`}
                  />
                </div>
              )}

              {/* Tab 3: Claude Code CLI */}
              {activeTab === 'claude' && (
                <div className="space-y-4 animate-fadeIn">
                  <CodeBlock
                    title="Terminal (Add MCP to Claude Code)"
                    language="bash"
                    code={`claude mcp add hauntview -- node /path/to/hauntview/dist/cli.js`}
                  />
                </div>
              )}

              {/* Tab 4: Cursor IDE */}
              {activeTab === 'cursor' && (
                <div className="space-y-4 animate-fadeIn">
                  <CodeBlock
                    title=".cursor/mcp.json"
                    language="json"
                    code={`{
  "mcpServers": {
    "hauntview": {
      "command": "node",
      "args": ["/absolute/path/to/hauntview/dist/cli.js"]
    }
  }
}`}
                  />
                </div>
              )}

              {/* Tab 5: Windsurf */}
              {activeTab === 'windsurf' && (
                <div className="space-y-4 animate-fadeIn">
                  <CodeBlock
                    title="~/.codeium/windsurf/mcp_config.json"
                    language="json"
                    code={`{
  "mcpServers": {
    "hauntview": {
      "command": "pnpm",
      "args": ["--prefix", "/absolute/path/to/hauntview", "mcp"]
    }
  }
}`}
                  />
                </div>
              )}

              {/* Tab 6: VS Code */}
              {activeTab === 'vscode' && (
                <div className="space-y-4 animate-fadeIn">
                  <CodeBlock
                    title=".vscode/mcp.json"
                    language="json"
                    code={`{
  "servers": {
    "hauntview": {
      "type": "stdio",
      "command": "pnpm",
      "args": ["mcp"]
    }
  }
}`}
                  />
                </div>
              )}
            </section>

            {/* ========================================================= */}
            {/* SECTION 5: KIRO POWER PACK                                */}
            {/* ========================================================= */}
            <section
              id="kiro-power"
              className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--pumpkin-fire)]/15 text-[var(--pumpkin-fire)]">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    4. Installing as a Kiro Power
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    HauntView is fully packaged as an installable Kiro Power under{' '}
                    <code className="font-mono text-xs">power/</code>.
                  </p>
                </div>
              </div>

              <div className="victorian-panel p-5 space-y-4">
                <ol className="text-xs space-y-2 list-decimal list-inside text-[var(--spirit-smoke)] leading-relaxed">
                  <li>
                    In <strong>Kiro IDE</strong>, open the <strong>Powers</strong> sidebar and click{' '}
                    <strong>Add Custom Power</strong>.
                  </li>
                  <li>
                    Select <strong>Import power from GitHub</strong>.
                  </li>
                  <li>
                    Paste repository URL:{' '}
                    <code className="text-[var(--pumpkin-fire)] font-mono">
                      https://github.com/kingjethro999/hauntview
                    </code>
                  </li>
                  <li>Confirm installation.</li>
                </ol>
              </div>

              {/* Included Skills */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="victorian-panel p-4 space-y-1.5">
                  <span className="font-mono text-xs text-[var(--pumpkin-fire)] font-bold">
                    haunt-a-website
                  </span>
                  <p className="text-xs text-[#9c8ea3]">
                    Runs automated failure-mode testing rites against any URL and returns structured
                    finding plates.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5">
                  <span className="font-mono text-xs text-[var(--ectoplasm-green)] font-bold">
                    exorcise-findings
                  </span>
                  <p className="text-xs text-[#9c8ea3]">
                    Reads report findings, locates the root causes in your code, and patches them
                    with verified evidence.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5">
                  <span className="font-mono text-xs text-[#a855f7] font-bold">setup</span>
                  <p className="text-xs text-[#9c8ea3]">
                    Verifies local dependencies, installs browser engines, and validates
                    configuration.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 6: TRANSPORTS (REMOTE VS STDIO)                   */}
            {/* ========================================================= */}
            <section
              id="transports"
              className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[var(--pumpkin-fire)]/15 text-[var(--pumpkin-fire)]">
                  <ServerStackIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    5. Remote URL vs. Stdio Subprocess
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Choose the transport mechanism that best fits your environment.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="victorian-panel p-5 space-y-3 border-l-2 border-l-[var(--ectoplasm-green)]">
                  <span className="font-mono text-xs font-bold text-[var(--ectoplasm-green)] uppercase tracking-wider">
                    Remote URL Transport (Cloud)
                  </span>
                  <p className="text-xs text-[var(--spirit-smoke)] leading-relaxed">
                    Zero local dependencies. Uses Server-Sent Events (SSE) to stream diagnostics
                    from the hosted Render engine.
                  </p>
                </div>

                <div className="victorian-panel p-5 space-y-3 border-l-2 border-l-[var(--pumpkin-fire)]">
                  <span className="font-mono text-xs font-bold text-[var(--pumpkin-fire)] uppercase tracking-wider">
                    Stdio Subprocess (Local)
                  </span>
                  <p className="text-xs text-[var(--spirit-smoke)] leading-relaxed">
                    Spawns a local Node.js process directly within your IDE. Zero cloud round-trips
                    and full parallel browser execution.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 7: MCP TOOLS REFERENCE                            */}
            {/* ========================================================= */}
            <section
              id="tools"
              className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#a855f7]/15 text-[#a855f7]">
                  <CodeBracketIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    6. Model Context Protocol Tools Reference
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Six deterministic tools registered on the MCP server for chaos testing,
                    auditing, and report generation.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="victorian-panel p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--ectoplasm-green)]">
                      list-test-profiles
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82]">args: none</span>
                  </div>
                  <p className="text-xs text-[var(--spirit-smoke)]">
                    Returns all 29 testing profiles, viewports, and timeout matrices for agent
                    discovery.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5 border-l-2 border-l-[var(--pumpkin-fire)]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--pumpkin-fire)]">
                      run-test-profile
                    </span>
                    <span className="text-[11px] font-mono text-[var(--pumpkin-fire)]">
                      url (req), profileId (opt)
                    </span>
                  </div>
                  <p className="text-xs text-[var(--spirit-smoke)]">
                    Drives headless browsers through specified testing profiles and returns
                    structured defect findings.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--ectoplasm-green)]">
                      get-run-status
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82]">runId (req)</span>
                  </div>
                  <p className="text-xs text-[var(--spirit-smoke)]">
                    Returns real-time execution progress, status, and severity counters.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--ectoplasm-green)]">
                      get-latest-report
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82]">args: none</span>
                  </div>
                  <p className="text-xs text-[var(--spirit-smoke)]">
                    Retrieves the complete structured JSON report from the most recent run in the
                    store.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5 border-l-2 border-l-[#a855f7]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[#a855f7]">compare-runs</span>
                    <span className="text-[11px] font-mono text-[#a855f7]">
                      runId1 (req), runId2 (req)
                    </span>
                  </div>
                  <p className="text-xs text-[var(--spirit-smoke)]">
                    Differential regression analysis between two runs: computes new defects,
                    persistent issues, and fixed defects.
                  </p>
                </div>

                <div className="victorian-panel p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-[var(--ectoplasm-green)]">
                      export-report
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82]">
                      runId (req), format: &apos;html&apos; | &apos;markdown&apos; |
                      &apos;json&apos;
                    </span>
                  </div>
                  <p className="text-xs text-[var(--spirit-smoke)]">
                    Generates standalone HTML Grimoire report, clean Markdown document, or JSON
                    export.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 8: LOCAL REPOSITORY SETUP                         */}
            {/* ========================================================= */}
            <section
              id="local-setup"
              className="space-y-6 pt-6 border-t border-[var(--tombstone-gray)]/40"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#60a5fa]/15 text-[#60a5fa]">
                  <CpuChipIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[var(--bone-white)]">
                    7. Local Setup &amp; Repository Development
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Instructions for cloning and developing HauntView locally.
                  </p>
                </div>
              </div>

              <CodeBlock
                title="Terminal (Local Setup)"
                language="bash"
                code={`# 1. Clone repository
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview

# 2. Install dependencies (Node 22 LTS + pnpm recommended)
pnpm install

# 3. Start local development server (Parlour UI at http://localhost:3000)
pnpm dev

# 4. Run test suites (39 Jest suites, 211 tests)
pnpm test

# 5. Build CLI bundle
node scripts/build-cli.mjs

# 6. Typecheck and lint
pnpm run typecheck
pnpm run lint`}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
