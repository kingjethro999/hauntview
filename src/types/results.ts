/**
 * Type definitions for test results and report generation
 */

import { Finding, TestReport } from './profiles';

/**
 * Aggregated finding across multiple profiles
 */
export interface AggregatedFinding {
  canonical: Finding;
  instances: Finding[];
  profiles: string[];
  occurrences: number;
  firstSeen: number;
  lastSeen: number;
}

/**
 * Report statistics
 */
export interface ReportStatistics {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  slowestProfile: string;
  fastestProfile: string;
  mostCommonIssue: string;
  findingTrends: {
    errors: number[];
    warnings: number[];
    info: number[];
  };
}

/**
 * HTML Report data
 */
export interface HtmlReportData {
  report: TestReport;
  statistics: ReportStatistics;
  generatedAt: string;
  environmentInfo: {
    nodeVersion: string;
    hauntviewVersion: string;
  };
}

/**
 * Markdown Report sections
 */
export interface MarkdownReportData {
  report: TestReport;
  statistics: ReportStatistics;
  generatedAt: string;
  sections: {
    summary: string;
    findings: string;
    byProfile: string;
    byCategory: string;
    bySeverity: string;
    screenshots: string;
  };
}

/**
 * Report export format
 */
export type ReportFormat = 'html' | 'markdown' | 'json';

/**
 * Report comparison result
 */
export interface ReportComparison {
  baselineReport: TestReport;
  currentReport: TestReport;
  newFindings: Finding[];
  resolvedFindings: Finding[];
  changedFindings: {
    finding: Finding;
    previousSeverity: string;
    currentSeverity: string;
  }[];
  regressions: number;
  improvements: number;
}

/**
 * Cache entry for findings
 */
export interface CacheEntry {
  key: string;
  finding: Finding;
  ttl: number;
  createdAt: number;
  expiresAt: number;
}

/**
 * Screenshot comparison result
 */
export interface ScreenshotComparison {
  baseline: string;
  current: string;
  pixelDifference: number;
  percentageDifference: number;
  changed: boolean;
}

/**
 * Test performance metrics
 */
export interface PerformanceMetrics {
  profileId: string;
  duration: number;
  memoryUsed: number;
  cpuUsed: number;
  networkRequests: number;
  averageResponseTime: number;
}

/**
 * Batch test result
 */
export interface BatchTestResult {
  batchId: string;
  urls: string[];
  reports: TestReport[];
  startTime: number;
  endTime: number;
  duration: number;
  successCount: number;
  failureCount: number;
  totalFindings: number;
}
