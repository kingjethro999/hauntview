import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    'primary' | 'secondary' | 'ghost' | 'outline' | 'candle' | 'moon' | 'banish' | 'banish-solid';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const VARIANT: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'hv-btn--primary',
  candle: 'hv-btn--primary',
  secondary: 'hv-btn--moon',
  moon: 'hv-btn--moon',
  outline: 'hv-btn--outline',
  ghost: 'hv-btn--ghost',
  banish: 'hv-btn--banish',
  'banish-solid': 'hv-btn--banish-solid',
};

const SIZE = { sm: 'hv-btn--sm', md: '', lg: 'hv-btn--lg' };

/** Tiny candle flame used as the loading indicator inside buttons. */
export function FlameSpinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`hv-candle--running ${className}`}
      width="12"
      height="16"
      viewBox="0 0 12 16"
      aria-hidden="true"
    >
      <path
        className="hv-candle__flame"
        d="M6 1c3.2 3.4 3.8 6.2 3 8.4A3.2 3.2 0 0 1 6 12a3.2 3.2 0 0 1-3-2.6C2.2 7.2 2.8 4.4 6 1Z"
        fill="currentColor"
      />
      <rect x="5.2" y="12" width="1.6" height="3.5" rx="0.6" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  type = 'button',
  ...props
}) => {
  return (
    <button
      type={type}
      className={`hv-btn ${VARIANT[variant]} ${SIZE[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <FlameSpinner /> : icon}
      {children}
    </button>
  );
};
