'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { EyeIcon } from '@heroicons/react/24/outline';

export interface CameoFrameProps {
  title: string;
  subtitle?: string;
  imageSrc?: string;
  findingCount: number;
  severity?: 'info' | 'warning' | 'serious';
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}

export const CameoFrame: React.FC<CameoFrameProps> = ({
  title,
  subtitle,
  imageSrc,
  findingCount,
  severity = 'info',
  isSelected = false,
  onClick,
  className = '',
}) => {
  const getSeverityBadgeVariant = () => {
    switch (severity) {
      case 'serious':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  };

  const getSeverityBorder = () => {
    switch (severity) {
      case 'serious':
        return 'border-[#F28B77] shadow-[0_0_12px_rgba(242,139,119,0.35)]';
      case 'warning':
        return 'border-[var(--pumpkin-fire)] shadow-[0_0_12px_rgba(255,121,31,0.35)]';
      case 'info':
      default:
        return 'border-[var(--grave-dust)]';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`group flex flex-col items-center text-center p-3 rounded-[6px] transition-all cursor-pointer ${
        isSelected
          ? 'bg-[var(--ghost-mist)] ring-2 ring-[var(--pumpkin-fire)] shadow-[0_4px_16px_rgba(255,121,31,0.2)]'
          : 'hover:bg-[var(--ghost-mist)]/60'
      } ${className}`}
    >
      {/* Oval Cameo Frame Container */}
      <div
        className={`relative w-28 h-36 cameo-frame mb-3 bg-[var(--midnight-veil)] border-2 transition-transform group-hover:scale-105 ${getSeverityBorder()}`}
      >
        {imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={`Apparition: ${title}`}
            className="w-full h-full object-cover pointer-events-none"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-[var(--midnight-veil)] text-[var(--spirit-smoke)]">
            <div className="w-8 h-8 rounded-full border border-[var(--tombstone-gray)] flex items-center justify-center mb-1 text-[var(--pumpkin-fire)]">
              👻
            </div>
            <span className="text-[10px] font-mono tracking-tight text-center leading-tight truncate max-w-[80px]">
              {title}
            </span>
          </div>
        )}

        {/* Hover inspect veil icon overlay */}
        <div className="absolute inset-0 bg-[var(--midnight-veil)]/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[var(--pumpkin-fire)]">
          <EyeIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Cameo Caption */}
      <span className="font-display font-semibold text-xs text-[var(--bone-white)] truncate max-w-[120px] group-hover:text-[var(--pumpkin-fire)] transition-colors">
        {title}
      </span>

      {subtitle && (
        <span className="text-[10px] text-[var(--spirit-smoke)] mt-0.5 truncate">{subtitle}</span>
      )}

      <div className="mt-1.5">
        <Badge variant={findingCount > 0 ? getSeverityBadgeVariant() : 'success'} size="sm">
          {findingCount === 0 ? 'No omens' : `${findingCount} omen${findingCount > 1 ? 's' : ''}`}
        </Badge>
      </div>
    </div>
  );
};
