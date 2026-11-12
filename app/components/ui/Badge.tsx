import React from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

const VARIANT = {
  primary: 'hv-chip--ember',
  success: 'hv-chip--rest',
  warning: 'hv-chip--chill',
  error: 'hv-chip--scream',
  info: '',
  outline: '',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
}) => {
  return (
    <span
      className={`hv-chip ${VARIANT[variant]} ${size === 'md' ? 'text-[0.8rem]' : ''} ${className}`}
    >
      {children}
    </span>
  );
};
