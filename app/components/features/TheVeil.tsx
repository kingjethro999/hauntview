'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import {
  ArrowsRightLeftIcon,
  SparklesIcon,
  ViewColumnsIcon,
  EyeIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

export interface OmenPin {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'serious';
  xPercent: number;
  yPercent: number;
}

export interface TheVeilProps {
  livingSrc?: string;
  apparitionSrc?: string;
  livingLabel?: string;
  apparitionLabel?: string;
  diffSrc?: string;
  pins?: OmenPin[];
  initialPosition?: number;
  className?: string;
  onPinClick?: (pinId: string) => void;
}

export type VeilMode = 'slider' | 'ectoplasm' | 'side-by-side' | 'onion-skin';

export const TheVeil: React.FC<TheVeilProps> = ({
  livingSrc,
  apparitionSrc,
  livingLabel = 'Living Page (Baseline)',
  apparitionLabel = 'Apparition (Under Condition)',
  diffSrc,
  pins = [],
  initialPosition = 50,
  className = '',
  onPinClick,
}) => {
  const [position, setPosition] = useState<number>(initialPosition);
  const [mode, setMode] = useState<VeilMode>('slider');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [activePin, setActivePin] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePositionFromPointer = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const clamped = Math.max(0, Math.min(rect.width, x));
    const percent = Math.round((clamped / rect.width) * 100);
    setPosition(percent);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    updatePositionFromPointer(e.clientX);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    updatePositionFromPointer(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 10 : 1;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setPosition((prev) => Math.max(0, prev - step));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setPosition((prev) => Math.min(100, prev + step));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setPosition(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setPosition(100);
    }
  };

  useEffect(() => {
    const handleGlobalPointerUp = () => setIsDragging(false);
    window.addEventListener('pointerup', handleGlobalPointerUp);
    return () => window.removeEventListener('pointerup', handleGlobalPointerUp);
  }, []);

  const getPinColor = (sev: OmenPin['severity']) => {
    switch (sev) {
      case 'serious':
        return 'bg-[var(--severity-scream)] text-white border-[#991b1b] shadow-[0_0_12px_rgba(220,38,38,0.6)]';
      case 'warning':
        return 'bg-[var(--candle-primary)] text-[#1a0c06] border-[#8a330d] shadow-[0_0_12px_rgba(255,121,31,0.6)]';
      case 'info':
        return 'bg-[#3b82f6] text-white border-[#1d4ed8] shadow-[0_0_12px_rgba(59,130,246,0.6)]';
    }
  };

  return (
    <div
      className={`victorian-panel p-6 ${className}`}
      style={{ background: 'rgba(10, 7, 17, 0.8)' }}
    >
      {/* Mode toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4"
        style={{ borderBottom: '1px solid rgba(255, 121, 31, 0.1)' }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm" style={{ color: 'var(--ghost-white)' }}>
            Comparison Mode
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('slider')}
            className={`min-h-[48px] px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mode === 'slider'
                ? 'bg-[var(--candle-primary)] text-[#1a0c06]'
                : 'text-[var(--phantom-gray)] hover:text-[var(--ghost-white)] hover:bg-[rgba(255,121,31,0.08)]'
            }`}
          >
            <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
            <span>Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ectoplasm')}
            className={`min-h-[48px] px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mode === 'ectoplasm'
                ? 'bg-[var(--ectoplasm-green)] text-[var(--midnight-veil)]'
                : 'text-[var(--phantom-gray)] hover:text-[var(--ghost-white)] hover:bg-[rgba(154,255,154,0.08)]'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>Ectoplasm</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={`min-h-[48px] px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mode === 'side-by-side'
                ? 'bg-[var(--candle-primary)] text-[#1a0c06]'
                : 'text-[var(--phantom-gray)] hover:text-[var(--ghost-white)] hover:bg-[rgba(255,121,31,0.08)]'
            }`}
          >
            <ViewColumnsIcon className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('onion-skin')}
            className={`min-h-[48px] px-3.5 py-2 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
              mode === 'onion-skin'
                ? 'bg-[var(--candle-primary)] text-[#1a0c06]'
                : 'text-[var(--phantom-gray)] hover:text-[var(--ghost-white)] hover:bg-[rgba(255,121,31,0.08)]'
            }`}
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span>Onion Skin</span>
          </button>
        </div>
      </div>

      {/* Main view area */}
      {mode === 'side-by-side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="border rounded-lg p-3 space-y-2"
            style={{ borderColor: 'rgba(255, 121, 31, 0.15)', background: 'rgba(10, 7, 17, 0.5)' }}
          >
            <span
              className="text-xs font-semibold block"
              style={{ color: 'var(--ectoplasm-green)' }}
            >
              {livingLabel}
            </span>
            <div
              className="relative aspect-[16/10] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(28, 21, 35, 0.5)' }}
            >
              {livingSrc ? (
                <Image
                  src={livingSrc}
                  alt={livingLabel || 'Living page'}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <SpiritPlate type="living" />
              )}
            </div>
          </div>

          <div
            className="border rounded-lg p-3 space-y-2"
            style={{ borderColor: 'rgba(255, 121, 31, 0.15)', background: 'rgba(10, 7, 17, 0.5)' }}
          >
            <span
              className="text-xs font-semibold block"
              style={{ color: 'var(--severity-scream)' }}
            >
              {apparitionLabel}
            </span>
            <div
              className="relative aspect-[16/10] rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: 'rgba(28, 21, 35, 0.5)' }}
            >
              {apparitionSrc ? (
                <Image
                  src={apparitionSrc}
                  alt={apparitionLabel || 'Apparition plate'}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <SpiritPlate type="apparition" />
              )}
            </div>
          </div>
        </div>
      ) : mode === 'ectoplasm' ? (
        <div
          className="border rounded-lg p-3"
          style={{ borderColor: 'rgba(255, 121, 31, 0.15)', background: 'rgba(10, 7, 17, 0.5)' }}
        >
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="font-semibold" style={{ color: 'var(--ectoplasm-green)' }}>
              Ectoplasm Pixel Diff
            </span>
            <span style={{ color: 'var(--phantom-gray)' }}>Green highlights = Altered pixels</span>
          </div>
          <div
            className="relative aspect-[16/10] rounded-lg overflow-hidden flex items-center justify-center"
            style={{ background: 'rgba(28, 21, 35, 0.5)' }}
          >
            {diffSrc ? (
              <Image
                src={diffSrc}
                alt="Ectoplasm diff"
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <EctoplasmPlate />
            )}
          </div>
        </div>
      ) : mode === 'onion-skin' ? (
        <div className="space-y-3">
          <div
            className="relative border rounded-lg aspect-[16/10] overflow-hidden"
            style={{ borderColor: 'rgba(255, 121, 31, 0.15)', background: 'rgba(10, 7, 17, 0.5)' }}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {livingSrc ? (
                <Image
                  src={livingSrc}
                  alt={livingLabel || 'Living page'}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <SpiritPlate type="living" />
              )}
            </div>
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity"
              style={{ opacity: position / 100 }}
            >
              {apparitionSrc ? (
                <Image
                  src={apparitionSrc}
                  alt={apparitionLabel || 'Apparition plate'}
                  fill
                  unoptimized
                  className="object-contain"
                />
              ) : (
                <SpiritPlate type="apparition" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 px-2">
            <span className="text-xs" style={{ color: 'var(--phantom-gray)' }}>
              Living (0%)
            </span>
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="flex-1 accent-[var(--candle-primary)]"
            />
            <span className="text-xs" style={{ color: 'var(--severity-scream)' }}>
              Apparition (100%)
            </span>
          </div>
        </div>
      ) : (
        /* Slider mode - signature interaction */
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative aspect-[16/10] rounded-lg overflow-hidden select-none cursor-ew-resize group"
          style={{
            background: 'rgba(10, 7, 17, 0.5)',
            border: '1px solid rgba(255, 121, 31, 0.15)',
          }}
        >
          {/* Living page (left) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            {livingSrc ? (
              <Image
                src={livingSrc}
                alt={livingLabel || 'Living page'}
                fill
                unoptimized
                className="object-contain pointer-events-none"
              />
            ) : (
              <SpiritPlate type="living" />
            )}
          </div>

          {/* Apparition (clipped over) */}
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            {apparitionSrc ? (
              <Image
                src={apparitionSrc}
                alt={apparitionLabel || 'Apparition plate'}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <SpiritPlate type="apparition" />
            )}

            {/* Omen pins */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(pin.id);
                  onPinClick?.(pin.id);
                }}
                style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer p-1.5 rounded-full border transition-transform hover:scale-110 ${getPinColor(pin.severity)}`}
                title={`${pin.title} (${pin.severity})`}
              >
                <MapPinIcon className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>

          {/* Curtain handle */}
          <div
            style={{ left: `${position}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-[var(--candle-primary)] pointer-events-none z-30 shadow-[0_0_8px_rgba(255,121,31,0.6)]"
          >
            <div
              tabIndex={0}
              role="slider"
              aria-label="The Veil comparison position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={position}
              aria-valuetext={`${position}% living page, ${100 - position}% apparition`}
              onKeyDown={handleKeyDown}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-[var(--midnight-veil)] border-2 border-[var(--candle-primary)] flex items-center justify-center shadow-[0_0_12px_rgba(255,121,31,0.4)] focus:outline-none cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" style={{ color: 'var(--candle-primary)' }} />
            </div>
          </div>

          {/* Labels */}
          <div
            className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm z-10"
            style={{
              background: 'rgba(10, 7, 17, 0.8)',
              color: 'var(--ectoplasm-green)',
              border: '1px solid rgba(154, 255, 154, 0.2)',
            }}
          >
            {livingLabel} ({position}%)
          </div>
          <div
            className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm z-10"
            style={{
              background: 'rgba(10, 7, 17, 0.8)',
              color: 'var(--severity-scream)',
              border: '1px solid rgba(220, 38, 38, 0.2)',
            }}
          >
            {apparitionLabel} ({100 - position}%)
          </div>
        </div>
      )}

      {/* Footer guidance */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2"
        style={{ color: 'var(--phantom-gray)' }}
      >
        <span>
          Drag or use{' '}
          <kbd
            className="px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(28, 21, 35, 0.5)',
              border: '1px solid rgba(255, 121, 31, 0.15)',
            }}
          >
            ←
          </kbd>{' '}
          <kbd
            className="px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(28, 21, 35, 0.5)',
              border: '1px solid rgba(255, 121, 31, 0.15)',
            }}
          >
            →
          </kbd>{' '}
          arrows
        </span>
        {activePin && (
          <span style={{ color: 'var(--candle-primary)', fontWeight: 500 }}>
            Selected: #{activePin}
          </span>
        )}
      </div>
    </div>
  );
};

