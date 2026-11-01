'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { TestReport } from '@/src/types';
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export interface ReportActionsProps {
  report: TestReport;
}

export const ReportActions: React.FC<ReportActionsProps> = ({ report }) => {
  const [copied, setCopied] = useState<boolean>(false);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-[#6C3CAA]/30 bg-[#373746]/40 backdrop-blur-sm">
      <Link href="/">
        <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />}>
          Run Another Test
        </Button>
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={copyJson}
          icon={
            copied ? (
              <ClipboardDocumentCheckIcon className="w-4 h-4 text-[#86efac]" />
            ) : (
              <ClipboardDocumentIcon className="w-4 h-4" />
            )
          }
        >
          {copied ? 'Copied JSON!' : 'Copy JSON'}
        </Button>

        <a href={`/api/results/${report.id}?format=markdown`} download>
          <Button
            variant="outline"
            size="sm"
            icon={<DocumentTextIcon className="w-4 h-4 text-[#DC6428]" />}
          >
            Export Markdown
          </Button>
        </a>

        <a href={`/api/results/${report.id}?format=html`} download>
          <Button variant="secondary" size="sm" icon={<ArrowDownTrayIcon className="w-4 h-4" />}>
            Download HTML Report
          </Button>
        </a>
      </div>
    </div>
  );
};
