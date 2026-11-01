'use client';

import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'bordered';
  padding?: 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
}) => {
  return (
    <div
      className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${className || ''}`}
    >
      {children}
    </div>
  );
};
