'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#DC6428] focus-visible:outline-offset-2 disabled:cursor-not-allowed';

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-6 py-3.5 text-base gap-2.5',
    };

    const variantStyles = {
      primary:
        'bg-[#582696] text-[#F5F5FA] border border-[#6C3CAA] shadow-[0_4px_12px_rgba(88,38,150,0.25)] hover:bg-[#6C3CAA] hover:shadow-[0_6px_20px_rgba(88,38,150,0.35)] hover:-translate-y-0.5 active:bg-[#441C78] active:translate-y-0 disabled:bg-[#4B5563] disabled:text-[#646478] disabled:border-transparent disabled:shadow-none disabled:transform-none',
      secondary:
        'bg-[#DC6428] text-[#F5F5FA] border border-[#B43C14] shadow-[0_4px_12px_rgba(220,100,40,0.25)] hover:bg-[#B43C14] hover:shadow-[0_6px_20px_rgba(220,100,40,0.35)] hover:-translate-y-0.5 active:bg-[#8B2E0F] active:translate-y-0 disabled:bg-[#4B5563] disabled:text-[#646478] disabled:border-transparent disabled:shadow-none disabled:transform-none',
      ghost:
        'bg-transparent text-[#F5F5FA] border border-transparent hover:bg-[rgba(88,38,150,0.15)] hover:border-[#6C3CAA] hover:text-[#DC6428] active:bg-[rgba(88,38,150,0.25)] disabled:text-[#646478] disabled:bg-transparent',
      outline:
        'bg-transparent text-[#F5F5FA] border border-[#6C3CAA] hover:bg-[rgba(88,38,150,0.1)] hover:border-[#DC6428] hover:text-[#DC6428] active:bg-[rgba(88,38,150,0.2)] disabled:border-[#4B5563] disabled:text-[#646478]',
      danger:
        'bg-[#dc2626] text-[#F5F5FA] border border-[#b91c1c] shadow-[0_4px_12px_rgba(220,38,38,0.25)] hover:bg-[#b91c1c] hover:shadow-[0_6px_20px_rgba(220,38,38,0.35)] hover:-translate-y-0.5 active:bg-[#991b1b] active:translate-y-0 disabled:bg-[#4B5563] disabled:text-[#646478]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {loading ? (
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : (
          icon
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
