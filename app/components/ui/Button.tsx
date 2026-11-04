import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'candle';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50';

  const variantStyles = {
    primary:
      'bg-[var(--candle-primary)] text-[#1a0c06] hover:bg-[#ff8a35] shadow-[0_4px_16px_rgba(255,121,31,0.4)] hover:shadow-[0_6px_24px_rgba(255,121,31,0.5)]',
    secondary:
      'bg-[#3b82f6] text-white hover:bg-[#60a5fa] shadow-[0_4px_16px_rgba(59,130,246,0.3)]',
    ghost:
      'bg-transparent text-[var(--ghost-white)] hover:bg-[rgba(255,121,31,0.1)] hover:text-[var(--candle-primary)]',
    outline:
      'bg-transparent border border-[rgba(255,121,31,0.3)] text-[var(--ghost-white)] hover:border-[var(--candle-primary)] hover:bg-[rgba(255,121,31,0.08)]',
    candle: 'btn-candle',
  };

  const sizeStyles = {
    sm: 'px-3.5 py-2 text-xs min-h-[44px]',
    md: 'px-4 py-2.5 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
      {!loading && icon}
      {children}
    </button>
  );
};
