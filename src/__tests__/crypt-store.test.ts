import { useCryptStore, createSummaryFromReport } from '../lib/client/crypt-store';
import { TestReport } from '../types';

describe('useCryptStore', () => {
  beforeEach(() => {
    useCryptStore.getState().clearAll();
  });

  const mockReport: TestReport = {
    id: 'report-test-123',
    url: 'https://example.com',
    startTime: 1700000000000,
    endTime: 1700000005000,
    duration: 5000,
    profileResults: [
      {
        profileId: 'mobile-iphone15',
        profileName: 'Mobile - iPhone 15',
        success: true,
        startTime: 1700000000000,
        endTime: 1700000002500,
        duration: 2500,
        findings: [
          {
            id: 'finding-1',
            profileId: 'mobile-iphone15',
            severity: 'error',
            category: 'device',
            message: 'Horizontal scroll detected',
            timestamp: 1700000001000,
            evidence: [{ kind: 'metric', name: 'fixture', value: 1, unit: 'count' }],
            isClassified: true,
          },
        ],
        screenshots: [],
        metadata: {
          browserEngine: 'chromium',
          browserVersion: '120.0',
          nodeVersion: 'v22.0.0',
        },
      },
    ],
    summary: {
      totalProfiles: 1,
      successfulProfiles: 1,
      failedProfiles: 0,
      totalFindings: 1,
      canonicalizedFindings: 1,
      findingsBySeverity: {
        error: 1,
        warning: 0,
        info: 0,
      },
      findingsByCategory: {
        device: 1,
      },
    },
  };

  test('createSummaryFromReport derives summary accurately', () => {
    const summary = createSummaryFromReport(mockReport);
    expect(summary.id).toBe('report-test-123');
    expect(summary.url).toBe('https://example.com');
    expect(summary.totalProfiles).toBe(1);
    expect(summary.successfulProfiles).toBe(1);
    expect(summary.errorCount).toBe(1);
    expect(summary.warningCount).toBe(0);
    expect(summary.totalFindings).toBe(1);
  });

  test('addReport saves report and summary', () => {
    useCryptStore.getState().addReport(mockReport);

    const state = useCryptStore.getState();
    expect(state.summaries).toHaveLength(1);
    expect(state.summaries[0].id).toBe('report-test-123');
    expect(state.getReport('report-test-123')).toEqual(mockReport);
  });

  test('deleteReport removes report and summary', () => {
    useCryptStore.getState().addReport(mockReport);
    expect(useCryptStore.getState().summaries).toHaveLength(1);

    useCryptStore.getState().deleteReport('report-test-123');
    expect(useCryptStore.getState().summaries).toHaveLength(0);
    expect(useCryptStore.getState().getReport('report-test-123')).toBeUndefined();
  });

  test('clearAll resets store state', () => {
    useCryptStore.getState().addReport(mockReport);
    useCryptStore.getState().clearAll();

    expect(useCryptStore.getState().summaries).toEqual([]);
    expect(useCryptStore.getState().reports).toEqual({});
  });
});
