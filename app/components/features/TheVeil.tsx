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
        return 'bg-[#F28B77] text-[#0E2233] border-[#9B2F1F] shadow-[0_0_10px_rgba(242,139,119,0.8)]';
      case 'warning':
        return 'bg-[#F4B860] text-[#0E2233] border-[#8A5A12] shadow-[0_0_10px_rgba(244,184,96,0.8)]';
      case 'info':
        return 'bg-[#B9AEE0] text-[#0E2233] border-[#5A4C85] shadow-[0_0_10px_rgba(185,174,224,0.8)]';
    }
  };

  return (
    <div
      className={`plate rounded-[2px] p-4 md:p-6 bg-[#153049] text-[#ECE6D3] space-y-4 ${className}`}
    >
      {/* Veil Mode Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#2C4B68]">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-sm tracking-wide text-[#F4B860]">
            The Veil
          </span>
          <span className="text-xs text-[#B4BFC8]">· Compare living plate vs apparition</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setMode('slider')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              mode === 'slider'
                ? 'bg-[#F4B860] text-[#0E2233] font-semibold'
                : 'bg-[#0E2233]/60 text-[#B4BFC8] hover:text-[#ECE6D3] border border-[#2C4B68]'
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
                ? 'bg-[#A6F0D6] text-[#0E2233] font-semibold'
                : 'bg-[#0E2233]/60 text-[#B4BFC8] hover:text-[#ECE6D3] border border-[#2C4B68]'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5 text-[#A6F0D6]" />
            <span>Ectoplasm (Diff)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('side-by-side')}
            className={`px-2.5 py-1 rounded-[6px] text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 ${
              mode === 'side-by-side'
                ? 'bg-[#F4B860] text-[#0E2233] font-semibold'
                : 'bg-[#0E2233]/60 text-[#B4BFC8] hover:text-[#ECE6D3] border border-[#2C4B68]'
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
                ? 'bg-[#F4B860] text-[#0E2233] font-semibold'
                : 'bg-[#0E2233]/60 text-[#B4BFC8] hover:text-[#ECE6D3] border border-[#2C4B68]'
            }`}
          >
            <EyeIcon className="w-3.5 h-3.5" />
            <span>Onion Skin</span>
          </button>

          <button
            type="button"
            onClick={() => setShowOriginalColors((prev) => !prev)}
            className={`ml-1 px-2 py-1 rounded-[6px] text-[11px] border border-[#2C4B68] text-[#B4BFC8] hover:text-[#ECE6D3] transition-colors cursor-pointer ${
              !showOriginalColors ? 'bg-[#5B7C99]/30 text-[#ECE6D3]' : ''
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
          <div className="border border-[#2C4B68] rounded-[2px] bg-[#0E2233] p-2 space-y-2">
            <span className="text-xs font-semibold text-[#A6F0D6] block">{livingLabel}</span>
            <div className="relative aspect-[16/10] bg-[#0E2233] flex items-center justify-center overflow-hidden rounded-[2px]">
              {livingSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={livingSrc}
                  alt={livingLabel}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <FictionalPlate
                  type="living"
                  title="Prompt Dock Mini"
                  tagline="All images, fonts & network reachable"
                />
              )}
            </div>
          </div>

          <div className="border border-[#2C4B68] rounded-[2px] bg-[#0E2233] p-2 space-y-2">
            <span className="text-xs font-semibold text-[#F28B77] block">{apparitionLabel}</span>
            <div className="relative aspect-[16/10] bg-[#0E2233] flex items-center justify-center overflow-hidden rounded-[2px]">
              {apparitionSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={apparitionSrc}
                  alt={apparitionLabel}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <FictionalPlate
                  type="apparition"
                  title="Prompt Dock Mini (Broken)"
                  tagline="Images blocked • 3 touch targets &lt; 24px"
                />
              )}
            </div>
          </div>
        </div>
      ) : mode === 'ectoplasm' ? (
        <div className="relative border border-[#2C4B68] rounded-[2px] bg-[#0E2233] p-2">
          <div className="flex items-center justify-between mb-2 text-xs">
            <span className="text-[#A6F0D6] font-semibold">
              Ectoplasm Pixel Diff (Changed Regions Highlighted)
            </span>
            <span className="text-[#B4BFC8]">Spectral Mint = Altered pixels</span>
          </div>

          <div className="relative aspect-[16/10] bg-[#0E2233] overflow-hidden rounded-[2px] flex items-center justify-center">
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
          <div className="relative border border-[#2C4B68] rounded-[2px] bg-[#0E2233] aspect-[16/10] overflow-hidden">
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
                <FictionalPlate
                  type="living"
                  title="Prompt Dock Mini"
                  tagline="Baseline living page"
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
                <FictionalPlate
                  type="apparition"
                  title="Prompt Dock Mini (Apparition)"
                  tagline="Simulated failure"
                />
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-2">
            <span className="text-xs text-[#B4BFC8]">Living (0%)</span>
            <input
              type="range"
              min={0}
              max={100}
              value={position}
              onChange={(e) => setPosition(Number(e.target.value))}
              className="flex-1 accent-[#F4B860] cursor-pointer"
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
          className="relative aspect-[16/10] bg-[#0E2233] rounded-[2px] border border-[#2C4B68] overflow-hidden select-none cursor-ew-resize group"
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
              <FictionalPlate
                type="living"
                title="Prompt Dock Mini"
                tagline="Living Page · As designed"
              />
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
              <FictionalPlate
                type="apparition"
                title="Apparition (Broken)"
                tagline="Images blocked • 3 touch targets &lt; 24px"
              />
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
            className="absolute top-0 bottom-0 w-[2px] bg-[#F4B860] pointer-events-none z-30 shadow-[0_0_8px_rgba(244,184,96,0.6)]"
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
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-[6px] bg-[#0E2233] border-2 border-[#F4B860] flex items-center justify-center text-[#F4B860] shadow-[0_0_12px_rgba(244,184,96,0.5)] focus:outline-none focus:ring-2 focus:ring-[#ECE6D3] cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
            >
              <ArrowsRightLeftIcon className="w-4 h-4" />
            </div>
          </div>

          {/* Living / Apparition Floating Badges */}
          <div className="absolute bottom-3 left-3 px-2 py-1 rounded-[2px] bg-[#0E2233]/80 border border-[#2C4B68] text-[11px] font-semibold text-[#A6F0D6] pointer-events-none backdrop-blur-sm z-10">
            {livingLabel} ({position}%)
          </div>
          <div className="absolute bottom-3 right-3 px-2 py-1 rounded-[2px] bg-[#0E2233]/80 border border-[#2C4B68] text-[11px] font-semibold text-[#F28B77] pointer-events-none backdrop-blur-sm z-10">
            {apparitionLabel} ({100 - position}%)
          </div>
        </div>
      )}

      {/* Guidance Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#B4BFC8] pt-1">
        <span>
          Use pointer drag or <kbd className="px-1 py-0.5 rounded bg-[#0E2233] font-mono">←</kbd>{' '}
          <kbd className="px-1 py-0.5 rounded bg-[#0E2233] font-mono">→</kbd> arrow keys to part the
          curtain
        </span>
        {activePin && (
          <span className="text-[#F4B860] font-medium">Selected omen pin: #{activePin}</span>
        )}
      </div>
    </div>
  );
};

/**
 * Fictional wireframe plate for the interactive example Veil on The Parlour
 */
function FictionalPlate({
  type,
  title,
  tagline,
}: {
  type: 'living' | 'apparition';
  title: string;
  tagline: string;
}) {
  const isLiving = type === 'living';

  return (
    <div
      className={`w-full h-full p-6 flex flex-col justify-between font-sans ${
        isLiving ? 'bg-[#0E2233] text-[#ECE6D3]' : 'bg-[#153049] text-[#ECE6D3]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#2C4B68] pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isLiving ? 'bg-[#A6F0D6]' : 'bg-[#F28B77] animate-pulse'
            }`}
          />
          <span className="font-display font-bold text-sm tracking-wide">{title}</span>
        </div>
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-mono ${
            isLiving ? 'bg-[#2C4B68] text-[#A6F0D6]' : 'bg-[#F28B77]/20 text-[#F28B77]'
          }`}
        >
          {isLiving ? '200 OK • Baseline' : 'Condition: Images Aborted'}
        </span>
      </div>

      {/* Wireframe Page Content */}
      <div className="space-y-3 my-auto">
        <div className="flex items-center gap-3">
          {isLiving ? (
            <div className="w-16 h-16 rounded-[4px] bg-[#2C4B68]/60 flex items-center justify-center text-xs text-[#A6F0D6]">
              [Image]
            </div>
          ) : (
            <div className="w-16 h-16 rounded-[4px] border-2 border-dashed border-[#F28B77] flex items-center justify-center text-[10px] text-[#F28B77] p-1 text-center font-mono">
              Broken (No Alt)
            </div>
          )}
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-3/4 rounded bg-[#5B7C99]/30" />
            <div className="h-3 w-1/2 rounded bg-[#5B7C99]/20" />
          </div>
        </div>

        <div className="p-2.5 rounded bg-[#0E2233]/70 border border-[#2C4B68] flex items-center justify-between">
          <span className="text-xs text-[#B4BFC8]">{tagline}</span>
          <button
            type="button"
            className={`px-3 py-1 rounded text-xs font-semibold ${
              isLiving
                ? 'bg-[#F4B860] text-[#0E2233]'
                : 'bg-[#F28B77]/30 text-[#F28B77] border border-[#F28B77]/40'
            }`}
          >
            {isLiving ? 'Subscribe' : '22px (Too Small)'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#B4BFC8] pt-2 border-t border-[#2C4B68]">
        <span>Viewport: 390px Mobile</span>
        <span>{isLiving ? 'Zero layout shifts' : '+38px horizontal overflow'}</span>
      </div>
    </div>
  );
}

/**
 * Fictional Ectoplasm Diff plate
 */
function FictionalEctoplasmPlate() {
  return (
    <div className="w-full h-full p-6 flex flex-col justify-between bg-[#0E2233] text-[#ECE6D3]">
      <div className="flex items-center justify-between pb-3 border-b border-[#2C4B68]">
        <span className="font-display text-sm font-semibold text-[#A6F0D6]">
          Spectral Pixel Difference Overlay
        </span>
        <span className="text-[10px] font-mono text-[#A6F0D6] bg-[#A6F0D6]/10 px-2 py-0.5 rounded">
          4.8% Pixels Changed
        </span>
      </div>

      <div className="my-auto p-6 border border-[#A6F0D6]/40 rounded-[2px] bg-[#A6F0D6]/5 text-center space-y-2">
        <SparklesIcon className="w-8 h-8 text-[#A6F0D6] mx-auto animate-pulse" />
        <p className="text-xs text-[#A6F0D6] font-medium">
          Ectoplasm highlights shifted bounding boxes & missing image regions
        </p>
        <p className="text-[11px] text-[#B4BFC8]">
          Hero image collapsed from 64px to 0px, causing layout shift in subsequent child nodes.
        </p>
      </div>

      <div className="text-[10px] text-[#B4BFC8] pt-2 border-t border-[#2C4B68] flex justify-between">
        <span>pixelmatch algorithm (deterministic)</span>
        <span className="text-[#A6F0D6]">Diff mask active</span>
      </div>
    </div>
  );
}
