'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CommandLineIcon,
  SparklesIcon,
  CpuChipIcon,
  ServerStackIcon,
  ClockIcon,
  ChevronRightIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  ArrowTopRightOnSquareIcon,
  GlobeAltIcon,
  BoltIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';
import { CodeBlock } from '../components/ui/CodeBlock';
import { FloatingDraggableGhost } from '../components/features/FloatingDraggableGhost';
import { HAUNTVIEW_DOCS_MARKDOWN } from './docs-markdown';

type ClientTab = 'kiro' | 'remote' | 'claude' | 'cursor' | 'windsurf' | 'vscode';

export default function ManualPage() {
  const [activeTab, setActiveTab] = useState<ClientTab>('kiro');
  const [copiedMd, setCopiedMd] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

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
      const sections = ['overview', 'clients', 'kiro-power', 'transports', 'tools', 'local-setup'];
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
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen py-8 md:py-12 bg-[#060309] text-[#d9d3e0]">
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
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#ff791f]/80 mb-2.5 font-semibold px-2">
                  Getting Started
                </h4>
                <nav className="space-y-1">
                  <a
                    href="#overview"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'overview'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#ff791f]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Overview</span>
                  </a>
                  <a
                    href="#transports"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'transports'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#ff791f]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Remote URL vs. Stdio</span>
                  </a>
                </nav>
              </div>

              {/* Navigation Group 2: Client Integration (KIRO FIRST) */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#a855f7]/80 mb-2.5 font-semibold px-2 flex items-center justify-between">
                  <span>Client Integration</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ff791f]/20 text-[#ff791f] font-mono">
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
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#ff791f]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span className="text-[#fff1dc] font-semibold">Kiro IDE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff791f]/20 text-[#ff791f] font-mono">
                      Primary
                    </span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('remote')}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'remote'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Remote HTTP / SSE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#9aff9a]/20 text-[#9aff9a] font-mono">
                      Cloud
                    </span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('claude')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'claude'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Claude Code CLI</span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('cursor')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'cursor'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Cursor IDE</span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('windsurf')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'windsurf'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Windsurf</span>
                  </a>
                  <a
                    href="#clients"
                    onClick={() => setActiveTab('vscode')}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'clients' && activeTab === 'vscode'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#a855f7]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>VS Code</span>
                  </a>
                </nav>
              </div>

              {/* Navigation Group 3: Kiro Power & Reference */}
              <div>
                <h4 className="text-[11px] font-mono uppercase tracking-wider text-[#9aff9a]/80 mb-2.5 font-semibold px-2">
                  Kiro Power &amp; Reference
                </h4>
                <nav className="space-y-1">
                  <a
                    href="#kiro-power"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'kiro-power'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#9aff9a]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <SparklesIcon className="w-3.5 h-3.5 text-[#ff791f]" />
                    <span className="text-[#fff1dc] font-semibold">Kiro Power Pack</span>
                  </a>
                  <a
                    href="#tools"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'tools'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#9aff9a]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>MCP Tools (6 Tools)</span>
                  </a>
                  <a
                    href="#local-setup"
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      activeSection === 'local-setup'
                        ? 'bg-[#1e1329] text-[#fff1dc] border-l-2 border-[#9aff9a]'
                        : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#120a1c]'
                    }`}
                  >
                    <span>Local Self-Hosting</span>
                  </a>
                </nav>
              </div>
            </div>

            {/* Quick Link Card in Sidebar */}
            <div className="p-3.5 rounded-lg border border-[#46334b]/40 bg-[#0d0714] text-xs space-y-2">
              <div className="flex items-center justify-between text-[#b9acbf]">
                <span className="font-mono text-[11px] text-[#ff791f]">Kiro Engine Live</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#9aff9a] animate-pulse" />
              </div>
              <p className="text-[11px] text-[#7a6a82] leading-relaxed">
                Render deployment active with Sparticuz Chromium runtime.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1 text-[11px] font-mono text-[#9aff9a] hover:underline"
              >
                <span>Launch Parlour</span>
                <ChevronRightIcon className="w-3 h-3" />
              </Link>
            </div>
          </aside>

          {/* ========================================================= */}
          {/* MAIN DOCUMENTATION CONTENT                                */}
          {/* ========================================================= */}
          <main className="flex-1 min-w-0 max-w-4xl space-y-16 pb-24">
            {/* Top Breadcrumb & Actions Bar */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#46334b]/40">
              <div className="flex items-center gap-2 text-xs text-[#7a6a82] font-mono">
                <Link href="/" className="hover:text-[#ff791f] transition-colors">
                  HauntView
                </Link>
                <span>/</span>
                <span className="text-[#b9acbf]">Manual</span>
                <span>/</span>
                <span className="text-[#ff791f]">Model Context Protocol</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Reading time badge */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#120a1c] border border-[#46334b]/50 text-xs text-[#b9acbf] font-mono">
                  <ClockIcon className="w-3.5 h-3.5 text-[#ff791f]" />
                  <span>6 min read</span>
                </div>

                {/* "Copy page as Markdown" Button */}
                <button
                  type="button"
                  onClick={handleCopyPageAsMd}
                  aria-label="Copy entire manual as Markdown"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-[#ff791f]/40 bg-[#ff791f]/10 hover:bg-[#ff791f]/20 text-[#ff791f] hover:text-[#fff1dc] text-xs font-mono transition-all duration-150 cursor-pointer shadow-sm hover:shadow-[0_0_12px_rgba(255,121,31,0.25)]"
                >
                  {copiedMd ? (
                    <>
                      <CheckIcon className="w-4 h-4 text-[#9aff9a]" />
                      <span className="text-[#9aff9a] font-medium">Copied as MD!</span>
                    </>
                  ) : (
                    <>
                      <DocumentDuplicateIcon className="w-4 h-4 text-[#ff791f]" />
                      <span>Copy page as MD</span>
                    </>
                  )}
                </button>

                {/* GitHub link */}
                <a
                  href="https://github.com/kingjethro999/hauntview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#46334b]/60 bg-[#120a1c] hover:bg-[#1a0f26] text-xs text-[#b9acbf] hover:text-[#fff1dc] font-mono transition-all"
                >
                  <span>GitHub</span>
                  <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </header>

            {/* ========================================================= */}
            {/* SECTION 1: OVERVIEW                                       */}
            {/* ========================================================= */}
            <section id="overview" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(255,121,31,0.12)] text-[#ff791f] border border-[rgba(255,121,31,0.3)]">
                  Kiro Hackathon Edition · v0.1.0
                </span>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(154,255,154,0.12)] text-[#9aff9a] border border-[rgba(154,255,154,0.3)]">
                  Hosted Service Active
                </span>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(168,85,247,0.12)] text-[#a855f7] border border-[rgba(168,85,247,0.3)]">
                  MCP Protocol 2024-11-05
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[#fff1dc]">
                HauntView Developer Manual
              </h1>

              <p className="text-sm sm:text-base text-[#b9acbf] leading-relaxed max-w-3xl">
                The authoritative manual for orchestrating HauntView across autonomous coding
                agents. Built for the <strong>Kiro Hackathon</strong> to equip your{' '}
                <strong>Kiro agents</strong> with deterministic resilience testing, responsive
                viewport audits, and accessibility defect detection.
              </p>
            </section>

            {/* ========================================================= */}
            {/* SECTION 2: CLIENT CONFIGURATION TABS (KIRO FIRST)         */}
            {/* ========================================================= */}
            <section id="clients" className="space-y-6 pt-6 border-t border-[#46334b]/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#ff791f]/15 text-[#ff791f]">
                  <BoltIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#fff1dc]">
                    1. Client Integration Guides (Kiro First)
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Connect your AI coding assistant to HauntView via the Model Context Protocol.
                  </p>
                </div>
              </div>

              {/* Tabs navigation - KIRO FIRST */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-[#0e0717] border border-[#46334b]/50">
                {/* 1. KIRO IDE (FIRST) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('kiro')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'kiro'
                      ? 'bg-[#251538] text-[#fff1dc] font-semibold shadow-sm border border-[#ff791f]/50 text-[#ff791f]'
                      : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#180e24]'
                  }`}
                >
                  <SparklesIcon className="w-3.5 h-3.5 text-[#ff791f]" />
                  <span>Kiro IDE</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#ff791f]/20 text-[#ff791f] font-mono">
                    Primary
                  </span>
                </button>

                {/* 2. REMOTE HTTP / SSE */}
                <button
                  type="button"
                  onClick={() => setActiveTab('remote')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'remote'
                      ? 'bg-[#251538] text-[#fff1dc] font-semibold shadow-sm border border-[#9aff9a]/40 text-[#9aff9a]'
                      : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#180e24]'
                  }`}
                >
                  <GlobeAltIcon className="w-3.5 h-3.5 text-[#9aff9a]" />
                  <span>Remote HTTP / SSE</span>
                </button>

                {/* 3. CLAUDE CODE */}
                <button
                  type="button"
                  onClick={() => setActiveTab('claude')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'claude'
                      ? 'bg-[#251538] text-[#fff1dc] font-semibold shadow-sm border border-[#a855f7]/40 text-[#fff1dc]'
                      : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#180e24]'
                  }`}
                >
                  Claude Code
                </button>

                {/* 4. CURSOR */}
                <button
                  type="button"
                  onClick={() => setActiveTab('cursor')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'cursor'
                      ? 'bg-[#251538] text-[#fff1dc] font-semibold shadow-sm border border-[#a855f7]/40 text-[#fff1dc]'
                      : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#180e24]'
                  }`}
                >
                  Cursor
                </button>

                {/* 5. WINDSURF */}
                <button
                  type="button"
                  onClick={() => setActiveTab('windsurf')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'windsurf'
                      ? 'bg-[#251538] text-[#fff1dc] font-semibold shadow-sm border border-[#a855f7]/40 text-[#fff1dc]'
                      : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#180e24]'
                  }`}
                >
                  Windsurf
                </button>

                {/* 6. VS CODE */}
                <button
                  type="button"
                  onClick={() => setActiveTab('vscode')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-mono transition-all cursor-pointer ${
                    activeTab === 'vscode'
                      ? 'bg-[#251538] text-[#fff1dc] font-semibold shadow-sm border border-[#a855f7]/40 text-[#fff1dc]'
                      : 'text-[#9c8ea3] hover:text-[#fff1dc] hover:bg-[#180e24]'
                  }`}
                >
                  VS Code
                </button>
              </div>

              {/* Tab Content Panes */}
              <div className="victorian-panel p-6 space-y-4">
                {/* 1. KIRO IDE TAB (FIRST) */}
                {activeTab === 'kiro' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fff1dc] flex items-center gap-2">
                        <SparklesIcon className="w-4 h-4 text-[#ff791f]" />
                        Kiro IDE Configuration (Primary Hackathon Target)
                      </h3>
                      <p className="text-xs text-[#b9acbf] mt-1 leading-relaxed">
                        In your Kiro workspace, place this configuration directly inside{' '}
                        <code className="text-[#ff791f] font-mono">.kiro/settings/mcp.json</code>.
                        Your Kiro agent will instantly gain access to all HauntView chaos testing
                        tools.
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#9aff9a] font-mono mb-2">
                        Option A: Remote Cloud (Zero local dependencies — Recommended)
                      </p>
                      <CodeBlock
                        title=".kiro/settings/mcp.json (Remote Cloud)"
                        language="json"
                        code={`{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}`}
                      />
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-[#ff791f] font-mono mb-2">
                        Option B: Local Stdio Subprocess (With remote engine routing)
                      </p>
                      <CodeBlock
                        title=".kiro/settings/mcp.json (Stdio Engine)"
                        language="json"
                        code={`{
  "mcpServers": {
    "hauntview": {
      "command": "node",
      "args": ["--import", "tsx/esm", "src/mcp/server.ts"],
      "env": {
        "HAUNT_API_URL": "https://hauntview.onrender.com",
        "NODE_ENV": "development"
      }
    }
  }
}`}
                      />
                    </div>
                  </div>
                )}

                {/* 2. REMOTE TAB */}
                {activeTab === 'remote' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fff1dc] flex items-center gap-2">
                        <GlobeAltIcon className="w-4 h-4 text-[#9aff9a]" />
                        Universal Remote HTTP / SSE Endpoint (Zero-Install)
                      </h3>
                      <p className="text-xs text-[#b9acbf] mt-1 leading-relaxed">
                        Add this configuration to any MCP-compatible agent to execute tests against
                        HauntView&apos;s hosted engine. No local dependencies, Node.js installation,
                        or browser binaries required.
                      </p>
                    </div>

                    <CodeBlock
                      title="mcp.json (Standard MCP HTTP format)"
                      language="json"
                      code={`{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}`}
                    />
                  </div>
                )}

                {/* 3. CLAUDE CODE TAB */}
                {activeTab === 'claude' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fff1dc]">
                        Claude Code CLI Configuration
                      </h3>
                      <p className="text-xs text-[#b9acbf] mt-1 leading-relaxed">
                        Add HauntView directly to Claude Code using the CLI. The command
                        automatically registers the tools in your global{' '}
                        <code className="text-[#ff791f] font-mono">~/.claude.json</code>:
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-[#9aff9a] font-mono mb-2">
                        Option A: Remote Streamable HTTP (Recommended)
                      </p>
                      <CodeBlock
                        title="Terminal"
                        language="bash"
                        code="claude mcp add --transport sse hauntview https://hauntview.onrender.com/api/mcp"
                      />
                    </div>

                    <div className="pt-2">
                      <p className="text-xs text-[#ff791f] font-mono mb-2">
                        Option B: Stdio Transport (Local Repository)
                      </p>
                      <CodeBlock
                        title="Terminal"
                        language="bash"
                        code="claude mcp add hauntview -- node --import tsx/esm src/mcp/server.ts"
                      />
                    </div>
                  </div>
                )}

                {/* 4. CURSOR TAB */}
                {activeTab === 'cursor' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fff1dc]">
                        Cursor IDE Configuration
                      </h3>
                      <p className="text-xs text-[#b9acbf] mt-1 leading-relaxed">
                        In Cursor, open <strong>Settings &gt; Features &gt; MCP</strong>, or paste
                        into <code className="text-[#ff791f] font-mono">.cursor/mcp.json</code>{' '}
                        (workspace) or{' '}
                        <code className="text-[#ff791f] font-mono">~/.cursor/mcp.json</code>{' '}
                        (global):
                      </p>
                    </div>

                    <CodeBlock
                      title=".cursor/mcp.json (Hosted Remote)"
                      language="json"
                      code={`{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}`}
                    />

                    <div className="pt-2">
                      <p className="text-xs text-[#7a6a82] mb-2 font-mono">
                        Alternative: Run via local stdio within the cloned repository:
                      </p>
                      <CodeBlock
                        title=".cursor/mcp.json (Local Stdio)"
                        language="json"
                        code={`{
  "mcpServers": {
    "hauntview": {
      "command": "node",
      "args": ["--import", "tsx/esm", "src/mcp/server.ts"],
      "env": {
        "HAUNT_API_URL": "https://hauntview.onrender.com"
      }
    }
  }
}`}
                      />
                    </div>
                  </div>
                )}

                {/* 5. WINDSURF TAB */}
                {activeTab === 'windsurf' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fff1dc]">
                        Windsurf Configuration
                      </h3>
                      <p className="text-xs text-[#b9acbf] mt-1 leading-relaxed">
                        Add to your Windsurf configuration at{' '}
                        <code className="text-[#ff791f] font-mono">
                          ~/.codeium/windsurf/mcp_config.json
                        </code>
                        :
                      </p>
                    </div>

                    <CodeBlock
                      title="~/.codeium/windsurf/mcp_config.json"
                      language="json"
                      code={`{
  "mcpServers": {
    "hauntview": {
      "serverUrl": "https://hauntview.onrender.com/api/mcp"
    }
  }
}`}
                    />
                  </div>
                )}

                {/* 6. VS CODE TAB */}
                {activeTab === 'vscode' && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#fff1dc]">
                        VS Code Configuration
                      </h3>
                      <p className="text-xs text-[#b9acbf] mt-1 leading-relaxed">
                        Add to your workspace&apos;s{' '}
                        <code className="text-[#ff791f] font-mono">.vscode/mcp.json</code> file:
                      </p>
                    </div>

                    <CodeBlock
                      title=".vscode/mcp.json"
                      language="json"
                      code={`{
  "servers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}`}
                    />
                  </div>
                )}
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 3: KIRO POWER EXTENSION                           */}
            {/* ========================================================= */}
            <section id="kiro-power" className="space-y-6 pt-6 border-t border-[#46334b]/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#ff791f]/15 text-[#ff791f]">
                  <SparklesIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#fff1dc]">
                    2. Installing as a Kiro Power
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Package HauntView skills into your Kiro agent to automatically audit and
                    exorcise code defects.
                  </p>
                </div>
              </div>

              <div className="victorian-panel p-6 space-y-4">
                <p className="text-xs text-[#d9d3e0] leading-relaxed">
                  HauntView ships a fully packaged Kiro Power in the{' '}
                  <code className="font-mono text-[#ff791f]">power/</code> directory. You can import
                  it directly into Kiro IDE using GitHub:
                </p>

                <ol className="list-decimal list-inside space-y-2 text-xs text-[#d9d3e0]">
                  <li>
                    Open Kiro IDE and open the <strong>Powers</strong> panel.
                  </li>
                  <li>
                    Click <strong>Import Power from GitHub</strong>.
                  </li>
                  <li>
                    Paste repository URL:
                    <code className="ml-2 px-2 py-0.5 rounded bg-[#0a0711] text-[#9aff9a] font-mono border border-[#46334b]">
                      https://github.com/kingjethro999/hauntview
                    </code>
                  </li>
                  <li>
                    Click <strong>Install</strong>. Kiro will register the MCP tools and three
                    specialized skills:
                  </li>
                </ol>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3.5 rounded bg-[#0a0711] border border-[#46334b]">
                    <div className="text-xs font-mono font-semibold text-[#ff791f] mb-1">
                      haunt-a-website
                    </div>
                    <p className="text-[11px] text-[#b9acbf]">
                      Scans target website under failure rites and returns structured defect plates.
                    </p>
                  </div>
                  <div className="p-3.5 rounded bg-[#0a0711] border border-[#46334b]">
                    <div className="text-xs font-mono font-semibold text-[#9aff9a] mb-1">
                      exorcise-findings
                    </div>
                    <p className="text-[11px] text-[#b9acbf]">
                      Takes findings from a run, inspects codebase, and patches root causes.
                    </p>
                  </div>
                  <div className="p-3.5 rounded bg-[#0a0711] border border-[#46334b]">
                    <div className="text-xs font-mono font-semibold text-[#60a5fa] mb-1">setup</div>
                    <p className="text-[11px] text-[#b9acbf]">
                      One-shot environment verifier and configuration helper.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 4: TRANSPORTS ARCHITECTURE                        */}
            {/* ========================================================= */}
            <section id="transports" className="space-y-6 pt-6 border-t border-[#46334b]/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#9aff9a]/15 text-[#9aff9a]">
                  <ServerStackIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#fff1dc]">
                    3. MCP Transports: Remote URL vs. Local Stdio
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Why some MCP servers use remote URLs and others use local commands.
                  </p>
                </div>
              </div>

              {/* Explanatory cards side-by-side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Remote HTTP / SSE Card */}
                <div className="victorian-panel p-5 space-y-3 border-l-2 border-l-[#9aff9a]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#9aff9a] font-semibold flex items-center gap-1.5">
                      <GlobeAltIcon className="w-4 h-4" />
                      Remote HTTP / SSE (&quot;url&quot;)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#9aff9a]/15 text-[#9aff9a] text-[10px] font-mono">
                      Cloud Gateway
                    </span>
                  </div>
                  <p className="text-xs text-[#b9acbf] leading-relaxed">
                    Connects directly over the web via Server-Sent Events (SSE) and HTTP POST.
                    <strong> Zero local installation</strong>: your agent simply talks to the remote
                    cloud URL. No Node.js, Playwright, or browser downloads on your machine.
                  </p>
                  <div className="text-[11px] font-mono text-[#7a6a82] bg-[#07030c] p-2.5 rounded border border-[#46334b]/40">
                    Endpoint:{' '}
                    <span className="text-[#9aff9a]">https://hauntview.onrender.com/api/mcp</span>
                  </div>
                </div>

                {/* Local Stdio Subprocess Card */}
                <div className="victorian-panel p-5 space-y-3 border-l-2 border-l-[#ff791f]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-[#ff791f] font-semibold flex items-center gap-1.5">
                      <CommandLineIcon className="w-4 h-4" />
                      Local Stdio Subprocess (&quot;command&quot;)
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#ff791f]/15 text-[#ff791f] text-[10px] font-mono">
                      Subprocess
                    </span>
                  </div>
                  <p className="text-xs text-[#b9acbf] leading-relaxed">
                    Spawns a local process on your computer communicating through standard
                    input/output (<code className="text-[#ff791f]">stdio</code>). Ideal for running
                    100% offline, inspecting local source files, or forwarding test executions to a
                    private engine.
                  </p>
                  <div className="text-[11px] font-mono text-[#7a6a82] bg-[#07030c] p-2.5 rounded border border-[#46334b]/40">
                    Command:{' '}
                    <span className="text-[#ff791f]">node --import tsx/esm src/mcp/server.ts</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 5: MCP TOOLS REFERENCE                            */}
            {/* ========================================================= */}
            <section id="tools" className="space-y-6 pt-6 border-t border-[#46334b]/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#a855f7]/15 text-[#a855f7]">
                  <CodeBracketIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#fff1dc]">
                    4. Model Context Protocol Tools Reference
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Six tools registered on the server for automated chaos testing, auditing, and
                    report generation.
                  </p>
                </div>
              </div>

              {/* Tools Table / Cards */}
              <div className="space-y-4">
                {/* Tool 1 */}
                <div className="victorian-panel p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#9aff9a]">
                      list-test-profiles
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82] px-2 py-0.5 rounded bg-[#0a0512] border border-[#46334b]/40 self-start sm:self-auto">
                      args: (none)
                    </span>
                  </div>
                  <p className="text-xs text-[#d9d3e0] leading-relaxed">
                    Returns all 25 supported failure-mode testing rites, viewport matrices, and
                    timeouts. Used by agents to discover which rites to run (e.g. mobile viewports,
                    high-contrast, disabled JS).
                  </p>
                </div>

                {/* Tool 2 */}
                <div className="victorian-panel p-5 space-y-2 border-l-2 border-l-[#ff791f]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#ff791f]">
                      run-test-profile
                    </span>
                    <span className="text-[11px] font-mono text-[#ff791f] px-2 py-0.5 rounded bg-[#0a0512] border border-[#ff791f]/40 self-start sm:self-auto">
                      url (req), profileId (opt)
                    </span>
                  </div>
                  <p className="text-xs text-[#d9d3e0] leading-relaxed">
                    Drives headless Chromium through the requested profile (e.g.{' '}
                    <code className="text-[#9aff9a] font-mono">mobile-iphone15</code>,{' '}
                    <code className="text-[#9aff9a] font-mono">js-disabled</code>,{' '}
                    <code className="text-[#9aff9a] font-mono">reduced-motion</code>). Returns the
                    unique run ID, total defect counts, and structured diagnostic findings.
                  </p>
                </div>

                {/* Tool 3 */}
                <div className="victorian-panel p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#9aff9a]">
                      get-run-status
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82] px-2 py-0.5 rounded bg-[#0a0512] border border-[#46334b]/40 self-start sm:self-auto">
                      runId (req)
                    </span>
                  </div>
                  <p className="text-xs text-[#d9d3e0] leading-relaxed">
                    Returns real-time execution progress, status, and severity counters (errors,
                    warnings, info) for an active or completed run.
                  </p>
                </div>

                {/* Tool 4 */}
                <div className="victorian-panel p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#9aff9a]">
                      get-latest-report
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82] px-2 py-0.5 rounded bg-[#0a0512] border border-[#46334b]/40 self-start sm:self-auto">
                      args: (none)
                    </span>
                  </div>
                  <p className="text-xs text-[#d9d3e0] leading-relaxed">
                    Retrieves the complete structured JSON report and findings from the most recent
                    test run in the store.
                  </p>
                </div>

                {/* Tool 5 */}
                <div className="victorian-panel p-5 space-y-2 border-l-2 border-l-[#a855f7]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#a855f7]">compare-runs</span>
                    <span className="text-[11px] font-mono text-[#a855f7] px-2 py-0.5 rounded bg-[#0a0512] border border-[#a855f7]/40 self-start sm:self-auto">
                      runId1 (req), runId2 (req)
                    </span>
                  </div>
                  <p className="text-xs text-[#d9d3e0] leading-relaxed">
                    Differential regression analysis between two runs: computes new defects
                    introduced, persistent issues, and fixes laid to rest.
                  </p>
                </div>

                {/* Tool 6 */}
                <div className="victorian-panel p-5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-[#9aff9a]">
                      export-report
                    </span>
                    <span className="text-[11px] font-mono text-[#7a6a82] px-2 py-0.5 rounded bg-[#0a0512] border border-[#46334b]/40 self-start sm:self-auto">
                      runId (req), format: &apos;html&apos; | &apos;markdown&apos; |
                      &apos;json&apos;
                    </span>
                  </div>
                  <p className="text-xs text-[#d9d3e0] leading-relaxed">
                    Generates an interactive stand-alone HTML Grimoire report, clean Markdown
                    document, or JSON export.
                  </p>
                </div>
              </div>
            </section>

            {/* ========================================================= */}
            {/* SECTION 6: LOCAL REPOSITORY SETUP                         */}
            {/* ========================================================= */}
            <section id="local-setup" className="space-y-6 pt-6 border-t border-[#46334b]/40">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded bg-[#60a5fa]/15 text-[#60a5fa]">
                  <CpuChipIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#fff1dc]">
                    5. Local Setup &amp; Repository Development
                  </h2>
                  <p className="text-xs text-[#7a6a82]">
                    Quickstart instructions for running HauntView on your local workstation.
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

# 4. Run test suites (27 suites, 108 tests)
pnpm test

# 5. Run compliance presubmit checks
pnpm run presubmit`}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
