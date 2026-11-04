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
          <label htmlFor={inputId} className="block text-sm font-semibold text-[#fff1dc] mb-1.5">
            {label}
            {required && <span className="text-[#dc2626] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#646478]">
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
              w-full bg-[#2d1a4a]/50 text-[#fff1dc] placeholder-[#646478]
              border-2 rounded-lg text-sm transition-all duration-200
              ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5
              ${
                error
                  ? 'border-[#dc2626] bg-[#dc2626]/5 focus:border-[#dc2626] focus:ring-2 focus:ring-[#dc2626]/20'
                  : 'border-[#6C3CAA] focus:border-[#ff791f] focus:ring-3 focus:ring-[#ff791f]/15'
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
          <p className="text-xs text-[#646478] mt-1.5">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
