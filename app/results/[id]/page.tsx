import React, { Suspense } from 'react';
import Link from 'next/link';
import { ReportStore } from '@/src/core/report-store';
import { ReportViewClient } from './ReportViewClient';
import { Container } from '../../components/layout/Container';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function ReportContent({ params }: PageProps) {
  const { id } = await params;
  const report = await ReportStore.getReport(id);

  if (!report) {
    return (
      <div className="py-20">
        <Container size="sm">
          <EmptyState
            icon={<ExclamationCircleIcon className="w-10 h-10 text-[#dc2626]" />}
            title="Report Not Found"
            description={`Could not find test report with ID "${id}". It may have expired or was generated in a separate process.`}
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
