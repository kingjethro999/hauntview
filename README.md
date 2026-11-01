# HauntView 👻

A local web testing engine with 16 automated testing profiles for responsive design, resilience, accessibility, security, and performance testing. Built with Next.js, TypeScript, and Playwright.

## 16 Testing Profiles

**Responsive Design (3)**: Mobile, Tablet, Desktop
**Resilience (5)**: Image Failure, Font Failure, JavaScript Disabled, Network Resilience, Offline
**Analysis (7)**: Console Errors, Accessibility, Broken Links, Form Resilience, Security Hygiene, Performance, Reduced Motion
**Orchestration (1)**: Full Test Suite

## Features

✅ Local-only execution (no external API calls)
✅ Screenshot comparisons with visual diffs
✅ HTML and Markdown downloadable reports
✅ MCP integration with Kiro for AI-powered analysis
✅ Detailed findings with severity levels and recommendations
✅ Real browser testing via Playwright

## Quick Start

```bash
git clone https://github.com/yourusername/hauntview.git
cd hauntview
npm install
npm run dev
```

Open http://localhost:3000 to begin testing.

## Usage

### Web UI

1. Enter target URL
2. Select test profiles
3. Run tests
4. View findings and download reports

### MCP Integration (Kiro)

```bash
npm run mcp
# Connect to port 5050 in Kiro
```

## Project Structure

```
hauntview/
├── app/                    # Next.js app
├── src/testing/            # 16 test profiles
├── src/lib/                # Core infrastructure
├── .kiro/                  # Kiro specs, steering, hooks
└── __tests__/              # Test suite
```

## Documentation

- `.kiro/specs/hauntview-core/` - System architecture specs
- `.kiro/specs/hauntview-testing-profiles/` - Profile specifications
- `ARCHITECTURE.md` - Detailed implementation guide
- `USER_GUIDE.md` - How to use each profile

## API Reference

```
POST /api/test/run
GET /api/test/status/:runId
GET /api/test/results/:runId
GET /api/reports/:runId/download?format=html|md
```

## Performance

- Single profile: 10-30 seconds
- Full suite (16 profiles): 2-10 minutes

## License

MIT License - See LICENSE file

## Built for Kiroween 2026

HauntView showcases Kiro capabilities: spec-driven development, property-based testing, steering, hooks, and MCP integration.

---

**Ready to test?** Start with `npm run dev` and navigate to http://localhost:3000
