'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { TombstoneCard } from '../components/features/TombstoneCard';
import { WispGhost } from '../components/features/WispGhost';
import { FloatingDraggableGhost } from '../components/features/FloatingDraggableGhost';
import { TestReportSummary } from '@/src/core/report-store';
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  TableCellsIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export default function CryptPage() {
  const [reports, setReports] = useState<TestReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'screams' | 'peaceful'>('all');
  const [viewStyle, setViewStyle] = useState<'tombstones' | 'table'>('tombstones');

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
      {/* Draggable wandering ghost companion */}
      <FloatingDraggableGhost />

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
        <div className="pb-6 border-b border-[#46334b] flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArchiveBoxIcon className="w-6 h-6 text-[#ff791f]" />
              <h1 className="font-serif font-extrabold text-2xl md:text-3xl text-[#fff1dc] tracking-tight">
                The Crypt · Graveyard of Séances
              </h1>
            </div>
            <p className="text-sm font-serif text-[#d9d3e0]">
              Browse past spirit photography sessions, exhuming previous findings and laid-to-rest
              apparitions.
            </p>
          </div>

          {/* Comparative Status Chips (§3.2 Lexicon) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-[#1c1629] border border-[#46334b] text-[#fff1dc] font-serif">
              <strong>{reports.length}</strong> Past Séances
            </span>
            <span className="px-3 py-1 rounded-full bg-[#1c1629] border border-[#9aff9a]/40 text-[#9aff9a] font-serif">
              Fresh hauntings tracked
            </span>
          </div>
        </div>

        {/* Filter and View Style Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8">
          {/* Category Filters */}
          <div className="flex items-center gap-2">
            {(['all', 'screams', 'peaceful'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-serif capitalize cursor-pointer transition-colors ${
                  filter === mode
                    ? 'bg-[#ff791f] text-[#0a0711] font-bold shadow-[0_0_8px_rgba(255,121,31,0.3)]'
                    : 'bg-[#1c1629] text-[#d9d3e0] hover:text-[#fff1dc] border border-[#46334b]'
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

          {/* View Toggle */}
          <div className="inline-flex rounded-[6px] bg-[#1c1629] p-0.5 border border-[#46334b]">
            <button
              type="button"
              onClick={() => setViewStyle('tombstones')}
              className={`px-3 py-1 rounded-[4px] text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewStyle === 'tombstones'
                  ? 'bg-[#ff791f] text-[#0a0711] font-bold'
                  : 'text-[#d9d3e0] hover:text-[#fff1dc]'
              }`}
              title="Graveyard headstones view"
            >
              <Squares2X2Icon className="w-3.5 h-3.5" />
              <span>Graveyard</span>
            </button>
            <button
              type="button"
              onClick={() => setViewStyle('table')}
              className={`px-3 py-1 rounded-[4px] text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewStyle === 'table'
                  ? 'bg-[#ff791f] text-[#0a0711] font-bold'
                  : 'text-[#d9d3e0] hover:text-[#fff1dc]'
              }`}
              title="Ledger table view"
            >
              <TableCellsIcon className="w-3.5 h-3.5" />
              <span>Scroll</span>
            </button>
          </div>
        </div>

        {/* Séance Grid - with spacing */}
        <div className="mt-8">
          {isLoading ? (
            <div className="p-16 text-center text-xs text-[#d9d3e0] bg-[#1c1629]/40 rounded-[2px] border border-[#46334b] font-serif">
              <SparklesIcon className="w-6 h-6 text-[#ff791f] mx-auto mb-2 animate-spin" />
              Reading the crypt stones...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#1c1629]/30 rounded-[4px] border border-[#46334b] flex flex-col items-center">
              <WispGhost state="napping" size="lg" className="mb-3" />
              <h3 className="font-serif font-bold text-lg text-[#fff1dc] mb-1">
                The Crypt is Silent
              </h3>
              <p className="text-xs text-[#d9d3e0] max-w-sm mx-auto mb-5 font-serif">
                No matching séances found in the graveyard. Begin a new run from The Parlour.
              </p>
              <Link href="/">
                <Button variant="secondary" size="md" className="font-serif font-bold">
                  Haunt a Website Now
                </Button>
              </Link>
            </div>
          ) : viewStyle === 'tombstones' ? (
            /* Graveyard of Gothic Tombstones */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <TombstoneCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            /* Traditional Ledger Table */
            <div className="rounded-[4px] bg-[#1c1629] overflow-hidden border border-[#46334b]">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-serif">
                  <thead className="bg-[#0a0711] text-[#d9d3e0] border-b border-[#46334b] font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">House (Target URL)</th>
                      <th className="py-3 px-4">Status & Omens</th>
                      <th className="py-3 px-4">Rites Completed</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Demise Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#46334b] text-[#fff1dc]">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-[#0a0711]/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium max-w-xs truncate">
                          <Link
                            href={`/results/${report.id}`}
                            className="hover:text-[#ff791f] transition-colors"
                          >
                            {report.url}
                          </Link>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs">
                            {report.errorCount > 0 ? `${report.errorCount} Screams` : '0 Screams'} •{' '}
                            {report.totalFindings} Omens
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#d9d3e0]">
                          {report.successfulProfiles} / {report.totalProfiles}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[#d9d3e0]">
                          {(report.duration / 1000).toFixed(1)}s
                        </td>
                        <td className="py-3.5 px-4 text-[#d9d3e0]">
                          {new Date(report.startTime).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <Link href={`/results/${report.id}`}>
                            <Button size="sm" variant="outline" className="text-xs py-1 px-2.5">
                              Read Grimoire
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
