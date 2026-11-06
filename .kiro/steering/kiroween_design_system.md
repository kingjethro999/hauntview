---
inclusion: always
---

# Kiroween Design System — HauntView

This steering document codifies the visual language, motion rules, and accessibility
floor for the HauntView UI (the Costume). Kiro **must** follow these rules when
generating or editing any file under `app/`, `packages/web/`, or `app/components/`.

## Design Tokens — CSS Custom Properties Only

**Never hardcode** colors, font families, spacing, border radii, or motion durations.
Every value must reference a CSS custom property from `app/components/design-tokens.css`.

```css
/* Good */
color: var(--color-ghostly-white);
background: var(--color-midnight-black);
transition: opacity var(--motion-duration-subtle) ease;

/* Bad — never */
color: #f5f5fa;
background: #0f0f14;
transition: opacity 200ms ease;
```

### Primary Palette

| Token                    | Value     | Role                        |
| ------------------------ | --------- | --------------------------- |
| `--color-midnight-black` | `#0F0F14` | Page background             |
| `--color-haunted-purple` | `#582696` | Primary brand / interactive |
| `--color-crimson-orange` | `#DC6428` | Accent / CTA                |
| `--color-ghostly-white`  | `#F5F5FA` | Body text                   |
| `--color-shadow-gray`    | `#646478` | Muted text, borders         |
| `--color-deep-gray`      | `#373746` | Card surfaces               |

### Severity Tokens

| Severity  | Token                      | Plain label      |
| --------- | -------------------------- | ---------------- |
| `info`    | `--color-severity-info`    | Info / Whisper   |
| `warning` | `--color-severity-warning` | Warning / Chill  |
| `serious` | `--color-severity-serious` | Serious / Scream |

Severity must never be conveyed by color alone — always pair with an icon shape
and a text label (`Info`, `Warning`, `Serious`).

## Typography

- Use `@fontsource/*` bundled fonts only. No Google Fonts CDN.
- Body: `var(--font-body)` — a serif or humanist typeface (e.g., IM Fell English or Lora).
- Monospace/code: `var(--font-mono)` — (e.g., JetBrains Mono).
- Display/heading: `var(--font-display)` — gothic or slab serif for atmosphere.
- Minimum body text size: `var(--font-size-base)` ≥ 16px.
- All body text must pass WCAG AA contrast (4.5:1) against its background.

## Motion Rules

```css
/* Atmosphere Off or prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.001ms !important;
    transition-duration: 0.001ms !important;
  }
}
```

- **No animation above 3 Hz.** No rapid flashing or strobing effects.
- All ghost, fog, moth, bat, and House animations respect the `Atmosphere` setting
  (Off / Subtle / Full) stored in localStorage under `hauntview.atmosphere`.
- Every animated element has a static CSS fallback visible when motion is off.
- Duration tokens: `--motion-duration-instant` (0ms), `--motion-duration-subtle`
  (150ms), `--motion-duration-normal` (300ms), `--motion-duration-slow` (600ms).
- The **Veil** comparison slider's entrance animation (`--motion-duration-normal`)
  is the single orchestrated entrance animation of the results view. Nothing else
  animates in at the same time.

## Accessibility Floor

The UI must pass HauntView's own Accessibility rite with zero serious violations
on every route. Specific requirements:

1. All interactive elements: visible focus ring using `var(--color-crimson-orange)`
   at 2px offset, 2px width (`:focus-visible` only, not `:focus`).
2. Touch targets: minimum 44×44 CSS px (buttons, links, checkboxes).
3. ARIA: every icon-only button has `aria-label`. Every status indicator has
   `role="status"` or `aria-live="polite"`.
4. Keyboard: full keyboard navigation — Tab, Shift+Tab, Enter, Space, Escape,
   Arrow keys on lists. The Veil slider is operable with Arrow keys.
5. `forced-colors` mode: all components must be distinguishable. Use
   `@media (forced-colors: active)` overrides where needed.
6. No autoplaying audio. The ambient audio system starts only on explicit user
   interaction and respects the Atmosphere setting.

## Component Patterns

### The Veil (comparison slider)

- Renders two `<img>` elements stacked, with a draggable divider.
- Divider position is a CSS custom property `--veil-position: 50%` updated via JS.
- Ghost pins (`<button role="img" aria-label="Finding: {title}">`) overlay the Veil
  and are focusable.
- ARIA: `<div role="slider" aria-label="Compare living page and apparition" aria-valuenow="{0-100}">`

### CandleIndicator

- One candle SVG per rite. State drives the visual variant:
  `queued` → unlit, `running` → flickering, `ok` → steady, `findings` → guttering,
  `skipped` → hollow holder, `error` → snuffed.
- Animation is CSS keyframes only (`@keyframes flicker`). Respects reduced-motion.

### Severity Chips

```tsx
<SeverityChip severity="warning">
  {/* icon shape (not color-only) + plain label */}
  <WarningIcon aria-hidden="true" />
  <span>Warning</span>
</SeverityChip>
```

### WispGhost

- Wisp reflects app state: idle, running, finding-serious, finding-info, error, complete.
- SVG-based. One Wisp per page. Does not overlay interactive content.
- Atmosphere Off: static SVG, no animation.

## Lore / Copy Rules (summary — full rules in AGENTS.md §3.3)

- Functional text (buttons, errors, labels): plain English, sentence case, no lore.
- Atmospheric text (headings, empty states): one lore term + plain subtitle.
- Maximum one lore term per sentence.
- Errors never joke. Errors state what happened and what to do next.

## HTML / CSS Conventions

- Use semantic HTML: `<main>`, `<nav>`, `<section aria-labelledby>`, `<article>`,
  `<aside>`, `<header>`, `<footer>`.
- CSS: plain CSS with custom properties. No inline styles for design values.
- No `!important` outside of the reduced-motion reset above.
- Class names: BEM-lite kebab-case (`veil__slider`, `candle--guttering`).
- No UI kit (no Radix, no Shadcn) — components are hand-rolled to the spec.
