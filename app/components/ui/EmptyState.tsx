import React from 'react';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-16 px-6 rounded-xl border border-dashed border-[#6C3CAA]/30 bg-[#373746]/10 ${className}`}
    >
      <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-[#582696]/10 text-[#DC6428] mb-4 opacity-80">
        {icon || (
          <span className="text-3xl select-none" role="img" aria-label="ghost">
            👻
          </span>
        )}
      </div>
      <h4 className="font-display font-bold text-lg text-[#F5F5FA] mb-2">{title}</h4>
      <p className="text-sm text-[#646478] max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
