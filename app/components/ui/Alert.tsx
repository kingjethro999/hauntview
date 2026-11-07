import React from 'react';
import {
  XMarkIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

interface AlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}

export const Alert: React.FC<AlertProps> = ({ type, title, children, onClose }) => {
  const config = {
    error: {
      icon: ExclamationCircleIcon,
      bg: 'rgba(220, 38, 38, 0.1)',
      border: 'rgba(220, 38, 38, 0.3)',
      iconColor: 'var(--severity-scream)',
      textColor: '#fca5a5',
    },
    warning: {
      icon: ExclamationTriangleIcon,
      bg: 'rgba(234, 88, 12, 0.1)',
      border: 'rgba(234, 88, 12, 0.3)',
      iconColor: '#ea580c',
      textColor: '#fed7aa',
    },
    success: {
      icon: CheckCircleIcon,
      bg: 'rgba(22, 163, 74, 0.1)',
      border: 'rgba(22, 163, 74, 0.3)',
      iconColor: '#16a34a',
      textColor: 'var(--success)',
    },
    info: {
      icon: InformationCircleIcon,
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.3)',
      iconColor: '#3b82f6',
      textColor: '#93c5fd',
    },
  };

  const { icon: Icon, bg, border, iconColor, textColor } = config[type];

  return (
    <div
      className="rounded-lg p-4 flex items-start gap-3"
      style={{
        background: bg,
        border: `1px solid ${border}`,
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: iconColor }} />
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold text-sm mb-1" style={{ color: textColor }}>
            {title}
          </h4>
        )}
        <div className="text-sm" style={{ color: textColor }}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
          style={{ color: textColor }}
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
