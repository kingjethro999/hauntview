'use client';

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, id, required, className = '', ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[var(--bone-white)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--severity-scream)] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--slate-epitaph)]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={`
              w-full bg-[var(--haunted-purple)]/50 text-[var(--bone-white)] placeholder-[var(--slate-epitaph)]
              border-2 rounded-lg text-sm transition-all duration-200
              ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
              ${
                error
                  ? 'border-[var(--severity-scream)] bg-[var(--severity-scream)]/5 focus:border-[var(--severity-scream)] focus:ring-2 focus:ring-[var(--severity-scream)]/20'
                  : 'border-[var(--witchcraft-violet)] focus:border-[var(--pumpkin-fire)] focus:ring-3 focus:ring-[var(--pumpkin-fire)]/15'
              }
              disabled:opacity-60 disabled:cursor-not-allowed
              outline-none
              ${className}
            `}
            {...props}
          />
        </div>
        {error ? (
          <p
            id={`${inputId}-error`}
            className="text-xs text-[#fca5a5] mt-1.5 flex items-center gap-1"
          >
            <span>•</span> {error}
          </p>
        ) : helperText ? (
          <p className="text-xs text-[var(--slate-epitaph)] mt-1.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
