'use client';

import React, { useState } from 'react';
import { TestReport } from '@/src/types';
import {
  ArrowDownTrayIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

export interface ReportActionsProps {
  report: TestReport;
}

/** Take the evidence home: copy, Markdown, HTML, or the full package with screenshots. */
export const ReportActions: React.FC<ReportActionsProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (permissions / insecure context)
    }
  };

  const base = `/api/results/${report.id}`;

  return (
    <div className="flex flex-wrap items-center gap-2 print:hidden" aria-label="Export this report">
      <button type="button" className="hv-btn hv-btn--ghost hv-btn--sm" onClick={copyJson}>
        {copied ? (
          <ClipboardDocumentCheckIcon
            className="w-4 h-4 text-[var(--hv-rest)]"
            aria-hidden="true"
          />
        ) : (
          <ClipboardDocumentIcon className="w-4 h-4" aria-hidden="true" />
        )}
        <span aria-live="polite">{copied ? 'Copied' : 'Copy JSON'}</span>
      </button>
      <a href={`${base}?format=markdown`} download className="hv-btn hv-btn--ghost hv-btn--sm">
        Markdown
      </a>
      <a href={`${base}?format=html`} download className="hv-btn hv-btn--ghost hv-btn--sm">
        HTML
      </a>
      <a href={`${base}?format=zip`} download className="hv-btn hv-btn--outline hv-btn--sm">
        <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
        Package (.zip)
      </a>
    </div>
  );
};
