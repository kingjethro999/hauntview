/**
 * API route for running HauntView tests and generating reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { HauntViewEngine } from '@/src/engine';
import { TestReport } from '@/src/types';
import { ReportStore } from '@/src/core/report-store';
import { saveTestReportToDb } from '@/src/lib/server/database';
import { validateTargetUrl } from '@/src/lib/server/url-safety';
import { isHostedEnvironment, isConcurrencyAllowedInHosted } from '@/src/core/concurrency-resolver';
import { VERSION } from '@/src/version';

interface TestApiResponse {
  success: boolean;
  report: TestReport;
  reportContent?: string;
  reportFilename?: string;
  mimeType?: string;
}

/**
 * POST /api/test
 * Execute tests on provided URL with optional report generation
 *
 * Body:
 *   - url (required): URL to test
 *   - profiles (optional): Array of profile IDs to run
 *   - format (optional): Report format ('html', 'markdown', 'json')
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, profiles, format, concurrency, concurrencyAmount } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Hosted-environment guard: reject request-level concurrency on hosted instances (Render / HAUNT_HOSTED)
    if (concurrency && isHostedEnvironment() && !isConcurrencyAllowedInHosted()) {
      return NextResponse.json(
        {
          error:
            'Concurrent execution is disabled on the hosted deployment to prevent resource exhaustion on limited container instances. Run tests sequentially, or use the local HauntView CLI for high-concurrency runs.',
        },
        { status: 400 }
      );
    }

    const urlValidation = validateTargetUrl(url, { allowLocal: true });
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: `URL safety error: ${urlValidation.error}` },
        { status: 400 }
      );
    }
    const safeUrl = urlValidation.normalizedUrl || url;

    // Initialize engine
    const engine = new HauntViewEngine();
    await engine.initialize();

    // Execute tests
    const report = await engine.executeTests({
      url: safeUrl,
      profiles,
      includeScreenshots: true,
      concurrency,
      concurrencyAmount,
    });

    // Save report to store & SQLite
    await ReportStore.saveReport(report);
    try {
      saveTestReportToDb(report);
    } catch (dbErr) {
      console.warn('Failed to persist report to SQLite:', dbErr);
    }

    // Generate report if format specified
    const result: TestApiResponse = { success: true, report };

    if (format) {
      try {
        const generatedReport = await engine.generateReport(report, {
          format,
          outputPath: '',
        });
        result.reportContent =
          typeof generatedReport.content === 'string'
            ? generatedReport.content
            : generatedReport.content.toString('base64');
        result.reportFilename = generatedReport.filename;
        result.mimeType = generatedReport.mimeType;
      } catch (error) {
        console.error('Report generation error:', error);
        // Don't fail the entire request, just return report data
      }
    }

    // Cleanup
    await engine.cleanup();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Test execution error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test
 * Get test status and available profiles
 */
export async function GET() {
  try {
    const engine = new HauntViewEngine();
    const stats = engine.getStats();

    return NextResponse.json({
      status: 'ready',
      stats,
      version: VERSION,
    });
  } catch (error) {
    console.error('Error getting test status:', error);
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
