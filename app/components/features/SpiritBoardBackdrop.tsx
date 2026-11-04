'use client';

import React from 'react';

export const SpiritBoardBackdrop: React.FC = () => {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[480px] pointer-events-none overflow-hidden opacity-25 flex flex-col items-center justify-start z-0 select-none"
    >
      {/* Decorative Hairline Letter Arc Motif */}
      <svg
        viewBox="0 0 1000 360"
        className="w-full max-w-5xl stroke-[#b9acbf] fill-none stroke-[0.75] opacity-40"
      >
        {/* Arc Path */}
        <path
          id="spiritArc"
          d="M 50 280 A 500 240 0 0 1 950 280"
          className="stroke-[#46334b] stroke-dasharray-[3,6]"
        />

        {/* Text along arc */}
        <text className="font-serif text-[18px] fill-[#d9d3e0] tracking-[0.45em]">
          <textPath href="#spiritArc" startOffset="50%" textAnchor="middle">
            A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
          </textPath>
        </text>

        {/* Numerals Path */}
        <path
          id="numeralArc"
          d="M 180 320 A 420 180 0 0 1 820 320"
          className="stroke-[#46334b]/60 stroke-dasharray-[2,4]"
        />
        <text className="font-mono text-[13px] fill-[#b9acbf] tracking-[0.35em]">
          <textPath href="#numeralArc" startOffset="50%" textAnchor="middle">
            1 2 3 4 5 6 7 8 9 0
          </textPath>
        </text>

        {/* Sun and Crescent Moon accents */}
        <circle cx="120" cy="180" r="16" className="stroke-[#ff791f]/40" />
        <path
          d="M 870 165 A 16 16 0 1 0 885 195 A 12 12 0 1 1 870 165 Z"
          className="stroke-[#9aff9a]/40"
        />
      </svg>
    </div>
  );
};
