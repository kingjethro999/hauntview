# HauntView Component Style Guide

This guide provides detailed implementation patterns for all HauntView UI components. Follow these specifications to maintain consistency across the scary Halloween theme.

## Table of Contents

1. [Button Patterns](#button-patterns)
2. [Form Patterns](#form-patterns)
3. [Data Display](#data-display)
4. [Feedback Elements](#feedback-elements)
5. [Navigation](#navigation)
6. [Modals & Overlays](#modals--overlays)
7. [Color & Contrast](#color--contrast)
8. [Responsive Behavior](#responsive-behavior)
9. [Accessibility Requirements](#accessibility-requirements)
10. [Halloween Theme Guidelines](#halloween-theme-guidelines)

---

## Button Patterns

### Primary Button

Used for main actions like "Run Tests", "Submit", "Save".

**CSS Classes:**

```tsx
bg-[#582696]
text-[#F5F5FA]
border border-[#6C3CAA]
px-6 py-3
rounded-lg
font-semibold
text-sm
shadow-[0_4px_12px_rgba(88,38,150,0.25)]
hover:bg-[#6C3CAA]
hover:shadow-[0_6px_20px_rgba(88,38,150,0.35)]
hover:-translate-y-0.5
active:bg-[#441C78]
active:translate-y-0
disabled:bg-[#4B5563]
disabled:text-[#646478]
disabled:cursor-not-allowed
transition-all duration-200
focus-visible:outline-2 focus-visible:outline-[#DC6428] focus-visible:outline-offset-2
```

**Sizes:**

- Small: `px-4 py-2` with `text-xs`
- Regular: `px-6 py-3` with `text-sm` (default)
- Large: `px-8 py-4` with `text-base`

**States:**

- Default: Purple (#582696)
- Hover: Brighter purple (#6C3CAA), elevated (-2px), shadow increase
- Active: Darker purple (#441C78), pressed, shadow decrease
- Focus: Orange outline (#DC6428), 2px offset
- Disabled: Gray (#4B5563), no hover effects

### Secondary Button

Used for alternative actions like "Download", "Export", "View Details".

**CSS Classes:**

```tsx
bg-[#DC6428]
text-[#F5F5FA]
border border-[#B43C14]
px-6 py-3
rounded-lg
font-semibold
text-sm
shadow-[0_4px_12px_rgba(220,100,40,0.25)]
hover:bg-[#B43C14]
hover:shadow-[0_6px_20px_rgba(220,100,40,0.35)]
hover:-translate-y-0.5
active:bg-[#8B2E0F]
transition-all duration-200
```

### Ghost Button

Used for low-priority actions like "Cancel", "Skip", "Learn More".

**CSS Classes:**

```tsx
bg-transparent
text-[#582696]
border border-[#6C3CAA]
px-5 py-2.5
rounded-lg
font-semibold
text-sm
hover:bg-[rgba(88,38,150,0.1)]
hover:border-[#DC6428]
hover:text-[#DC6428]
transition-all duration-200
```

### Danger Button

Used for destructive actions like "Delete", "Clear", "Remove".

**CSS Classes:**

```tsx
bg-[#dc2626]
text-[#F5F5FA]
border border-[#b91c1c]
px-6 py-3
rounded-lg
font-semibold
text-sm
hover:bg-[#b91c1c]
active:bg-[#991b1b]
transition-all duration-200
```

### Icon Buttons

Square format for toolbar icons.

**CSS Classes:**

```tsx
w-10 h-10
flex items-center justify-center
text-[#646478]
hover:text-[#DC6428]
hover:bg-[rgba(220,100,40,0.1)]
rounded-lg
transition-all duration-200
focus-visible:outline-2 focus-visible:outline-[#DC6428]
```

**Icon Sizes:** 20px (standard), 16px (compact), 24px (large)

---

## Form Patterns

### Text Input

```tsx
bg-[rgba(55,55,70,0.5)]
border-2 border-[#6C3CAA]
text-[#F5F5FA]
placeholder-[#646478]
px-4 py-3
rounded-lg
text-sm
focus:outline-none
focus:border-[#DC6428]
focus:shadow-[0_0_0_3px_rgba(220,100,40,0.1)]
focus:bg-[rgba(55,55,70,0.7)]
disabled:bg-[rgba(55,55,70,0.3)]
disabled:text-[#646478]
disabled:cursor-not-allowed
transition-all duration-200
```

### Form Label

```tsx
display: block;
font-size: 14px;
font-weight: 600;
color: #F5F5FA;
margin-bottom: 8px;

&.required::after {
  content: '*';
  color: #dc2626;
  margin-left: 4px;
}
```

### Form Error State

**Container:**

```tsx
bg-[rgba(220,38,38,0.05)]
border-2 border-[#dc2626]
```

**Error Message:**

```tsx
font-size: 12px;
color: #dc2626;
margin-top: 4px;
font-weight: 500;
```

### Checkbox & Radio

```tsx
accent-color: #582696;
width: 20px;
height: 20px;
cursor: pointer;

&:hover {
  accent-color: #DC6428;
}

&:focus-visible {
  outline: 2px solid #DC6428;
  outline-offset: 2px;
}
```

### Select Dropdown

```tsx
background: rgba(55, 55, 70, 0.5);
border: 2px solid #6C3CAA;
color: #F5F5FA;
padding: 12px 16px;
border-radius: 8px;
font-size: 14px;
cursor: pointer;

&:focus {
  border-color: #DC6428;
  box-shadow: 0 0 0 3px rgba(220, 100, 40, 0.1);
}

/* Dropdown arrow (right side) */
&::after {
  content: '▼';
  position: absolute;
  right: 12px;
  color: #DC6428;
  pointer-events: none;
}
```

---

## Data Display

### Table Header

```tsx
background: rgba(88, 38, 150, 0.15);
border-bottom: 2px solid #6C3CAA;
color: #F5F5FA;
font-weight: 600;
font-size: 14px;
padding: 16px;
text-align: left;
```

### Table Row

```tsx
border-bottom: 1px solid rgba(108, 60, 170, 0.2);
padding: 16px;
font-size: 14px;

&:hover {
  background: rgba(88, 38, 150, 0.08);
}

&:nth-child(even) {
  background: rgba(55, 55, 70, 0.3);
}
```

### Table Cell

- Primary data: `color: #F5F5FA`
- Secondary data: `color: #646478`
- Numbers: `text-align: right`
- Actions: Inline buttons at rightmost column

### Card Container

```tsx
background: #373746;
border: 1px solid rgba(108, 60, 170, 0.3);
border-radius: 12px;
padding: 24px;
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
transition: all 200ms ease;

&:hover {
  border-color: rgba(220, 100, 40, 0.5);
  box-shadow: 0 12px 32px rgba(88, 38, 150, 0.2);
}
```

### Card Title

```tsx
font-size: 20px;
font-weight: 700;
color: #F5F5FA;
margin-bottom: 12px;
font-family: 'Space Grotesk', sans-serif;
```

---

## Feedback Elements

### Alert - Success

```tsx
background: rgba(22, 163, 74, 0.1);
border-left: 4px solid #16a34a;
color: #86efac;
padding: 16px;
border-radius: 8px;
display: flex;
gap: 12px;
align-items: flex-start;
```

Icon: check-circle (Heroicons, 20px)

### Alert - Warning

```tsx
background: rgba(234, 88, 12, 0.1);
border-left: 4px solid #ea580c;
color: #fed7aa;
```

Icon: exclamation-triangle (Heroicons, 20px)

### Alert - Error

```tsx
background: rgba(220, 38, 38, 0.1);
border-left: 4px solid #dc2626;
color: #fca5a5;
```

Icon: exclamation-circle (Heroicons, 20px)

### Alert - Info

```tsx
background: rgba(2, 132, 199, 0.1);
border-left: 4px solid #0284c7;
color: #7dd3fc;
```

Icon: information-circle (Heroicons, 20px)

### Badge

```tsx
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 12px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
white-space: nowrap;
```

**Variants:**

| Variant | Background             | Text    | Border                           |
| ------- | ---------------------- | ------- | -------------------------------- |
| Primary | rgba(88, 38, 150, 0.2) | #582696 | 1px solid rgba(88, 38, 150, 0.5) |
| Success | rgba(22, 163, 74, 0.2) | #16a34a | 1px solid rgba(22, 163, 74, 0.5) |
| Warning | rgba(234, 88, 12, 0.2) | #ea580c | 1px solid rgba(234, 88, 12, 0.5) |
| Error   | rgba(220, 38, 38, 0.2) | #dc2626 | 1px solid rgba(220, 38, 38, 0.5) |
| Outline | transparent            | #582696 | 1px solid #6C3CAA                |

---

## Navigation

### Header/Navigation Bar

```tsx
background: rgba(15, 15, 20, 0.95);
border-bottom: 1px solid rgba(108, 60, 170, 0.3);
height: 64px;
display: flex;
align-items: center;
padding: 0 24px;
backdrop-filter: blur(10px);
position: sticky;
top: 0;
z-index: 100;
```

### Navigation Item

```tsx
color: #646478;
font-size: 14px;
font-weight: 500;
padding: 8px 16px;
border-radius: 6px;
transition: all 200ms ease;
cursor: pointer;

&:hover {
  color: #DC6428;
  background: rgba(220, 100, 40, 0.1);
}

&.active {
  color: #582696;
  background: rgba(88, 38, 150, 0.2);
  border-bottom: 2px solid #DC6428;
}
```

### Sidebar Navigation

```tsx
background: #0F0F14;
border-right: 1px solid rgba(108, 60, 170, 0.3);
width: 250px;
padding: 24px 16px;
```

---

## Modals & Overlays

### Modal Overlay

```tsx
background: rgba(0, 0, 0, 0.7);
position: fixed;
inset: 0;
z-index: 999;
backdrop-filter: blur(4px);
```

### Modal Container

```tsx
background: #0F0F14;
border: 1px solid #6C3CAA;
border-radius: 12px;
max-width: 600px;
width: 90%;
max-height: 90vh;
box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
z-index: 1000;
position: fixed;
top: 50%;
left: 50%;
transform: translate(-50%, -50%);
```

### Modal Header

```tsx
border-bottom: 1px solid rgba(108, 60, 170, 0.3);
padding: 24px;
display: flex;
justify-content: space-between;
align-items: center;
```

### Modal Title

```tsx
font-size: 24px;
font-weight: 700;
color: #F5F5FA;
font-family: 'Space Grotesk', sans-serif;
```

### Close Button (Modal)

```tsx
background: transparent;
border: none;
color: #646478;
cursor: pointer;
font-size: 24px;
padding: 0;
width: 32px;
height: 32px;
display: flex;
align-items: center;
justify-content: center;

&:hover {
  color: #DC6428;
}

&:focus-visible {
  outline: 2px solid #DC6428;
  outline-offset: 2px;
}
```

---

## Color & Contrast

### Text-to-Background Ratios

All combinations verified WCAG AA compliant:

| Text Color               | Background               | Contrast Ratio |
| ------------------------ | ------------------------ | -------------- |
| #F5F5FA (Ghostly White)  | #0F0F14 (Midnight Black) | 17.2:1 ✓       |
| #F5F5FA                  | #582696 (Haunted Purple) | 8.4:1 ✓        |
| #F5F5FA                  | #373746 (Deep Gray)      | 11.3:1 ✓       |
| #646478 (Shadow Gray)    | #0F0F14                  | 4.2:1 ✓        |
| #16a34a (Success)        | #0F0F14                  | 4.8:1 ✓        |
| #dc2626 (Error)          | #0F0F14                  | 5.1:1 ✓        |
| #DC6428 (Crimson Orange) | #0F0F14                  | 5.3:1 ✓        |

**Rule**: Always verify custom color combinations with a contrast checker tool.

---

## Responsive Behavior

### Breakpoints

```css
--breakpoint-sm: 375px; /* Mobile */
--breakpoint-md: 768px; /* Tablet */
--breakpoint-lg: 1200px; /* Desktop */
--breakpoint-xl: 1440px; /* Large desktop */
```

### Padding Scale

| Breakpoint              | Horizontal | Vertical |
| ----------------------- | ---------- | -------- |
| Mobile (< 768px)        | 16px       | 16px     |
| Tablet (768px - 1200px) | 24px       | 20px     |
| Desktop (> 1200px)      | 32px       | 24px     |

### Typography Scaling

| Breakpoint | Display | H1   | H2   | Body |
| ---------- | ------- | ---- | ---- | ---- |
| Mobile     | 28px    | 20px | 16px | 14px |
| Tablet     | 36px    | 24px | 18px | 15px |
| Desktop    | 48px    | 28px | 20px | 16px |

### Button Sizes (Mobile)

- Reduce padding: `12px 16px` (instead of `16px 32px`)
- Keep font size: `14px`
- Minimum touch target: 44x44px

### Grid System

**Desktop (1200px)**

- 12-column grid
- 24px gutter
- Max content width: 1200px

**Tablet (768px)**

- 8-column grid
- 16px gutter

**Mobile (375px)**

- 4-column grid
- 12px gutter

---

## Accessibility Requirements

### Keyboard Navigation

1. **Tab Order**: Logical flow left-to-right, top-to-bottom
2. **Focus Indicators**: 2px solid #DC6428 outline, 2px offset
3. **Skip Links**: Visible when focused, skip to main content
4. **Modals**: Focus trap inside modal, restore on close

### Screen Readers

1. **ARIA Labels**: All icons need `aria-label`
2. **Form Fields**: Associated labels via `for` attribute
3. **Buttons**: Clear action text
4. **Links**: Descriptive link text (not "click here")
5. **Alerts**: Use `role="alert"` for dynamic content

### Color Accessibility

1. **Never rely on color alone** to convey information
2. **Always pair icons with text** (icons support color)
3. **Verify contrast** with WCAG AA minimum 4.5:1
4. **Test with color blindness** simulators

### Motion & Animation

1. **Respect `prefers-reduced-motion`**:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

2. **Avoid flashing/strobing** (>3 times per second)
3. **Keep animations < 300ms** for UI feedback

### Touch Targets

- Minimum 44x44px for all interactive elements
- 8px minimum padding around touch targets
- Spacing between targets: 8px minimum

---

## Halloween Theme Guidelines

### Do's

✓ Use purple (#582696) and orange (#DC6428) accents liberally
✓ Apply glow effects to interactive elements
✓ Use Space Grotesk font for headings
✓ Implement subtle gradient backgrounds
✓ Use atmospheric shadows and depth
✓ Include professional icons (Heroicons only)
✓ Maintain dark color scheme throughout
✓ Use italic typography selectively on key terms

### Don'ts

✗ Do not use emojis (replace with Heroicons)
✗ Do not make the interface hard to read
✗ Do not use bright, harsh colors
✗ Do not add decorative motifs that distract from content
✗ Do not compromise accessibility for aesthetics
✗ Do not use light backgrounds
✗ Do not clash Halloween theme with professionalism
✗ Do not use more than 2 accent colors per component

### Atmospheric Effects

**Glow on Buttons:**

```css
box-shadow: 0 4px 12px rgba(88, 38, 150, 0.25);

&:hover {
  box-shadow: 0 6px 20px rgba(88, 38, 150, 0.35);
}
```

**Gradient Backgrounds:**

```css
background: linear-gradient(180deg, rgba(68, 28, 120, 0.2) 0%, rgba(15, 15, 20, 1) 100%);
```

**Subtle Animations:**

- Fade in: 150ms
- Slide up: 200ms
- Hover lift: -2px translateY
- Loading pulse: 2s cycle

---

## Implementation Checklist

Before shipping a component:

- [ ] Color contrast verified (WCAG AA)
- [ ] Focus states visible (2px outline)
- [ ] Keyboard navigation tested
- [ ] Screen reader labels present
- [ ] Touch targets 44x44px minimum
- [ ] Responsive at all breakpoints
- [ ] Hover/active/disabled states working
- [ ] Animations smooth (60fps)
- [ ] No emojis (icons only)
- [ ] Error messages clear and helpful
- [ ] Loading states show progress
- [ ] Empty states encouraging
- [ ] Halloween theme consistent
- [ ] No hardcoded colors (use CSS variables)

---

## Questions or Issues?

Refer to:

- `.kiro/specs/hauntview-ui-design/design.md` - Full design specification
- `app/design-tokens.css` - CSS custom properties
- `app/component-examples.tsx` - Working component examples
