'use client';

import React, { useState, useEffect } from 'react';

interface HauntingWispProps {
  /** Current state of the wisp */
  state?: 'idle' | 'happy' | 'concerned' | 'searching' | 'celebrating';
  /** Size of the wisp */
  size?: 'small' | 'medium' | 'large';
  /** Custom message to display */
  message?: string;
  /** Whether to show the message */
  showMessage?: boolean;
  /** Atmosphere setting */
  atmosphere?: 'off' | 'subtle' | 'full';
}

export const HauntingWisp: React.FC<HauntingWispProps> = ({
  state = 'idle',
  size = 'medium',
  message,
  showMessage = true,
  atmosphere = 'full',
}) => {
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isFloating, setIsFloating] = useState(true);
  const [glowIntensity, setGlowIntensity] = useState(0.6);

  const sizeMap = {
    small: { width: 60, height: 80 },
    medium: { width: 80, height: 100 },
    large: { width: 100, height: 120 },
  };

  const stateColors = {
    idle: 'var(--severity-whisper)',
    happy: 'var(--ectoplasm-green)',
    concerned: 'var(--severity-chill)',
    searching: 'var(--witchcraft-violet)',
    celebrating: 'var(--pumpkin-fire)',
  };

  useEffect(() => {
    if (atmosphere === 'off' || !isFloating) return;

    const interval = setInterval(() => {
      setPosition((prev) => ({
        x: Math.max(10, Math.min(90, prev.x + (Math.random() - 0.5) * 4)),
        y: Math.max(10, Math.min(90, prev.y + (Math.random() - 0.5) * 3)),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [atmosphere, isFloating]);

  useEffect(() => {
    if (atmosphere === 'off') return;

    const pulseInterval = setInterval(() => {
      setGlowIntensity((prev) => (prev === 0.6 ? 0.8 : 0.6));
    }, 1500);

    return () => clearInterval(pulseInterval);
  }, [atmosphere]);

  const messages = {
    idle: "I'm Wisp, your spectral guide. Which house shall we haunt?",
    happy: 'The spirits are calm... for now.',
    concerned: 'I sense disturbances in the veil.',
    searching: 'Searching for phantoms in the code...',
    celebrating: 'The haunt was successful!',
  };

  const currentMessage = message || messages[state];

  return (
    <div
      className="fixed pointer-events-none z-50"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        width: sizeMap[size].width,
        height: sizeMap[size].height,
        transform: 'translate(-50%, -50%)',
        transition: atmosphere !== 'off' ? 'left 2s ease-in-out, top 2s ease-in-out' : 'none',
      }}
      onMouseEnter={() => setIsFloating(false)}
      onMouseLeave={() => setIsFloating(true)}
    >
      {/* Wisp glow effect */}
      <div
        className="absolute inset-0 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${stateColors[state]}40 0%, transparent 70%)`,
          opacity: glowIntensity,
          animation: atmosphere !== 'off' ? 'pulse 2s ease-in-out infinite' : 'none',
        }}
      />

      {/* Wisp body */}
      <div className="relative w-full h-full">
        {/* Main ghost shape */}
        <div
          className="absolute w-full h-3/4 rounded-t-full"
          style={{
            background: stateColors[state],
            opacity: 0.9,
            filter: 'blur(0.5px)',
            bottom: 0,
          }}
        />

        {/* Ghost trail */}
        <div
          className="absolute w-3/4 h-1/4 rounded-b-full left-1/2 -translate-x-1/2"
          style={{
            background: `linear-gradient(to top, ${stateColors[state]}80, transparent)`,
            bottom: '-10%',
          }}
        />

        {/* Eyes */}
        <div className="absolute top-1/3 left-1/3 w-3 h-3 rounded-full bg-white" />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-white" />

        {/* Eye glows */}
        <div
          className="absolute top-1/3 left-1/3 w-1.5 h-1.5 rounded-full"
          style={{ background: stateColors[state] }}
        />
        <div
          className="absolute top-1/3 right-1/3 w-1.5 h-1.5 rounded-full"
          style={{ background: stateColors[state] }}
        />

        {/* Mouth */}
        <div
          className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-6 h-2 rounded-full"
          style={{
            background: stateColors[state],
            opacity: 0.7,
            transform: state === 'happy' ? 'translate(-50%, 0) scaleY(0.5)' : 'translate(-50%, 0)',
          }}
        />
      </div>

      {/* Speech bubble */}
      {showMessage && atmosphere !== 'off' && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 p-3 rounded-lg"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--border-secondary)',
            minWidth: '200px',
            maxWidth: '300px',
            boxShadow: 'var(--shadow-seance)',
            opacity: 0.95,
            animation: 'spirit-manifest var(--motion-apparition) ease-out',
          }}
        >
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {currentMessage}
          </div>
          <div
            className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8"
            style={{
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: 'var(--surface-card)',
            }}
          />
        </div>
      )}
    </div>
  );
};

export default HauntingWisp;
