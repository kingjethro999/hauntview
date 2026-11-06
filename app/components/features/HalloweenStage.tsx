'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

/* ─────────────────────────────────────────────────────────────────────────────
   GHOST — detailed path SVG matching the "The Last Save" anatomy
───────────────────────────────────────────────────────────────────────────── */
export function Ghost({ className = '', style = {}, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 75 100"
      fill="currentColor"
      fillRule="evenodd"
      aria-hidden="true"
      {...props}
    >
      <g transform="matrix(3.800695,0,0,4.166604,-7.598366,0.001061)">
        <path
          d="M4.594,6.677C6.67,-2.226 18.746,-2.211 21.16,6.632C21.513,7.929 22.885,14.214 19.487,20.379C17.942,23.176 13.646,25.869 12.497,22.262C8.6,25.477 3.315,24.1 5.789,18.609L5.471,18.752C1.901,20.057 1.608,17.544 2.298,16.239C2.748,15.399 3.025,14.904 3.235,14.342C3.588,13.367 3.693,12.774 3.828,11.844C4.098,10.007 4.105,8.237 4.593,6.677L4.594,6.677Z"
          fill="currentColor"
        />
        {/* left eye */}
        <path
          d="M12.964,6.687C12.638,6.676 12.329,6.839 12.154,7.115C11.937,7.438 11.824,7.94 11.824,8.577C11.824,9.282 11.974,10.467 12.964,10.467L12.972,10.467C13.729,10.467 14.186,9.762 14.186,8.577C14.186,7.955 14.059,7.452 13.819,7.122C13.625,6.843 13.304,6.68 12.964,6.687Z"
          fill="#0a0711"
        />
        {/* right eye */}
        <path
          d="M17.044,6.687C16.718,6.676 16.409,6.839 16.234,7.115C16.017,7.438 15.904,7.94 15.904,8.577C15.904,9.282 16.054,10.467 17.044,10.467L17.052,10.467C17.809,10.467 18.267,9.762 18.267,8.577C18.267,7.955 18.139,7.452 17.899,7.122C17.705,6.843 17.384,6.68 17.044,6.687Z"
          fill="#0a0711"
        />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   PUMPKIN — ridged body, carved face, glow ellipse
───────────────────────────────────────────────────────────────────────────── */
export function Pumpkin() {
  return (
    <svg viewBox="0 0 130 120" fill="none" aria-hidden="true">
      {/* stem */}
      <path d="M65 27q-6-20 6-23l9 6q-12 3-8 18" fill="#89a36a" />
      {/* outer body */}
      <path
        d="M65 29C20 6-9 56 12 91c10 23 36 25 53 17 22 11 48 4 55-20C139 48 108 9 65 29Z"
        fill="#d86a29"
        stroke="#ed934c"
        strokeWidth="2"
      />
      {/* ridges */}
      <path
        d="M46 29C14 64 35 109 59 110m22-81c32 35 11 80-13 81M65 30v79"
        stroke="#783825"
        strokeWidth="2"
        opacity=".6"
      />
      {/* carved face */}
      <g className="pumpkin-carving" fill="#ffe29a">
        {/* left eye triangle */}
        <path d="m30 58 19-12 3 23Z" />
        {/* right eye triangle */}
        <path d="m71 0L82 46l-3 23ZM100 58 82 46l-3 23Z" />
        {/* mouth */}
        <path d="m27 80 18 6 7-5 8 10 10-8 9 4 23-10q-10 30-37 28T27 80Z" />
      </g>
      {/* glow under pumpkin */}
      <ellipse cx="65" cy="112" rx="38" ry="6" fill="rgba(255,121,31,0.12)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SKELETON — ribcage, skull, arms, legs, all animate via CSS classes
───────────────────────────────────────────────────────────────────────────── */
export function Skeleton(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 120 220"
      fill="none"
      stroke="currentColor"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* skull */}
      <g className="skeleton-head">
        <path d="M39 46C17 11 41 2 60 2s42 9 21 44l-8 7H48Z" fill="currentColor" stroke="none" />
        <path d="M40 49h39v15H40Z" fill="currentColor" stroke="none" />
        {/* eyes + nose */}
        <g fill="#1d1124" stroke="none">
          <ellipse cx="45" cy="29" rx="9" ry="10" />
          <ellipse cx="76" cy="29" rx="9" ry="10" />
          <path d="m60 37-6 10h12Z" />
        </g>
        {/* teeth */}
        <path d="M51 54v8m10-8v8m10-8v8" stroke="#1d1124" strokeWidth="2" />
      </g>
      {/* spine */}
      <path d="M60 69v74m-3-65L40 80l-8 8 22 4m13-14 16 2 8 8-22 4m-15 8-22-4 3 12 19 4m15-12 22-4-3 12-19 4m-15 7-16-4 4 11 12 5m15-12 16-4-4 11-12 5M42 141q18 12 36 0l-2 19H45Z" />
      {/* left arm */}
      <g className="skeleton-arm">
        <path d="m35 77-15 31-9-25M5 77l6 6 5-9M8 73l3 10" />
      </g>
      {/* right arm */}
      <g className="skeleton-arm">
        <path d="m87 78 19 26 7-27m-5-5 5 5 5-7m-7-4 2 11" />
      </g>
      {/* legs */}
      <g>
        <path d="m49 165-9 23 8 22-14 5m37-50 10 23-5 22 15 5" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   SPIDER WEB — radiating lines + concentric arcs
───────────────────────────────────────────────────────────────────────────── */
function SpiderWeb() {
  return (
    <svg
      className="spider-web"
      viewBox="0 0 150 150"
      fill="none"
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: 150,
        height: 150,
        color: '#cba8db',
        opacity: 0.18,
      }}
    >
      {/* radial spokes */}
      <path
        d="M150 0 0 0m150 0L0 150M150 0v150M150 0 10 70m140-70-70 140M120 0q0 30 30 30M90 0q0 60 60 60M60 0q0 90 90 90M30 0q0 120 120 120M0 0q0 150 150 150"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   HANGING SPIDER
───────────────────────────────────────────────────────────────────────────── */
function HangingSpider() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: '2.3%',
        top: 0,
        width: 37,
        height: 120,
        color: '#c796d5',
        animation: 'spider-sway 8s ease-in-out infinite',
        transformOrigin: 'top',
      }}
    >
      {/* thread */}
      <div
        style={{
          height: 82,
          width: 1,
          background: 'rgba(171,125,190,0.5)',
          margin: 'auto',
        }}
      />
      <svg viewBox="0 0 60 50" width="37" height="35">
        {/* legs */}
        <path
          d="m25 25-15-8-7-12m22 22L8 29 2 42m33-17 15-8 7-12M35 27l17 2 6 13M23 32 12 39v9m25-16 11 7v9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        {/* body */}
        <ellipse cx="30" cy="27" rx="10" ry="13" fill="currentColor" />
        {/* eyes */}
        <circle cx="27" cy="23" r="2" fill="#ffb570" />
        <circle cx="33" cy="23" r="2" fill="#ffb570" />
      </svg>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   BAT — inline SVG version (no sprite needed)
───────────────────────────────────────────────────────────────────────────── */
function SvgBat({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="#100914"
      aria-hidden="true"
      style={{ display: 'block', filter: 'drop-shadow(0 0 1px rgba(219,130,247,0.6))', ...style }}
    >
      {/* left wing */}
      <path d="M24 12C18 3 4 4 6 12 C7 16 16 13 24 11 Z" />
      {/* right wing */}
      <path d="M24 12C30 3 44 4 42 12 C41 16 32 13 24 11 Z" />
      {/* body */}
      <ellipse cx="24" cy="11" rx="3" ry="4" />
      {/* ears */}
      <path d="M21 8 L18 3 L22 7 Z" fill="#1a0d20" />
      <path d="M27 8 L30 3 L26 7 Z" fill="#1a0d20" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GRAVE MARKER
───────────────────────────────────────────────────────────────────────────── */
function GraveMarker() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        right: '34%',
        bottom: 95,
        width: 58,
        height: 72,
        border: '1px solid #7c6e86',
        borderRadius: '28px 28px 0 0',
        background: '#2d2533',
        transform: 'rotate(-12deg)',
        textAlign: 'center',
        paddingTop: 15,
        color: '#8c7f96',
        fontFamily: 'serif',
        fontSize: 12,
        boxShadow: '4px 3px 0 #161218',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 3,
      }}
    >
      {/* cross */}
      <span style={{ position: 'absolute', top: -11, left: 25, color: '#92859c', fontSize: 14 }}>
        ✦
      </span>
      <span style={{ fontWeight: 700 }}>R.I.P.</span>
      <small
        style={{
          fontFamily: 'monospace',
          fontSize: 6,
          lineHeight: 1.4,
          display: 'block',
          color: '#7a6d84',
        }}
      >
        DEAD
        <br />
        FORMATS
      </small>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MOON
───────────────────────────────────────────────────────────────────────────── */
function Moon() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        width: 115,
        height: 115,
        right: '5%',
        top: 24,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 36% 30%, #ffce78, #ec863c)',
        boxShadow: '0 0 60px rgba(237,132,53,0.28), inset -24px -10px 0 rgba(167,71,40,0.27)',
        opacity: 0.95,
      }}
    >
      {/* crater pits */}
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'rgba(168,84,49,0.22)',
          width: 17,
          height: 18,
          top: 22,
          left: 30,
        }}
      />
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'rgba(168,84,49,0.22)',
          width: 23,
          height: 21,
          top: 60,
          left: 63,
        }}
      />
      <div
        style={{
          position: 'absolute',
          borderRadius: '50%',
          background: 'rgba(168,84,49,0.22)',
          width: 11,
          height: 10,
          top: 79,
          left: 27,
        }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN HALLOWEEN STAGE COMPONENT
   Interactive: ghost summons crew, skeleton dances, pumpkin toggles lanterns
───────────────────────────────────────────────────────────────────────────── */
interface GhostRoute {
  x: number;
  delay: number;
  time: number;
  drift: number;
  size: number;
}

interface HalloweenStageProps {
  isRunning?: boolean;
}

export default function HalloweenStage({ isRunning = false }: HalloweenStageProps) {
  const [lit, setLit] = useState(true);
  const [summons, setSummons] = useState(0);
  const [ghostRoutes, setGhostRoutes] = useState<GhostRoute[]>([]);
  const [dancing, setDancing] = useState(false);
  const [message, setMessage] = useState('Click a creature. Disturb the peace.');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const summonCrew = useCallback(() => {
    setGhostRoutes(
      Array.from({ length: 5 }, (_, i) => ({
        x: 15 + i * 14 + Math.random() * 3,
        delay: i === 0 ? 0 : i * 0.09 + Math.random() * 0.04,
        time: 1.8 + Math.random() * 0.7,
        drift: -50 + Math.random() * 100,
        size: 25 + Math.random() * 18,
      }))
    );
    setSummons((n) => n + 1);
    setDancing(true);
    setMessage('The graveyard shift has clocked in. Your rites are running.');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setDancing(false), 6500);
  }, []);

  // Auto-summon spirits when a test run starts.
  // Deferred via setTimeout so setState is not called synchronously
  // inside the effect body (satisfies react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!isRunning) return;
    const id = setTimeout(() => summonCrew(), 0);
    return () => clearTimeout(id);
  }, [isRunning, summonCrew]);

  return (
    <>
      {/* ── Inline animation keyframes (scoped to this component) ── */}
      <style>{`
        @keyframes ghost-hover   { 50% { transform: translateY(-12px) rotate(6deg); } }
        @keyframes spider-sway   { 50% { transform: rotate(7deg); } }
        @keyframes skeleton-bop  { to  { transform: translateY(-8px) rotate(-9deg); } }
        @keyframes skull-nod     { to  { transform: rotate(-12deg); } }
        @keyframes bone-wave     { to  { transform: rotate(24deg); } }
        @keyframes lantern-pulse { 50% { opacity: 0.77; } }
        @keyframes lobby-spirit-wander {
          0%   { opacity: .9;  transform: translate3d(0,0,0)         rotate(-10deg); }
          20%  { opacity: .95; transform: translate3d(calc(var(--lobby-drift)*-.2),-65px,0) rotate(3deg); }
          55%  { opacity: .85; transform: translate3d(calc(var(--lobby-drift)*-.4),-170px,0) rotate(8deg); }
          85%  { opacity: .65; }
          100% { opacity: 0;   transform: translate3d(var(--lobby-drift),-360px,0)  rotate(-12deg); }
        }
        .halloween-stage { position: absolute; inset: 0; pointer-events: none; z-index: 3; overflow: hidden; }
        .halloween-stage button { pointer-events: auto; position: absolute; padding: 0; background: none; border: none; cursor: pointer; transition: filter .2s, transform .2s; }
        .halloween-stage button:hover  { filter: brightness(1.25); }
        .halloween-stage button:focus-visible { outline: 2px solid #ff791f; outline-offset: 4px; }

        .stage-ghost     { width: 74px; right: 39%; top: 57px; color: #fff4ed; animation: ghost-hover 5s ease-in-out infinite; filter: drop-shadow(0 0 18px rgba(193,139,255,0.4)); }
        .stage-ghost span { font: 6px monospace; white-space: nowrap; color: #d9b5ee; display: block; margin-top: -3px; }

        .stage-skeleton  { width: 86px; right: 1.5%; bottom: 155px; color: #fff0d2; transform: rotate(8deg); filter: drop-shadow(0 4px 5px rgba(0,0,0,0.5)); }
        .stage-skeleton:hover { transform: rotate(-6deg); }
        .skeleton-dancing { animation: skeleton-bop .7s ease-in-out infinite alternate; }
        .skeleton-dancing .skeleton-head { transform-origin: 60px 62px; animation: skull-nod .55s ease-in-out infinite alternate; }
        .skeleton-dancing .skeleton-arm  { transform-box: fill-box; transform-origin: top; animation: bone-wave .65s ease-in-out infinite alternate; }

        .stage-pumpkin   { filter: drop-shadow(0 0 19px rgba(255,123,37,0.2)); }
        .lanterns-lit  .pumpkin-carving { animation: lantern-pulse 4s ease-in-out infinite; }
        .lanterns-dark .pumpkin-carving { fill: #3c271b; }
        .lanterns-dark .stage-pumpkin   { filter: none; }
        .pumpkin-one { position: absolute; right: 15%; bottom: 89px; width: 130px; transform: rotate(-10deg); z-index: 2; }
        .pumpkin-one:hover { transform: rotate(-5deg) translateY(-4px); }
        .pumpkin-two { position: absolute; right: 6%;  bottom: 85px; width: 90px;  transform: rotate(8deg);  }

        .spirit-trail-ghost { position: absolute; bottom: 80px; color: #fff5e8; opacity: 0;
          filter: drop-shadow(0 0 9px #c78dff);
          animation: lobby-spirit-wander var(--lobby-time) ease-out var(--lobby-delay) both;
          width: var(--lobby-size); height: calc(var(--lobby-size) * 1.3);
          left: var(--lobby-x);
        }

        .graveyard-fog-el { position: absolute; bottom: 35px; right: 0; width: 60%; height: 100px; z-index: -1;
          background: radial-gradient(ellipse, rgba(184,83,196,0.17), transparent 66%);
          filter: blur(10px); pointer-events: none; }

        .crew-controls-el { position: absolute; right: 6%; bottom: 50px; display: grid; justify-items: center; gap: 8px; width: 32%; z-index: 5; }
        .crew-btn { position: static !important; pointer-events: auto !important;
          border: 1px solid rgba(118,104,128,0.35) !important;
          background: #1f1923 !important;
          padding: 8px 14px !important;
          display: flex; gap: 12px; align-items: center;
          font: 7px monospace; letter-spacing: 1px; color: #c7c1cc;
          border-radius: 3px; cursor: pointer; transition: background .2s, border-color .2s; }
        .crew-btn:hover { background: #372d3e !important; border-color: #aaa0b1 !important; }
        .crew-btn span { color: #ff963c; }
        .crew-msg { font: 6px/1.5 monospace; color: #a99fb0; text-align: center; max-width: 220px; }

        .lobby-bat { position: absolute; right: 20%; top: 26px; z-index: 3; transform: rotate(-9deg); }

        @media (max-width: 600px) {
          .stage-ghost   { width: 55px; right: 72%; top: auto; bottom: 305px; }
          .stage-skeleton { width: 65px; bottom: 150px; right: 1%; }
          .pumpkin-one  { right: 18%; width: 86px;  bottom: 112px; }
          .pumpkin-two  { right: 4%;  width: 62px;  bottom: 109px; }
          .hanging-spider-wrap { right: 4%; }
          .graveyard-fog-el { bottom: 80px; width: 100%; }
          .crew-controls-el { right: 5%; bottom: 51px; width: 88%; }
        }
        @media (prefers-reduced-motion: reduce) {
          .halloween-stage *, .halloween-stage *::before, .halloween-stage *::after {
            animation: none !important; transition: none !important;
          }
          .spirit-trail-ghost { opacity: .7; transform: translateY(-130px); }
        }
      `}</style>

      <div className={`halloween-stage ${lit ? 'lanterns-lit' : 'lanterns-dark'}`}>
        <SpiderWeb />
        <Moon />

        {/* Bat cluster */}
        <div className="lobby-bat" aria-hidden="true">
          <SvgBat style={{ width: 43, height: 22 }} />
          <SvgBat style={{ width: 29, marginLeft: 39, transform: 'rotate(8deg)' }} />
          <SvgBat style={{ width: 23, marginLeft: -14 }} />
        </div>

        <HangingSpider />

        {/* Ghost — click to summon crew */}
        <button className="stage-ghost" onClick={summonCrew} aria-label="Summon the ghost crew">
          <Ghost />
          <span>psst. click me.</span>
        </button>

        {/* Skeleton — click to dance */}
        <button
          className={`stage-skeleton ${dancing ? 'skeleton-dancing' : ''}`}
          onClick={() => {
            setDancing((v) => !v);
            setMessage('Even skeletons need a dance break.');
          }}
          aria-label="Make the skeleton dance"
          aria-pressed={dancing}
        >
          <Skeleton />
        </button>

        {/* Pumpkin 1 — toggle lanterns */}
        <button
          className="stage-pumpkin pumpkin-one"
          onClick={() => {
            setLit((v) => !v);
            setMessage(
              lit
                ? "Lanterns out. The ghosts don't mind."
                : 'Lanterns lit. Welcome to the night shift.'
            );
          }}
          aria-label="Toggle pumpkin lanterns"
          aria-pressed={lit}
        >
          <Pumpkin />
        </button>

        {/* Pumpkin 2 — decorative */}
        <div className="stage-pumpkin pumpkin-two" aria-hidden="true">
          <Pumpkin />
        </div>

        <GraveMarker />

        {/* Spirit trails */}
        <div
          key={summons}
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
        >
          {summons > 0 &&
            ghostRoutes.map((route, i) => (
              <Ghost
                key={i}
                className="spirit-trail-ghost"
                style={
                  {
                    '--lobby-x': `${route.x}%`,
                    '--lobby-delay': `${route.delay}s`,
                    '--lobby-time': `${route.time}s`,
                    '--lobby-drift': `${route.drift}px`,
                    '--lobby-size': `${route.size}px`,
                  } as React.CSSProperties
                }
              />
            ))}
        </div>

        {/* Fog */}
        <div className="graveyard-fog-el" />

        {/* Crew controls */}
        <div className="crew-controls-el">
          <button className="crew-btn" onClick={summonCrew}>
            <span>✦</span> WAKE THE CREW <span>↗</span>
          </button>
          <span className="crew-msg" role="status">
            {message}
          </span>
        </div>
      </div>
    </>
  );
}
