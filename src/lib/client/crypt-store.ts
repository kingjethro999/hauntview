import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { TestReport } from '@/src/types';
import { TestReportSummary } from '@/src/core/report-store';

export function createSummaryFromReport(report: TestReport): TestReportSummary {
  return {
    id: report.id,
    url: report.url,
    startTime: report.startTime,
    duration: report.duration,
    totalProfiles: report.summary?.totalProfiles ?? report.profileResults?.length ?? 0,
    successfulProfiles:
      report.summary?.successfulProfiles ??
      report.profileResults?.filter((p) => p.success).length ??
      0,
    failedProfiles:
      report.summary?.failedProfiles ??
      report.profileResults?.filter((p) => !p.success).length ??
      0,
    totalFindings:
      report.summary?.totalFindings ??
      report.profileResults?.reduce((acc, p) => acc + (p.findings?.length || 0), 0) ??
      0,
    errorCount:
      report.summary?.findingsBySeverity?.error ??
      report.profileResults?.reduce(
        (acc, p) => acc + (p.findings?.filter((f) => f.severity === 'error').length || 0),
        0
      ) ??
      0,
    warningCount:
      report.summary?.findingsBySeverity?.warning ??
      report.profileResults?.reduce(
        (acc, p) => acc + (p.findings?.filter((f) => f.severity === 'warning').length || 0),
        0
      ) ??
      0,
  };
}

interface CryptStoreState {
  // Map of full reports keyed by report ID
  reports: Record<string, TestReport>;
  // Array of summaries sorted with most recent first
  summaries: TestReportSummary[];
  // Hydration indicator for safe SSR/CSR transition
  _hasHydrated: boolean;
  // IDs the user banished — never re-imported from the server listing
  banished: string[];

  // Actions
  setHasHydrated: (state: boolean) => void;
  addReport: (report: TestReport) => void;
  deleteReport: (id: string) => void;
  clearAll: () => void;
  /** Merge server-listed summaries, skipping duplicates and banished runs. */
  importSummaries: (incoming: TestReportSummary[]) => void;
  getReport: (id: string) => TestReport | undefined;
}

const MAX_STORED_FULL_REPORTS = 30;

// Safe quota-aware storage wrapper
const safeLocalStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(name, value);
    } catch (e) {
      // If quota exceeded, attempt to prune old entries
      try {
        const parsed = JSON.parse(value);
        if (parsed?.state?.reports) {
          const reportKeys = Object.keys(parsed.state.reports);
          if (reportKeys.length > 5) {
            // Drop oldest half of reports
            const sortedSummaries = (parsed.state.summaries || []) as TestReportSummary[];
            const keepIds = new Set(sortedSummaries.slice(0, 10).map((s) => s.id));
            const trimmedReports: Record<string, TestReport> = {};
            for (const key of reportKeys) {
              if (keepIds.has(key)) {
                trimmedReports[key] = parsed.state.reports[key];
              }
            }
            parsed.state.reports = trimmedReports;
            window.localStorage.setItem(name, JSON.stringify(parsed));
          }
        }
      } catch {
        console.warn('Could not prune localStorage for crypt store quota', e);
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const useCryptStore = create<CryptStoreState>()(
  persist(
    (set, get) => ({
      reports: {},
      summaries: [],
      _hasHydrated: false,
      banished: [],

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },

      addReport: (report: TestReport) => {
        const summary = createSummaryFromReport(report);
        set((state) => {
          // A fresh run of a banished ID shouldn't stay hidden
          const banished = state.banished.filter((b) => b !== report.id);
          // Remove duplicate summary if already present
          const existingSummaries = state.summaries.filter((s) => s.id !== report.id);
          const nextSummaries = [summary, ...existingSummaries];

          // Store report and cap max full reports to preserve localStorage quota
          const nextReports = { ...state.reports, [report.id]: report };
          const keys = Object.keys(nextReports);
          if (keys.length > MAX_STORED_FULL_REPORTS) {
            // Keep the ones present in top summaries
            const topReportIds = new Set(
              nextSummaries.slice(0, MAX_STORED_FULL_REPORTS).map((s) => s.id)
            );
            for (const k of keys) {
              if (!topReportIds.has(k)) {
                delete nextReports[k];
              }
            }
          }

          return {
            reports: nextReports,
            summaries: nextSummaries,
            banished,
          };
        });
      },

      deleteReport: (id: string) => {
        set((state) => {
          const nextReports = { ...state.reports };
          delete nextReports[id];
          return {
            reports: nextReports,
            summaries: state.summaries.filter((s) => s.id !== id),
            banished: state.banished.includes(id) ? state.banished : [...state.banished, id],
          };
        });
      },

      clearAll: () => {
        set((state) => ({
          reports: {},
          summaries: [],
          banished: Array.from(new Set([...state.banished, ...state.summaries.map((s) => s.id)])),
        }));
      },

      importSummaries: (incoming: TestReportSummary[]) => {
        set((state) => {
          const skip = new Set([...state.summaries.map((s) => s.id), ...state.banished]);
          const fresh = incoming.filter((r) => !skip.has(r.id));
          return fresh.length ? { summaries: [...state.summaries, ...fresh] } : state;
        });
      },

      getReport: (id: string) => {
        return get().reports[id];
      },
    }),
    {
      name: 'hauntview_crypt_local_storage_v1',
      storage: createJSONStorage(() => safeLocalStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
