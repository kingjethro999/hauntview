import {
  initDatabase,
  saveTestReportToDb,
  getRunById,
  listStoredRuns,
  compareStoredRuns,
} from '../lib/server/database';
import { TestReport } from '../types';

describe('SQLite Database Layer', () => {
  let db: ReturnType<typeof initDatabase>;

  beforeEach(() => {
    db = initDatabase(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  const mockReport: TestReport = {
    id: 'test-run-1',
    url: 'https://example.com',
    startTime: 1000,
    endTime: 2000,
    duration: 1000,
    summary: {
      totalProfiles: 1,
      successfulProfiles: 1,
      failedProfiles: 0,
      totalFindings: 1,
      findingsBySeverity: { error: 0, warning: 1, info: 0 },
      findingsByCategory: { performance: 1 },
      canonicalizedFindings: 1,
    },
    profileResults: [
      {
        profileId: 'mobile-iphone15',
        profileName: 'Mobile - iPhone 15',
        success: true,
        startTime: 1000,
        endTime: 2000,
        duration: 1000,
        findings: [
          {
            id: 'find-1',
            profileId: 'mobile-iphone15',
            severity: 'warning',
            category: 'performance',
            message: 'Image load slow',
            timestamp: 1500,
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
  };

  it('persists and retrieves a test report', () => {
    saveTestReportToDb(
      mockReport,
      { html: '/reports/test.html', markdown: '/reports/test.md' },
      db
    );

    const fetched = getRunById('test-run-1', db);
    expect(fetched).not.toBeNull();
    expect(fetched!.run.id).toBe('test-run-1');
    expect(fetched!.run.targetUrl).toBe('https://example.com');
    expect(fetched!.run.totalFindings).toBe(1);
    expect(fetched!.run.warningCount).toBe(1);
    expect(fetched!.run.htmlReportPath).toBe('/reports/test.html');

    expect(fetched!.findings).toHaveLength(1);
    expect(fetched!.findings[0].message).toBe('Image load slow');
  });

  it('lists stored runs ordered by start time', () => {
    saveTestReportToDb(mockReport, undefined, db);

    const report2: TestReport = {
      ...mockReport,
      id: 'test-run-2',
      startTime: 3000,
      endTime: 4000,
    };
    saveTestReportToDb(report2, undefined, db);

    const list = listStoredRuns(10, db);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('test-run-2');
    expect(list[1].id).toBe('test-run-1');
  });

  it('compares two runs accurately', () => {
    saveTestReportToDb(mockReport, undefined, db);

    const report2: TestReport = {
      ...mockReport,
      id: 'test-run-2',
      startTime: 3000,
      endTime: 4000,
      profileResults: [
        {
          ...mockReport.profileResults[0],
          findings: [
            {
              id: 'find-2',
              profileId: 'mobile-iphone15',
              severity: 'error',
              category: 'accessibility',
              message: 'Missing alt text',
              timestamp: 3500,
              isClassified: true,
            },
          ],
        },
      ],
    };
    saveTestReportToDb(report2, undefined, db);

    const comp = compareStoredRuns('test-run-1', 'test-run-2', db);
    expect(comp).not.toBeNull();
    expect(comp!.findingDiff.fixedFindings).toBe(1); // 'Image load slow' was fixed
    expect(comp!.findingDiff.newFindings).toBe(1); // 'Missing alt text' is new
    expect(comp!.findingDiff.persistingFindings).toBe(0);
  });
});
