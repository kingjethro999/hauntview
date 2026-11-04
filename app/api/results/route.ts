import { NextResponse } from 'next/server';
import { ReportStore } from '@/src/core/report-store';

export async function GET() {
  try {
    const reports = await ReportStore.listReports();
    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Failed to list test reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve test reports' },
      { status: 500 }
    );
  }
}
