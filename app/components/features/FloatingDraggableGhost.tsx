'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import Image from 'next/image';

interface Position {
  x: number;
  y: number;
}

const GHOST_QUIPS = [
  'Boo! 👻',
  'Wheee! ✨',
  'Browsing the scrolls? 📜',
  'Watch your step! 🕯️',
  'Lost in the crypt? ⚰️',
  'Need a guide? 🔮',
  'I haunt these pages! 🎃',
  'Floating by... 💨',
  'Beware the phantoms! 🦇',
];

const emptySubscribe = () => () => {};

function subscribeMotion(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getMotionSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getMotionServerSnapshot(): boolean {
  return false;
}

export const FloatingDraggableGhost: React.FC = () => {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const prefersReducedMotion = useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getMotionServerSnapshot
  );

  const [pos, setPos] = useState<Position>(() => {
    if (typeof window === 'undefined') return { x: 40, y: 120 };
    return {
      x: Math.max(20, window.innerWidth - 130),
      y: 130,
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [quip, setQuip] = useState<string | null>(null);

  const dragStartRef = useRef<{
    clientX: number;
    clientY: number;
    posX: number;
    posY: number;
  } | null>(null);
  const hasMovedDuringDragRef = useRef(false);
  const isDraggingRef = useRef(false);
  const quipTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const driftTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const driftRef = useRef<() => void>(() => {});

  const showQuip = useCallback((text?: string) => {
    if (quipTimeoutRef.current) clearTimeout(quipTimeoutRef.current);
    const chosenQuip = text || GHOST_QUIPS[Math.floor(Math.random() * GHOST_QUIPS.length)];
    setQuip(chosenQuip);
    quipTimeoutRef.current = setTimeout(() => {
      setQuip(null);
    }, 2800);
  }, []);

  const resumeDrift = useCallback((delayMs: number = 2000) => {
    if (driftTimeoutRef.current) clearTimeout(driftTimeoutRef.current);
    driftTimeoutRef.current = setTimeout(() => {
      driftRef.current();
    }, delayMs);
  }, []);

  // Update drift implementation safely in effect
  useEffect(() => {
    driftRef.current = () => {
      if (typeof window === 'undefined' || isDraggingRef.current) return;

      const ghostWidth = 80;
      const ghostHeight = 85;
      const paddingX = 24;
      const paddingTop = 90; // Avoid navbar overlap
      const paddingBottom = 40;

      const maxX = Math.max(paddingX, window.innerWidth - ghostWidth - paddingX);
      const maxY = Math.max(paddingTop, window.innerHeight - ghostHeight - paddingBottom);

      const targetX = Math.floor(paddingX + Math.random() * (maxX - paddingX));
      const targetY = Math.floor(paddingTop + Math.random() * (maxY - paddingTop));

      setPos((prev) => {
        setDirection(targetX < prev.x ? 'left' : 'right');
        return { x: targetX, y: targetY };
      });

      const nextInterval = 5000 + Math.random() * 4000;
      driftTimeoutRef.current = setTimeout(() => {
        driftRef.current();
      }, nextInterval);
    };
  });

  // Start autonomous drift on client mount and handle window resizing
  useEffect(() => {
    if (!isClient) return;

    if (!prefersReducedMotion) {
      resumeDrift(1200);
    }

    const handleResize = () => {
      setPos((prev) => {
        const maxX = Math.max(20, window.innerWidth - 90);
        const maxY = Math.max(80, window.innerHeight - 90);
        return {
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY),
        };
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (driftTimeoutRef.current) clearTimeout(driftTimeoutRef.current);
      if (quipTimeoutRef.current) clearTimeout(quipTimeoutRef.current);
    };
  }, [isClient, prefersReducedMotion, resumeDrift]);

  // Pointer drag handlers (supports mouse, touch, and pen)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);

    if (driftTimeoutRef.current) clearTimeout(driftTimeoutRef.current);

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      posX: pos.x,
      posY: pos.y,
    };
    hasMovedDuringDragRef.current = false;
    isDraggingRef.current = true;
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !dragStartRef.current) return;

    const dx = e.clientX - dragStartRef.current.clientX;
    const dy = e.clientY - dragStartRef.current.clientY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedDuringDragRef.current = true;
    }

    const ghostWidth = 80;
    const ghostHeight = 85;
    const maxX = Math.max(10, window.innerWidth - ghostWidth - 10);
    const maxY = Math.max(70, window.innerHeight - ghostHeight - 10);

    const nextX = Math.min(maxX, Math.max(10, dragStartRef.current.posX + dx));
    const nextY = Math.min(maxY, Math.max(70, dragStartRef.current.posY + dy));

    if (dx < -2) setDirection('left');
    else if (dx > 2) setDirection('right');

    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if already released
    }

    isDraggingRef.current = false;
    setIsDragging(false);
    dragStartRef.current = null;

    if (!hasMovedDuringDragRef.current) {
      // User tapped or clicked without dragging
      showQuip();
    } else {
      // Dropped after dragging
      showQuip('Thanks for the lift! 👻');
    }

    // Resume floating drift after 2 seconds
    if (!prefersReducedMotion) {
      resumeDrift(2000);
    }
  };

  if (!isClient) return null;

  return (
    <div
      role="img"
      aria-label="Interactive floating ghost companion. Drag me anywhere!"
      title="Wisp the Ghost (Drag me around or click for a boo!)"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showQuip();
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`fixed z-50 select-none touch-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff791f] rounded-full transition-transform ${
        isDragging ? 'cursor-grabbing scale-110' : 'cursor-grab hover:scale-105'
      }`}
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
        transition: isDragging
          ? 'transform 0.04s linear, filter 0.2s ease'
          : 'transform 5s cubic-bezier(0.25, 1, 0.5, 1), filter 0.3s ease',
        willChange: 'transform',
      }}
    >
      {/* Playful Ghost Speech Bubble */}
      {quip && (
        <div
          className="absolute -top-11 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#1a1126]/95 border border-[#ff791f]/80 rounded-md text-[#fff1dc] text-xs font-serif shadow-[0_4px_20px_rgba(255,121,31,0.35)] whitespace-nowrap animate-bounce pointer-events-none"
          style={{ backdropFilter: 'blur(6px)' }}
        >
          {quip}
          <div className="absolute left-1/2 -bottom-1 -translate-x-1/2 w-2 h-2 bg-[#1a1126] border-r border-b border-[#ff791f]/80 rotate-45" />
        </div>
      )}

      {/* Ghost Sprite */}
      <div
        className={`relative transition-transform duration-300 ${
          direction === 'left' ? '-scale-x-100' : 'scale-x-100'
        }`}
      >
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_8px_20px_rgba(255,121,31,0.35)] ${
            isDragging ? 'drop-shadow-[0_12px_28px_rgba(255,121,31,0.65)]' : 'animate-float'
          }`}
        >
          <Image
            src="/ghost.png"
            alt="Floating ghost companion"
            width={88}
            height={93}
            priority
            draggable={false}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
      </div>
    </div>
  );
};
