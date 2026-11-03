/**
 * veil-demo-assets.ts
 *
 * High-fidelity SVG mockups for The Veil interactive preview on the landing page.
 * Demonstrates a living page baseline vs. an apparition failure condition
 * (images blocked + layout shift) with ectoplasm pixel diff.
 */

// 1. Living Page: Clean, healthy website as built by developers
const LIVING_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" fill="#0d0914" />
  
  <!-- Browser Chrome Header -->
  <rect width="800" height="42" fill="#1b1226" />
  <circle cx="24" cy="21" r="5" fill="#ef4444" />
  <circle cx="40" cy="21" r="5" fill="#f59e0b" />
  <circle cx="56" cy="21" r="5" fill="#10b981" />
  <rect x="80" y="10" width="340" height="22" rx="4" fill="#0d0914" />
  <text x="94" y="25" fill="#a79db5" font-family="system-ui, sans-serif" font-size="11">https://promptdock-mini.vercel.app</text>
  <rect x="710" y="11" width="70" height="20" rx="3" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="1" />
  <text x="722" y="25" fill="#34d399" font-family="system-ui, sans-serif" font-size="10" font-weight="bold">HEALTHY</text>

  <!-- Navigation Bar -->
  <rect y="42" width="800" height="54" fill="#140d1e" />
  <circle cx="48" cy="69" r="14" fill="#ff791f" />
  <text x="72" y="74" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="bold" font-size="16">PromptDock</text>
  <text x="530" y="74" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="13">Features</text>
  <text x="610" y="74" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="13">Docs</text>
  <rect x="670" y="56" width="100" height="28" rx="4" fill="#ff791f" />
  <text x="696" y="74" fill="#140d1e" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Launch App</text>

  <!-- Hero Content -->
  <text x="48" y="145" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="bold">Automate Chaos &amp; Web Resilience</text>
  <text x="48" y="176" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="14">Verify your frontend across 25 failure modes before real users arrive.</text>
  
  <!-- Hero Image (Living: Loaded & Responsive) -->
  <rect x="48" y="200" width="360" height="220" rx="8" fill="#241738" stroke="#3d275e" stroke-width="1.5" />
  <defs>
    <linearGradient id="heroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4a2675" />
      <stop offset="50%" stop-color="#ff791f" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#140d1e" />
    </linearGradient>
  </defs>
  <rect x="58" y="210" width="340" height="150" rx="6" fill="url(#heroGrad)" />
  <circle cx="120" cy="260" r="28" fill="#ffffff" fill-opacity="0.15" />
  <path d="M 58 330 Q 150 270 240 330 T 398 310 L 398 360 L 58 360 Z" fill="#1b1226" fill-opacity="0.8" />
  <text x="58" y="385" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="600">Living Photo Plate: Intact Hero Banner</text>
  <text x="58" y="405" fill="#34d399" font-family="system-ui, sans-serif" font-size="11">✓ Dimensions reserved · Alt text intact · 60 FPS</text>

  <!-- Right Side Cards -->
  <rect x="440" y="200" width="320" height="95" rx="6" fill="#1a1224" stroke="#332145" stroke-width="1" />
  <rect x="456" y="218" width="32" height="32" rx="6" fill="#3d275e" />
  <text x="467" y="240" fill="#ff791f" font-family="system-ui, sans-serif" font-size="16">⚡</text>
  <text x="500" y="234" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Zero JS Degradation</text>
  <text x="500" y="254" fill="#8d7f9e" font-family="system-ui, sans-serif" font-size="11">Static HTML hydrates cleanly with fallbacks.</text>

  <rect x="440" y="315" width="320" height="95" rx="6" fill="#1a1224" stroke="#332145" stroke-width="1" />
  <rect x="456" y="333" width="32" height="32" rx="6" fill="#3d275e" />
  <text x="466" y="355" fill="#34d399" font-family="system-ui, sans-serif" font-size="16">🛡</text>
  <text x="500" y="349" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="600">WCAG AA Accessible</text>
  <text x="500" y="369" fill="#8d7f9e" font-family="system-ui, sans-serif" font-size="11">All contrast ratios &gt; 4.5:1 with proper roles.</text>
