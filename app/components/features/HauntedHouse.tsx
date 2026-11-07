'use client';

import React, { useState } from 'react';

export interface WindowProfileInfo {
  id: string;
  name: string;
  floor: 'attic' | 'upper' | 'ground';
  x: number;
  y: number;
  width: number;
  height: number;
}

export const HOUSE_WINDOWS: WindowProfileInfo[] = [
  // Attic (Audits & Vitals) - 5 Dormer Windows
  {
    id: 'console-errors',
    name: 'Console Errors',
    floor: 'attic',
    x: 105,
    y: 135,
    width: 34,
    height: 44,
  },
  {
    id: 'a11y-screenreader',
    name: 'A11y: Screen Reader',
    floor: 'attic',
    x: 165,
    y: 135,
    width: 34,
    height: 44,
  },
  {
    id: 'performance',
    name: 'Performance & Vitals',
    floor: 'attic',
    x: 253,
    y: 110,
    width: 34,
    height: 48,
  }, // Spire dormer
  {
    id: 'a11y-keyboard',
    name: 'A11y: Keyboard Flow',
    floor: 'attic',
    x: 341,
    y: 135,
    width: 34,
    height: 44,
  },
  {
    id: 'a11y-visual',
    name: 'A11y: Visual Contrast',
    floor: 'attic',
    x: 401,
    y: 135,
    width: 34,
    height: 44,
  },

  // Upper Floor (Resilience, Browsers & i18n) - 6 Grand Windows
  {
    id: 'a11y-cognitive',
    name: 'A11y: Cognitive Load',
    floor: 'upper',
    x: 75,
    y: 215,
    width: 38,
    height: 54,
  },
  {
    id: 'i18n-rtl',
    name: 'i18n: RTL (Arabic)',
    floor: 'upper',
    x: 140,
    y: 215,
    width: 38,
    height: 54,
  },
  {
    id: 'i18n-cjk',
    name: 'i18n: CJK (Japanese)',
    floor: 'upper',
    x: 205,
    y: 215,
    width: 38,
    height: 54,
  },
  {
    id: 'i18n-mixed',
    name: 'i18n: Mixed Scripts',
    floor: 'upper',
    x: 295,
    y: 215,
    width: 38,
    height: 54,
  },
  {
    id: 'browser-webkit',
    name: 'Browser: WebKit',
    floor: 'upper',
    x: 360,
    y: 215,
    width: 38,
    height: 54,
  },
  {
    id: 'browser-firefox',
    name: 'Browser: Firefox',
    floor: 'upper',
    x: 425,
    y: 215,
    width: 38,
    height: 54,
  },

  // Ground Floor (Devices & Viewports) - 6 Parlour Windows
  {
    id: 'mobile-iphone15',
    name: 'Mobile: iPhone 15',
    floor: 'ground',
    x: 70,
    y: 315,
    width: 40,
    height: 58,
  },
  {
    id: 'mobile-android',
    name: 'Mobile: Android S23',
    floor: 'ground',
    x: 130,
    y: 315,
    width: 40,
    height: 58,
  },
  {
    id: 'tablet-ipad',
    name: 'Tablet: iPad Pro',
    floor: 'ground',
    x: 190,
    y: 315,
    width: 40,
    height: 58,
  },
  {
    id: 'desktop-1080p',
    name: 'Desktop: 1080p',
    floor: 'ground',
    x: 310,
    y: 315,
    width: 40,
    height: 58,
  },
  {
    id: 'desktop-4k',
    name: 'Desktop: 4K UHD',
    floor: 'ground',
    x: 370,
    y: 315,
    width: 40,
    height: 58,
  },
  {
    id: 'browser-edge',
    name: 'Browser: Edge',
    floor: 'ground',
    x: 430,
    y: 315,
    width: 40,
    height: 58,
  },
];

