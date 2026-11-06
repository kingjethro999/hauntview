import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ghostly' | 'outlined' | 'accent';
  hoverable?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-lg transition-all duration-200';

  const variantStyles = {
    default: 'victorian-panel',
    ghostly: 'bg-transparent border-none shadow-none',
    outlined: 'border rounded-lg bg-transparent hover:bg-[rgba(255,121,31,0.05)]',
    accent: 'victorian-panel border-[var(--candle-primary)] shadow-[0_0_20px_rgba(255,121,31,0.2)]',
  };

  const hoverStyles = hoverable
    ? 'hover:border-[var(--candle-primary)] hover:shadow-[0_8px_32px_rgba(255,121,31,0.15)] hover:-translate-y-0.5 cursor-pointer'
    : '';

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
