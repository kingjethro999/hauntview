/**
 * HauntView Model Context Protocol (MCP) Server
 * Exposes HauntView's testing engine directly to Kiro via stdio.
 * All diagnostic logs are sent to stderr; stdout is reserved for MCP JSON-RPC.
 */

import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { z } from 'zod';
import pLimit from 'p-limit';
import { HauntViewEngine } from '../engine';
import { ProfileManager } from '../core/profile-manager';
import { ReportStore } from '../core/report-store';
import { ReportFactory } from '../reports/factory';
import { validateTargetUrl } from '../lib/server/url-safety';
import {
  saveTestReportToDb,
  getRunById,
  getLatestRun,
  compareStoredRuns,
} from '../lib/server/database';

const limit = pLimit(1); // One active test run at a time to prevent resource exhaustion
let engineInstance: HauntViewEngine | null = null;
const profileManager = new ProfileManager();

async function getEngine(): Promise<HauntViewEngine> {
  if (!engineInstance) {
    engineInstance = new HauntViewEngine();
    await engineInstance.initialize();
  }
  return engineInstance;
}

const server = new McpServer({
  name: 'hauntview',
  version: '0.1.0',
});

// Tool 1: list-test-profiles
server.registerTool(
  'list-test-profiles',
  {
    description: 'Returns supported HauntView test profiles and their descriptions.',
    inputSchema: {},
  },
  async () => {
    const profiles = profileManager.getAllProfiles().map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      viewport: p.viewport,
      timeout: p.timeout,
    }));

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              total: profiles.length,
              profiles,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 2: run-test-profile
server.registerTool(
  'run-test-profile',
  {
    description:
      'Validates target URL and profile, starts a test run, and returns its run identifier and results.',
    inputSchema: {
      url: z.string().describe('Target website URL to test (must be http:// or https://)'),
      profileId: z
        .string()
        .optional()
        .describe('Specific profile ID to run, or omit for default smoke suite'),
    },
  },
  async (args) => {
    const urlValidation = validateTargetUrl(args.url, { allowLocal: true });
    if (!urlValidation.valid) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `URL safety error: ${urlValidation.error}`,
          },
        ],
      };
    }

    const targetUrl = urlValidation.normalizedUrl || args.url;
    const requestedProfiles = args.profileId
      ? [args.profileId]
      : ['mobile-iphone15', 'console-errors'];

    try {
      console.error(
        `[HauntView MCP] Starting run for ${targetUrl} with profiles:`,
        requestedProfiles
      );

      const report = await limit(async () => {
        const engine = await getEngine();
        return await engine.executeTests({
          url: targetUrl,
          profiles: requestedProfiles,
        });
      });

      // Persist report to report store & SQLite
      await ReportStore.saveReport(report);
      try {
        saveTestReportToDb(report);
      } catch (dbErr) {
        console.error('[HauntView MCP] Warning: failed to save to SQLite:', dbErr);
      }

      const summary = {
        runId: report.id,
        url: report.url,
        durationMs: report.duration,
        profilesCount: report.profileResults.length,
        totalFindings: report.summary.totalFindings,
        findingsBySeverity: report.summary.findingsBySeverity,
        findings: report.profileResults.flatMap((r) =>
          r.findings.map((f) => ({
            id: f.id,
            profileId: f.profileId,
            severity: f.severity,
            category: f.category,
            message: f.message,
            location: f.location,
          }))
        ),
      };

      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    } catch (err) {
      console.error('[HauntView MCP] Test execution error:', err);
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Execution failed: ${err instanceof Error ? err.message : String(err)}`,
          },
        ],
      };
    }
  }
);

// Tool 3: get-run-status
server.registerTool(
  'get-run-status',
  {
    description: 'Returns progress and the current state of a run by ID.',
    inputSchema: {
      runId: z.string().describe('Run identifier'),
    },
  },
  async (args) => {
    // Check SQLite first
    const dbRecord = getRunById(args.runId);
    if (dbRecord) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                id: dbRecord.run.id,
                url: dbRecord.run.targetUrl,
                status: dbRecord.run.status,
                startedAt: dbRecord.run.startedAt,
                durationMs: dbRecord.run.durationMs,
                totalFindings: dbRecord.run.totalFindings,
                severitySummary: {
                  error: dbRecord.run.errorCount,
                  warning: dbRecord.run.warningCount,
                  info: dbRecord.run.infoCount,
                },
                findingsCount: dbRecord.findings.length,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Check memory / json report store
    const fileReport = await ReportStore.getReport(args.runId);
    if (fileReport) {
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                id: fileReport.id,
                url: fileReport.url,
                status: 'completed',
                durationMs: fileReport.duration,
                totalFindings: fileReport.summary.totalFindings,
                severitySummary: fileReport.summary.findingsBySeverity,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [{ type: 'text' as const, text: `Run not found: ${args.runId}` }],
    };
  }
);

// Tool 4: get-latest-report
server.registerTool(
  'get-latest-report',
  {
    description: 'Returns a structured summary of the latest completed run.',
    inputSchema: {},
  },
  async () => {
    const latestDbRun = getLatestRun();
    if (latestDbRun) {
      const details = getRunById(latestDbRun.id);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(
              {
                run: latestDbRun,
                findings: details?.findings || [],
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Fallback to report store
    const reports = await ReportStore.listReports();
    if (reports.length > 0) {
      const fullReport = await ReportStore.getReport(reports[0].id);
      return {
        content: [
          {
            type: 'text' as const,
            text: JSON.stringify(fullReport, null, 2),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify({ message: 'No completed runs found' }),
        },
      ],
    };
  }
);

// Tool 5: compare-runs
server.registerTool(
  'compare-runs',
  {
    description: 'Compares results from two stored runs to identify regressions and fixes.',
    inputSchema: {
      runId1: z.string().describe('Baseline run ID'),
      runId2: z.string().describe('Comparison run ID'),
    },
  },
  async (args) => {
    const comparison = compareStoredRuns(args.runId1, args.runId2);
    if (!comparison) {
      return {
        isError: true,
        content: [
          {
            type: 'text' as const,
            text: `Could not compare runs ${args.runId1} and ${args.runId2}. Ensure both exist in storage.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(comparison, null, 2),
        },
      ],
    };
  }
);

// Tool 6: export-report
server.registerTool(
  'export-report',
  {
    description:
      'Generates or retrieves a report in the requested format (html, markdown, or json).',
    inputSchema: {
      runId: z.string().describe('Run identifier'),
      format: z.enum(['html', 'markdown', 'json']).describe('Desired export format'),
    },
  },
  async (args) => {
    const report = await ReportStore.getReport(args.runId);
    if (!report) {
      return {
        isError: true,
        content: [{ type: 'text' as const, text: `Run not found: ${args.runId}` }],
      };
    }

    if (args.format === 'json') {
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(report, null, 2) }],
      };
    }

    const generator = ReportFactory.createGenerator(args.format);
    const generated = await generator.generate(report, {
      format: args.format,
      includeScreenshots: false,
    });

    return {
      content: [{ type: 'text' as const, text: generated.content }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[HauntView MCP] Server running on stdio');
}

main().catch((err) => {
  console.error('[HauntView MCP] Fatal error starting server:', err);
  process.exit(1);
});