export interface HauntedHouseProps {
  selectedProfiles: string[];
  onToggleProfile: (profileId: string) => void;
  onSelectAll: () => void;
  isUrlValid?: boolean;
  activeRunningProfile?: string | null;
  profileFindings?: Record<string, number>;
  className?: string;
}

export const HauntedHouse: React.FC<HauntedHouseProps> = ({
  selectedProfiles,
  onToggleProfile,
  onSelectAll,
  isUrlValid = false,
  activeRunningProfile,
  profileFindings = {},
  className = '',
}) => {
  const [hoveredWindow, setHoveredWindow] = useState<WindowProfileInfo | null>(null);

  const isAllSelected = HOUSE_WINDOWS.every((w) => selectedProfiles.includes(w.id));

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* Top Status & Tooltip Ribbon - Fixed height to avoid ANY layout shift or hover jitter */}
      <div className="h-9 mb-2 flex items-center justify-center text-xs font-serif overflow-hidden select-none">
        {hoveredWindow ? (
          <div className="flex items-center gap-2 px-3 py-1 bg-[var(--ghost-mist)] border border-[var(--pumpkin-fire)] rounded-[4px] text-[var(--bone-white)] shadow-[0_0_12px_rgba(255,121,31,0.25)]">
            <span className="text-[var(--pumpkin-fire)]">🕯️</span>
            <span className="font-bold">{hoveredWindow.name}</span>
            <span className="text-[var(--spirit-smoke)]">
              ({selectedProfiles.includes(hoveredWindow.id) ? 'Summoned Rite' : 'Click to summon'})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 text-[var(--spirit-smoke)]">
            <span>Click windows to summon rites • Click heavy front door to haunt with all</span>
          </div>
        )}
      </div>

      {/* Main Victorian House SVG */}
      <svg
        viewBox="0 0 540 430"
        className="w-full max-w-[620px] h-auto drop-shadow-[0_12px_36px_rgba(0,0,0,0.85)]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Haunted House Rite Selector"
      >
        <defs>
          {/* Candlelight glow inside lit windows */}
          <radialGradient id="windowLit" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFF275" stopOpacity="1" />
            <stop offset="45%" stopColor="var(--pumpkin-fire)" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#D97706" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350F" stopOpacity="0.7" />
          </radialGradient>

          {/* Eerie ghost finding glow inside windows */}
          <radialGradient id="windowOmen" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FCA5A5" stopOpacity="1" />
            <stop offset="50%" stopColor="#F28B77" stopOpacity="0.95" />
            <stop offset="85%" stopColor="var(--severity-scream)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#7F1D1D" stopOpacity="0.75" />
          </radialGradient>

          {/* Porch Lantern Flame Gradient */}
          <radialGradient id="pumpkinGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="40%" stopColor="var(--pumpkin-fire)" stopOpacity="0.95" />
            <stop offset="80%" stopColor="#EA580C" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#7C2D12" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ================= BACKGROUND: DUSK MOON & WEATHER VANE ================= */}
        {/* Full harvest moon behind gothic spire */}
        <circle cx="340" cy="80" r="38" fill="var(--pumpkin-fire)" opacity="0.12" />
        <circle cx="340" cy="80" r="32" fill="var(--bone-white)" opacity="0.18" />

        {/* Spire Weather Vane */}
        <path
          d="M 270 20 L 270 65"
          stroke="var(--tombstone-gray)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M 262 35 L 278 35" stroke="var(--tombstone-gray)" strokeWidth="1.5" />
        <circle cx="270" cy="22" r="3" fill="var(--pumpkin-fire)" />

        {/* Chimney & Curling Smoke */}
        <path
          d="M 120 70 L 142 70 L 142 125 L 120 125 Z"
          fill="#0C1B2A"
          stroke="var(--tombstone-gray)"
          strokeWidth="2"
        />
        <path
          d="M 116 66 L 146 66 L 146 72 L 116 72 Z"
          fill="var(--ghost-mist)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />
        <path
          d="M 131 64 C 131 52, 122 45, 127 34 C 132 23, 126 15, 133 8"
          stroke="var(--grave-dust)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          fill="none"
          opacity="0.6"
        />

        {/* ================= GOTHIC MANSION ARCHITECTURE ================= */}
        {/* Stone foundation base */}
        <rect
          x="50"
          y="380"
          width="440"
          height="25"
          fill="#08131E"
          stroke="var(--tombstone-gray)"
          strokeWidth="2"
          rx="2"
        />
        <line x1="50" y1="392" x2="490" y2="392" stroke="#1E3A54" strokeWidth="1.5" />

        {/* Ground Floor Main Body */}
        <rect
          x="58"
          y="280"
          width="424"
          height="102"
          fill="var(--midnight-veil)"
          stroke="var(--tombstone-gray)"
          strokeWidth="2.5"
        />

        {/* Ground to Upper Floor Cornice Moulding */}
        <rect
          x="52"
          y="274"
          width="436"
          height="8"
          fill="var(--ghost-mist)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />

        {/* Upper Floor Body */}
        <rect
          x="64"
          y="180"
          width="412"
          height="96"
          fill="#0D1E2D"
          stroke="var(--tombstone-gray)"
          strokeWidth="2"
        />

        {/* Upper Floor Cornice Moulding */}
        <rect
          x="58"
          y="174"
          width="424"
          height="8"
          fill="var(--ghost-mist)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />

        {/* Main Mansard / Gable Roof */}
        <polygon
          points="270,60 58,176 482,176"
          fill="#091622"
          stroke="var(--tombstone-gray)"
          strokeWidth="2.5"
        />

        {/* Center Spire Dormer Pediment */}
        <polygon
          points="270,82 242,125 298,125"
          fill="var(--ghost-mist)"
          stroke="var(--pumpkin-fire)"
          strokeWidth="1.5"
        />

        {/* Left & Right Roof Dormer Gables */}
        <polygon
          points="122,118 96,145 148,145"
          fill="var(--midnight-veil)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />
        <polygon
          points="182,118 156,145 208,145"
          fill="var(--midnight-veil)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />
        <polygon
          points="358,118 332,145 384,145"
          fill="var(--midnight-veil)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />
        <polygon
          points="418,118 392,145 444,145"
          fill="var(--midnight-veil)"
          stroke="var(--tombstone-gray)"
          strokeWidth="1.5"
        />

        {/* ================= 17 INTERACTIVE RITE WINDOWS ================= */}
        {HOUSE_WINDOWS.map((win) => {
          const isSelected = selectedProfiles.includes(win.id);
          const isRunning = activeRunningProfile === win.id;
          const findingCount = profileFindings[win.id] || 0;
          const hasFindings = findingCount > 0;
          const isHovered = hoveredWindow?.id === win.id;

          return (
            <g
              key={win.id}
              role="button"
              aria-pressed={isSelected}
              aria-label={`${win.name} (${isSelected ? 'Selected' : 'Unselected'})`}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleProfile(win.id);
                }
              }}
              className="cursor-pointer"
            >
              {/* Outer Window Stone Frame */}
              <rect
                x={win.x - 3}
                y={win.y - 3}
                width={win.width + 6}
                height={win.height + 6}
                rx={win.floor === 'attic' ? 14 : 3}
                fill="var(--ghost-mist)"
                stroke={
                  isHovered ? 'var(--pumpkin-fire)' : isSelected ? 'var(--grave-dust)' : '#1A334B'
                }
                strokeWidth={isHovered ? '2' : '1'}
                pointerEvents="none"
              />

              {/* Window Glass Pane - Lighted by candlelight or snuffed */}
              <rect
                x={win.x}
                y={win.y}
                width={win.width}
                height={win.height}
                rx={win.floor === 'attic' ? 12 : 2}
                fill={
                  isRunning || isSelected
                    ? hasFindings
                      ? 'url(#windowOmen)'
                      : 'url(#windowLit)'
                    : '#08131E'
                }
                stroke={
                  isSelected
                    ? hasFindings
                      ? '#F28B77'
                      : 'var(--pumpkin-fire)'
                    : 'var(--tombstone-gray)'
                }
                strokeWidth={isSelected ? '2' : '1'}
                pointerEvents="none"
              />

              {/* Window Mullions (Panes Grid) */}
              <line
                x1={win.x + win.width / 2}
                y1={win.y}
                x2={win.x + win.width / 2}
                y2={win.y + win.height}
                stroke={isSelected ? (hasFindings ? '#7F1D1D' : '#78350F') : '#1E3A54'}
                strokeWidth="1.2"
                pointerEvents="none"
              />
              <line
                x1={win.x}
                y1={win.y + win.height / 2}
                x2={win.x + win.width}
                y2={win.y + win.height / 2}
                stroke={isSelected ? (hasFindings ? '#7F1D1D' : '#78350F') : '#1E3A54'}
                strokeWidth="1.2"
                pointerEvents="none"
              />

              {/* Ghost Phantom in window if findings exist */}
              {hasFindings && (
                <g pointerEvents="none" opacity="0.9">
                  <path
                    d={`M ${win.x + win.width / 2} ${win.y + win.height / 2 - 4} 
                        C ${win.x + 8} ${win.y + win.height / 2 - 4}, ${win.x + 8} ${win.y + win.height - 8}, ${win.x + win.width / 2} ${win.y + win.height - 8}
                        C ${win.x + win.width - 8} ${win.y + win.height - 8}, ${win.x + win.width - 8} ${win.y + win.height / 2 - 4}, ${win.x + win.width / 2} ${win.y + win.height / 2 - 4} Z`}
                    fill="#F28B77"
                  />
                  <circle
                    cx={win.x + win.width / 2 - 3}
                    cy={win.y + win.height / 2}
                    r="1.5"
                    fill="var(--midnight-veil)"
                  />
                  <circle
                    cx={win.x + win.width / 2 + 3}
                    cy={win.y + win.height / 2}
                    r="1.5"
                    fill="var(--midnight-veil)"
                  />
                </g>
              )}

              {/* Window Sill */}
              <line
                x1={win.x - 4}
                y1={win.y + win.height + 2}
                x2={win.x + win.width + 4}
                y2={win.y + win.height + 2}
                stroke="var(--tombstone-gray)"
                strokeWidth="2.5"
                strokeLinecap="round"
                pointerEvents="none"
              />

              {/* DEDICATED TRANSPARENT HIT TARGET: Isolates hit tracking completely to prevent hover glitching */}
              <rect
                x={win.x - 4}
                y={win.y - 4}
                width={win.width + 8}
                height={win.height + 8}
                fill="transparent"
                pointerEvents="all"
                onMouseEnter={() => setHoveredWindow(win)}
                onMouseLeave={() => setHoveredWindow(null)}
                onClick={() => onToggleProfile(win.id)}
              />
            </g>
          );
        })}

        {/* ================= GOTHIC MAIN ENTRANCE (HAUNT ALL) ================= */}
        <g
          role="button"
          tabIndex={0}
          onClick={onSelectAll}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelectAll();
            }
          }}
          className="cursor-pointer group"
          aria-label={isAllSelected ? 'Deselect all rites' : 'Select all 17 rites'}
        >
          {/* Stone Archway Over Door */}
          <path
            d="M 240 382 L 240 300 C 240 282, 300 282, 300 300 L 300 382 Z"
            fill="var(--midnight-veil)"
            stroke="var(--tombstone-gray)"
            strokeWidth="2"
          />

          {/* Heavy Victorian Oak Door */}
          <path
            d="M 246 382 L 246 304 C 246 290, 294 290, 294 304 L 294 382 Z"
            fill={isAllSelected ? 'var(--ghost-mist)' : '#0B1724'}
            stroke={isAllSelected ? 'var(--pumpkin-fire)' : 'var(--tombstone-gray)'}
            strokeWidth="2"
            className="transition-colors group-hover:fill-[var(--ghost-mist)]"
          />

          {/* Door Panels */}
          <rect
            x="251"
            y="320"
            width="16"
            height="24"
            fill="#08131E"
            stroke="#1E3A54"
            strokeWidth="1"
          />
          <rect
            x="273"
            y="320"
            width="16"
            height="24"
            fill="#08131E"
            stroke="#1E3A54"
            strokeWidth="1"
          />
          <rect
            x="251"
            y="350"
            width="16"
            height="26"
            fill="#08131E"
            stroke="#1E3A54"
            strokeWidth="1"
          />
          <rect
            x="273"
            y="350"
            width="16"
            height="26"
            fill="#08131E"
            stroke="#1E3A54"
            strokeWidth="1"
          />

          {/* Brass Door Knob */}
          <circle cx="288" cy="344" r="2.5" fill="var(--pumpkin-fire)" />

          {/* Door Header Banner: "HAUNT ALL" */}
          <rect
            x="245"
            y="286"
            width="50"
            height="12"
            fill="var(--midnight-veil)"
            stroke="var(--pumpkin-fire)"
            strokeWidth="1"
            rx="2"
          />
          <text
            x="270"
            y="295"
            textAnchor="middle"
            fill="var(--pumpkin-fire)"
            fontSize="7"
            fontFamily="monospace"
            fontWeight="bold"
            letterSpacing="1"
          >
            {isAllSelected ? 'ALL RITES' : 'HAUNT ALL'}
          </text>
        </g>

        {/* ================= PORCH LANTERN (JACK-O'-LANTERN) ================= */}
        {/* Iron Hook Arm */}
        <path
          d="M 230 338 L 220 338 L 220 348"
          stroke="var(--tombstone-gray)"
          strokeWidth="2"
          fill="none"
        />

        {/* Ambient warm light cast on porch when URL is valid */}
        {isUrlValid && (
          <circle
            cx="220"
            cy="358"
            r="42"
            fill="url(#pumpkinGlow)"
            opacity="0.6"
            pointerEvents="none"
          />
        )}

        {/* Carved Pumpkin Body */}
        <g id="jack-o-lantern" transform="translate(208, 348)">
          {/* Pumpkin Stem */}
          <path
            d="M 12 0 C 13 -4, 16 -5, 18 -4"
            stroke="#15803D"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Pumpkin Shell */}
          <ellipse
            cx="12"
            cy="10"
            rx="11"
            ry="9"
            fill={isUrlValid ? '#EA580C' : '#451A03'}
            stroke={isUrlValid ? 'var(--pumpkin-fire)' : 'var(--tombstone-gray)'}
            strokeWidth="1.5"
            className="transition-colors duration-300"
          />

          {/* Carved Eyes and Mouth */}
          {/* Left Eye */}
          <polygon
            points="7,6 9,9 5,9"
            fill={isUrlValid ? '#FEF08A' : '#1C1917'}
            stroke={isUrlValid ? 'var(--pumpkin-fire)' : '#292524'}
            strokeWidth="0.5"
          />
          {/* Right Eye */}
          <polygon
            points="17,6 19,9 15,9"
            fill={isUrlValid ? '#FEF08A' : '#1C1917'}
            stroke={isUrlValid ? 'var(--pumpkin-fire)' : '#292524'}
            strokeWidth="0.5"
          />
          {/* Carved Jagged Grin */}
          <path
            d="M 6 12 L 8 14 L 10 12 L 12 14 L 14 12 L 16 14 L 18 12 L 16 16 L 8 16 Z"
            fill={isUrlValid ? '#FEF08A' : '#1C1917'}
            stroke={isUrlValid ? 'var(--pumpkin-fire)' : '#292524'}
            strokeWidth="0.5"
          />
        </g>
      </svg>
    </div>
  );
};