/* Victorian spirit photography plate placeholder */
function SpiritPlate({ type }: { type: 'living' | 'apparition' }) {
  const isLiving = type === 'living';

  return (
    <div className="w-full h-full p-8 flex flex-col justify-center items-center text-center">
      <div
        className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
        style={{
          background: isLiving ? 'rgba(154, 255, 154, 0.1)' : 'rgba(220, 38, 38, 0.1)',
          border: `1px solid ${isLiving ? 'rgba(154, 255, 154, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
        }}
      >
        {isLiving ? <span className="text-2xl">✓</span> : <span className="text-2xl">!</span>}
      </div>
      <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--ghost-white)' }}>
        {isLiving ? 'Living Page' : 'Apparition'}
      </h4>
      <p className="text-xs" style={{ color: 'var(--phantom-gray)' }}>
        {isLiving ? 'Baseline capture' : 'Under failure condition'}
      </p>
    </div>
  );
}

/* Ectoplasm diff placeholder */
function EctoplasmPlate() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center text-center p-8">
      <div
        className="w-16 h-16 rounded-full mb-4 flex items-center justify-center"
        style={{
          background: 'rgba(154, 255, 154, 0.1)',
          border: '1px solid rgba(154, 255, 154, 0.3)',
        }}
      >
        <SparklesIcon className="w-8 h-8" style={{ color: 'var(--ectoplasm-green)' }} />
      </div>
      <h4 className="font-semibold text-sm mb-1" style={{ color: 'var(--ghost-white)' }}>
        Ectoplasm Diff
      </h4>
      <p className="text-xs" style={{ color: 'var(--phantom-gray)' }}>
        Pixel difference visualization
      </p>
    </div>
  );
}
