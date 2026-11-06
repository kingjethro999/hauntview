'use client';

import React, { useState, useEffect } from 'react';

/**
 * App-wide haunting effects layer
 * Decorative elements that enhance the séance atmosphere
 * Never intercepts user input
 * Respects reduced motion and atmosphere settings
 */
export function HauntingEffects() {
  const [spirits, setSpirits] = useState<Array<{ id: number; x: number; delay: number }>>([]);

  useEffect(() => {
    // Spawn occasional spirits
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setSpirits((prev) => {
          const newSpirit = {
            id: Date.now(),
            x: 10 + Math.random() * 80,
            delay: Math.random() * 2,
          };
          return [...prev.slice(-2), newSpirit]; // Keep max 3 spirits
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="haunting-layer" aria-hidden="true">
      {/* Corridor fog */}
      <div className="corridor-fog fog-left" />
      <div className="corridor-fog fog-right" />

      {/* Spirit apparitions */}
      {spirits.map((spirit) => (
        <Spirit key={spirit.id} x={spirit.x} delay={spirit.delay} />
      ))}

      {/* Ceiling spark */}
      <div className="haunt-ceiling">
        <span>*</span>
        <span>*</span>
        <span>*</span>
      </div>
    </div>
  );
}

function Spirit({ x, delay }: { x: number; delay: number }) {
  return (
    <div
      className="apparition-burst"
      style={
        {
          '--ghost-left': `${x}%`,
          '--delay': `${delay}s`,
        } as React.CSSProperties
      }
    >
      <svg viewBox="0 0 75 100" className="spirit-svg">
        <path
          d="M4.594,6.677C6.67,-2.226 18.746,-2.211 21.16,6.632C21.513,7.929 22.885,14.214 19.487,20.379C17.942,23.176 13.646,25.869 12.497,22.262C8.6,25.477 3.315,24.1 5.789,18.609L5.471,18.752C1.901,20.057 1.608,17.544 2.298,16.239C2.748,15.399 3.025,14.904 3.235,14.342C3.588,13.367 3.693,12.774 3.828,11.844C4.098,10.007 4.105,8.237 4.593,6.677L4.594,6.677Z"
          fill="currentColor"
        />
        <circle cx="12.964" cy="6.687" r="1.5" fill="#0a0711" />
        <circle cx="17.044" cy="6.687" r="1.5" fill="#0a0711" />
      </svg>
    </div>
  );
}
