'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Synthesizes a soft séance bell chime (528 Hz with decay).
 * Used as a one-shot cue (e.g. when a run completes) — only if the user enabled sound.
 */
export function playSeanceBell() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(528, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(523, ctx.currentTime + 1.2);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.8);
    setTimeout(() => ctx.close().catch(() => {}), 2000);
  } catch {
    // Ignore audio permission or failure
  }
}

/**
 * Ambient wind + low room tone, fully synthesized (no audio files).
 * Muted by default; starts only on an explicit click; suspends while the tab is hidden.
 */
export const AmbientAudio: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const nodesRef = useRef<AudioScheduledSourceNode[]>([]);

  const stopAudio = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    if (ctx && master) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
      const nodes = nodesRef.current;
      setTimeout(() => {
        nodes.forEach((n) => {
          try {
            n.stop();
            n.disconnect();
          } catch {
            // already stopped
          }
        });
      }, 900);
    }
    nodesRef.current = [];
    setIsPlaying(false);
  }, []);

  const startAudio = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = ctxRef.current || new AudioCtx();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') ctx.resume();

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, ctx.currentTime);
      master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 2.5);
      master.connect(ctx.destination);
      masterRef.current = master;

      // --- Wind: looping brown-ish noise through a wandering band-pass
      const seconds = 4;
      const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < data.length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.2;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.frequency.value = 420;
      band.Q.value = 0.9;

      const windGain = ctx.createGain();
      windGain.gain.value = 0.08;

      // Gusts: slow LFOs on filter frequency and loudness
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 260;
      lfo.connect(lfoDepth).connect(band.frequency);

      const gust = ctx.createOscillator();
      gust.frequency.value = 0.045;
      const gustDepth = ctx.createGain();
      gustDepth.gain.value = 0.05;
      gust.connect(gustDepth).connect(windGain.gain);

      noise.connect(band).connect(windGain).connect(master);

      // --- Room tone: two detuned low sines
      const tone = ctx.createGain();
      tone.gain.value = 0.03;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 180;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      o1.frequency.value = 55;
      o2.frequency.value = 55.35;
      o1.connect(lp);
      o2.connect(lp);
      lp.connect(tone).connect(master);

      [noise, lfo, gust, o1, o2].forEach((n) => n.start());
      nodesRef.current = [noise, lfo, gust, o1, o2];
      setIsPlaying(true);
    } catch (e) {
      console.warn('Web Audio ambience skipped:', e);
    }
  }, []);

  // Silence while the tab is hidden
  useEffect(() => {
    const onVis = () => {
      const ctx = ctxRef.current;
      if (!ctx || !isPlaying) return;
      if (document.hidden) ctx.suspend().catch(() => {});
      else ctx.resume().catch(() => {});
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      nodesRef.current.forEach((n) => {
        try {
          n.stop();
        } catch {
          // ignore
        }
      });
      ctxRef.current?.close().catch(() => {});
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => (isPlaying ? stopAudio() : startAudio())}
      aria-pressed={isPlaying}
      aria-label={isPlaying ? 'Mute ambient wind' : 'Play ambient wind (sound)'}
      title={isPlaying ? 'Mute ambience' : 'Play ambience — wind and room tone'}
      className="hv-icon-btn"
    >
      <svg width="20" height="16" viewBox="0 0 20 16" fill="none" aria-hidden="true">
        <path d="M2 6h3l4-3.5v11L5 10H2V6Z" fill="currentColor" opacity="0.85" />
        {isPlaying ? (
          <path
            d="M12 5.5c1 .7 1.5 1.6 1.5 2.5s-.5 1.8-1.5 2.5M14.5 3.5c1.8 1.2 2.7 2.8 2.7 4.5s-.9 3.3-2.7 4.5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        ) : (
          <path
            d="m12.5 5.5 5 5m0-5-5 5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        )}
      </svg>
      <span className="hidden xl:inline">{isPlaying ? 'Wind on' : 'Muted'}</span>
    </button>
  );
};
