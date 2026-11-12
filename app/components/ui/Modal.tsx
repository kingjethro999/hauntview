'use client';

import React, { useEffect, useId, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  footer?: React.ReactNode;
  /** Visual tone — 'banish' tints the frame for destructive confirmations. */
  tone?: 'default' | 'banish';
}

const WIDTH = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth,
  size = 'lg',
  footer,
  tone = 'default',
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const prior = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    // Focus the last action (usually the safe "Keep" / primary), else the panel
    requestAnimationFrame(() => {
      const els = focusables();
      (els[els.length - 1] ?? panel)?.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab') {
        const els = focusables();
        if (!els.length) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      prior?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const frame =
    tone === 'banish'
      ? 'border-[rgba(255,93,82,0.45)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9),0_0_60px_-20px_rgba(255,93,82,0.4)]'
      : 'border-[var(--hv-seam-strong)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
      <div className="hv-dialog-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={`hv-dialog relative w-full ${WIDTH[maxWidth || size]} bg-[var(--hv-vault)] border rounded-[var(--hv-radius-lg)] overflow-hidden flex flex-col max-h-[90vh] ${frame}`}
      >
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-[var(--hv-seam)]">
          <h2 id={titleId} className="text-[length:var(--hv-step-2)] font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="hv-btn hv-btn--ghost hv-btn--sm !px-2"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1 text-[var(--hv-bone-dim)]">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-[var(--hv-seam)]">{footer}</div>}
      </div>
    </div>
  );
};
