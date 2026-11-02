import { NextRequest, NextResponse } from 'next/server';
import { ReportStore } from '@/src/core/report-store';
import { ReportFactory } from '@/src/reports/factory';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const report = await ReportStore.getReport(id);

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