</svg>
`.trim();

// 2. Apparition: Failure condition (Images blocked, layout collapse, missing alt)
const APPARITION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" fill="#0d0914" />
  
  <!-- Browser Chrome Header with Warning -->
  <rect width="800" height="42" fill="#1b1226" />
  <circle cx="24" cy="21" r="5" fill="#ef4444" />
  <circle cx="40" cy="21" r="5" fill="#f59e0b" />
  <circle cx="56" cy="21" r="5" fill="#10b981" />
  <rect x="80" y="10" width="340" height="22" rx="4" fill="#0d0914" />
  <text x="94" y="25" fill="#a79db5" font-family="system-ui, sans-serif" font-size="11">https://promptdock-mini.vercel.app</text>
  <rect x="670" y="11" width="110" height="20" rx="3" fill="#dc2626" fill-opacity="0.2" stroke="#dc2626" stroke-width="1" />
  <text x="678" y="25" fill="#f87171" font-family="system-ui, sans-serif" font-size="10" font-weight="bold">IMAGES BLOCKED</text>

  <!-- Navigation Bar -->
  <rect y="42" width="800" height="54" fill="#140d1e" />
  <circle cx="48" cy="69" r="14" fill="#ff791f" />
  <text x="72" y="74" fill="#ffffff" font-family="system-ui, sans-serif" font-weight="bold" font-size="16">PromptDock</text>
  <text x="530" y="74" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="13">Features</text>
  <text x="610" y="74" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="13">Docs</text>
  <rect x="670" y="56" width="100" height="28" rx="4" fill="#ff791f" />
  <text x="696" y="74" fill="#140d1e" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Launch App</text>

  <!-- Hero Content -->
  <text x="48" y="145" fill="#ffffff" font-family="system-ui, sans-serif" font-size="28" font-weight="bold">Automate Chaos &amp; Web Resilience</text>
  <text x="48" y="176" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="14">Verify your frontend across 25 failure modes before real users arrive.</text>
  
  <!-- Hero Image COLLAPSED / BROKEN (Apparition Defect) -->
  <rect x="48" y="200" width="360" height="90" rx="8" fill="#1b1226" stroke="#dc2626" stroke-dasharray="4 4" stroke-width="2" />
  <text x="180" y="240" fill="#ef4444" font-family="system-ui, sans-serif" font-size="24">⚠️</text>
  <text x="130" y="265" fill="#ef4444" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">BROKEN IMAGE: missing-alt-text</text>
  <text x="100" y="280" fill="#8d7f9e" font-family="system-ui, sans-serif" font-size="10">Layout shifted 130px · &lt;img&gt; lacks width/height attributes</text>

  <!-- Shifted Content below collapsed hero -->
  <rect x="48" y="310" width="360" height="70" rx="6" fill="#1a1224" stroke="#ff791f" stroke-width="1" />
  <text x="65" y="335" fill="#ff791f" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">Notice: Unreserved Viewport Shift</text>
  <text x="65" y="355" fill="#9e91ac" font-family="system-ui, sans-serif" font-size="11">Content bounced upward, breaking layout stability (CLS: 0.28).</text>

  <!-- Right Side Cards (Slightly Misaligned under Chaos) -->
  <rect x="440" y="200" width="320" height="95" rx="6" fill="#1a1224" stroke="#332145" stroke-width="1" />
  <rect x="456" y="218" width="32" height="32" rx="6" fill="#3d275e" />
  <text x="467" y="240" fill="#ff791f" font-family="system-ui, sans-serif" font-size="16">⚡</text>
  <text x="500" y="234" fill="#ffffff" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Zero JS Degradation</text>
  <text x="500" y="254" fill="#8d7f9e" font-family="system-ui, sans-serif" font-size="11">Static HTML hydrates cleanly with fallbacks.</text>

  <rect x="440" y="315" width="320" height="95" rx="6" fill="#1a1224" stroke="#dc2626" stroke-width="1.5" />
  <rect x="456" y="333" width="32" height="32" rx="6" fill="#451821" />
  <text x="466" y="355" fill="#ef4444" font-family="system-ui, sans-serif" font-size="16">✕</text>
  <text x="500" y="349" fill="#f87171" font-family="system-ui, sans-serif" font-size="14" font-weight="600">Touch Target Collision</text>
  <text x="500" y="369" fill="#ef4444" font-family="system-ui, sans-serif" font-size="11">Button target is 22px &lt; 44px minimum touch target.</text>
</svg>
`.trim();

// 3. Ectoplasm Diff: Highlighting altered pixels in luminous green
const DIFF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <rect width="800" height="500" fill="#07040a" />
  
  <!-- Subtle silhouette of living layout -->
  <rect width="800" height="42" fill="#100b17" fill-opacity="0.4" />
  <rect y="42" width="800" height="54" fill="#0d0814" fill-opacity="0.4" />

  <!-- ECTOPLASM DIFF REGION 1: Broken/Collapsed Hero Banner -->
  <g filter="drop-shadow(0 0 10px rgba(154, 255, 154, 0.7))">
    <rect x="48" y="200" width="360" height="220" rx="8" fill="rgba(154, 255, 154, 0.15)" stroke="#9aff9a" stroke-width="2" />
    <rect x="58" y="210" width="340" height="150" fill="rgba(154, 255, 154, 0.35)" />
    <text x="68" y="240" fill="#9aff9a" font-family="monospace" font-size="12" font-weight="bold">DIFF REGION #1: 14,200 PIXELS ALTERED</text>
    <text x="68" y="260" fill="#9aff9a" font-family="monospace" font-size="10">Hero image collapsed (Missing width/height reservations)</text>
  </g>

  <!-- ECTOPLASM DIFF REGION 2: Shifted Banner underneath -->
  <g filter="drop-shadow(0 0 8px rgba(154, 255, 154, 0.6))">
    <rect x="48" y="310" width="360" height="70" rx="6" fill="rgba(154, 255, 154, 0.2)" stroke="#9aff9a" stroke-width="1.5" />
    <text x="65" y="340" fill="#9aff9a" font-family="monospace" font-size="11" font-weight="bold">DIFF REGION #2: LAYOUT DISPLACEMENT</text>
  </g>

  <!-- ECTOPLASM DIFF REGION 3: Touch Target Box -->
  <g filter="drop-shadow(0 0 8px rgba(154, 255, 154, 0.6))">
    <rect x="440" y="315" width="320" height="95" rx="6" fill="rgba(154, 255, 154, 0.25)" stroke="#9aff9a" stroke-width="2" />
    <text x="460" y="360" fill="#9aff9a" font-family="monospace" font-size="11" font-weight="bold">DIFF REGION #3: OVERLAPPING TARGET</text>
  </g>
</svg>
`.trim();

export const DEMO_LIVING_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(LIVING_SVG)}`;
export const DEMO_APPARITION_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(APPARITION_SVG)}`;
export const DEMO_DIFF_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(DIFF_SVG)}`;
