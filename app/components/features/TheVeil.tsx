'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
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
  const [showOriginalColors, setShowOriginalColors] = useState<boolean>(true);
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

  // Keyboard navigation for slider handle
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
        return 'bg-[#F28B77] text-[#0a0711] border-[#9B2F1F] shadow-[0_0_10px_rgba(242,139,119,0.8)]';
      case 'warning':
        return 'bg-[#ff791f] text-[#0a0711] border-[#8A5A12] shadow-[0_0_10px_rgba(255,121,31,0.8)]';
      case 'info':
        return 'bg-[#B9AEE0] text-[#0a0711] border-[#5A4C85] shadow-[0_0_10px_rgba(185,174,224,0.8)]';
    }
  };

  return (
    <div
      className={`plate rounded-[2px] p-4 md:p-6 bg-[#1c1629] text-[#fff1dc] space-y-4 ${className}`}
    >
      {/* Veil Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#46334b]">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-sm tracking-wide text-[#ff791f]">
            The Veil
          </span>
          <span className="text-xs text-[#d9d3e0]">· Compare living plate vs apparition</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('slider')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              mode === 'slider'
                ? 'bg-[#ff791f] text-[#0a0711] font-semibold'
                : 'bg-[#0a0711]/60 text-[#d9d3e0] hover:text-[#fff1dc] border border-[#46334b]'
            }`}
          >
            <ArrowsRightLeftIcon className="w-3.5 h-3.5" />
            <span>Slider</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('ectoplasm')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              mode === 'ectoplasm'
                ? 'bg-[#9aff9a] text-[#0a0711] font-semibold'
                : 'bg-[#0a0711]/60 text-[#d9d3e0] hover:text-[#fff1dc] border border-[#46334b]'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5 text-[#9aff9a]" />
            <span>Ectoplasm (Diff)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              mode === 'side-by-side'
                ? 'bg-[#ff791f] text-[#0a0711] font-semibold'
                : 'bg-[#0a0711]/60 text-[#d9d3e0] hover:text-[#fff1dc] border border-[#46334b]'
            }`}
          >
            <ViewColumnsIcon className="w-3.5 h-3.5" />
            <span>Side by Side</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('onion-skin')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              mode === 'onion-skin'
                ? 'bg-[#ff791f] text-[#0a0711] font-semibold'
                : 'bg-[#0a0711]/60 text-[#d9d3e0] hover:text-[#fff1dc] border border-[#46334b]'
            }`}
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span>Onion Skin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOriginalColors((prev) => !prev)}
            className={`ml-1 px-2 py-1 rounded-[6px] text-[11px] border border-[#46334b] text-[#d9d3e0] hover:text-[#fff1dc] transition-colors cursor-pointer ${
              !showOriginalColors ? 'bg-[#b9acbf]/30 text-[#fff1dc]' : ''
            }`}
            title="Toggle photographic spectral treatment"
          >
            {showOriginalColors ? 'Ghostly tint' : 'True colors'}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {mode === 'side-by-side' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-[#46334b] rounded-[2px] bg-[#0a0711] p-2 space-y-2">
            <span className="text-xs font-semibold text-[#9aff9a] block">{livingLabel}</span>
            <div className="relative aspect-[16/10] bg-[#0a0711] flex items-center justify-center overflow-hidden rounded-[2px]">
              {livingSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={livingSrc}
                  alt={livingLabel}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <SpiritPhotographyPlate
                  type="living"
                  title="The Grand Parlour Gazette"
                  subtitle="All images, fonts & network reachable"
                />
              )}
            </div>
          </div>

          <div className="border border-[#46334b] rounded-[2px] bg-[#0a0711] p-2 space-y-2">
            <span className="text-xs font-semibold text-[#F28B77] block">{apparitionLabel}</span>
            <div className="relative aspect-[16/10] bg-[#0a0711] flex items-center justify-center overflow-hidden rounded-[2px]">
              {apparitionSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={apparitionSrc}
                  alt={apparitionLabel}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <SpiritPhotographyPlate
                  type="apparition"
                  title="The Restless Apparition"
                  subtitle="Images blocked • 3 touch targets < 24px"
                />
              )}
            </div>
          </div>
        </div>
      ) : mode === 'ectoplasm' ? (
        <div className="relative border border-[#46334b] rounded-[2px] bg-[#0a0711] p-2">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-[#9aff9a] font-semibold">
              Ectoplasm Pixel Diff (Changed Regions Highlighted)
            </span>
            <span className="text-[#d9d3e0]">Spectral Mint = Altered pixels</span>
          </div>

          <div className="relative aspect-[16/10] bg-[#0a0711] overflow-hidden rounded-[2px] flex items-center justify-center">
            {diffSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={diffSrc}
                alt="Ectoplasm visual difference"
                className="w-full h-full object-contain"
              />
            ) : (
              <FictionalEctoplasmPlate />
            )}
          </div>
        </div>
      ) : mode === 'onion-skin' ? (
        <div className="space-y-3">
          <div className="relative border border-[#46334b] rounded-[2px] bg-[#0a0711] aspect-[16/10] overflow-hidden">
            {/* Living Underneath */}
            <div className="absolute inset-0 flex items-center justify-center">
              {livingSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={livingSrc}
                  alt={livingLabel}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <SpiritPhotographyPlate
                  type="living"
                  title="The Grand Parlour Gazette"
                  subtitle="Baseline living page"
                />
              )}
            </div>

            {/* Apparition with variable opacity */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-opacity"
              style={{ opacity: position / 100 }}
            >
              {apparitionSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={apparitionSrc}
                  alt={apparitionLabel}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <SpiritPhotographyPlate
                  type="apparition"
                  title="The Restless Apparition"
                  subtitle="Simulated failure apparition"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <span className="text-xs text-[#d9d3e0]">Living (0%)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="flex-1 accent-[#ff791f] cursor-pointer"
            />
            <span className="text-xs text-[#F28B77]">Apparition (100%)</span>
          </div>
        </div>
      ) : (
        /* Slider Mode (Default Signature Interaction) */
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative aspect-[16/10] bg-[#0a0711] rounded-[2px] border border-[#46334b] overflow-hidden select-none cursor-ew-resize group"
        >
          {/* Layer 1: Living Page (Left side baseline) */}
          <div className="absolute inset-0 w-full h-full flex items-center justify-center">
            {livingSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={livingSrc}
                alt={livingLabel}
                className="w-full h-full object-contain pointer-events-none"
              />
            ) : (
              <SpiritPhotographyPlate type="living" />
            )}
          </div>

          {/* Layer 2: Apparition (Clipped over living page) */}
          <div
            className={`absolute inset-0 w-full h-full flex items-center justify-center pointer-events-none transition-filter ${
              showOriginalColors ? 'filter contrast-[1.03] saturate-[0.92]' : ''
            }`}
            style={{
              clipPath: `inset(0 0 0 ${position}%)`,
            }}
          >
            {apparitionSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={apparitionSrc}
                alt={apparitionLabel}
                className="w-full h-full object-contain"
              />
            ) : (
              <SpiritPhotographyPlate type="apparition" />
            )}

            {/* Omen Pins on Apparition */}
            {pins.map((pin) => (
              <div
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePin(pin.id);
                  onPinClick?.(pin.id);
                }}
                style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer p-1 rounded-full border ${getPinColor(
                  pin.severity
                )} transition-transform hover:scale-125`}
                title={`${pin.title} (${pin.severity})`}
              >
                <MapPinIcon className="w-3.5 h-3.5" />
              </div>
            ))}
          </div>

          {/* Curtain Rod Handle */}
          <div
            style={{ left: `${position}%` }}
            className="absolute top-0 bottom-0 w-[2px] bg-[#ff791f] pointer-events-none z-30 shadow-[0_0_8px_rgba(255,121,31,0.6)]"
          >
            {/* Ornamental Pull-Tab Handle */}
            <div
              tabIndex={0}
              role="slider"
              aria-label="The Veil comparison position"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={position}
              aria-valuetext={`${position}% living page, ${100 - position}% apparition`}
              onKeyDown={handleKeyDown}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] bg-[#0a0711] border-2 border-[#ff791f] flex items-center justify-center text-[#ff791f] shadow-[0_0_12px_rgba(255,121,31,0.5)] focus:outline-none focus:ring-2 focus:ring-[#fff1dc] cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Living / Apparition Floating Badges */}
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-[2px] bg-[#0a0711]/80 border border-[#46334b] text-[11px] font-semibold text-[#9aff9a] pointer-events-none backdrop-blur-sm z-10">
            {livingLabel} ({position}%)
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-[2px] bg-[#0a0711]/80 border border-[#46334b] text-[11px] font-semibold text-[#F28B77] pointer-events-none backdrop-blur-sm z-10">
            {apparitionLabel} ({100 - position}%)
          </div>
        </div>
      )}

      {/* Guidance Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#d9d3e0] pt-1">
        <span>
          Use pointer drag or <kbd className="px-1 py-0.5 rounded bg-[#0a0711] font-mono">←</kbd>{' '}
          <kbd className="px-1 py-0.5 rounded bg-[#0a0711] font-mono">→</kbd> arrow keys to part the
          curtain
        </span>
        {activePin && (
          <span className="text-[#ff791f] font-medium">Selected omen pin: #{activePin}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Atmospheric Victorian Spirit Photography Plate for The Veil
 */
function SpiritPhotographyPlate({
  type,
  title,
  subtitle,
}: {
  type: 'living' | 'apparition';
  title?: string;
  subtitle?: string;
}) {
  const isLiving = type === 'living';

  return (
    <div
      className={`relative w-full h-full p-6 flex flex-col justify-between font-serif select-none overflow-hidden ${
        isLiving
          ? 'bg-gradient-to-br from-[#1c1629] via-[#0a0711] to-[#08131E] text-[#fff1dc]'
          : 'bg-gradient-to-br from-[#1C1628] via-[#151D2A] to-[#0A0D14] text-[#fff1dc]'
      }`}
    >
      {/* Victorian Daguerreotype Ornamental Border */}
      <div className="absolute inset-2 border border-[#46334b]/60 rounded-[2px] pointer-events-none" />
      <div className="absolute inset-3 border border-[#ff791f]/20 rounded-[2px] pointer-events-none" />

      {/* Plate Header */}
      <div className="flex items-center justify-between border-b border-[#46334b]/80 pb-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[10px] ${
              isLiving
                ? 'bg-[#9aff9a] text-[#0a0711] shadow-[0_0_8px_rgba(154,255,154,0.6)]'
                : 'bg-[#F28B77] text-[#0a0711] animate-pulse shadow-[0_0_8px_rgba(242,139,119,0.8)]'
            }`}
          >
            {isLiving ? '✦' : '✕'}
          </div>
          <div>
            <span className="font-display font-bold text-sm tracking-wide text-[#fff1dc]">
              {title || (isLiving ? 'The Grand Parlour Gazette' : 'The Restless Apparition')}
            </span>
            <span className="block text-[10px] text-[#d9d3e0] tracking-wider uppercase font-mono">
              {subtitle ||
                (isLiving
                  ? 'Plate No. 01 • Living Page (Baseline)'
                  : 'Plate No. 01-B • Images Aborted & Mobile Narrow')}
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] px-2.5 py-1 rounded-[2px] font-mono tracking-wider uppercase border ${
            isLiving
              ? 'bg-[#46334b]/40 border-[#9aff9a]/40 text-[#9aff9a]'
              : 'bg-[#F28B77]/20 border-[#F28B77]/40 text-[#F28B77]'
          }`}
        >
          {isLiving ? '200 OK • Living State' : 'Breached • 3 Omens Caught'}
        </span>
      </div>

      {/* Plate Body: Living vs Broken Apparition */}
      <div className="space-y-4 my-auto relative z-10">
        <div className="flex items-center gap-4">
          {/* Living Cameo Photo vs Broken Silhouette */}
          {isLiving ? (
            <div className="w-20 h-20 rounded-[4px] bg-[#1c1629] border border-[#ff791f]/60 p-1 flex items-center justify-center shadow-[0_0_12px_rgba(255,121,31,0.2)]">
              <div className="w-full h-full rounded-[2px] bg-[#0a0711] flex flex-col items-center justify-center text-center p-1">
                <span className="text-xl">🏛️</span>
                <span className="text-[9px] font-mono text-[#ff791f] mt-0.5">EST. 1888</span>
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-[4px] border-2 border-dashed border-[#F28B77] flex flex-col items-center justify-center text-center p-1 bg-[#F28B77]/10">
              <span className="text-xl opacity-70 animate-bounce">👻</span>
              <span className="text-[9px] font-mono text-[#F28B77] leading-tight">
                Image Aborted (No Alt)
              </span>
            </div>
          )}

          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={`h-4.5 rounded ${isLiving ? 'w-3/4 bg-[#fff1dc]/80' : 'w-full bg-[#F28B77]/40 ring-1 ring-[#F28B77]'}`}
              />
              {!isLiving && (
                <span className="text-[10px] font-mono text-[#F28B77] whitespace-nowrap">
                  +42px overflow
                </span>
              )}
            </div>
            <div
              className={`h-3 rounded ${isLiving ? 'w-1/2 bg-[#b9acbf]/50' : 'w-2/3 bg-[#b9acbf]/30'}`}
            />
            <div
              className={`h-2.5 rounded ${isLiving ? 'w-2/3 bg-[#b9acbf]/30' : 'w-1/3 bg-[#b9acbf]/20'}`}
            />
          </div>
        </div>

        {/* Interactive Controls Simulation */}
        <div
          className={`p-3 rounded-[4px] border flex items-center justify-between ${
            isLiving ? 'bg-[#0a0711]/70 border-[#46334b]' : 'bg-[#1C1628]/80 border-[#F28B77]/40'
          }`}
        >
          <div>
            <span className="text-xs font-serif text-[#fff1dc] block">
              {isLiving
                ? 'Touch Target: 48x48px (WCAG Compliant)'
                : 'Touch Target: 22x22px (Too Small for Touch)'}
            </span>
            <span className="text-[10px] text-[#d9d3e0]">
              {isLiving
                ? 'Comfortable spacing for touch and mouse interaction'
                : 'Violates WCAG 2.5.8 Target Size minimum'}
            </span>
          </div>

          <button
            type="button"
            className={`px-3 py-1.5 rounded-[4px] text-xs font-semibold tracking-wide transition-all ${
              isLiving
                ? 'bg-[#ff791f] text-[#0a0711] shadow-[0_0_10px_rgba(255,121,31,0.3)]'
                : 'bg-[#F28B77]/20 border border-[#F28B77] text-[#F28B77] text-[10px] p-0.5'
            }`}
          >
            {isLiving ? 'Enter Parlour (48px)' : '22px'}
          </button>
        </div>
      </div>

      {/* Plate Footer */}
      <div className="flex items-center justify-between text-[10px] text-[#d9d3e0] pt-2 border-t border-[#46334b]/80 relative z-10 font-mono">
        <span>Emulation: 390px Mobile Viewport</span>
        <span>{isLiving ? '✓ Zero Layout Shift (CLS 0.0)' : '⚠ Cumulative Shift: +0.28'}</span>
      </div>
    </div>
  );
}

/**
 * Atmospheric Ectoplasm Diff plate
 */
function FictionalEctoplasmPlate() {
  return (
    <div className="w-full h-full p-6 flex flex-col justify-between bg-[#0a0711] text-[#fff1dc]">
      <div className="flex items-center justify-between pb-3 border-b border-[#46334b]">
        <span className="font-display text-sm font-semibold text-[#9aff9a]">
          Spectral Pixel Difference Overlay (Ectoplasm)
        </span>
        <span className="text-[10px] font-mono text-[#9aff9a] bg-[#9aff9a]/10 px-2 py-0.5 rounded">
          4.8% Pixels Fractured
        </span>
      </div>

      <div className="my-auto p-6 border border-[#9aff9a]/40 rounded-[2px] bg-[#9aff9a]/5 text-center space-y-2">
        <SparklesIcon className="w-8 h-8 text-[#9aff9a] mx-auto animate-pulse" />
        <p className="text-xs text-[#9aff9a] font-medium">
          Ectoplasm highlights shifted bounding boxes & missing image regions
        </p>
        <p className="text-[11px] text-[#d9d3e0]">
          Hero image collapsed from 64px to 0px, causing layout shift in subsequent child nodes.
        </p>
      </div>

      <div className="text-[10px] text-[#d9d3e0] pt-2 border-t border-[#46334b] flex justify-between">
        <span>pixelmatch algorithm (deterministic)</span>
        <span className="text-[#9aff9a]">Diff mask active</span>
      </div>
    </div>
  );
}
