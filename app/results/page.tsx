'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '../components/layout/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { TestReportSummary } from '@/src/core/report-store';
import {
  DocumentChartBarIcon,
  ArrowLeftIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function ResultsIndexPage() {
  const [reports, setReports] = useState<TestReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/results')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && data?.success && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch test reports:', err);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/results');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.reports)) {
          setReports(data.reports);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch test reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-10 md:py-14 space-y-8">
      <Container size="lg">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--witchcraft-violet)]/25">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/">
                <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />}>
                  Back
                </Button>
              </Link>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-[var(--bone-white)]">
                Test Reports & Execution History
              </h1>
            </div>
            <p className="text-xs text-[var(--slate-epitaph)] pl-10">
              Browse, inspect, and download past test sessions recorded by the HauntView engine
            </p>
          </div>

          <div className="flex items-center gap-2 pl-10 sm:pl-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              icon={<ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>
            <Link href="/">
              <Button variant="secondary" size="sm">
                Run New Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-16 text-center text-sm text-[var(--slate-epitaph)] bg-[var(--haunted-purple)]/20 rounded-xl border border-[var(--witchcraft-violet)]/20">
            Loading test reports history...
          </div>
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<DocumentChartBarIcon className="w-10 h-10 text-[var(--slate-epitaph)]" />}
            title="No Test Sessions Recorded"
            description="You haven't run any tests yet. Launch your first test suite against a website to generate a report."
            action={
              <Link href="/">
                <Button variant="primary">Launch Test Suite</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-[var(--slate-epitaph)] font-medium px-2">
              Showing {reports.length} {reports.length === 1 ? 'report' : 'reports'}
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--witchcraft-violet)]/30 bg-[var(--haunted-purple)]/30">
              <table className="w-full text-left text-sm text-[var(--bone-white)]">
                <thead className="bg-[var(--witchcraft-violet)]/15 border-b border-[var(--witchcraft-violet)]/30 text-xs font-semibold text-[var(--bone-white)] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Target URL</th>
                    <th className="py-3 px-4">Profiles</th>
                    <th className="py-3 px-4">Findings</th>
                    <th className="py-3 px-4">Executed</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--witchcraft-violet)]/15">
                  {reports.map((report) => {
                    const isPass = report.errorCount === 0;

                    return (
                      <tr
                        key={report.id}
                        className="hover:bg-[var(--witchcraft-violet)]/10 transition-colors"
                      >
                        <td className="py-3.5 px-4">
                          <Badge variant={isPass ? 'success' : 'error'} size="sm">
                            {isPass ? 'PASS' : `${report.errorCount} ERRORS`}
                          </Badge>
                        </td>

                        <td
                          className="py-3.5 px-4 font-medium max-w-xs truncate"
                          title={report.url}
                        >
                          <Link
                            href={`/results/${report.id}`}
                            className="hover:text-[var(--pumpkin-fire)] transition-colors"
                          >
                            {report.url}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-[var(--slate-epitaph)]">
                          <span className="text-[var(--bone-white)] font-semibold">
                            {report.successfulProfiles}
                          </span>
                          /{report.totalProfiles} passed
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          {report.totalFindings > 0 ? (
                            <span className="text-[var(--pumpkin-fire)] font-semibold">
                              {report.totalFindings} issues
                            </span>
                          ) : (
                            <span className="text-[var(--success)]">Clean</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-[var(--slate-epitaph)] whitespace-nowrap">
                          <div>{new Date(report.startTime).toLocaleDateString()}</div>
                          <div className="text-[10px] text-[var(--slate-epitaph)]/80 flex items-center gap-1">
                            <ClockIcon className="w-3 h-3 text-[var(--pumpkin-fire)]" />
                            <span>{(report.duration / 1000).toFixed(1)}s</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`/api/results/${report.id}?format=markdown`}
                              download
                              title="Download Markdown Report"
                              className="p-1.5 rounded text-[var(--slate-epitaph)] hover:text-[var(--pumpkin-fire)] hover:bg-[var(--haunted-purple)]/60 transition-colors"
                            >
                              <DocumentTextIcon className="w-4 h-4" />
                            </a>
                            <a
                              href={`/api/results/${report.id}?format=html`}
                              download
                              title="Download HTML Report"
                              className="p-1.5 rounded text-[var(--slate-epitaph)] hover:text-[var(--pumpkin-fire)] hover:bg-[var(--haunted-purple)]/60 transition-colors"
                            >
                              <ArrowDownTrayIcon className="w-4 h-4" />
                            </a>
                            <Link href={`/results/${report.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs py-1 px-3 ml-1"
                              >
                                View Report
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
