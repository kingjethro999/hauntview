import fs from 'fs/promises';
import path from 'path';
import { TestReport } from '../types';

export interface TestReportSummary {
  id: string;
  url: string;
  startTime: number;
  duration: number;
  totalProfiles: number;
  successfulProfiles: number;
  failedProfiles: number;
  totalFindings: number;
  errorCount: number;
  warningCount: number;
}

const RESULTS_DIR = path.join(process.cwd(), '.hauntview', 'results');

// In-memory fallback/cache
const memoryStore = new Map<string, TestReport>();

export class ReportStore {
  private static async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(RESULTS_DIR, { recursive: true });
    } catch {
      // Ignore if exists
    }
  }

  static async saveReport(report: TestReport): Promise<void> {
    memoryStore.set(report.id, report);
    try {
      await this.ensureDir();
      const filePath = path.join(RESULTS_DIR, `${report.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf8');
    } catch (err) {
      console.warn('Failed to persist report to disk, saved in memory only:', err);
    }
  }

  static async getReport(id: string): Promise<TestReport | null> {
    if (memoryStore.has(id)) {
      return memoryStore.get(id)!;
    }

    try {
      const filePath = path.join(RESULTS_DIR, `${id}.json`);
      const data = await fs.readFile(filePath, 'utf8');
      const parsed = JSON.parse(data) as TestReport;
      memoryStore.set(parsed.id, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  static async listReports(): Promise<TestReportSummary[]> {
    const summaries: TestReportSummary[] = [];
    const seenIds = new Set<string>();

    // Load from memory first
    for (const report of memoryStore.values()) {
      seenIds.add(report.id);
      summaries.push({
        id: report.id,
        url: report.url,
        startTime: report.startTime,
        duration: report.duration,
        totalProfiles: report.summary.totalProfiles,
        successfulProfiles: report.summary.successfulProfiles,
        failedProfiles: report.summary.failedProfiles,
        totalFindings: report.summary.totalFindings,
        errorCount: report.summary.findingsBySeverity.error,
        warningCount: report.summary.findingsBySeverity.warning,
      });
    }

    // Load from disk
    try {
      await this.ensureDir();
      const files = await fs.readdir(RESULTS_DIR);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        const id = file.replace('.json', '');
        if (seenIds.has(id)) continue;

        try {
          const filePath = path.join(RESULTS_DIR, file);
          const data = await fs.readFile(filePath, 'utf8');
          const report = JSON.parse(data) as TestReport;
          summaries.push({
            id: report.id,
            url: report.url,
            startTime: report.startTime,
            duration: report.duration,
            totalProfiles: report.summary.totalProfiles,
            successfulProfiles: report.summary.successfulProfiles,
            failedProfiles: report.summary.failedProfiles,
            totalFindings: report.summary.totalFindings,
            errorCount: report.summary.findingsBySeverity.error,
            warningCount: report.summary.findingsBySeverity.warning,
          });
          seenIds.add(id);
        } catch {
          // Skip corrupt files
        }
      }
    } catch {
      // Ignore if dir read fails
    }

    // Sort descending by start time
    return summaries.sort((a, b) => b.startTime - a.startTime);
  }
}
