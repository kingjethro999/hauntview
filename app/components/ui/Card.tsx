'use client';

import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'ghostly' | 'outlined' | 'accent';
  hoverable?: boolean;
  children: React.ReactNode;
}

const VARIANT = {
  default: 'hv-panel',
  ghostly: '',
  outlined: 'hv-card',
  accent: 'hv-panel border-[rgba(var(--hv-ember-rgb),0.45)] shadow-[var(--hv-glow-md)]',
};

/**
 * Surface primitive. `hoverable` cards carry the lantern: a soft ember glow
 * tracks the pointer across the card (CSS vars --mx/--my, transform-free).
 */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hoverable = false,
  children,
  className = '',
  onPointerMove,
  ...props
}) => {
  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (hoverable) {
      const r = e.currentTarget.getBoundingClientRect();
      e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
      e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
    }
    onPointerMove?.(e);
  };

  return (
    <div
      className={`${hoverable ? 'hv-card hv-card--interactive' : VARIANT[variant]} ${className}`}
      onPointerMove={handleMove}
      {...props}
    >
      {children}
    </div>
  );
};
