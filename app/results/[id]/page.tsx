import React, { Suspense } from 'react';
import { ReportStore } from '@/src/core/report-store';
import { ReportDetailClient } from './ReportDetailClient';
import { Spinner } from '../../components/ui/Spinner';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ReportContent({ params }: PageProps) {
  const { id } = await params;
  let report = null;
  try {
    report = await ReportStore.getReport(id);
  } catch {
    // If server file reading fails, fallback to client
  }

  return <ReportDetailClient id={id} initialReport={report} />;
}

export default function ReportDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-[#646478]">Loading test report...</p>
        </div>
      }
    >
      <ReportContent {...props} />
    </Suspense>
  );
}
