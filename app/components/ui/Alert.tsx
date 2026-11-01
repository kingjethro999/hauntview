import React from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  children,
  onClose,
  className = '',
  ...props
}) => {
  const config = {
    success: {
      bg: 'bg-[#16a34a]/10',
      border: 'border-l-4 border-l-[#16a34a] border-y border-r border-[#16a34a]/20',
      text: 'text-[#86efac]',
      icon: <CheckCircleIcon className="w-5 h-5 text-[#22c55e] flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-[#ea580c]/10',
      border: 'border-l-4 border-l-[#ea580c] border-y border-r border-[#ea580c]/20',
      text: 'text-[#fed7aa]',
      icon: <ExclamationTriangleIcon className="w-5 h-5 text-[#f97316] flex-shrink-0" />,
    },
    error: {
      bg: 'bg-[#dc2626]/10',
      border: 'border-l-4 border-l-[#dc2626] border-y border-r border-[#dc2626]/20',
      text: 'text-[#fca5a5]',
      icon: <ExclamationCircleIcon className="w-5 h-5 text-[#ef4444] flex-shrink-0" />,
    },
    info: {
      bg: 'bg-[#0284c7]/10',
      border: 'border-l-4 border-l-[#0284c7] border-y border-r border-[#0284c7]/20',
      text: 'text-[#7dd3fc]',
      icon: <InformationCircleIcon className="w-5 h-5 text-[#38bdf8] flex-shrink-0" />,
    },
  };

  const current = config[type];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg ${current.bg} ${current.border} ${current.text} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{current.icon}</div>
      <div className="flex-1 text-sm">
        {title && <h5 className="font-semibold mb-1 text-[#F5F5FA]">{title}</h5>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-current opacity-60 hover:opacity-100 transition-opacity p-1"
        >
          ✕
        </button>
      )}
    </div>
  );
};
