# HauntView Icon Reference Guide

All icons in HauntView use **Heroicons** (https://heroicons.com/) in the **outline** style. This ensures professional, consistent iconography without emojis.

## Icon Usage Rules

1. **Style**: Always use outline (not solid or mini)
2. **Size**: Choose from 16px, 20px, 24px, 32px, 48px, 64px
3. **Color**: Match context (primary text, secondary text, status color, etc.)
4. **Labels**: All icons must have accompanying text or ARIA label
5. **Hover**: Color typically shifts to #DC6428 (Crimson Orange) on hover for interactive icons

## Common Icons by Category

### Navigation & Controls

| Use Case       | Icon Name           | Size | Color   | Hover   |
| -------------- | ------------------- | ---- | ------- | ------- |
| Home           | home                | 20px | #646478 | #DC6428 |
| Back/Previous  | arrow-left          | 20px | #646478 | #DC6428 |
| Forward/Next   | arrow-right         | 20px | #646478 | #DC6428 |
| Menu/Hamburger | bars-3              | 20px | #646478 | #DC6428 |
| Close/Dismiss  | x-mark              | 20px | #646478 | #DC6428 |
| Settings/Gear  | cog-6-tooth         | 20px | #646478 | #DC6428 |
| More/Ellipsis  | ellipsis-horizontal | 20px | #646478 | #DC6428 |

### Actions

| Use Case       | Icon Name                 | Size | Color   |
| -------------- | ------------------------- | ---- | ------- |
| Download       | arrow-down-tray           | 20px | #582696 |
| Upload         | arrow-up-tray             | 20px | #582696 |
| Search         | magnifying-glass          | 20px | #582696 |
| Filter         | funnel                    | 20px | #582696 |
| Sort/Reorder   | arrow-up-down             | 20px | #582696 |
| Refresh/Reload | arrow-path                | 20px | #582696 |
| Add/Plus       | plus                      | 20px | #582696 |
| Remove/Minus   | minus                     | 20px | #dc2626 |
| Duplicate      | square-2-stack            | 20px | #582696 |
| Edit/Pencil    | pencil                    | 20px | #582696 |
| Trash/Delete   | trash                     | 20px | #dc2626 |
| Share          | share                     | 20px | #582696 |
| External Link  | arrow-top-right-on-square | 20px | #582696 |

### Status & Feedback

| Use Case            | Icon Name            | Size | Color   | Meaning             |
| ------------------- | -------------------- | ---- | ------- | ------------------- |
| Success/Checkmark   | check-circle         | 20px | #16a34a | Passed, completed   |
| Error/X             | x-circle             | 20px | #dc2626 | Failed, error       |
| Warning/Exclamation | exclamation-triangle | 20px | #ea580c | Warning, attention  |
| Info/Info Circle    | information-circle   | 20px | #0284c7 | Information         |
| Help/Question       | question-mark-circle | 20px | #0284c7 | Help, documentation |
| Loading/Spinner     | arrow-path           | 20px | #582696 | Loading (animated)  |

### File & Document

| Use Case      | Icon Name       | Size | Color   |
| ------------- | --------------- | ---- | ------- |
| File/Document | document        | 20px | #646478 |
| File PDF      | document-text   | 20px | #dc2626 |
| Folder        | folder          | 20px | #646478 |
| Download      | arrow-down-tray | 20px | #582696 |
| Upload        | arrow-up-tray   | 20px | #582696 |
| Code          | code-bracket    | 20px | #582696 |

### System & Content

| Use Case          | Icon Name     | Size | Color   |
| ----------------- | ------------- | ---- | ------- |
| Eye/View          | eye           | 20px | #582696 |
| Eye Closed/Hidden | eye-slash     | 20px | #646478 |
| Lock/Secure       | lock-closed   | 20px | #dc2626 |
| Unlock            | lock-open     | 20px | #16a34a |
| User/Profile      | user          | 20px | #646478 |
| Users/Group       | users         | 20px | #646478 |
| Clock/Time        | clock         | 20px | #646478 |
| Calendar          | calendar-days | 20px | #646478 |
| Bell/Notification | bell          | 20px | #582696 |
| Flag/Important    | flag          | 20px | #ea580c |
| Star/Favorite     | star          | 20px | #DC6428 |
| Heart             | heart         | 20px | #dc2626 |
| Gear/Settings     | cog-6-tooth   | 20px | #582696 |

### Halloween-Themed Icons

While we use professional icons, some Heroicons can convey the Halloween theme:

| Use Case          | Icon Name            | Size | Color   | Note               |
| ----------------- | -------------------- | ---- | ------- | ------------------ |
| Spooky/Alert      | exclamation-triangle | 20px | #ea580c | Warning context    |
| Check/Passed      | check-circle         | 20px | #16a34a | Success state      |
| Failed/Error      | x-circle             | 20px | #dc2626 | Error state        |
| Report/Analysis   | chart-bar            | 20px | #582696 | Data visualization |
| Bug/Issue         | bug-ant              | 20px | #dc2626 | Test failures      |
| Shield/Protection | shield-check         | 20px | #16a34a | Security passed    |

## Icon Sizing Guidelines

### Usage by Size

**12px (--icon-xs)**

- Inline badges
- Tiny indicators
- Use sparingly

**16px (--icon-sm)**

- Badge icons
- Compact form inputs
- Secondary actions
- Navigation breadcrumbs

**20px (--icon-md)**

- Standard buttons
- Table row actions
- Navigation items
- Alerts
- Forms
- **Most common size**

**24px (--icon-lg)**

- Hero buttons
- Large action buttons
- Section headers
- Prominent alerts

**32px (--icon-xl)**

- Large cards
- Important actions
- Feature highlights

**48px & 64px (--icon-2xl)**

- Empty states
- Loading indicators
- Hero sections
- Onboarding

### Icon + Text Combinations

**Button with Icon:**

```
[Icon 20px] ← gap: 8px → "Button Label"
```

**Badge with Icon:**

```
[Icon 12px] ← gap: 4px → "Badge"
```

**Table Row Action:**

```
[Icon 20px] ← No text, ARIA label required
```

**Navigation Item:**

```
[Icon 20px] ← gap: 12px → "Nav Item"
```

## Color Rules for Icons

### By Context

**Interactive Icons:**

- Default: #646478 (Shadow Gray)
- Hover: #DC6428 (Crimson Orange)
- Active: #582696 (Haunted Purple)
- Disabled: #4B5563 (Disabled Gray)

**Status Icons:**

- Success: #16a34a (Green)
- Error: #dc2626 (Red)
- Warning: #ea580c (Orange)
- Info: #0284c7 (Blue)

**In Buttons:**

- Primary button: #F5F5FA (Ghostly White)
- Secondary button: #F5F5FA (Ghostly White)
- Ghost button: #582696 (Haunted Purple) → hover #DC6428

**In Cards:**

- Default: #646478 (Shadow Gray)
- On hover: #DC6428 (Crimson Orange)

**In Alerts:**

- Success: #16a34a (Green, matches alert text)
- Error: #dc2626 (Red, matches alert text)
- Warning: #ea580c (Orange, matches alert text)
- Info: #0284c7 (Blue, matches alert text)

## Animated Icons

### Loading Spinner

Use `arrow-path` (or `cog-6-tooth`) rotated continuously:

```css
animation: spin 2s linear infinite;

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
```

Position: Center of loading area
Size: 24px or 32px
Duration: 2 seconds
Color: #582696 (Haunted Purple)

## Importing Heroicons in React

### Installation

```bash
npm install heroicons
```

### Basic Usage

```tsx
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export function MyComponent() {
  return (
    <div>
      <CheckCircleIcon className="w-5 h-5 text-green-600" />
      <XMarkIcon className="w-5 h-5 text-red-600" />
    </div>
  );
}
```

### Sizing with Tailwind

| Icon Size | Class     |
| --------- | --------- |
| 12px      | w-3 h-3   |
| 16px      | w-4 h-4   |
| 20px      | w-5 h-5   |
| 24px      | w-6 h-6   |
| 32px      | w-8 h-8   |
| 48px      | w-12 h-12 |
| 64px      | w-16 h-16 |

### Coloring with Tailwind

```tsx
<CheckCircleIcon className="w-5 h-5 text-green-600" />
<XMarkIcon className="w-5 h-5 text-red-600" />
<ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
```

**Note**: Use Tailwind classes or inline styles with CSS variables for consistency.

## Icon Installation Guide

### Step 1: Install Heroicons

```bash
npm install heroicons
```

### Step 2: Import Required Icons

```tsx
import {
  HomeIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  BellIcon,
  CogIcon,
  BarChartIcon,
} from '@heroicons/react/24/outline';
```

### Step 3: Use in Components

```tsx
<button className="flex items-center gap-2">
  <CheckCircleIcon className="w-5 h-5" />
  Success
</button>
```

## Accessibility with Icons

### ARIA Labels (Required for Icon-Only Elements)

```tsx
// ❌ Bad - no label
<button>
  <TrashIcon className="w-5 h-5" />
</button>

// ✓ Good - has aria-label
<button aria-label="Delete item">
  <TrashIcon className="w-5 h-5" />
</button>

// ✓ Good - has visible text
<button>
  <TrashIcon className="w-5 h-5 mr-2" />
  Delete
</button>
```

### Color Alone Rule

Never use color alone to convey information:

```tsx
// ❌ Bad - only color conveys status
<div className="text-green-600">
  <CheckIcon className="w-5 h-5" />
</div>

// ✓ Good - icon + text + color
<div className="flex items-center gap-2 text-green-600">
  <CheckCircleIcon className="w-5 h-5" />
  <span>Test passed</span>
</div>
```

## Icon Library Statistics

- **Total Heroicons**: 300+
- **Used in HauntView**: ~30
- **Outline style**: Yes (all icons)
- **Solid style**: No (use outline only)
- **Mini style**: No (use outline only)
- **Customization**: Color only (no size modifications)

## Common Icon Mistakes

| Mistake                       | Fix                            |
| ----------------------------- | ------------------------------ |
| Using emoji instead of icon   | Switch to Heroicons            |
| Icon without label or text    | Add aria-label or visible text |
| Wrong icon style (solid/mini) | Use outline only               |
| Hardcoded color               | Use CSS variables              |
| No hover state                | Add hover color change         |
| Icon too small to click       | Minimum 44x44px container      |
| Not aligned with text         | Use flexbox with gap           |
| Spinning icon not accessible  | Add aria-label="Loading"       |

---

## Quick Reference Card

```
┌─────────────────────────────────────────────┐
│         HAUNTVIEW ICON QUICK REFERENCE      │
├─────────────────────────────────────────────┤
│ Library: Heroicons (outline style)          │
│ Common Size: 20px                           │
│ Default Color: #646478 (Shadow Gray)        │
│ Hover Color: #DC6428 (Crimson Orange)       │
│ Status Colors: Green/Red/Orange/Blue        │
│ NO Emojis - Icons only                      │
│ Accessibility: Always label icon buttons    │
│ Documentation: heroicons.com                │
│ Installation: npm install heroicons         │
└─────────────────────────────────────────────┘
```

For complete Heroicons documentation, visit: https://heroicons.com/
