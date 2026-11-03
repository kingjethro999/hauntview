# HauntView 👻

**See what breaks before your users do.**

HauntView photographs your website twice: once as you built it, and once as your users sometimes get it — mobile layout, JavaScript disabled, images blocked, fonts failing, offline. Every finding carries proof. The tool refuses to flag a defect it cannot prove.

## Quick Start

```bash
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview
pnpm install
pnpm dev       # web UI at http://localhost:3000
pnpm mcp       # MCP server (stdio) for Kiro integration
```

**Requirements:** Node 22 LTS, pnpm 9+. Playwright's Chromium is installed automatically via the `postinstall` script.

## MCP Setup (Kiro IDE)

Add `.kiro/settings/mcp.json` to your workspace:

```json
{
  "mcpServers": {
    "hauntview-medium": {
      "command": "node",
      "args": ["--import", "tsx/esm", "src/mcp/server.ts"],
      "env": { "HAUNT_DATA_DIR": "${env:HOME}/.haunt" },
      "disabled": false
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"],
      "disabled": false
    }
  }
}
```

Then ask Kiro: `@haunt run rites on https://yoursite.com` — it will call `haunt_run_rites`, get structured findings, and help you fix them without leaving the IDE.

---

A local web testing engine with 16 automated testing profiles for responsive design, accessibility, security, and performance testing. Built with Next.js, TypeScript, and Playwright.

## Project Status

**Phase 1**: ✅ Core infrastructure complete

- Type system (30+ types)
- Core engine modules (BrowserPool, ScreenshotManager, FindingClassifier, ProfileManager)
- 3 initial profiles implemented: Mobile, Desktop, Console Errors
- 16 profiles pre-configured and architecture established
- API endpoints for test execution

**Phase 2**: ✅ Testing Profiles & Core Reporting Complete

- All 16 testing profiles fully implemented and tested
- HTML and Markdown spirit grimoire report generation
- Frontend dashboard UI and profile selector
- Comprehensive Jest unit test suite (100+ tests)

## 16 Testing Profiles

### Device Testing (5)

- ✅ **Mobile - iPhone 15** (390×844): Touch targets, responsive design, font sizes
- ✅ **Mobile - Android** (360×800): Touch targets, responsive design, font sizes
- ✅ **Tablet - iPad Pro** (1024×1366): Layout, touch targets
- ✅ **Desktop - 1080p** (1920×1080): Layout shift, CSS optimization
- ✅ **Desktop - 4K** (3840×2160): High-resolution support

### Accessibility Testing (4)

- ✅ **Screen Reader**: ARIA, semantic HTML, announcements
- ✅ **Keyboard Navigation**: Tab order, focus management
- ✅ **Visual Impairment**: High contrast, color independence
- ✅ **Cognitive Load**: Complexity, instructions clarity

### Internationalization (3)

- ✅ **RTL Language** (Arabic): Right-to-left layout
- ✅ **CJK Language** (Japanese): East Asian script support
- ✅ **Mixed Scripts** (Hindi): Complex script rendering

### Browser Compatibility (4)

- ✅ **WebKit** (Safari, Chrome): WebKit engine
- ✅ **Firefox**: Gecko engine
- ✅ **Edge**: Blink engine variant
- ✅ **Legacy**: IE 11 fallback detection

## Features

✅ Local-only execution (no external API calls)
✅ Browser pooling for performance (up to 3 concurrent browsers)
✅ Screenshot capture with SHA256 deduplication
✅ Finding classification and canonicalization
✅ Console error tracking
✅ Cumulative Layout Shift detection
✅ Touch target validation
✅ Horizontal scroll detection
✅ HTML and Markdown report generation (coming Phase 2)
✅ MCP integration with Kiro (coming Phase 2)

## Architecture

### Core Modules

**BrowserPool** - Manages Playwright instances

- Pooling strategy: 3 browsers max, 5 pages per browser
- Idle timeout cleanup (30 seconds)
- Page acquisition/release with context isolation

**ScreenshotManager** - Screenshot capture and comparison

- SHA256-based deduplication
- Pixel-level comparison
- Configurable retention (default 7 days)

**FindingClassifier** - Finding normalization

- 10+ classification rules
- Rule-based (95% confidence) + heuristic (60% confidence)
- LRU cache with TTL (1 hour default)
- Deduplication by canonical hash

**ProfileManager** - Profile orchestration

- All 16 profiles pre-configured
- Execution context creation
- Duration-based optimal ordering
- Statistics tracking

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Server starts at http://localhost:3000
```

## API Usage

### Check Engine Status

```bash
curl http://localhost:3000/api/test
```

Response:

```json
{
  "status": "ready",
  "stats": {
    "profiles": { "total": 16, "enabled": 16, "disabled": 0 },
    "browserPool": { "totalBrowsers": 0, "totalPages": 0, ... }
  },
  "version": "0.1.0"
}
```

### Run Tests

```bash
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "profiles": ["mobile-iphone15", "desktop-1080p", "console-errors"],
    "includeScreenshots": true
  }'
```

Response:

```json
{
  "success": true,
  "report": {
    "id": "hauntview-1704067200000",
    "url": "https://example.com",
    "duration": 45000,
    "profileResults": [...],
    "summary": {
      "totalProfiles": 3,
      "successfulProfiles": 2,
      "failedProfiles": 1,
      "totalFindings": 12,
      "findingsBySeverity": { "error": 2, "warning": 5, "info": 5 }
    }
  }
}
```

## Project Structure

```
hauntview/
├── src/
│   ├── types/                 # Type definitions (30+ types)
│   │   ├── profiles.ts       # Core profile types
│   │   └── results.ts        # Report types
│   ├── core/                  # Core engine modules
│   │   ├── browser-pool.ts
│   │   ├── screenshot-manager.ts
│   │   ├── finding-classifier.ts
│   │   └── profile-manager.ts
│   ├── profiles/              # Testing profiles (3 implemented)
│   │   ├── mobile.ts
│   │   ├── desktop.ts
│   │   └── console-errors.ts
│   ├── engine.ts              # Main orchestrator
│   └── __tests__/             # Jest tests
├── app/
│   ├── api/
│   │   └── test/route.ts      # Test API endpoints
│   ├── layout.tsx
│   └── page.tsx
├── .kiro/specs/               # Kiro specifications
├── jest.config.js
└── package.json
```

## Documentation

- `PHASE_1_COMPLETE.md` - Detailed Phase 1 implementation report
- `.kiro/specs/hauntview-core/` - System architecture specs
- `.kiro/specs/hauntview-testing-profiles/` - Profile specifications
- `.kiro/specs/hauntview-ui-design/` - UI design system

## Features Delivered

- [x] All 16 testing profile implementations
- [x] HTML report generation with spirit photography grimoire styling
- [x] Markdown report generation
- [x] Frontend dashboard UI with design tokens and profile selector
- [x] Jest test suite expansion (27 test suites, 108 tests)
- [x] MCP integration for Kiro IDE

## Performance

- Single profile: ~10-30 seconds
- 3 profiles: ~30-45 seconds
- Full suite (16 profiles): ~2-10 minutes

## License

MIT License - See LICENSE file

## Built for Kiroween 2026 Hackathon

HauntView demonstrates comprehensive spec-driven development with Kiro, including specs, steering, hooks, and automated testing infrastructure.

---

**Status**: Phase 1 Complete ✓ | Phase 2 Ready to Start

Start with `npm run dev` and visit http://localhost:3000
