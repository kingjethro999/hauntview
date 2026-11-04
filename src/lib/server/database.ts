/**
 * SQLite Local Storage Layer for HauntView runs, findings, and metadata.
 * Uses better-sqlite3 with synchronous local persistence and parameterized statements.
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { Finding, TestReport } from '../../types';

export interface StoredRun {
  id: string;
  targetUrl: string;
  status: string;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  selectedProfiles: string[];
  totalFindings: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  htmlReportPath?: string;
  markdownReportPath?: string;
  createdAt: string;
}

export interface RunComparison {
  run1: StoredRun;
  run2: StoredRun;
  findingDiff: {
    newFindings: number;
    fixedFindings: number;
    persistingFindings: number;
  };
}

let dbInstance: Database.Database | null = null;

export function getDatabasePath(): string {
  const dataDir = path.join(process.cwd(), '.hauntview', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'hauntview.db');
}

export function initDatabase(dbPath?: string): Database.Database {
  if (dbInstance && !dbPath) {
    return dbInstance;
  }

  const resolvedPath = dbPath || getDatabasePath();

  // Ensure parent directory exists
  const parentDir = path.dirname(resolvedPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  const db = new Database(resolvedPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Schema creation
  db.exec(`
    CREATE TABLE IF NOT EXISTS runs (
      id TEXT PRIMARY KEY,
      target_url TEXT NOT NULL,
      status TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      duration_ms INTEGER,
      selected_profiles TEXT NOT NULL,
      total_findings INTEGER NOT NULL DEFAULT 0,
      error_count INTEGER NOT NULL DEFAULT 0,
      warning_count INTEGER NOT NULL DEFAULT 0,
      info_count INTEGER NOT NULL DEFAULT 0,
      html_report_path TEXT,
      markdown_report_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS findings (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      severity TEXT NOT NULL,
      category TEXT NOT NULL,
      message TEXT NOT NULL,
      location TEXT,
      evidence TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS screenshots (
      id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      hash TEXT NOT NULL,
      viewport_width INTEGER NOT NULL,
      viewport_height INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (run_id) REFERENCES runs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_findings_run_id ON findings(run_id);
    CREATE INDEX IF NOT EXISTS idx_screenshots_run_id ON screenshots(run_id);
    CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);
  `);

  if (!dbPath) {
    dbInstance = db;
  }
  return db;
}

/**
 * Persist a completed or in-progress TestReport into SQLite
 */
