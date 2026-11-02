'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '../components/layout/Container';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { TestReportSummary } from '@/src/core/report-store';
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function CryptPage() {
  const [reports, setReports] = useState<TestReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<string>('all');

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
        console.warn('Failed to load Crypt archives:', err);
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
      console.warn('Failed to refresh Crypt archives:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'screams') return r.errorCount > 0;
    if (filter === 'peaceful') return r.errorCount === 0;
    return true;
  });

  return (
    <div className="py-10 md:py-14 space-y-8">
      <Container size="lg">
        {/* Navigation back and actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />}>
              The Parlour
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            loading={isLoading}
            icon={<ArrowPathIcon className="w-4 h-4" />}
          >
            Refresh Crypt
          </Button>
        </div>

        {/* Crypt Header */}
        <div className="pb-6 border-b border-[#2C4B68] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArchiveBoxIcon className="w-6 h-6 text-[#F4B860]" />
              <h1 className="font-display font-extrabold text-2xl md:text-3xl text-[#ECE6D3] tracking-tight">
                The Crypt · Archive of Séances
              </h1>
            </div>
            <p className="text-sm text-[#B4BFC8]">
              Browse previous spirit photography sessions and examine historical apparitions
            </p>
          </div>

          {/* Comparative Status Chips (§3.2 Lexicon) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="px-2.5 py-1 rounded-full bg-[#153049] border border-[#2C4B68] text-[#ECE6D3]">
              <strong>{reports.length}</strong> Total Séances
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#153049] border border-[#A6F0D6]/30 text-[#A6F0D6]">
              Fresh hauntings tracked
            </span>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-2">
          {(['all', 'screams', 'peaceful'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`px-3 py-1.5 rounded-[6px] text-xs font-semibold capitalize cursor-pointer transition-colors ${
                filter === mode
                  ? 'bg-[#F4B860] text-[#0E2233]'
                  : 'bg-[#153049] text-[#B4BFC8] hover:text-[#ECE6D3] border border-[#2C4B68]'
              }`}
            >
              {mode === 'all'
                ? `All Séances (${reports.length})`
                : mode === 'screams'
                  ? 'With Screams (Errors)'
                  : 'Peaceful (No Errors)'}
            </button>
          ))}
        </div>

        {/* Reports Table / List */}
        {isLoading ? (
          <div className="p-16 text-center text-xs text-[#B4BFC8] bg-[#153049]/40 rounded-[2px] border border-[#2C4B68]">
            <SparklesIcon className="w-6 h-6 text-[#F4B860] mx-auto mb-2 animate-spin" />
            Reading the crypt stones...
          </div>
        ) : filteredReports.length === 0 ? (
          <EmptyState
            icon={<ArchiveBoxIcon className="w-10 h-10 text-[#5B7C99]" />}
            title="The Crypt is Empty"
            description="No matching séances recorded. Run a test from The Parlour to add records to the archive."
            action={
              <Link href="/">
                <Button variant="secondary" size="sm">
                  Haunt a Website Now
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="plate rounded-[2px] bg-[#153049] overflow-hidden border border-[#2C4B68]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0E2233] text-[#B4BFC8] border-b border-[#2C4B68] font-mono uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">House (Target URL)</th>
                    <th className="py-3 px-4">Status & Omens</th>
                    <th className="py-3 px-4">Rites Completed</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Séance Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2C4B68] text-[#ECE6D3]">
                  {filteredReports.map((report) => {
                    const isPass = report.errorCount === 0;

                    return (
                      <tr key={report.id} className="hover:bg-[#0E2233]/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium max-w-xs truncate">
                          <Link
                            href={`/results/${report.id}`}
                            className="hover:text-[#F4B860] transition-colors"
                          >
                            {report.url}
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={isPass ? 'success' : 'error'} size="sm">
                              {isPass ? 'NO OMENS' : `${report.errorCount} SCREAMS`}
                            </Badge>
                            {report.warningCount > 0 && (
                              <Badge variant="warning" size="sm">
                                {report.warningCount} CHILLS
                              </Badge>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[#B4BFC8]">
                          {report.successfulProfiles}/{report.totalProfiles} rites
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[#B4BFC8]">
                          <div className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5 text-[#F4B860]" />
                            <span>{(report.duration / 1000).toFixed(1)}s</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-[#B4BFC8]">
                          {new Date(report.startTime).toLocaleDateString()} at{' '}
                          {new Date(report.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Link href={`/results/${report.id}`}>
                              <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                                Grimoire →
                              </Button>
                            </Link>

                            <a
                              href={`/api/results/${report.id}?format=html`}
                              download
                              title="Download HTML Grimoire"
                              className="p-1.5 rounded-[4px] border border-[#2C4B68] text-[#B4BFC8] hover:text-[#ECE6D3] hover:bg-[#0E2233] transition-colors"
                            >
                              <DocumentArrowDownIcon className="w-4 h-4 text-[#A6F0D6]" />
                            </a>
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
