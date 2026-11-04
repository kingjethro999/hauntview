/**
 * veil-demo-assets.ts
 *
 * Professional SVG mockups for The Veil interactive preview on the landing page.
 * Strictly zero emojis. Uses clean vector typography and geometric glyphs.
 */

// 1. Living Page: Healthy baseline webpage
const LIVING_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  <rect width="800" height="480" fill="#0d0914" />
  
  <!-- Browser Chrome Header -->
  <rect width="800" height="40" fill="#181124" />
  <circle cx="24" cy="20" r="4.5" fill="#ef4444" />
  <circle cx="39" cy="20" r="4.5" fill="#f59e0b" />
  <circle cx="54" cy="20" r="4.5" fill="#10b981" />
  
  <rect x="75" y="9" width="360" height="22" rx="4" fill="#0d0914" stroke="#2e2142" stroke-width="1" />
  <text x="88" y="24" fill="#a79db5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">https://examplesite.com</text>
  
  <rect x="705" y="10" width="75" height="20" rx="3" fill="#10b981" fill-opacity="0.15" stroke="#10b981" stroke-width="1" />
  <text x="720" y="24" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold">BASELINE</text>

  <!-- Navigation Bar -->
  <rect y="40" width="800" height="52" fill="#130c1e" stroke="#26173a" stroke-width="1" />
  <circle cx="48" cy="66" r="12" fill="#ff791f" />
  <text x="70" y="71" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="15">ExampleSite</text>
  <text x="540" y="70" fill="#9e91ac" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Documentation</text>
  <text x="635" y="70" fill="#9e91ac" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">API Reference</text>
  
  <!-- Hero Section -->
  <text x="48" y="132" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold">Web Resilience &amp; Spirit Diagnostics</text>
  <text x="48" y="156" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Standard living baseline with all network assets and scripts fully loaded.</text>

  <!-- Left: Main Feature Visual Card -->
  <g transform="translate(48, 180)">
    <rect width="400" height="260" rx="6" fill="#171024" stroke="#36224e" stroke-width="1" />
    <defs>
      <linearGradient id="livingPlateGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3d1d60" />
        <stop offset="100%" stop-color="#140a20" />
      </linearGradient>
    </defs>
    <rect x="16" y="16" width="368" height="160" rx="4" fill="url(#livingPlateGrad)" />
    <!-- Graphical Geometric Elements -->
    <circle cx="200" cy="96" r="42" fill="#ff791f" fill-opacity="0.2" stroke="#ff791f" stroke-width="1.5" />
    <path d="M 175 106 L 200 76 L 225 106 Z" fill="#ff791f" />
    
    <text x="16" y="205" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="14" font-weight="600">Hero Media Component</text>
    <text x="16" y="226" fill="#34d399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Dimensions reserved (368x160) · Valid alt description · CDN 200 OK</text>
  </g>

  <!-- Right: Side Inspection Panels -->
  <g transform="translate(470, 180)">
    <rect width="280" height="120" rx="6" fill="#171024" stroke="#36224e" stroke-width="1" />
    <circle cx="36" cy="36" r="14" fill="#34d399" fill-opacity="0.15" stroke="#34d399" stroke-width="1" />
    <path d="M 31 36 L 35 40 L 42 32" fill="none" stroke="#34d399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <text x="60" y="36" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Interactive Targets</text>
    <text x="60" y="54" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Minimum 48x48px touch boundaries.</text>
    <rect x="60" y="70" width="120" height="32" rx="4" fill="#ff791f" />
    <text x="88" y="90" fill="#0d0914" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="bold">Action Button</text>
  </g>

  <g transform="translate(470, 318)">
    <rect width="280" height="122" rx="6" fill="#171024" stroke="#36224e" stroke-width="1" />
    <circle cx="36" cy="36" r="14" fill="#60a5fa" fill-opacity="0.15" stroke="#60a5fa" stroke-width="1" />
    <path d="M 30 36 L 42 36 M 36 30 L 36 42" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" />
    <text x="60" y="36" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Font Rendering</text>
    <text x="60" y="54" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Primary web font loaded with zero layout shift.</text>
    <text x="60" y="80" fill="#a79db5" font-family="monospace" font-size="11">font-display: swap;</text>
  </g>
