import { NextRequest, NextResponse } from 'next/server';
import { ReportStore } from '@/src/core/report-store';
import { ReportFactory } from '@/src/reports/factory';
import { getRunById } from '@/src/lib/server/database';
import { TestReport } from '@/src/types';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    let report: TestReport | null = await ReportStore.getReport(id);

    // Fallback to SQLite if not in file store
    if (!report) {
      try {
        const dbRecord = getRunById(id);
        if (dbRecord) {
          report = {
            id: dbRecord.run.id,
            url: dbRecord.run.targetUrl,
            startTime: dbRecord.run.startedAt,
            endTime: dbRecord.run.completedAt || dbRecord.run.startedAt,
            duration: dbRecord.run.durationMs || 0,
            profileResults: dbRecord.run.selectedProfiles.map((pId) => ({
              profileId: pId,
              profileName: pId,
              success: true,
              startTime: dbRecord.run.startedAt,
              endTime: dbRecord.run.completedAt || dbRecord.run.startedAt,
              duration: dbRecord.run.durationMs || 0,
              findings: dbRecord.findings.filter((f) => f.profileId === pId),
              screenshots: [],
              metadata: {
                browserEngine: 'chromium',
                browserVersion: 'unknown',
                nodeVersion: process.version,
              },
            })),
            summary: {
              totalProfiles: dbRecord.run.selectedProfiles.length,
              successfulProfiles: dbRecord.run.selectedProfiles.length,
              failedProfiles: 0,
              totalFindings: dbRecord.run.totalFindings,
              canonicalizedFindings: 0,
              findingsBySeverity: {
                error: dbRecord.run.errorCount,
                warning: dbRecord.run.warningCount,
                info: dbRecord.run.infoCount,
              },
              findingsByCategory: {},
            },
          };
        }
      } catch {
        // Fallback silently if SQLite is uninitialized
      }
    }

    if (!report) {
      return NextResponse.json(
        { success: false, error: `Report ${id} not found` },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    if (
      format &&
      (format === 'html' || format === 'markdown' || format === 'zip' || format === 'bundle')
    ) {
      const generator = ReportFactory.createGenerator(format);
      const generated = await generator.generate(report, {
        format: format === 'bundle' ? 'zip' : (format as 'html' | 'markdown' | 'zip'),
        includeScreenshots: true,
      });

      const body =
        typeof generated.content === 'string'
          ? generated.content
          : new Uint8Array(generated.content);

      return new NextResponse(body, {
        headers: {
          'Content-Type': generated.mimeType,
          'Content-Disposition': `attachment; filename="${generated.filename}"`,
        },
      });
    }

    return NextResponse.json({ success: true, report });
  } catch (error) {
    console.error('Failed to get report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
