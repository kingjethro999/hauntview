'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Container } from '../components/layout/Container';
import { Button } from '../components/ui/Button';
import { TombstoneCard } from '../components/features/TombstoneCard';
import { WispGhost } from '../components/features/WispGhost';
import { FloatingDraggableGhost } from '../components/features/FloatingDraggableGhost';
import { TestReportSummary } from '@/src/core/report-store';
import { useCryptStore } from '@/src/lib/client/crypt-store';
import {
  ArchiveBoxIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  TableCellsIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function CryptPage() {
  const { summaries, _hasHydrated, clearAll } = useCryptStore();
  const [serverReports, setServerReports] = useState<TestReportSummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [filter, setFilter] = useState<'all' | 'screams' | 'peaceful'>('all');
  const [viewStyle, setViewStyle] = useState<'tombstones' | 'table'>('tombstones');

  const reports = summaries.length > 0 ? summaries : serverReports;
  const isLoading = !_hasHydrated || isRefreshing;

  useEffect(() => {
    let active = true;
    if (_hasHydrated && summaries.length === 0) {
      fetch('/api/results')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!active) return;
          if (data?.success && Array.isArray(data.reports) && data.reports.length > 0) {
            setServerReports(data.reports);
            useCryptStore.setState((prev) => {
              const existingIds = new Set(prev.summaries.map((s) => s.id));
              const newSummaries = data.reports.filter(
                (r: TestReportSummary) => !existingIds.has(r.id)
              );
              return { ...prev, summaries: [...prev.summaries, ...newSummaries] };
            });
          }
        })
        .catch(() => {})
        .finally(() => {
          if (active) {
            setIsRefreshing(false);
          }
        });
    }
    return () => {
      active = false;
    };
  }, [_hasHydrated, summaries.length]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate brief refresh effect to confirm fresh view
    setTimeout(() => {
      setIsRefreshing(false);
    }, 200);
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear all past séance history stored in this browser?')) {
      clearAll();
      setServerReports([]);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (filter === 'screams') return r.errorCount > 0;
    if (filter === 'peaceful') return r.errorCount === 0;
    return true;
  });

  return (
    <div className="py-6 sm:py-10 md:py-14 space-y-6 sm:space-y-8">
      {/* Draggable wandering ghost companion */}
      <FloatingDraggableGhost />

      <Container size="lg">
        {/* Navigation back and actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 sm:mb-6">
          <Link href="/">
            <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />}>
              The Parlour
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            {reports.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearHistory}
                icon={<TrashIcon className="w-4 h-4 text-red-400" />}
                className="text-red-400 hover:text-red-300 hover:bg-red-950/20 text-xs"
              >
                Clear History
              </Button>
            )}
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
        </div>

        {/* Crypt Header */}
        <div className="pb-5 sm:pb-6 border-b border-[var(--tombstone-gray)] flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ArchiveBoxIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--pumpkin-fire)] flex-shrink-0" />
              <h1 className="font-serif font-extrabold text-xl sm:text-2xl md:text-3xl text-[var(--bone-white)] tracking-tight">
                The Crypt · Graveyard of Séances
              </h1>
            </div>
            <p className="text-xs sm:text-sm font-serif text-[var(--spirit-smoke)]">
              Browse past spirit photography sessions, exhuming previous findings and laid-to-rest
              apparitions.
            </p>
          </div>

          {/* Comparative Status Chips (§3.2 Lexicon) */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[var(--ghost-mist)] border border-[var(--tombstone-gray)] text-[var(--bone-white)] font-serif">
              <strong>{reports.length}</strong> Past Séances
            </span>
            <span className="px-2.5 sm:px-3 py-1 rounded-full bg-[var(--ghost-mist)] border border-[var(--ectoplasm-green)]/40 text-[var(--ectoplasm-green)] font-serif">
              Browser-persisted séances
            </span>
          </div>
        </div>

        {/* Filter and View Style Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 mt-6 sm:mt-8">
          {/* Category Filters */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {(['all', 'screams', 'peaceful'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFilter(mode)}
                className={`px-2.5 sm:px-3 py-1.5 rounded-[6px] text-xs font-serif capitalize cursor-pointer transition-colors ${
                  filter === mode
                    ? 'bg-[var(--pumpkin-fire)] text-[var(--midnight-veil)] font-bold shadow-[0_0_8px_rgba(255,121,31,0.3)]'
                    : 'bg-[var(--ghost-mist)] text-[var(--spirit-smoke)] hover:text-[var(--bone-white)] border border-[var(--tombstone-gray)]'
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
          <div className="inline-flex self-start sm:self-auto rounded-[6px] bg-[var(--ghost-mist)] p-0.5 border border-[var(--tombstone-gray)]">
            <button
              type="button"
              onClick={() => setViewStyle('tombstones')}
              className={`px-3 py-1 rounded-[4px] text-xs font-serif flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewStyle === 'tombstones'
                  ? 'bg-[var(--pumpkin-fire)] text-[var(--midnight-veil)] font-bold'
                  : 'text-[var(--spirit-smoke)] hover:text-[var(--bone-white)]'
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
                  ? 'bg-[var(--pumpkin-fire)] text-[var(--midnight-veil)] font-bold'
                  : 'text-[var(--spirit-smoke)] hover:text-[var(--bone-white)]'
              }`}
              title="Ledger table view"
            >
              <TableCellsIcon className="w-3.5 h-3.5" />
              <span>Scroll</span>
            </button>
          </div>
        </div>

        {/* Séance Grid - with spacing */}
        <div className="mt-6 sm:mt-8">
          {isLoading ? (
            <div className="p-12 sm:p-16 text-center text-xs text-[var(--spirit-smoke)] bg-[var(--ghost-mist)]/40 rounded-[2px] border border-[var(--tombstone-gray)] font-serif">
              <SparklesIcon className="w-6 h-6 text-[var(--pumpkin-fire)] mx-auto mb-2 animate-spin" />
              Reading the crypt stones...
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4 bg-[var(--ghost-mist)]/30 rounded-[4px] border border-[var(--tombstone-gray)] flex flex-col items-center">
              <WispGhost state="napping" size="lg" className="mb-3" />
              <h3 className="font-serif font-bold text-base sm:text-lg text-[var(--bone-white)] mb-1">
                The Crypt is Silent
              </h3>
              <p className="text-xs text-[var(--spirit-smoke)] max-w-sm mx-auto mb-5 font-serif">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredReports.map((report) => (
                <TombstoneCard key={report.id} report={report} />
              ))}
            </div>
          ) : (
            /* Traditional Ledger Table */
            <div className="rounded-[4px] bg-[var(--ghost-mist)] overflow-hidden border border-[var(--tombstone-gray)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs font-serif">
                  <thead className="bg-[var(--midnight-veil)] text-[var(--spirit-smoke)] border-b border-[var(--tombstone-gray)] font-mono uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">House (Target URL)</th>
                      <th className="py-3 px-4">Status & Omens</th>
                      <th className="py-3 px-4">Rites Completed</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Demise Date</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--tombstone-gray)] text-[var(--bone-white)]">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-[var(--midnight-veil)]/40 transition-colors"
                      >
                        <td className="py-3.5 px-4 font-medium max-w-xs truncate">
                          <Link
                            href={`/results/${report.id}`}
                            className="hover:text-[var(--pumpkin-fire)] transition-colors"
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
                        <td className="py-3.5 px-4 font-mono text-[var(--spirit-smoke)]">
                          {report.successfulProfiles} / {report.totalProfiles}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[var(--spirit-smoke)]">
                          {(report.duration / 1000).toFixed(1)}s
                        </td>
                        <td className="py-3.5 px-4 text-[var(--spirit-smoke)]">
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
