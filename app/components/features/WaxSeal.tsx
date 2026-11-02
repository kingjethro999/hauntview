'use client';

import React from 'react';

export interface WaxSealProps {
  variant?: 'crimson' | 'amber' | 'emerald' | 'dusk';
  status?: 'passed' | 'warnings' | 'failed' | 'sealed';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

export const WaxSeal: React.FC<WaxSealProps> = ({
  variant = 'crimson',
  status,
  size = 'md',
  label,
  className = '',
}) => {
  // Infer variant from status if provided
  const resolvedVariant = status
    ? status === 'passed'
      ? 'emerald'
      : status === 'warnings'
        ? 'amber'
        : 'crimson'
    : variant;

  const colorThemes = {
    crimson: {
      fill: '#8B1818',
      dark: '#5C0F0F',
      light: '#D33E3E',
      highlight: '#F28B77',
      text: '#FDE8E8',
      shadow: 'rgba(139, 24, 24, 0.45)',
    },
    amber: {
      fill: '#B87A18',
      dark: '#7A4F0B',
      light: '#E6A330',
      highlight: '#ff791f',
      text: '#FEF3C7',
      shadow: 'rgba(184, 122, 24, 0.45)',
    },
    emerald: {
      fill: '#136738',
      dark: '#0C4223',
      light: '#22A35B',
      highlight: '#86EFAC',
      text: '#ECFDF5',
      shadow: 'rgba(19, 103, 56, 0.45)',
    },
    dusk: {
      fill: '#1E3A56',
      dark: '#0F2133',
      light: '#366085',
      highlight: '#8EADC9',
      text: '#fff1dc',
      shadow: 'rgba(30, 58, 86, 0.45)',
    },
  };

  const theme = colorThemes[resolvedVariant];

  const sizePixels = {
    sm: 44,
    md: 68,
    lg: 96,
  }[size];

  const defaultText =
    label ||
    (status === 'passed'
      ? 'PURIFIED'
      : status === 'warnings'
        ? 'CHILLED'
        : status === 'failed'
          ? 'BREACHED'
          : 'SEALED');

  return (
    <div
      className={`relative inline-flex flex-col items-center justify-center select-none group ${className}`}
      title={`Grimoire Wax Seal: ${defaultText}`}
    >
      <svg
        width={sizePixels}
        height={sizePixels}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: `drop-shadow(0 4px 10px ${theme.shadow}) drop-shadow(0 1px 2px rgba(0,0,0,0.5))`,
        }}
        className="transform transition-transform group-hover:scale-105 duration-200"
      >
        <defs>
          <radialGradient
            id={`wax-grad-${resolvedVariant}-${size}`}
            cx="40%"
            cy="36%"
            r="65%"
            fx="35%"
            fy="30%"
          >
            <stop offset="0%" stopColor={theme.light} />
            <stop offset="60%" stopColor={theme.fill} />
            <stop offset="100%" stopColor={theme.dark} />
          </radialGradient>
          <linearGradient
            id={`wax-bevel-${resolvedVariant}-${size}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={theme.highlight} stopOpacity="0.8" />
            <stop offset="50%" stopColor={theme.fill} stopOpacity="0.2" />
            <stop offset="100%" stopColor={theme.dark} stopOpacity="0.9" />
          </linearGradient>
          {/* Circular text path */}
          <path id={`circle-path-${resolvedVariant}-${size}`} d="M 20, 50 a 30,30 0 1,1 60,0" />
        </defs>

        {/* Melted organic wax puddle / rim */}
        <path
          d="M 50,4
             C 61,3 73,7 81,15
             C 89,23 96,36 96,49
             C 96,62 89,75 80,84
             C 71,92 59,96 47,95
             C 34,95 23,90 14,81
             C 5,72 4,59 5,47
             C 6,34 11,22 20,13
             C 29,5 39,4 50,4 Z
             M 50,8
             C 38,8 26,13 18,22
             C 10,31 9,45 8,57
             C 8,70 17,81 29,87
             C 41,92 55,90 67,83
             C 78,76 88,64 88,50
             C 88,36 80,24 71,16
             C 63,9 52,8 50,8 Z"
          fill={theme.dark}
          opacity="0.85"
        />

        {/* Main circular wax body */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill={`url(#wax-grad-${resolvedVariant}-${size})`}
          stroke={`url(#wax-bevel-${resolvedVariant}-${size})`}
          strokeWidth="2"
        />

        {/* Stamped inner rim */}
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          stroke={theme.dark}
          strokeWidth="2.5"
          opacity="0.75"
        />
        <circle
          cx="50"
          cy="50"
          r="31"
          fill="none"
          stroke={theme.highlight}
          strokeWidth="1"
          opacity="0.5"
        />

        {/* Stamped Center Emblem: Ghost, Skull, Hourglass, or Victorian Monogram */}
        {resolvedVariant === 'emerald' ? (
          // Purified / Checkmark & Shield
          <g transform="translate(32, 32) scale(0.75)">
            <path
              d="M24 4L6 12v14c0 11.1 7.7 21.5 18 24 10.3-2.5 18-12.9 18-24V12L24 4z"
              fill={theme.dark}
              opacity="0.6"
            />
            <path
              d="M17 24l5 5 10-10"
              stroke={theme.highlight}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        ) : resolvedVariant === 'amber' ? (
          // Candle Flame / Eye of Vigilance
          <g transform="translate(32, 28) scale(0.75)">
            <path
              d="M24 4c0 0-10 12-10 20a10 10 0 0020 0c0-8-10-20-10-20z"
              fill={theme.dark}
              opacity="0.6"
            />
            <path
              d="M24 12c0 0-5 6-5 10a5 5 0 0010 0c0-4-5-10-5-10z"
              fill={theme.highlight}
              opacity="0.9"
            />
          </g>
        ) : (
          // Crimson / HauntView Skull or Ghost Emblem
          <g transform="translate(33, 30) scale(0.72)">
            {/* Victorian Ghost / Apparition Icon */}
            <path
              d="M24 4C14.059 4 6 12.059 6 22c0 6.5 3.2 12.3 8.2 15.8L12 44l6-3 6 3 6-3 6 3-2.2-6.2C38.8 34.3 42 28.5 42 22c0-9.941-8.059-18-18-18z"
              fill={theme.dark}
              opacity="0.6"
            />
            <circle cx="18" cy="20" r="3" fill={theme.highlight} />
            <circle cx="30" cy="20" r="3" fill={theme.highlight} />
            <path
              d="M21 28c1.5 2 4.5 2 6 0"
              stroke={theme.highlight}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* Outer stamped text */}
        {size !== 'sm' && (
          <text
            x="50"
            y="88"
            textAnchor="middle"
            fill={theme.highlight}
            fontSize="8"
            fontWeight="bold"
            letterSpacing="2"
            fontFamily="monospace"
            opacity="0.9"
            style={{ textShadow: `0 1px 2px ${theme.dark}` }}
          >
            {defaultText}
          </text>
        )}
      </svg>
    </div>
  );
};
