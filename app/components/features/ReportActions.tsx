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
    <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-[6px] border border-[#46334b] bg-[#1c1629]/70 backdrop-blur-sm print:hidden">
      <Link href="/">
        <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />}>
          The Parlour · New Séance
        </Button>
      </Link>

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
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

        {/* Print Grimoire button commented out per user request
        <Button
          variant="outline"
          size="sm"
          onClick={printReport}
          icon={<PrinterIcon className="w-4 h-4 text-[#ff791f]" />}
        >
          Print Grimoire
        </Button>
        */}

        <a href={`/api/results/${report.id}?format=markdown`} download>
          <Button
            variant="outline"
            size="sm"
            icon={<DocumentTextIcon className="w-4 h-4 text-[#ff791f]" />}
          >
            Export Markdown
          </Button>
        </a>

        <a href={`/api/results/${report.id}?format=zip`} download>
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowDownTrayIcon className="w-4 h-4 text-[#0a0711]" />}
            className="bg-[#ff791f] hover:bg-[#ff791f]/90 text-[#0a0711] font-bold shadow-[0_0_12px_rgba(255,121,31,0.3)]"
          >
            Download Package (.zip + screenshots)
          </Button>
        </a>

        <a href={`/api/results/${report.id}?format=html`} download>
          <Button variant="outline" size="sm" icon={<ArrowDownTrayIcon className="w-4 h-4" />}>
            HTML Folio
          </Button>
        </a>
      </div>
    </div>
  );
};
