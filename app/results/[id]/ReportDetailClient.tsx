'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { TestReport } from '@/src/types';
import { useCryptStore } from '@/src/lib/client/crypt-store';
import { ReportViewClient } from './ReportViewClient';
import { Container } from '../../components/layout/Container';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface ReportDetailClientProps {
  id: string;
  initialReport: TestReport | null;
}

export function ReportDetailClient({ id, initialReport }: ReportDetailClientProps) {
  const { reports, _hasHydrated } = useCryptStore();
  const storeReport = reports[id];
  const report = initialReport ?? storeReport;

  useEffect(() => {
    if (initialReport) {
      // Persist to browser-local storage
      useCryptStore.getState().addReport(initialReport);
    } else if (storeReport) {
      // Sync back to ephemeral server memory in background for exports
      fetch(`/api/results/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report: storeReport }),
      }).catch(() => {});
    }
  }, [id, initialReport, storeReport]);

  if (!_hasHydrated && !initialReport) {
    return (
      <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" />
        <p className="text-sm text-[#646478]">Consulting local séance crypt archives...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-12 sm:py-20">
        <Container size="sm">
          <EmptyState
            icon={<ExclamationCircleIcon className="w-10 h-10 text-[#dc2626]" />}
            title="Report Not Found"
            description={`Could not find test report with ID "${id}" in local browser storage or server memory.`}
            action={
              <Link href="/">
                <Button variant="primary">Launch New Test Run</Button>
              </Link>
            }
          />
        </Container>
      </div>
    );
  }

  return <ReportViewClient report={report} />;
}
