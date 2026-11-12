'use client';

import { useEffect, useState } from 'react';
import { useCryptStore } from './crypt-store';

/**
 * Past runs for this browser. Once hydrated, merges in the server's listing
 * (once per mount) without resurrecting anything the user banished.
 */
export function useCryptRuns() {
  const summaries = useCryptStore((s) => s.summaries);
  const hydrated = useCryptStore((s) => s._hasHydrated);
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    fetch('/api/results')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.success && Array.isArray(d.reports)) {
          useCryptStore.getState().importSummaries(d.reports);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setSyncing(false);
      });
    return () => {
      active = false;
    };
  }, [hydrated]);

  const runs = [...summaries].sort((a, b) => b.startTime - a.startTime);
  return { runs, loading: !hydrated || (syncing && summaries.length === 0) };
}
