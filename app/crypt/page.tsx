'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Container } from '../components/layout/Container';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { GhostLoader } from '../components/features/GhostLoader';
import { TombstoneCard, verdictFor } from '../components/features/TombstoneCard';
import { CandleIndicator } from '../components/features/CandleIndicator';
import { FloatingDraggableGhost } from '../components/features/FloatingDraggableGhost';
import { TestReportSummary } from '@/src/core/report-store';
import { useCryptStore } from '@/src/lib/client/crypt-store';
import { useCryptRuns } from '@/src/lib/client/use-crypt-runs';

type Filter = 'all' | 'restless' | 'peace';
type View = 'graveyard' | 'ledger';
type Pending = { kind: 'one'; run: TestReportSummary } | { kind: 'all' } | null;

const DISSOLVE_MS = 700;

export default function CryptPage() {
  const { runs, loading } = useCryptRuns();
  const deleteReport = useCryptStore((s) => s.deleteReport);
  const clearAll = useCryptStore((s) => s.clearAll);

  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<View>('graveyard');
  const [pending, setPending] = useState<Pending>(null);
  const [dissolving, setDissolving] = useState<Set<string>>(new Set());

  const restless = runs.filter((r) => r.errorCount > 0 || r.warningCount > 0);
  const shown =
    filter === 'restless'
      ? restless
      : filter === 'peace'
        ? runs.filter((r) => r.errorCount === 0 && r.warningCount === 0)
        : runs;

  const banish = () => {
    if (!pending) return;
    const ids = pending.kind === 'one' ? [pending.run.id] : runs.map((r) => r.id);
    const label = pending.kind === 'one' ? pending.run.url : `${ids.length} runs`;
    setPending(null);
    setDissolving(new Set(ids));
    setTimeout(() => {
      if (pending.kind === 'all') clearAll();
      else deleteReport(ids[0]);
      setDissolving(new Set());
      toast.success(`Banished ${label}.`, {
        description: 'Removed from this browser’s crypt.',
      });
    }, DISSOLVE_MS);
  };

  const FILTERS: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: runs.length },
    { id: 'restless', label: 'Restless', count: restless.length },
    { id: 'peace', label: 'At peace', count: runs.length - restless.length },
  ];

  return (
    <div className="pt-10 sm:pt-16 pb-24">
      <FloatingDraggableGhost />
      <Container size="lg" className="space-y-10 sm:space-y-14">
        <header className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div className="space-y-5">
            <p className="hv-eyebrow hv-rise">
              The crypt · {runs.length} {runs.length === 1 ? 'grave' : 'graves'}
            </p>
            <h1 className="hv-display hv-rise" style={{ '--i': 1 } as React.CSSProperties}>
              Here lie your <em>séances.</em>
            </h1>
          </div>
          <p className="hv-lede hv-rise lg:pb-3" style={{ '--i': 2 } as React.CSSProperties}>
            Every run is buried in this browser. Taller stones hold more findings; restless ones
            won’t keep still. Open a stone to read what it saw.
          </p>
        </header>

        {runs.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-y border-[var(--hv-seam)] py-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="hv-segmented" role="group" aria-label="Filter runs">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                    <span className="font-mono text-xs opacity-70">{f.count}</span>
                  </button>
                ))}
              </div>
              <div className="hv-segmented" role="group" aria-label="Layout">
                <button
                  type="button"
                  aria-pressed={view === 'graveyard'}
                  onClick={() => setView('graveyard')}
                >
                  Graveyard
                </button>
                <button
                  type="button"
                  aria-pressed={view === 'ledger'}
                  onClick={() => setView('ledger')}
                >
                  Ledger
                </button>
              </div>
            </div>
            <button
              type="button"
              className="hv-btn hv-btn--banish"
              onClick={() => setPending({ kind: 'all' })}
            >
              Banish all
            </button>
          </div>
        )}

        {loading ? (
          <div className="hv-empty">
            <GhostLoader label="Reading the headstones…" />
          </div>
        ) : runs.length === 0 ? (
          <EmptyState
            art="crypt"
            title="Nothing haunts this crypt yet"
            description="Hold a séance in the parlour and its findings will be laid to rest here, ready to compare with the next one."
            action={
              <Link href="/" className="hv-btn hv-btn--primary">
                Go to the parlour
              </Link>
            }
          />
        ) : shown.length === 0 ? (
          <EmptyState
            art="ghost"
            title={filter === 'restless' ? 'No restless graves' : 'No peaceful graves yet'}
            description={
              filter === 'restless'
                ? 'Every run in this crypt finished without warnings or serious findings.'
                : 'Every run here turned up at least one warning. Fix them and run again.'
            }
            action={
              <button
                type="button"
                className="hv-btn hv-btn--outline"
                onClick={() => setFilter('all')}
              >
                Show every grave
              </button>
            }
          />
        ) : view === 'graveyard' ? (
          <div className="hv-graveyard pt-6">
            {shown.map((run, i) => (
              <TombstoneCard
                key={run.id}
                report={run}
                index={i}
                onBanish={(r) => setPending({ kind: 'one', run: r })}
                banishing={dissolving.has(run.id)}
              />
            ))}
          </div>
        ) : (
          <ul className="hv-rows">
            {shown.map((run) => {
              const v = verdictFor(run);
              return (
                <li
                  key={run.id}
                  className={`hv-row !grid-cols-[auto_1fr_auto] sm:!grid-cols-[auto_1fr_auto_auto] ${
                    dissolving.has(run.id) ? 'hv-dissolve' : ''
                  }`}
                >
                  <CandleIndicator
                    status={v.tone === 'peace' ? 'ok' : 'findings'}
                    size="sm"
                    decorative
                  />
                  <div className="min-w-0">
                    <p className="hv-row__url">
                      <Link href={`/results/${run.id}`}>{run.url}</Link>
                    </p>
                    <p className="hv-mono-label mt-1 !tracking-[0.08em]">
                      {new Date(run.startTime).toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      · {run.errorCount} serious · {run.warningCount} warnings ·{' '}
                      {(run.duration / 1000).toFixed(1)}s
                    </p>
                  </div>
                  <span className="hv-row__verdict hidden sm:block">{v.word}</span>
                  <button
                    type="button"
                    className="hv-btn hv-btn--banish hv-btn--sm relative z-[2]"
                    onClick={() => setPending({ kind: 'one', run })}
                    aria-label={`Banish the run for ${run.url}`}
                  >
                    Banish
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Container>

      <Modal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        size="sm"
        tone="banish"
        title={pending?.kind === 'all' ? 'Banish every run?' : 'Banish this run?'}
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button type="button" className="hv-btn hv-btn--banish-solid" onClick={banish}>
              {pending?.kind === 'all' ? `Banish all ${runs.length}` : 'Banish it'}
            </button>
            <button
              type="button"
              className="hv-btn hv-btn--outline"
              onClick={() => setPending(null)}
            >
              Keep {pending?.kind === 'all' ? 'them' : 'it'}
            </button>
          </div>
        }
      >
        {pending?.kind === 'one' ? (
          <p>
            The report for{' '}
            <span className="font-mono text-[var(--hv-bone)] break-all">{pending.run.url}</span>{' '}
            will be removed from this browser’s crypt. This can’t be undone.
          </p>
        ) : (
          <p>
            All {runs.length} reports will be removed from this browser’s crypt. This can’t be
            undone.
          </p>
        )}
      </Modal>
    </div>
  );
}
