import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center font-medium rounded-md';

  const variantStyles = {
    primary: 'bg-[var(--candle-primary)] text-[#1a0c06]',
    success: 'bg-[#9aff9a] text-[#0a0711]',
    warning: 'bg-[#f59e0b] text-[#1a0c06]',
    error: 'bg-[#dc2626] text-white',
    info: 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40',
    outline: 'border text-[var(--ghost-white)]',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const borderStyles = variant === 'outline' ? 'border-[rgba(255,121,31,0.3)]' : '';

  return (
    <span
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${borderStyles} ${className}`}
    >
      {children}
    </span>
  );
};
