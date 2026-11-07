import React from 'react';
import { ReportStore } from '@/src/core/report-store';
import { ReportDetailClient } from './ReportDetailClient';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { id } = await params;
  let report = null;
  try {
    report = await ReportStore.getReport(id);
  } catch {
    // If server file reading fails, fallback to client
  }

  return <ReportDetailClient id={id} initialReport={report} />;
}
