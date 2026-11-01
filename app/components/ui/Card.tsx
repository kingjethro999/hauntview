import React from 'react';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  variant?: 'default' | 'ghostly' | 'accent';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  variant = 'default',
  hoverable = false,
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-[#373746]/80 border border-[#6C3CAA]/30 shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur-sm',
    ghostly:
      'bg-[#0F0F14]/90 border border-[#6C3CAA]/40 shadow-[0_12px_32px_rgba(88,38,150,0.2)] backdrop-blur-md',
    accent:
      'bg-[#441C78]/40 border border-[#DC6428]/40 shadow-[0_8px_24px_rgba(220,100,40,0.15)] backdrop-blur-sm',
  };

  const hoverStyles = hoverable
    ? 'hover:border-[#DC6428]/60 hover:shadow-[0_12px_32px_rgba(88,38,150,0.25)] hover:-translate-y-0.5 transition-all duration-200'
    : '';

  return (
    <div
      className={`rounded-xl p-6 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      {...props}
    >
      {(title || subtitle || action) && (
        <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-[#6C3CAA]/20">
          <div>
            {title && (
              <h3 className="font-display font-bold text-lg md:text-xl text-[#F5F5FA] tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && <p className="text-sm text-[#646478] mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
