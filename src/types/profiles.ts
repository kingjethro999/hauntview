/**
 * Core type definitions for HauntView testing profiles
 * Defines the structure of all 16 testing profiles and their execution models
 */

import type { Evidence } from './contracts';

/**
 * Profile execution environment context
 */
export interface ProfileContext {
  profileId: string;
  profileName: string;
  viewport: Viewport;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  strictMode: boolean;
}

/**
 * Viewport dimensions and device configuration
 */
export interface Viewport {
  width: number;
  height: number;
  deviceScaleFactor?: number;
  isMobile: boolean;
  hasTouch: boolean;
}

/**
 * Screenshot capture metadata
 */
export interface ScreenshotMetadata {
  profileId: string;
  timestamp: number;
  url: string;
  viewport: Viewport;
  fileName: string;
  hash: string;
}

/**
 * Single finding/issue detected by a profile
 */
export interface Finding {
  id: string;
  profileId: string;
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  details?: Record<string, unknown>;
  location?: {
    file?: string;
    line?: number;
    column?: number;
    selector?: string;
  };
  timestamp: number;
  isClassified: boolean;
  canonicalHash?: string;
  /**
   * Evidence backing this finding. Must never be empty for findings produced
   * by a profile — enforced at construction by `buildProfileFinding` /
   * `buildFinding` and at runtime by `FindingClassifier.classify`.
   */
  evidence: Evidence[];
}

/**
 * Result from a single profile execution
 */
export interface ProfileResult {
  profileId: string;
  profileName: string;
  success: boolean;
  startTime: number;
  endTime: number;
  duration: number;
  findings: Finding[];
  screenshots: ScreenshotMetadata[];
  error?: {
    message: string;
    stack?: string;
  };
  metadata: {
    browserEngine: string;
    browserVersion: string;
    osVersion?: string;
    nodeVersion: string;
  };
}

/**
 * Combined results from all 16 profiles
 */
export interface TestReport {
  id: string;
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
  profileResults: ProfileResult[];
  summary: {
    totalProfiles: number;
    successfulProfiles: number;
    failedProfiles: number;
    totalFindings: number;
    findingsBySeverity: {
      error: number;
      warning: number;
      info: number;
    };
    findingsByCategory: Record<string, number>;
    canonicalizedFindings: number;
  };
}

/**
 * Profile execution configuration
 */
export interface ProfileConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  viewport: Viewport;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  timeout?: number;
  retries?: number;
  screenshotOnError?: boolean;
  strictMode?: boolean;
}

/**
 * Browser pool configuration
 */
export interface BrowserPoolConfig {
  maxBrowsers?: number;
  maxPagesPerBrowser?: number;
  idleTimeout?: number;
  launchOptions?: Record<string, unknown>;
}

/**
 * Finding classification result
 */
export interface ClassificationResult {
  originalFinding: Finding;
  canonical: Finding;
  classifier: string;
  confidence: number;
  duplicateOf?: string;
}

/**
 * Progress event emitted during test suite execution
 */
export interface TestProgressUpdate {
  completed: number;
  total: number;
  profileId: string;
  profileName: string;
  durationMs?: number;
  status: 'start' | 'done' | 'fail';
  findingsCount?: number;
  error?: string;
}

/**
 * Test execution options
 */
export interface TestExecutionOptions {
  url: string;
  profiles?: string[]; // if not provided, run all enabled profiles
  outputDir?: string;
  includeScreenshots?: boolean;
  strictMode?: boolean;
  timeout?: number;
  headless?: boolean;
  concurrency?: boolean;
  concurrencyAmount?: number;
  onProgress?: (update: TestProgressUpdate) => void;
}

/**
 * Report generation options
 */
export interface ReportGenerationOptions {
  format: 'html' | 'markdown' | 'json';
  outputPath: string;
  includeScreenshots?: boolean;
  groupByCategory?: boolean;
  groupBySeverity?: boolean;
}
