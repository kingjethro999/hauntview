'use client';

import React from 'react';

/**
 * Haunting decorations for the hero section
 * Spirits, moon, spider web, and subtle Victorian ornaments
 * Never intercepts user input, purely atmospheric
 */
export function HauntingDecorations() {
  return (
    <div className="haunting-decorations" aria-hidden="true">
      {/* Spider web - top right */}
      <svg className="spider-web" viewBox="0 0 150 150" fill="none">
        <path
          d="M150 0 0 0m150 0L0 150M150 0v150M150 0 10 70m140-70-70 140M120 0q0 30 30 30M90 0q0 60 60 60M60 0q0 90 90 90M30 0q0 120 120 120M0 0q0 150 150 150"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* Haunted moon */}
      <div className="haunted-moon">
        <div className="moon-crater-1" />
        <div className="moon-crater-2" />
        <div className="moon-crater-3" />
      </div>

      {/* Spirit apparition - floating */}
      <div className="hero-spirit">
        <svg viewBox="0 0 75 100" className="spirit-svg">
          <path
            d="M4.594,6.677C6.67,-2.226 18.746,-2.211,21.16,6.632C21.513,7.929 22.885,14.214 19.487,20.379C17.942,23.176 13.646,25.869 12.497,22.262C8.6,25.477 3.315,24.1,5.789,18.609L5.471,18.752C1.901,20.057 1.608,17.544 2.298,16.239C2.748,15.399 3.025,14.904 3.235,14.342C3.588,13.367 3.693,12.774 3.828,11.844C4.098,10.007 4.105,8.237 4.593,6.677L4.594,6.677Z"
            fill="currentColor"
          />
          <circle cx="12.964" cy="6.687" r="1.5" fill="#0a0711" />
          <circle cx="17.044" cy="6.687" r="1.5" fill="#0a0711" />
        </svg>
      </div>

      {/* Hanging spider */}
      <div className="hanging-spider">
        <div className="spider-thread" />
        <svg viewBox="0 0 60 50" className="spider-svg">
          <path
            d="m25 25-15-8-7-12m22 22L8 29 2 42m33-17 15-8 7-12M35 27l17 2 6 13M23 32 12 39v9m25-16 11 7v9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <ellipse cx="30" cy="27" rx="10" ry="13" fill="currentColor" />
          <circle cx="27" cy="23" r="2" fill="#ffb570" />
          <circle cx="33" cy="23" r="2" fill="#ffb570" />
        </svg>
      </div>

      {/* Victorian frame ornaments */}
      <div className="frame-ornament frame-tl" />
      <div className="frame-ornament frame-tr" />
      <div className="frame-ornament frame-bl" />
      <div className="frame-ornament frame-br" />

      {/* Candle glows */}
      <div className="candle-glow candle-1" />
      <div className="candle-glow candle-2" />
      <div className="candle-glow candle-3" />
    </div>
  );
}
