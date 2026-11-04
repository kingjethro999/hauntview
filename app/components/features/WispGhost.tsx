'use client';

import React, { useState } from 'react';

export type WispState =
  | 'idle'
  | 'curious'
  | 'pleased'
  | 'conjuring'
  | 'delighted'
  | 'wary'
  | 'alarmed'
  | 'napping'
  | 'lost'
  | 'waving';

export interface WispGhostProps {
  state?: WispState;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSpeechBubble?: boolean;
  message?: string;
}

export const WispGhost: React.FC<WispGhostProps> = ({
  state = 'idle',
  className = '',
  size = 'md',
  showSpeechBubble = false,
  message,
}) => {
  const [isSpun, setIsSpun] = useState(false);
  const [clickedBoo, setClickedBoo] = useState(false);

  const sizeDimensions = {
    sm: { w: 48, h: 56, text: 'text-[10px]' },
    md: { w: 72, h: 84, text: 'text-xs' },
    lg: { w: 96, h: 112, text: 'text-sm' },
    xl: { w: 128, h: 148, text: 'text-base' },
  };

  const { w, h, text: textSize } = sizeDimensions[size];

  const handleClick = () => {
    setIsSpun(true);
    setClickedBoo(true);
    setTimeout(() => setIsSpun(false), 700);
    setTimeout(() => setClickedBoo(false), 2600);
  };

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none group cursor-pointer ${className}`}
      onClick={handleClick}
      title="Wisp, the resident ghost (Click for a friendly boo!)"
      role="img"
      aria-label={`Wisp the friendly ghost in ${state} mood`}
    >
      {/* Playful Speech Bubble */}
      {(clickedBoo || (showSpeechBubble && message)) && (
        <div
          className={`absolute -top-10 z-20 px-3 py-1 bg-[#1c1629] border border-[#ff791f] rounded-[6px] shadow-[0_4px_16px_rgba(255,121,31,0.3)] text-[#fff1dc] ${textSize} font-serif whitespace-nowrap animate-bounce`}
        >
          {clickedBoo ? 'Boo! 👻✨' : message}
          <div className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-2.5 h-2.5 bg-[#1c1629] border-r border-b border-[#ff791f] rotate-45" />
        </div>
      )}

      {/* Ghost SVG Body */}
      <svg
        width={w}
        height={h}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-700 ${isSpun ? 'rotate-[360deg] scale-110' : ''} ${
          state === 'idle' ? 'animate-[float_4s_ease-in-out_infinite]' : ''
        } ${state === 'conjuring' ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''}`}
      >
        <defs>
          {/* Ethereal body gradient */}
          <linearGradient
            id="wispBodyGrad"
            x1="50"
            y1="10"
            x2="50"
            y2="110"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#9aff9a" stopOpacity="0.65" />
          </linearGradient>

          {/* Candle Flame Radial Glow */}
          <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF275" stopOpacity="1" />
            <stop offset="50%" stopColor="#ff791f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#ff791f" stopOpacity="0" />
          </radialGradient>

          {/* Ghost Aura Blur */}
          <filter id="wispAura" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ethereal Glow Silhouette */}
        <path
          d="M 50 15 
             C 25 15, 20 40, 20 65 
             C 20 85, 15 95, 25 105 
             C 33 100, 42 108, 50 100 
             C 58 108, 67 100, 75 105 
             C 85 95, 80 85, 80 65 
             C 80 40, 75 15, 50 15 Z"
          fill="none"
          stroke={state === 'delighted' ? '#9aff9a' : state === 'alarmed' ? '#F28B77' : '#ff791f'}
          strokeWidth="2"
          strokeOpacity={state === 'delighted' || state === 'conjuring' ? '0.8' : '0.3'}
          filter="url(#wispAura)"
        />

        {/* Ghost Main Body with Scalloped Hem */}
        <path
          d="M 50 16 
             C 28 16, 23 42, 23 66 
             C 23 83, 18 92, 26 102 
             C 33 97, 41 104, 50 97 
             C 59 104, 67 97, 74 102 
             C 82 92, 77 83, 77 66 
             C 77 42, 72 16, 50 16 Z"
          fill="url(#wispBodyGrad)"
          stroke="#fff1dc"
          strokeWidth="1.5"
        />

        {/* State-specific facial expressions and accessories */}
        {state === 'napping' ? (
          <>
            {/* Sleeping Eyes (curved arches) */}
            <path
              d="M 37 54 Q 42 58 47 54"
              stroke="#0a0711"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 53 54 Q 58 58 63 54"
              stroke="#0a0711"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* ZZZ marks floating */}
            <text
              x="68"
              y="36"
              fill="#ff791f"
              fontSize="12"
              fontWeight="bold"
              fontFamily="serif"
              className="animate-pulse"
            >
              z
            </text>
            <text
              x="76"
              y="24"
              fill="#ff791f"
              fontSize="15"
              fontWeight="bold"
              fontFamily="serif"
              className="animate-pulse"
            >
              Z
            </text>
          </>
        ) : state === 'alarmed' ? (
          <>
            {/* Wide, shocked eyes */}
            <ellipse cx="40" cy="50" rx="5" ry="7" fill="#0a0711" />
            <circle cx="39" cy="48" r="1.5" fill="#FFFFFF" />
            <ellipse cx="60" cy="50" rx="5" ry="7" fill="#0a0711" />
            <circle cx="59" cy="48" r="1.5" fill="#FFFFFF" />
            {/* Open mouth (Scream) */}
            <ellipse cx="50" cy="64" rx="4" ry="6" fill="#0a0711" />
            {/* Little arms raised */}
            <path
              d="M 23 58 Q 12 48 16 38"
              stroke="#fff1dc"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 77 58 Q 88 48 84 38"
              stroke="#fff1dc"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            />
          </>
        ) : state === 'delighted' ? (
          <>
            {/* Happy smiling eyes */}
            <path
              d="M 36 50 Q 41 45 46 50"
              stroke="#0a0711"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M 54 50 Q 59 45 64 50"
              stroke="#0a0711"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Joyful smile */}
            <path
              d="M 43 58 Q 50 65 57 58"
              stroke="#0a0711"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Rosy cheeks */}
            <ellipse cx="34" cy="56" rx="4" ry="2" fill="#ff791f" opacity="0.6" />
            <ellipse cx="66" cy="56" rx="4" ry="2" fill="#ff791f" opacity="0.6" />
            {/* Sparkles */}
            <path
              d="M 82 28 L 84 22 L 86 28 L 92 30 L 86 32 L 84 38 L 82 32 L 76 30 Z"
              fill="#9aff9a"
            />
            <path
              d="M 16 32 L 17 28 L 18 32 L 22 33 L 18 34 L 17 38 L 16 34 L 12 33 Z"
              fill="#ff791f"
            />
          </>
        ) : state === 'curious' ? (
          <>
            {/* Inquisitive eyes looking forward-down */}
            <ellipse cx="43" cy="52" rx="4" ry="5.5" fill="#0a0711" />
            <circle cx="44" cy="51" r="1.5" fill="#FFFFFF" />
            <ellipse cx="61" cy="52" rx="4" ry="5.5" fill="#0a0711" />
            <circle cx="62" cy="51" r="1.5" fill="#FFFFFF" />
            {/* Curious tilted small mouth */}
            <ellipse cx="53" cy="62" rx="2.5" ry="3" fill="#0a0711" />
          </>
        ) : state === 'pleased' ? (
          <>
            {/* Pleased eyes */}
            <ellipse cx="40" cy="50" rx="3.5" ry="5" fill="#0a0711" />
            <circle cx="41" cy="48" r="1.2" fill="#FFFFFF" />
            <ellipse cx="60" cy="50" rx="3.5" ry="5" fill="#0a0711" />
            <circle cx="61" cy="48" r="1.2" fill="#FFFFFF" />
            {/* Contented smile */}
            <path
              d="M 44 59 Q 50 64 56 59"
              stroke="#0a0711"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
            <ellipse cx="34" cy="55" rx="3" ry="1.5" fill="#ff791f" opacity="0.5" />
            <ellipse cx="66" cy="55" rx="3" ry="1.5" fill="#ff791f" opacity="0.5" />
          </>
        ) : state === 'conjuring' ? (
          <>
            {/* Conjuring focused eyes */}
            <ellipse cx="40" cy="50" rx="4" ry="5.5" fill="#0a0711" />
            <circle cx="41" cy="48" r="1.5" fill="#9aff9a" />
            <ellipse cx="60" cy="50" rx="4" ry="5.5" fill="#0a0711" />
            <circle cx="61" cy="48" r="1.5" fill="#9aff9a" />
            {/* Candle being held */}
            <rect
              x="70"
              y="55"
              width="8"
              height="22"
              rx="1.5"
              fill="#EDE6D6"
              stroke="#b9acbf"
              strokeWidth="1"
            />
            <ellipse cx="74" cy="48" rx="6" ry="8" fill="url(#candleGlow)" />
            <circle cx="74" cy="48" r="2.5" fill="#FFFFFF" />
            {/* Small glowing trail */}
            <circle cx="20" cy="70" r="3" fill="#9aff9a" opacity="0.7" className="animate-ping" />
          </>
        ) : (
          /* Default Idle / Standard friendly pose */
          <>
            <ellipse cx="40" cy="50" rx="3.5" ry="5" fill="#0a0711" />
            <circle cx="41" cy="48" r="1.2" fill="#FFFFFF" />
            <ellipse cx="60" cy="50" rx="3.5" ry="5" fill="#0a0711" />
            <circle cx="61" cy="48" r="1.2" fill="#FFFFFF" />
            {/* Small friendly curve */}
            <path
              d="M 46 60 Q 50 63 54 60"
              stroke="#0a0711"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </>
        )}
      </svg>
    </div>
  );
};
