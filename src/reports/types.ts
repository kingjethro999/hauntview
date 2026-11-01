/**
 * Report generation types
 */

import { TestReport } from '../types';

export type ReportFormat = 'html' | 'markdown' | 'json';

export interface ReportOptions {
  format: ReportFormat;
  title?: string;
  includeScreenshots?: boolean;
  groupByCategory?: boolean;
  groupBySeverity?: boolean;
  cssUrl?: string; // For custom CSS in HTML reports
  theme?: 'dark' | 'light'; // dark = Halloween, light = standard
}

export interface GeneratedReport {
  format: ReportFormat;
  content: string;
  filename: string;
  mimeType: string;
}

export interface ReportGenerator {
  generate(report: TestReport, options: ReportOptions): Promise<GeneratedReport>;
}

export interface FindingGroup {
  name: string;
  findings: TestReport['profileResults'][0]['findings'];
  count: number;
}
