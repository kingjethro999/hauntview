# Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ with pnpm
- Playwright browsers installed

### Setup

```bash
pnpm install
pnpm exec playwright install
```

## Development Workflow

### Running the Dev Server

```bash
npm run dev
# Starts Next.js at http://localhost:3000
```

### Code Style & Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint
```

### Building for Production

```bash
npm run build
npm run start
```

## Testing

### Run Tests

```bash
# One-time run
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Type Checking

```bash
npx tsc --noEmit
```

## Architecture

### Type System (`src/types/`)

- `profiles.ts` - Core profile types and interfaces
- `results.ts` - Report and result types

### Core Modules (`src/core/`)

#### BrowserPool

Manages Playwright browser instances with pooling:

```typescript
const pool = new BrowserPool({
  maxBrowsers: 3,
  maxPagesPerBrowser: 5,
  idleTimeout: 30000,
});

const page = await pool.acquirePage(browserKey, profileContext, browser);
// Use page...
pool.releasePage(page);
```

#### ScreenshotManager

Captures and manages screenshots:

```typescript
const manager = new ScreenshotManager('.hauntview/screenshots');
await manager.initialize();

const metadata = await manager.captureScreenshot(page, profileId, url, viewport);
```

#### FindingClassifier

Classifies and deduplicates findings:

```typescript
const classifier = new FindingClassifier();

const result = await classifier.classify(finding);
const dedup = classifier.deduplicateFindings(findings);
```

#### ProfileManager

Orchestrates 16 profiles:

```typescript
const manager = new ProfileManager();

const allProfiles = manager.getAllProfiles();
const enabled = manager.getEnabledProfiles();
const context = manager.createExecutionContext(profileId);
```

### Testing Profiles (`src/profiles/`)

#### Mobile Profile

Tests responsive design on mobile devices:

- Viewport meta tag validation
- Touch target size checking (48px minimum)
- Horizontal scroll detection
- Image optimization
- Font size accessibility

#### Desktop Profile

Tests layout and performance on desktop:

- Cumulative Layout Shift detection
- CSS optimization analysis
- Content width constraints
- Image dimensions
- Zoom policy

#### Console Errors Profile

Tracks all console output:

- JavaScript errors
- Warnings and logs
- Service worker errors
- Unhandled promise rejections
- Request failures

### Main Engine (`src/engine.ts`)

HauntViewEngine orchestrates test execution:

```typescript
const engine = new HauntViewEngine();
await engine.initialize();

const report = await engine.executeTests({
  url: 'https://example.com',
  profiles: ['mobile-iphone15', 'desktop-1080p'],
  includeScreenshots: true,
});

await engine.cleanup();
```

### API Routes (`app/api/`)

#### POST /api/test

Execute tests:

```json
{
  "url": "https://example.com",
  "profiles": ["mobile-iphone15"],
  "includeScreenshots": true
}
```

#### GET /api/test

Get engine status and stats.

## Adding a New Profile

1. **Create profile file** in `src/profiles/`:

```typescript
import { Page } from 'playwright';
import { Finding, ProfileResult, ProfileContext } from '../types';

export class NewProfile {
  async execute(page: Page, url: string, context: ProfileContext): Promise<ProfileResult> {
    // Implementation
  }
}
```

2. **Add to ProfileManager** in `src/core/profile-manager.ts`:

```typescript
const PROFILES: ProfileConfig[] = [
  // ... existing profiles
  {
    id: 'new-profile',
    name: 'New Profile',
    description: 'Description',
    enabled: true,
    viewport: { width: 1920, height: 1080, isMobile: false, hasTouch: false },
  },
];
```

3. **Add to engine** in `src/engine.ts`:

```typescript
if (profileId === 'new-profile') {
  profile = new NewProfile(profileId, 'New Profile');
}
```

4. **Export from profiles/index.ts**:

```typescript
export { NewProfile } from './new-profile';
```

## Debugging

### Enable Verbose Logging

Set environment variable:

```bash
DEBUG=hauntview:* npm run dev
```

### Playwright Inspector

```bash
PWDEBUG=1 npm test
```

### Check Profile Execution

Access engine stats via API:

```bash
curl http://localhost:3000/api/test
```

## Performance Optimization

### Browser Pool Tuning

Adjust in `src/engine.ts`:

```typescript
new BrowserPool({
  maxBrowsers: 3, // Increase for more parallelization
  maxPagesPerBrowser: 5, // Increase for more concurrent pages
  idleTimeout: 30000, // Decrease for faster cleanup
});
```

### Profile Execution Order

ProfileManager automatically orders profiles by expected duration.
Check optimization in `src/core/profile-manager.ts`:

```typescript
getOptimalExecutionOrder(): ProfileConfig[]
```

## File Structure Reference

```
src/
├── types/
│   ├── index.ts         # Type exports
│   ├── profiles.ts      # Profile types (160 lines)
│   └── results.ts       # Result types (130 lines)
│
├── core/
│   ├── index.ts         # Core module exports
│   ├── browser-pool.ts  # Browser pooling (280 lines)
│   ├── screenshot-manager.ts # Screenshot management (280 lines)
│   ├── finding-classifier.ts # Finding classification (350 lines)
│   └── profile-manager.ts # Profile management (280 lines)
│
├── profiles/
│   ├── index.ts         # Profile exports
│   ├── mobile.ts        # Mobile profile (150 lines)
│   ├── desktop.ts       # Desktop profile (170 lines)
│   └── console-errors.ts # Console errors profile (170 lines)
│
├── __tests__/
│   └── types.test.ts    # Type validation tests
│
├── engine.ts            # Main orchestrator (220 lines)
└── index.ts             # Main exports
```

## Common Tasks

### Run Tests on a Specific URL

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","profiles":["mobile-iphone15"]}'
```

### Enable/Disable Profiles

In code or via ProfileManager API:

```typescript
const manager = new ProfileManager();
manager.disableProfile('desktop-4k');
manager.enableProfile('mobile-android');
```

### View Screenshot Stats

```typescript
const stats = screenshotManager.getStats();
console.log(stats);
// { totalScreenshots: 12, uniqueScreenshots: 10, totalSize: 1024000 }
```

### Clear Classification Cache

```typescript
classifier.clearCache();
```

## Next Phase Tasks

- [ ] Implement remaining 13 profiles
- [ ] Add HTML report generation
- [ ] Add Markdown report generation
- [ ] Build frontend dashboard
- [ ] Add Jest test coverage
- [ ] MCP integration
- [ ] Performance benchmarking

---

**Questions?** Check `.kiro/specs/` for detailed specifications or create an issue.