export function saveTestReportToDb(
  report: TestReport,
  paths?: { html?: string; markdown?: string },
  db?: Database.Database
): void {
  const database = db || initDatabase();

  const insertRun = database.prepare(`
    INSERT OR REPLACE INTO runs (
      id, target_url, status, started_at, completed_at, duration_ms,
      selected_profiles, total_findings, error_count, warning_count, info_count,
      html_report_path, markdown_report_path
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?
    )
  `);

  const selectedProfiles = report.profileResults.map((r) => r.profileId);
  const status = report.summary.failedProfiles > 0 ? 'completed_with_findings' : 'completed';

  const transaction = database.transaction(() => {
    insertRun.run(
      report.id,
      report.url,
      status,
      report.startTime,
      report.endTime,
      report.duration,
      JSON.stringify(selectedProfiles),
      report.summary.totalFindings,
      report.summary.findingsBySeverity.error,
      report.summary.findingsBySeverity.warning,
      report.summary.findingsBySeverity.info,
      paths?.html || null,
      paths?.markdown || null
    );

    const insertFinding = database.prepare(`
      INSERT OR REPLACE INTO findings (
        id, run_id, profile_id, severity, category, message, location, evidence, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertScreenshot = database.prepare(`
      INSERT OR REPLACE INTO screenshots (
        id, run_id, profile_id, file_name, hash, viewport_width, viewport_height, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const profileResult of report.profileResults) {
      if (profileResult.screenshots) {
        for (const s of profileResult.screenshots) {
          insertScreenshot.run(
            `${report.id}-${s.fileName}`,
            report.id,
            s.profileId,
            s.fileName,
            s.hash,
            s.viewport.width,
            s.viewport.height,
            s.timestamp
          );
        }
      }

      for (const finding of profileResult.findings) {
        insertFinding.run(
          finding.id,
          report.id,
          finding.profileId,
          finding.severity,
          finding.category,
          finding.message,
          finding.location ? JSON.stringify(finding.location) : null,
          finding.details ? JSON.stringify(finding.details) : null,
          finding.timestamp
        );
      }
    }
  });

  transaction();
}

/**
 * Retrieve a stored run by ID
 */
export function getRunById(
  runId: string,
  db?: Database.Database
): { run: StoredRun; findings: Finding[] } | null {
  const database = db || initDatabase();

  const row = database.prepare('SELECT * FROM runs WHERE id = ?').get(runId) as
    Record<string, unknown> | undefined;

  if (!row) {
    return null;
  }

  const storedRun: StoredRun = {
    id: String(row.id),
    targetUrl: String(row.target_url),
    status: String(row.status),
    startedAt: Number(row.started_at),
    completedAt: row.completed_at ? Number(row.completed_at) : undefined,
    durationMs: row.duration_ms ? Number(row.duration_ms) : undefined,
    selectedProfiles: JSON.parse(String(row.selected_profiles || '[]')),
    totalFindings: Number(row.total_findings),
    errorCount: Number(row.error_count),
    warningCount: Number(row.warning_count),
    infoCount: Number(row.info_count),
    htmlReportPath: row.html_report_path ? String(row.html_report_path) : undefined,
    markdownReportPath: row.markdown_report_path ? String(row.markdown_report_path) : undefined,
    createdAt: String(row.created_at),
  };

  const findingRows = database
    .prepare('SELECT * FROM findings WHERE run_id = ?')
    .all(runId) as Array<Record<string, unknown>>;

  const findings: Finding[] = findingRows.map((f) => ({
    id: String(f.id),
    profileId: String(f.profile_id),
    severity: f.severity as Finding['severity'],
    category: String(f.category),
    message: String(f.message),
    timestamp: Number(f.timestamp),
    isClassified: true,
    location: f.location ? JSON.parse(String(f.location)) : undefined,
    details: f.evidence ? JSON.parse(String(f.evidence)) : undefined,
  }));

  return { run: storedRun, findings };
}

/**
 * List historical runs ordered newest first
 */
export function listStoredRuns(limit = 50, db?: Database.Database): StoredRun[] {
  const database = db || initDatabase();
  const rows = database
    .prepare('SELECT * FROM runs ORDER BY started_at DESC LIMIT ?')
    .all(limit) as Array<Record<string, unknown>>;

  return rows.map((row) => ({
    id: String(row.id),
    targetUrl: String(row.target_url),
    status: String(row.status),
    startedAt: Number(row.started_at),
    completedAt: row.completed_at ? Number(row.completed_at) : undefined,
    durationMs: row.duration_ms ? Number(row.duration_ms) : undefined,
    selectedProfiles: JSON.parse(String(row.selected_profiles || '[]')),
    totalFindings: Number(row.total_findings),
    errorCount: Number(row.error_count),
    warningCount: Number(row.warning_count),
    infoCount: Number(row.info_count),
    htmlReportPath: row.html_report_path ? String(row.html_report_path) : undefined,
    markdownReportPath: row.markdown_report_path ? String(row.markdown_report_path) : undefined,
    createdAt: String(row.created_at),
  }));
}

/**
 * Get the latest completed run
 */
export function getLatestRun(db?: Database.Database): StoredRun | null {
  const runs = listStoredRuns(1, db);
  return runs.length > 0 ? runs[0] : null;
}

/**
 * Compare two runs
 */
export function compareStoredRuns(
  runId1: string,
  runId2: string,
  db?: Database.Database
): RunComparison | null {
  const r1 = getRunById(runId1, db);
  const r2 = getRunById(runId2, db);

  if (!r1 || !r2) return null;

  const r1FindingMessages = new Set(r1.findings.map((f) => `${f.profileId}:${f.message}`));
  const r2FindingMessages = new Set(r2.findings.map((f) => `${f.profileId}:${f.message}`));

  let persisting = 0;
  let fixed = 0;
  let newFindings = 0;

  for (const msg of r2FindingMessages) {
    if (r1FindingMessages.has(msg)) {
      persisting++;
    } else {
      newFindings++;
    }
  }

  for (const msg of r1FindingMessages) {
    if (!r2FindingMessages.has(msg)) {
      fixed++;
    }
  }

  return {
    run1: r1.run,
    run2: r2.run,
    findingDiff: {
      newFindings,
      fixedFindings: fixed,
      persistingFindings: persisting,
    },
  };
}