</svg>
`.trim();

// 2. Apparition: Failure condition (Asset CDN Blocked & Layout Collapse)
const APPARITION_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  <rect width="800" height="480" fill="#0d0914" />
  
  <!-- Browser Chrome Header with Alert -->
  <rect width="800" height="40" fill="#181124" />
  <circle cx="24" cy="20" r="4.5" fill="#ef4444" />
  <circle cx="39" cy="20" r="4.5" fill="#f59e0b" />
  <circle cx="54" cy="20" r="4.5" fill="#10b981" />
  
  <rect x="75" y="9" width="360" height="22" rx="4" fill="#0d0914" stroke="#2e2142" stroke-width="1" />
  <text x="88" y="24" fill="#a79db5" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">https://examplesite.com</text>
  
  <rect x="660" y="10" width="120" height="20" rx="3" fill="#dc2626" fill-opacity="0.2" stroke="#dc2626" stroke-width="1" />
  <text x="672" y="24" fill="#f87171" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold">IMAGES BLOCKED</text>

  <!-- Navigation Bar -->
  <rect y="40" width="800" height="52" fill="#130c1e" stroke="#26173a" stroke-width="1" />
  <circle cx="48" cy="66" r="12" fill="#ff791f" />
  <text x="70" y="71" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="bold" font-size="15">ExampleSite</text>
  <text x="540" y="70" fill="#9e91ac" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">Documentation</text>
  <text x="635" y="70" fill="#9e91ac" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12">API Reference</text>
  
  <!-- Hero Section -->
  <text x="48" y="132" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="bold">Web Resilience &amp; Spirit Diagnostics</text>
  <text x="48" y="156" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13">Standard living baseline with all network assets and scripts fully loaded.</text>

  <!-- Left: COLLAPSED Image Component (Failure Condition) -->
  <g transform="translate(48, 180)">
    <!-- Broken Outline Box -->
    <rect width="400" height="120" rx="6" fill="#140a1b" stroke="#dc2626" stroke-dasharray="5 5" stroke-width="1.5" />
    <circle cx="40" cy="40" r="14" fill="#dc2626" fill-opacity="0.15" stroke="#dc2626" stroke-width="1" />
    <path d="M 33 40 L 47 40 M 40 33 L 40 47" stroke="#dc2626" stroke-width="2" stroke-linecap="round" transform="rotate(45, 40, 40)" />
    
    <text x="68" y="36" fill="#f87171" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Asset Load Failure (HTTP 404 / Blocked)</text>
    <text x="68" y="54" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">&lt;img&gt; missing explicit width/height attributes</text>
    <text x="68" y="74" fill="#ff791f" font-family="monospace" font-size="10">Layout collapsed 140px — Cumulative Layout Shift: 0.32</text>
  </g>

  <!-- Shifted Content beneath collapsed element -->
  <g transform="translate(48, 315)">
    <rect width="400" height="125" rx="6" fill="#171024" stroke="#ff791f" stroke-width="1" />
    <text x="16" y="32" fill="#ff791f" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold">Notice: Unintended Layout Displacement</text>
    <text x="16" y="52" fill="#d9d3e0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Content shifted upwards due to collapsed parent container.</text>
    <rect x="16" y="68" width="160" height="34" rx="4" fill="#2d1f3d" stroke="#ff791f" stroke-width="1" />
    <text x="32" y="89" fill="#ff791f" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11" font-weight="600">Displaced Action</text>
  </g>

  <!-- Right: Side Inspection Panels with Collision Defect -->
  <g transform="translate(470, 180)">
    <rect width="280" height="120" rx="6" fill="#171024" stroke="#36224e" stroke-width="1" />
    <circle cx="36" cy="36" r="14" fill="#f59e0b" fill-opacity="0.15" stroke="#f59e0b" stroke-width="1" />
    <text x="60" y="36" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Interactive Targets</text>
    <text x="60" y="54" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Minimum 48x48px touch boundaries.</text>
    <!-- Truncated/Sub-minimum touch target -->
    <rect x="60" y="70" width="80" height="24" rx="3" fill="#dc2626" />
    <text x="74" y="86" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="10" font-weight="bold">Action</text>
    <text x="150" y="86" fill="#f87171" font-family="monospace" font-size="10">24px &lt; 44px</text>
  </g>

  <g transform="translate(470, 318)">
    <rect width="280" height="122" rx="6" fill="#171024" stroke="#36224e" stroke-width="1" />
    <circle cx="36" cy="36" r="14" fill="#60a5fa" fill-opacity="0.15" stroke="#60a5fa" stroke-width="1" />
    <path d="M 30 36 L 42 36 M 36 30 L 36 42" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" />
    <text x="60" y="36" fill="#ffffff" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="600">Font Rendering</text>
    <text x="60" y="54" fill="#8d7f9e" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="11">Primary web font loaded with zero layout shift.</text>
    <text x="60" y="80" fill="#a79db5" font-family="monospace" font-size="11">font-display: swap;</text>
  </g>
</svg>
`.trim();

// 3. Ectoplasm Diff: Precise pixel differences highlighted in radiant green
const DIFF_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 480" width="100%" height="100%">
  <defs>
    <filter id="ectoGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <rect width="800" height="480" fill="#07040a" />
  
  <!-- Subtle silhouette boundaries of unaffected page chrome -->
  <rect width="800" height="40" fill="#100b17" fill-opacity="0.4" />
  <rect y="40" width="800" height="52" fill="#0d0814" fill-opacity="0.4" />

  <!-- Ectoplasm Region 1: Exact Missing Hero Canvas -->
  <g filter="url(#ectoGlow)">
    <rect x="48" y="180" width="400" height="260" rx="6" fill="rgba(154, 255, 154, 0.08)" stroke="#9aff9a" stroke-width="1.5" />
    <rect x="64" y="196" width="368" height="160" rx="4" fill="rgba(154, 255, 154, 0.22)" stroke="#9aff9a" stroke-width="1" />
    <text x="76" y="240" fill="#9aff9a" font-family="monospace" font-size="12" font-weight="bold">ECTOPLASM DIFF #1 · 14,280 PIXELS ALTERED</text>
    <text x="76" y="260" fill="#9aff9a" font-family="monospace" font-size="10">Missing Image Plate · Bounding Dimension Collapse</text>
  </g>

  <!-- Ectoplasm Region 2: Touch Target Mutation -->
  <g filter="url(#ectoGlow)">
    <rect x="530" y="250" width="120" height="34" rx="4" fill="rgba(154, 255, 154, 0.25)" stroke="#9aff9a" stroke-width="1.5" />
    <text x="540" y="272" fill="#9aff9a" font-family="monospace" font-size="10" font-weight="bold">DIFF #2 · TARGET COLLISION</text>
  </g>
</svg>
`.trim();

export const DEMO_LIVING_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(LIVING_SVG)}`;
export const DEMO_APPARITION_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(APPARITION_SVG)}`;
export const DEMO_DIFF_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(DIFF_SVG)}`;
