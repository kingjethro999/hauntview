'use client';

import React, { useState } from 'react';
import { ClipboardDocumentIcon, CheckIcon } from '@heroicons/react/24/outline';

export interface CodeBlockProps {
  code: string;
  title?: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({ code, title, language = 'bash', className = '' }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div
      className={`relative group rounded-lg border border-[#46334b]/60 bg-[#07040d] overflow-hidden ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#46334b]/40 bg-[#120a1c]/80 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff791f]/40 border border-[#ff791f]/60 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#9aff9a]/40 border border-[#9aff9a]/60 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#a855f7]/40 border border-[#a855f7]/60 inline-block" />
          {title ? (
            <span className="ml-2 font-mono text-[11px] text-[#b9acbf] tracking-wide">{title}</span>
          ) : (
            <span className="ml-2 font-mono text-[10px] uppercase text-[#7a6a82] tracking-wider">
              {language}
            </span>
          )}
        </div>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all duration-150 border border-[#46334b]/50 hover:border-[#ff791f]/50 bg-[#191024] hover:bg-[#231733] text-[#d9d3e0] hover:text-[#fff1dc] cursor-pointer"
        >
          {copied ? (
            <>
              <CheckIcon className="w-3.5 h-3.5 text-[#9aff9a]" />
              <span className="text-[11px] text-[#9aff9a] font-medium">Copied!</span>
            </>
          ) : (
            <>
              <ClipboardDocumentIcon className="w-3.5 h-3.5 text-[#b9acbf] group-hover:text-[#ff791f]" />
              <span className="text-[11px] text-[#b9acbf]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <pre className="p-4 text-xs font-mono leading-relaxed text-[#e6e0ed] overflow-x-auto selection:bg-[#ff791f]/30">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
}
