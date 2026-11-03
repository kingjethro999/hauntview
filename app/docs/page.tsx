'use client';

import React from 'react';
import { Container } from '../components/layout/Container';
import { CommandLineIcon, SparklesIcon, CpuChipIcon } from '@heroicons/react/24/outline';

export default function ManualPage() {
  return (
    <div className="py-10 md:py-16 space-y-12">
      <Container size="lg">
        {/* Header */}
        <div className="space-y-4 mb-10 pb-8 border-b border-[#46334b]/40">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(255,121,31,0.1)] text-[#ff791f] border border-[rgba(255,121,31,0.25)]">
              Developer Codex · v0.1.0
            </span>
            <span className="font-mono text-xs px-2.5 py-1 rounded bg-[rgba(154,255,154,0.1)] text-[#9aff9a] border border-[rgba(154,255,154,0.25)]">
              Hosted Instance Live
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-[#fff1dc]">
            HauntView Developer Manual
          </h1>
          <p className="text-sm md:text-base text-[#d9d3e0] max-w-3xl leading-relaxed">
            The authoritative manual for configuring HauntView across agentic workflows. Connect
            Kiro directly to the hosted or local engine via the Model Context Protocol (MCP),
            install HauntView as a standalone Kiro Power, or run the full suite locally.
          </p>
        </div>

        {/* Section 1: HauntView MCP Server */}
        <section className="space-y-6 mb-16">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[rgba(255,121,31,0.15)] text-[#ff791f]">
              <CommandLineIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#fff1dc]">
                1. HauntView MCP Server (The Medium)
              </h2>
              <p className="text-xs text-[#b9acbf]">
                Exposes deterministic web chaos testing directly to your AI agent in Kiro IDE.
              </p>
            </div>
          </div>

          <div className="victorian-panel p-6 space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-[#ff791f] mb-1">
                Connecting to Hosted Engine (Zero-Install Default)
              </h3>
              <p className="text-xs text-[#d9d3e0] mb-3 leading-relaxed">
                Add this block to your project&apos;s{' '}
                <code className="px-1.5 py-0.5 rounded bg-[#1c1629] text-[#ff791f] font-mono">
                  .kiro/settings/mcp.json
                </code>
                . By default, requests route directly to the hosted service at{' '}
                <code className="text-[#9aff9a]">https://hauntview.onrender.com</code>, so you do
                not need Playwright or browser binaries installed on your workstation.
              </p>

              <pre className="p-4 rounded-lg bg-[#0a0711] border border-[#46334b] text-xs font-mono text-[#d9d3e0] overflow-x-auto">
                {`{
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
              </pre>
            </div>

            <div className="pt-4 border-t border-[#46334b]/30">
              <h3 className="text-sm font-semibold text-[#ff791f] mb-1">Local Engine Mode</h3>
              <p className="text-xs text-[#d9d3e0] mb-3 leading-relaxed">
                To run tests completely offline using your local Chromium engine, point{' '}
                <code className="font-mono text-[#ff791f]">HAUNT_API_URL</code> to localhost or
                remove it:
              </p>
              <pre className="p-4 rounded-lg bg-[#0a0711] border border-[#46334b] text-xs font-mono text-[#d9d3e0] overflow-x-auto">
                {`"env": {
  "HAUNT_API_URL": "http://localhost:3000",
  "NODE_ENV": "development"
}`}
              </pre>
            </div>

            {/* MCP Tools Reference Table */}
            <div className="pt-4 border-t border-[#46334b]/30">
              <h3 className="text-sm font-semibold text-[#ff791f] mb-3">
                MCP Tools &amp; Arguments Reference
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#46334b] text-[#ff791f] font-mono">
                      <th className="py-2.5 px-3">Tool Name</th>
                      <th className="py-2.5 px-3">Arguments</th>
                      <th className="py-2.5 px-3">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#46334b]/30 text-[#d9d3e0]">
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#9aff9a]">
                        list-test-profiles
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#b9acbf]">(none)</td>
                      <td className="py-2.5 px-3">
                        Returns all 25 supported failure-mode testing rites and viewports.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#9aff9a]">
                        run-test-profile
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#b9acbf]">
                        <code>url</code> (string, required)
                        <br />
                        <code>profileId</code> (string, optional)
                      </td>
                      <td className="py-2.5 px-3">
                        Drives headless Chromium through the requested profile (e.g.{' '}
                        <code>mobile-iphone15</code>, <code>js-disabled</code>,{' '}
                        <code>reduced-motion</code>). Returns full run ID and structured findings.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#9aff9a]">
                        get-test-report
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#b9acbf]">
                        <code>runId</code> (string, required)
                      </td>
                      <td className="py-2.5 px-3">
                        Retrieves complete structured JSON report with all findings and screenshot
                        plate references.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#9aff9a]">
                        export-report
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#b9acbf]">
                        <code>runId</code> (string, required)
                        <br />
                        <code>format</code> (&apos;html&apos; | &apos;markdown&apos; |
                        &apos;zip&apos;)
                      </td>
                      <td className="py-2.5 px-3">
                        Generates an exportable artifact or ZIP bundle matching the report ID.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#9aff9a]">
                        compare-runs
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#b9acbf]">
                        <code>baselineRunId</code> (string, required)
                        <br />
                        <code>comparisonRunId</code> (string, required)
                      </td>
                      <td className="py-2.5 px-3">
                        Performs differential comparison: identifies newly appeared omens, lingering
                        issues, and laid-to-rest fixes.
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#9aff9a]">
                        get-latest-run
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#b9acbf]">
                        <code>url</code> (string, optional)
                      </td>
                      <td className="py-2.5 px-3">
                        Returns the most recent test report for a given target URL.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Installing as a Kiro Power */}
        <section className="space-y-6 mb-16">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[rgba(154,255,154,0.15)] text-[#9aff9a]">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#fff1dc]">
                2. Installing HauntView as a Kiro Power
              </h2>
              <p className="text-xs text-[#b9acbf]">
                Package HauntView skills into your Kiro agent so it can automatically run rites and
                exorcise code defects.
              </p>
            </div>
          </div>

          <div className="victorian-panel p-6 space-y-4">
            <p className="text-xs text-[#d9d3e0] leading-relaxed">
              HauntView ships a fully packaged Kiro Power in the{' '}
              <code className="font-mono text-[#ff791f]">power/</code> directory. You can import it
              directly into Kiro IDE using GitHub:
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

        {/* Section 3: Local Setup */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-[rgba(59,130,246,0.15)] text-[#60a5fa]">
              <CpuChipIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#fff1dc]">
                3. Local Setup &amp; Repository Development
              </h2>
              <p className="text-xs text-[#b9acbf]">
                Quickstart instructions for running HauntView on your local workstation.
              </p>
            </div>
          </div>

          <div className="victorian-panel p-6 space-y-4">
            <pre className="p-4 rounded-lg bg-[#0a0711] border border-[#46334b] text-xs font-mono text-[#d9d3e0] overflow-x-auto">
              {`# 1. Clone repository
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
            </pre>
          </div>
        </section>
      </Container>
    </div>
  );
}
