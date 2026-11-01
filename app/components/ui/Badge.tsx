import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  const variantStyles = {
    primary: 'bg-[#582696]/20 text-[#c084fc] border border-[#582696]/60',
    success: 'bg-[#16a34a]/15 text-[#86efac] border border-[#16a34a]/40',
    warning: 'bg-[#ea580c]/15 text-[#fed7aa] border border-[#ea580c]/40',
    error: 'bg-[#dc2626]/15 text-[#fca5a5] border border-[#dc2626]/40',
    info: 'bg-[#0284c7]/15 text-[#7dd3fc] border border-[#0284c7]/40',
    outline: 'bg-transparent text-[#F5F5FA] border border-[#6C3CAA]',
    neutral: 'bg-[#373746]/60 text-[#646478] border border-[#646478]/30',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full select-none ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </span>
  );
};
