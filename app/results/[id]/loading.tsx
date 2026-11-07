import React from 'react';
import { Spinner } from '@/app/components/ui/Spinner';

export default function Loading() {
  return (
    <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-[var(--slate-epitaph)]">Loading test report...</p>
    </div>
  );
}
