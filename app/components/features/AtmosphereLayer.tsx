'use client';

import React, { useEffect, useRef } from 'react';

/**
 * AtmosphereLayer — the room the app lives in.
 *
 * Purely decorative and never interactive (pointer-events: none, aria-hidden).
 * Layers, back to front:
 *   1. Canvas motes & embers with three parallax depths (pointer + scroll).
 *   2. Drifting CSS fog banks (transform-only animation).
 *   3. Cursor lantern: a warm pool of light that follows the pointer.
 *   4. Vignette + film grain.
 *
 * Always at full strength; prefers-reduced-motion renders a single still frame,
 * and the loop stops whenever the tab is hidden.
 */

export type AtmosphereLevel = 'off' | 'subtle' | 'full';

/**
 * The séance is always at full strength. The only thing that softens it is the
 * visitor's OS-level reduced-motion preference, which we must respect.
 */
export const ATMOSPHERE_LEVEL: AtmosphereLevel = 'full';

type Mote = {
  x: number;
  y: number;
  r: number;
  depth: number; // 0.25 (far) .. 1 (near)
  vx: number;
  vy: number;
  phase: number;
  ember: boolean;
  alpha: number;
};

function makeMotes(count: number, w: number, h: number): Mote[] {
  const motes: Mote[] = [];
  for (let i = 0; i < count; i++) {
    const depth = [0.3, 0.6, 1][i % 3];
    const ember = Math.random() < 0.22;
    motes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (ember ? 1.1 : 0.8) + Math.random() * 1.4 * depth,
      depth,
      vx: (Math.random() - 0.5) * 0.08,
      vy: ember ? -(0.12 + Math.random() * 0.25) * depth : -(0.02 + Math.random() * 0.08) * depth,
      phase: Math.random() * Math.PI * 2,
      ember,
      alpha: 0.25 + Math.random() * 0.45,
    });
  }
  return motes;
}

export const AtmosphereLayer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lanternRef = useRef<HTMLDivElement>(null);

  // Particles
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let motes: Mote[] = [];
    let raf = 0;
    let running = false;
    let pointerX = 0;
    let pointerY = 0;
    let parX = 0;
    let parY = 0;

    const density = 1;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 14000) * density);
      motes = makeMotes(count, w, h);
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // ease parallax toward pointer offset
      parX += (pointerX - parX) * 0.04;
      parY += (pointerY - parY) * 0.04;
      const scrollShift = window.scrollY * 0.15;

      for (const m of motes) {
        m.x += m.vx + Math.sin(t * 0.0004 + m.phase) * 0.12 * m.depth;
        m.y += m.vy;
        if (m.y < -10) {
          m.y = h + 10;
          m.x = Math.random() * w;
        }
        if (m.x < -10) m.x = w + 10;
        if (m.x > w + 10) m.x = -10;

        const px = m.x - parX * 18 * m.depth;
        const py =
          (((m.y - scrollShift * m.depth - parY * 12 * m.depth) % (h + 20)) + h + 20) % (h + 20);
        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.0012 + m.phase);
        const a = m.alpha * twinkle;

        if (m.ember) {
          const g = ctx.createRadialGradient(px, py, 0, px, py, m.r * 5);
          g.addColorStop(0, `rgba(255, 170, 110, ${a})`);
          g.addColorStop(0.35, `rgba(255, 122, 61, ${a * 0.45})`);
          g.addColorStop(1, 'rgba(255, 122, 61, 0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(px, py, m.r * 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = `rgba(237, 230, 216, ${a * 0.55})`;
          ctx.beginPath();
          ctx.arc(px, py, m.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (t: number) => {
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduceMotion.matches || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    const onPointer = (e: PointerEvent) => {
      pointerX = e.clientX / w - 0.5;
      pointerY = e.clientY / h - 0.5;
    };
    const onMotionPref = () => {
      if (reduceMotion.matches) {
        stop();
        draw(0);
      } else {
        start();
      }
    };

    resize();
    if (reduceMotion.matches) draw(0);
    else start();

    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduceMotion.addEventListener('change', onMotionPref);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibility);
      reduceMotion.removeEventListener('change', onMotionPref);
    };
  }, []);

  // Cursor lantern — transform only, rAF-throttled, fine pointers only
  useEffect(() => {
    const el = lanternRef.current;
    if (!el) return;
    const finePointer = window.matchMedia('(pointer: fine)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches || reduceMotion.matches) return;

    let raf = 0;
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 3;
    let tx = x;
    let ty = y;
    let active = false;

    const tick = () => {
      x += (tx - x) * 0.18;
      y += (ty - y) * 0.18;
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3) {
        raf = requestAnimationFrame(tick);
      } else {
        active = false;
      }
    };
    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      el.classList.add('is-on');
      if (!active && !document.hidden) {
        active = true;
        raf = requestAnimationFrame(tick);
      }
    };
    const onLeave = () => el.classList.remove('is-on');

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className="hv-atmos">
        <div className="hv-fog hv-fog--top" />
        <canvas ref={canvasRef} className="hv-atmos__canvas" />
        <div className="hv-fog" />
        <div className="hv-fog hv-fog--2" />
      </div>
      <div aria-hidden="true" ref={lanternRef} className="hv-lantern-light" />
      <div aria-hidden="true" className="hv-vignette" />
      <div aria-hidden="true" className="hv-grain" />
    </>
  );
};
