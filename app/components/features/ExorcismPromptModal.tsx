'use client';

import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Finding } from '@/src/types';
import {
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export interface ExorcismPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding?: Finding | null;
  targetUrl: string;
}

export const ExorcismPromptModal: React.FC<ExorcismPromptModalProps> = ({
  isOpen,
  onClose,
  finding,
  targetUrl,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!finding) return null;

  const promptText = `I ran HauntView against ${targetUrl} and detected an omen that needs an exorcism (fix):

- Severity: ${finding.severity.toUpperCase()}
- Category: ${finding.category}
- Message: ${finding.message}
- Profile: ${finding.profileId}
${finding.location?.selector ? `- Target DOM Selector: ${finding.location.selector}` : ''}
${finding.location?.file ? `- File: ${finding.location.file}` : ''}
${finding.details ? `- Evidence Details: ${JSON.stringify(finding.details, null, 2)}` : ''}

Please examine our codebase, find the source element corresponding to this selector or issue, and apply the remediation to resolve this defect. Ensure that changes pass WCAG AA standards and maintain responsive layout integrity.`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exorcism · Fix with Kiro"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-[#B4BFC8]">
            Paste this prompt into your Kiro prompt box
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={copyToClipboard}
              icon={
                copied ? (
                  <ClipboardDocumentCheckIcon className="w-4 h-4 text-[#86efac]" />
                ) : (
                  <ClipboardDocumentIcon className="w-4 h-4" />
                )
              }
            >
              {copied ? 'Copied Prompt!' : 'Copy Fix Prompt'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4 text-xs text-[#ECE6D3]">
        <div className="p-3 rounded bg-[#0E2233] border border-[#2C4B68] flex items-start gap-2.5">
          <SparklesIcon className="w-5 h-5 text-[#F4B860] flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[#B4BFC8]">
            This structured prompt packages the raw omen evidence, DOM selector, and failure
            condition so your Kiro agent can identify the source file and generate the fix in one
            loop.
          </p>
        </div>

        <div>
          <span className="text-[#B4BFC8] font-semibold block mb-1.5 font-display text-sm">
            Generated Exorcism Prompt:
          </span>
          <pre className="p-3.5 rounded bg-[#0E2233] border border-[#2C4B68] font-mono text-[11px] text-[#A6F0D6] whitespace-pre-wrap overflow-x-auto max-h-72">
            {promptText}
          </pre>
        </div>
      </div>
    </Modal>
  );
};
