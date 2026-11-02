'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export const AmbientAudio: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const osc1Ref = useRef<OscillatorNode | null>(null);
  const osc2Ref = useRef<OscillatorNode | null>(null);

  const stopAudio = useCallback(() => {
    try {
      if (gainNodeRef.current && audioCtxRef.current) {
        // Smooth fade out
        gainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.2);
        setTimeout(() => {
          try {
            osc1Ref.current?.stop();
            osc2Ref.current?.stop();
            osc1Ref.current?.disconnect();
            osc2Ref.current?.disconnect();
          } catch {
            // Ignore
          }
          osc1Ref.current = null;
          osc2Ref.current = null;
        }, 300);
      }
    } catch {
      // Ignore
    }
    setIsPlaying(false);
  }, []);

  const startAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Room tone: Two sine oscillators at 55 Hz and 55.4 Hz through low-pass ~200Hz
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, ctx.currentTime);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(55.4, ctx.currentTime); // Subtle binaural beat

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(200, ctx.currentTime);

      // Very low ambient gain (0.04)
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.035, ctx.currentTime + 1.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      osc1Ref.current = osc1;
      osc2Ref.current = osc2;
      gainNodeRef.current = gain;

      setIsPlaying(true);
    } catch (e) {
      console.warn('Web Audio synthesis initialisation skipped:', e);
    }
  }, []);

  const toggleSound = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch {
          // Ignore
        }
      }
    };
  }, [stopAudio]);

  return (
    <button
      type="button"
      onClick={toggleSound}
      title={
        isPlaying ? 'Mute ambient parlour tone' : 'Synthesize ambient parlour tone (Web Audio)'
      }
      className={`px-2.5 py-1 rounded-[6px] text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer ${
        isPlaying
          ? 'bg-[#F4B860] text-[#0E2233] font-semibold shadow-[0_0_8px_rgba(244,184,96,0.4)]'
          : 'bg-[#0E2233] text-[#B4BFC8] hover:text-[#ECE6D3] border border-[#2C4B68]'
      }`}
    >
      <span>{isPlaying ? '♪ Ambience On' : '♪ Ambience Off'}</span>
    </button>
  );
};
