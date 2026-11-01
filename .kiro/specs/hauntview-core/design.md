# Design Document: HauntView

## Overview

HauntView is a local web testing engine designed as a Next.js full-stack application that provides automated testing for web applications across 16 distinct testing profiles. The system combines a polished React frontend for profile selection and results viewing with a Node.js backend that orchestrates Playwright-based browser automation. A dedicated MCP (Model Context Protocol) server exposes testing capabilities to Kiro, enabling programmatic test execution and result interpretation.

### Key Design Principles

1. **Local-First Architecture**: All testing occurs locally; no data leaves the user's machine
2. **Component Isolation**: Each test profile is an independent, composable unit
3. **Progressive Complexity**: Core infrastructure supports phased rollout of profiles
4. **Type Safety**: End-to-end TypeScript ensures compile-time correctness
5. **Extensibility**: New profiles can be added without modifying core infrastructure
6. **Kiro Integration**: MCP server provides first-class AI agent access to testing capabilities

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      HauntView System                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Frontend UI (React/Next.js App Router)        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Profile Selection  │  Results Display  │ Reports│ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓ (HTTP)                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │       Next.js API Routes (Backend Layer)               │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Test Controller  │ Result Service  │ Reports    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Testing Engine (Core Logic)                   │ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │  Profile Manager  │  Browser Pool  │  Scheduler   ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │     16 Test Profiles (Modular Implementations)     ││ │
│  │  │  Mobile │ Tablet │ Desktop │ Images │ Fonts │ JS  ││ │
│  │  │  Network │ Offline │ Console │ A11y │ Links │...  ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  │  ┌────────────────────────────────────────────────────┐│ │
│  │  │   Supporting Services                              ││ │
│  │  │  Screenshot Manager  │  Report Generator           ││ │
│  │  │  Finding Classifier  │  Metrics Aggregator         ││ │
│  │  └────────────────────────────────────────────────────┘│ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │        Browser Automation Layer (Playwright)          │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Browser Instance Pool  │ Context Management     │ │ │
│  │  │  Interceptor Manager    │ Device Emulation       │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Result Storage (Local File System)        │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  Test Results  │  Screenshots  │  Reports        │ │ │
│  │  │  (JSON/Binary)  (PNG)           (HTML and Markdown)        │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │    MCP Server (Kiro Integration - Optional Port)      │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  MCP Tool Handlers  │  Result Formatters         │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Test Initiation**: User selects profiles and URL in UI
2. **Validation**: URL is validated; profiles are prepared
3. **Execution**: ProfileManager orchestrates profile execution sequentially
4. **Monitoring**: Frontend polls progress endpoint; UI updates display
5. **Collection**: ScreenshotManager and Finding Classifier collect outputs
6. **Storage**: Results persisted to local file system
7. **Display**: Results endpoint returns structured data to UI
8. **Report**: ReportGenerator creates HTML and Markdown; user downloads

---

## Components and Interfaces

### 1. Frontend UI (React/Next.js App Router)

**Purpose**: Polished interface for test profile selection, execution monitoring, results viewing, and report access.

**Key Features**:

- Profile selection grid with visual indicators
- URL input with validation feedback
- Real-time progress display during test runs
- Results filtration and sorting
- Screenshot comparison viewer
- Report download interface
- Responsive design for multiple screen sizes

**Key Pages**:

- `/` - Home page with profile selection and URL input
- `/results` - Results display with filtering and sorting
- `/compare` - Screenshot comparison tool
- `/history` - Test run history

**API Integration**:

- `POST /api/test/run` - Start a test run
- `GET /api/test/status/:runId` - Poll test status
- `GET /api/test/results/:runId` - Fetch test results
- `GET /api/reports/:runId/download` - Download report
- `GET /api/screenshots/:runId/:profileId` - Get screenshots
- `POST /api/test/cancel/:runId` - Cancel ongoing test

---

### 2. Test Controller (API Routes)

**Purpose**: HTTP endpoint handlers that translate frontend requests into testing engine operations.

**Key Handlers**:

```typescript
POST /api/test/run
  Input: { targetUrl: string; profileIds: string[] }
  Output: { runId: string; status: 'queued' }

GET /api/test/status/:runId
  Output: {
    runId: string;
    status: 'running' | 'completed' | 'failed' | 'canceled';
    progress: { completed: number; total: number };
    currentProfile: string | null;
    estimatedTimeRemaining: number;
  }

GET /api/test/results/:runId
  Output: {
    runId: string;
    url: string;
    startTime: ISO8601;
    endTime: ISO8601;
    profiles: ProfileResult[];
    overall: { passCount: number; failCount: number };
  }

POST /api/test/cancel/:runId
  Output: { success: boolean }
```

---

### 3. Testing Engine

#### 3.1 ProfileManager

**Purpose**: Orchestrates execution of test profiles in sequence or parallel.

**Responsibilities**:

- Register and discover available profiles
- Execute profiles based on request
- Handle profile lifecycle (setup, execute, cleanup)
- Manage test run state and cancellation
- Collect results from all profiles

**Interface**:

```typescript
interface IProfileManager {
  registerProfile(profile: TestProfile): void;
  executeProfiles(request: ExecutionRequest): Promise<ExecutionResult>;
  cancelRun(runId: string): Promise<void>;
  getRunStatus(runId: string): Promise<RunStatus>;
}

interface ExecutionRequest {
  runId: string;
  targetUrl: string;
  profileIds: string[];
  options: ExecutionOptions;
}

interface ExecutionResult {
  runId: string;
  results: ProfileResult[];
  startTime: Date;
  endTime: Date;
  duration: number;
}
```

#### 3.2 TestProfile Interface

**Purpose**: Standardized contract that all 16 profiles must implement.

**Core Interface**:

```typescript
interface TestProfile {
  id: string;
  name: string;
  description: string;
  category: 'responsive' | 'resilience' | 'security' | 'accessibility' | 'performance' | 'behavior';
  estimatedDuration: number; // milliseconds

  setup(): Promise<void>;
  execute(context: ProfileContext): Promise<ProfileExecution>;
  cleanup(): Promise<void>;

  shouldRetry(error: Error): boolean;
  maxRetries: number;
}

interface ProfileContext {
  page: Page; // Playwright Page instance
  targetUrl: string;
  browser: Browser;
  context: BrowserContext;
  screenshotDir: string;
  runId: string;
  signal?: AbortSignal; // For cancellation
}

interface ProfileExecution {
  profileId: string;
  status: 'pass' | 'fail' | 'warning';
  findings: Finding[];
  screenshots: Screenshot[];
  metrics: Record<string, unknown>;
  duration: number;
}
```

#### 3.3 BrowserPool

**Purpose**: Manages browser instances and contexts for efficient resource utilization.

**Responsibilities**:

- Launch and manage Chromium browser instances
- Create isolated browser contexts for parallel execution
- Handle browser cleanup and resource release
- Implement connection pooling for performance

**Interface**:

```typescript
interface IBrowserPool {
  initialize(): Promise<void>;
  acquireContext(): Promise<BrowserContext>;
  releaseContext(context: BrowserContext): Promise<void>;
  terminate(): Promise<void>;
  getStatus(): PoolStatus;
}
```

#### 3.4 ScreenshotManager

**Purpose**: Captures, manages, and compares screenshots.

**Responsibilities**:

- Capture screenshots at specified viewport sizes
- Store screenshots with metadata
- Generate visual diffs for comparison
- Provide screenshot access via API

**Interface**:

```typescript
interface IScreenshotManager {
  captureScreenshot(page: Page, metadata: ScreenshotMetadata): Promise<Screenshot>;
  compareScreenshots(baseline: Screenshot, current: Screenshot): Promise<ScreenshotDiff>;
  getScreenshot(runId: string, profileId: string, index: number): Promise<Screenshot>;
  deleteScreenshots(runId: string): Promise<void>;
}

interface Screenshot {
  id: string;
  runId: string;
  profileId: string;
  timestamp: Date;
  viewport: { width: number; height: number };
  filePath: string;
  metadata: Record<string, unknown>;
}
```

#### 3.5 Finding Classifier

**Purpose**: Categorizes and structures findings from profiles.

**Responsibilities**:

- Normalize findings across different profile types
- Assign severity levels
- Generate actionable recommendations
- Track finding metadata (location, frequency, etc.)

**Interface**:

```typescript
interface IFindingClassifier {
  classifyFinding(rawFinding: unknown, context: ClassificationContext): Promise<Finding>;
  normalizeFinding(finding: unknown, profileId: string): Finding;
}

interface Finding {
  id: string;
  profileId: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  recommendation: string;
  evidence: {
    type: 'screenshot' | 'console' | 'metadata' | 'code';
    value: string | Buffer;
  }[];
  location?: {
    selector?: string;
    url?: string;
    line?: number;
  };
}
```

#### 3.6 ReportGenerator

**Purpose**: Creates comprehensive reports in HTML and Markdown format.

**Responsibilities**:

- Aggregate results from all profiles
- Embed screenshots and metrics
- Generate visual charts and comparisons
- Create downloadable documents

**Interface**:

```typescript
interface IReportGenerator {
  generateReport(results: ExecutionResult, format: 'html' | 'md'): Promise<Buffer>;
  generateSummary(results: ExecutionResult): ReportSummary;
}

interface ReportSummary {
  date: Date;
  url: string;
  totalDuration: number;
  profiles: {
    name: string;
    status: 'pass' | 'fail';
    findingCount: number;
  }[];
  criticalFindings: Finding[];
}
```

---

### 4. Test Profile Implementations (16 Total)

All profiles follow the TestProfile interface. Below is the categorization and execution strategy:

#### Phase 1 (MVP): 3 Profiles

- **Mobile Responsive**: Tests at 320px, 375px, 428px widths
- **Desktop Responsive**: Tests at 1280px, 1920px widths
- **Console Errors**: Monitors browser console and network errors

#### Phase 2: 4 Additional Profiles

- **Tablet Responsive**: Tests at 768px, 1024px widths
- **Accessibility**: Validates heading hierarchy, alt text, labels, contrast, descriptive text
- **Broken Links**: Verifies HTTP status of all page links
- **Performance**: Measures FCP, LCP, CLS, and resource load times

#### Phase 3: 5 Additional Profiles

- **Image Failure**: Blocks images, verifies alt text and layout
- **Font Failure**: Blocks custom fonts, validates fallback rendering
- **JavaScript Disabled**: Disables JS, tests core functionality
- **Form Resilience**: Tests form validation without real submission
- **Security Hygiene**: Validates HTTPS, security headers, mixed content

#### Phase 4: 4 Final Profiles

- **Network Resilience**: Simulates latency, packet loss, slow connections
- **Offline Testing**: Tests with all network requests blocked
- **Reduced Motion**: Verifies animations respect prefers-reduced-motion
- **Full Test**: Orchestrates all 16 profiles in sequence

**Common Profile Pattern**:

```typescript
class ResponsiveDesignProfile implements TestProfile {
  id = 'responsive-mobile';
  name = 'Mobile Responsive';
  category = 'responsive';
  estimatedDuration = 15000;
  maxRetries = 2;

  async setup(): Promise<void> {
    // Prepare environment
  }

  async execute(context: ProfileContext): Promise<ProfileExecution> {
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 428, height: 926 },
    ];

    const findings: Finding[] = [];
    const screenshots: Screenshot[] = [];

    for (const viewport of viewports) {
      // Set viewport
      // Navigate
      // Capture screenshot
      // Check for layout issues
      // Add findings if issues detected
    }

    return {
      profileId: this.id,
      status: findings.length === 0 ? 'pass' : 'fail',
      findings,
      screenshots,
      metrics: { viewportsChecked: viewports.length },
      duration: performance.now(),
    };
  }

  async cleanup(): Promise<void> {
    // Release resources
  }

  shouldRetry(error: Error): boolean {
    return error.message.includes('timeout') || error.message.includes('network');
  }
}
```

---

### 5. MCP Server Integration

**Purpose**: Exposes HauntView testing capabilities to Kiro via Model Context Protocol.

**MCP Tools Exposed**:

```typescript
// Tool 1: Run individual profile
tool: {
  name: "hauntview_run_profile",
  description: "Execute a single test profile against a target URL",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string", description: "Target URL to test" },
      profileId: { type: "string", enum: [...all profile IDs] },
      options: { type: "object" }
    },
    required: ["url", "profileId"]
  },
  handler: async (params) => { /* ... */ }
}

// Tool 2: Run full test suite
tool: {
  name: "hauntview_run_full_suite",
  description: "Execute all 16 testing profiles",
  inputSchema: {
    type: "object",
    properties: {
      url: { type: "string" }
    },
    required: ["url"]
  }
}

// Tool 3: Get test results
tool: {
  name: "hauntview_get_results",
  description: "Retrieve results from a completed test run",
  inputSchema: {
    type: "object",
    properties: {
      runId: { type: "string" }
    },
    required: ["runId"]
  }
}

// Tool 4: Get run status
tool: {
  name: "hauntview_get_status",
  description: "Check progress of an ongoing test run",
  inputSchema: {
    type: "object",
    properties: {
      runId: { type: "string" }
    },
    required: ["runId"]
  }
}
```

**MCP Resources** (Data Sources):

```typescript
resource: {
  uri: "hauntview://test-runs",
  mimeType: "application/json",
  contents: // List of all test runs with basic metadata
}

resource: {
  uri: "hauntview://profiles",
  mimeType: "application/json",
  contents: // Descriptions of all 16 profiles
}
```

---

## Data Models

### Test Run Result

```typescript
interface TestRun {
  id: string;
  url: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  status: 'completed' | 'failed' | 'canceled';
  profileResults: ProfileResult[];
  metadata: {
    userAgent: string;
    screenSize?: { width: number; height: number };
  };
}

interface ProfileResult {
  profileId: string;
  profileName: string;
  status: 'pass' | 'fail' | 'warning';
  startTime: Date;
  endTime: Date;
  duration: number;
  findings: Finding[];
  screenshots: Screenshot[];
  metrics: Record<string, unknown>;
  error?: {
    message: string;
    stack?: string;
    retries: number;
  };
}
```

### Finding Severity Levels

- **Critical**: Security, functionality, or UX-blocking issues
- **High**: Notable problems affecting quality or accessibility
- **Medium**: Areas for improvement; not blocking
- **Low**: Minor issues or suggestions
- **Info**: Informational findings; no action required

---

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

Before writing properties, I'll analyze the acceptance criteria for testability.

### Property 1: Profile Discovery and Registration

_For any_ set of test profiles registered in the system, all registered profiles SHALL appear as selectable options in the UI with unique IDs and descriptive names.
**Validates: Requirements 1.1, 23.1**

### Property 2: Profile Selection State

_For any_ combination of profile IDs selected by the user, the system SHALL accept and record exactly that combination without modification or filtering.
**Validates: Requirements 1.2, 1.6, 23.2**

### Property 3: Full Test Execution Completeness

_When_ the user initiates a "Full Test" execution, the system SHALL execute all 16 profiles without omission, regardless of which individual profiles exist or their individual outcomes.
**Validates: Requirements 1.3, 23.3**

### Property 4: Test Run Progress Tracking

_For any_ ongoing test run, calling the status endpoint SHALL return valid progress indicating: (a) which profile is currently executing, (b) count of completed profiles, (c) total profile count, and (d) a non-negative estimated time remaining.
**Validates: Requirements 1.4, 23.4, 24.1, 24.2, 24.3**

### Property 5: Test Run Cancellation Idempotency

_For any_ test run in a running or queued state, calling cancel SHALL transition it to a canceled state, and subsequent cancel calls on the same run SHALL not error and SHALL remain in canceled state.
**Validates: Requirements 1.5, 24.4, 24.5**

### Property 6: Profile Execution Result Completeness

_For any_ completed test run, the results endpoint SHALL return structured results for all profiles that were executed, with each profile result containing: status, findings array, screenshots array, metrics, and duration.
**Validates: Requirements 1.6, 18.1, 18.2, 18.3**

### Property 7: Responsive Design Profile Viewport Coverage

_When_ the Mobile Test Profile executes, it SHALL capture exactly 3 screenshots at the specified viewport widths (320px, 375px, 428px), each screenshot SHALL show the page at that exact viewport width, and all screenshots SHALL be included in the result.
**Validates: Requirements 2.2, 2.5, 3.2, 3.5, 4.2, 4.5**

### Property 8: Console Error Capture Completeness

_For any_ page load where console errors or failed network requests occur, the Console Errors Test Profile SHALL capture and report all errors and failed requests (4xx, 5xx responses) with message, stack trace, and URL information.
**Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**

### Property 9: Finding Classification and Structure

_For any_ finding generated by any profile, it SHALL have: a unique ID, severity level from the defined set, title, description, recommendation, evidence array with type and value, and optional location information.
**Validates: Requirements 10.4, 10.5, 11.7, 11.8, 14.4, 14.5, 14.6**

### Property 10: Image Failure Profile Behavior

_When_ the Image Failure Test Profile executes, it SHALL block all image requests, capture at least one screenshot showing the no-images state, and report any images with missing alt text as findings.
**Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

### Property 11: URL Validation Universality

_For any_ URL string provided as input, the system SHALL validate it as: (a) either localhost with port, (b) a valid HTTP/HTTPS URL with proper format, and (c) if validation passes, SHALL mark it as accessible; if validation fails, SHALL report a specific validation error.
**Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6**

### Property 12: MCP Tool Availability

_For any_ MCP tool invocation (run_profile, run_full_suite, get_results, get_status), if the tool is called with valid parameters, the system SHALL execute the requested operation and return results in the MCP-structured format.
**Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7**

### Property 13: Local-Only Execution

_For any_ test execution, no data SHALL be transmitted to external services (verified by: no outbound HTTP requests to non-target URLs, no external logging, no telemetry), and all results SHALL be stored locally on the user's file system.
**Validates: Requirements 22.2, 22.3, 22.5**

### Property 14: Browser Resource Cleanup

_For any_ completed test run (whether successful, failed, or canceled), all Playwright browser contexts and pages created for that run SHALL be closed and all resources released, such that no browser processes remain orphaned.
**Validates: Requirements 22.6, 22.7**

### Property 15: Error Retry Logic

_For any_ test profile that encounters a transient error (timeout, network error), the system SHALL automatically retry up to the profile's maxRetries count before reporting failure, and SHALL log each retry attempt with timestamp and error details.
**Validates: Requirements 25.1, 25.2, 25.6**

### Property 16: Profile Continuation on Failure

_When_ a test profile encounters an error and exhausts retries, the system SHALL mark that profile as failed and continue executing remaining profiles in the run without aborting the entire test suite.
**Validates: Requirements 25.3, 25.4, 25.5**

### Property 17: Screenshot Capture Round-Trip

_For any_ profile that executes successfully, if screenshots are captured and stored, querying the screenshot endpoint with the run ID, profile ID, and screenshot index SHALL return the same screenshot data (content, dimensions, metadata) that was captured.
**Validates: Requirements 19.1, 19.6, 2.1, 2.3, 3.1, 3.3, 4.1, 4.3**

### Property 18: Report Generation Completeness

_For any_ completed test run, the report generator SHALL produce a valid report (HTML or PDF) that includes: summary section, all profile results, all findings with descriptions, all screenshots embedded, metrics, test date/time, and target URL.
**Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8**

### Property 19: Result Filtering and Sorting Correctness

_For any_ set of test results, filtering by profile ID SHALL return only results from that profile, sorting by status SHALL order results consistently (pass/fail/warning), and sorting by severity SHALL order findings by severity level.
**Validates: Requirements 18.4, 18.5, 18.6**

### Property 20: Screenshot Comparison Consistency

_For any_ pair of baseline and current screenshots, the screenshot comparison SHALL produce a comparison object with: both images embedded or referenced, a diff calculation (pixel difference percentage), and visual diff highlighting indicating areas of change.
**Validates: Requirements 19.2, 19.3, 19.4, 19.5**

---

## Error Handling

### Profile Execution Errors

**Transient Errors** (Retryable):

- Network timeouts
- Browser connection failures
- Memory pressure
- Temporary page load failures

**Permanent Errors** (Not Retried):

- Invalid URL (navigation fails)
- Profile setup failure
- Syntax or logic errors in profile code
- Missing required resources

**Error Response Pattern**:

```typescript
{
  profileId: string;
  status: 'fail';
  error: {
    type: 'transient' | 'permanent';
    message: string;
    stack: string;
    retries: number;
    maxRetries: number;
  }
  findings: [];
  duration: number;
}
```

### Browser Pool Exhaustion

If all browser contexts are in use and a new profile needs to start:

- Queue the profile for execution
- Wait for a context to be released
- Timeout after 30 seconds with error
- Report timeout to user with option to retry

### Graceful Degradation

If non-critical functionality fails:

- Screenshot capture fails: Continue profile with metric indication
- Finding classification fails: Report raw finding with minimal structure
- Report generation fails: Serve results as JSON instead

---

## Testing Strategy

### Unit Testing Approach

**Scope**: Individual profile implementations, utility functions, data validators

**Examples**:

- Profile execution returns correctly structured results
- URL validation accepts/rejects expected formats
- Finding classification assigns correct severity
- Screenshot comparison calculates diffs accurately
- Report generator produces valid HTML
- Error retry logic respects max retry count

**Framework**: Jest with TypeScript support

**Configuration**:

```json
{
  "testMatch": ["**/__tests__/**/*.test.ts"],
  "collectCoverageFrom": ["src/**/*.ts"],
  "coverageThreshold": {
    "global": { "statements": 80, "branches": 75, "functions": 80 }
  }
}
```

### Property-Based Testing Approach

**Scope**: Core orchestration logic, data transformations, and system contracts

**Library**: [fast-check](https://github.com/dubzzz/fast-check) for TypeScript/JavaScript PBT

**Properties to Test** (Implemented as separate PBT suite):

1. **Profile Discovery Property**: For any registered profiles, discovery endpoint returns all of them
   - Generator: Arbitrary number of test profile definitions
   - Property: All generated profiles appear in discovery response
   - Configuration: 100+ iterations

2. **Test Execution State Machine Property**: For any sequence of test state transitions, state remains consistent
   - Generator: Arbitrary sequences of (start, progress_query, cancel) operations
   - Property: State is always valid; transitions follow defined rules
   - Configuration: 100+ iterations

3. **Result Aggregation Property**: For any set of profile results, aggregation produces valid summary
   - Generator: Arbitrary profile result objects with various findings/screenshots
   - Property: Summary totals match actual profile count; no data is lost
   - Configuration: 100+ iterations

4. **Finding Classification Property**: For any raw finding from any profile, classification produces valid Finding object
   - Generator: Arbitrary raw finding structures from different profile types
   - Property: Result is always a valid Finding with required fields
   - Configuration: 100+ iterations

5. **Screenshot Comparison Property**: For any pair of screenshots, comparison is symmetric and consistent
   - Generator: Arbitrary pairs of PNG buffers with varying differences
   - Property: Comparing (A, B) equals comparing (B, A) in difference percentage
   - Configuration: 100+ iterations

**PBT Test Configuration**:

```typescript
// Example PBT test using fast-check
import fc from 'fast-check';
import { ProfileManager } from './src/testing/ProfileManager';

describe('HauntView Property-Based Tests', () => {
  test('Feature: hauntview-core, Property 1: Profile discovery returns all registered profiles', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string(),
            name: fc.string(),
            description: fc.string(),
          }),
          { minLength: 1, maxLength: 16 }
        ),
        (profiles) => {
          const manager = new ProfileManager();
          profiles.forEach((p) => manager.registerProfile(p as any));
          const discovered = manager.getAvailableProfiles();

          // Property: All registered profiles are discovered
          return profiles.every((p) => discovered.some((d) => d.id === p.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing Approach

**Scope**: End-to-end workflows including real browser automation, file I/O, and API interactions

**Examples**:

- Run a single profile against a real website
- Full test suite execution and results retrieval
- Screenshot capture and comparison
- Report generation and download
- MCP tool invocation and result formatting

**Test Environment**:

- Local HTTP server serving static test pages
- Isolated file system for test artifacts
- MCP server running on separate port for testing

**Configuration**:

```typescript
const TEST_FIXTURES = {
  simpleHtml: '<html><body><h1>Test</h1></body></html>',
  responsiveDesignBreakage: '/* CSS that breaks at mobile widths */',
  inaccessibleForm: '<form><input type="text"></form>', // Missing label
  performanceHeavy: '/* Large resources, slow load */',
};
```

### Performance Considerations

**Profile Execution Time**:

- Single profile: 10-30 seconds typically
- Full suite (16 profiles): 2-10 minutes depending on page size and network

**Optimization Strategies**:

- Parallel profile execution (multiple browser contexts)
- Browser context reuse (setup once, execute many)
- Screenshot compression (PNG optimization)
- Result caching (avoid re-execution for same URL)

**Resource Management**:

- Limit concurrent browser instances to CPU cores × 2
- Implement LRU cache for screenshots (max 500MB)
- Clean up results older than 30 days
- Monitor and log resource usage

---

## Design Decisions and Rationale

### 1. Full-Stack Next.js Architecture

**Decision**: Use Next.js App Router for both frontend and API routes; no separate backend server

**Rationale**:

- Single codebase, shared TypeScript types between frontend and backend
- API routes run in Node.js, providing access to Playwright
- Simplified deployment; frontend and backend scale together
- Faster iteration during development

**Trade-offs**:

- Serverless deployment requires careful resource management for long-running tests
- Scaling requires coordination between API routes and browser pool
- Mitigated by: Implementing proper async handling and connection pooling

### 2. Sequential Profile Execution (Phase 1-3) with Optional Parallelization (Phase 4)

**Decision**: Execute profiles sequentially by default; parallelize only for optional "Full Test"

**Rationale**:

- Reduces memory overhead and browser instance management complexity
- Predictable resource usage
- Easier to debug and troubleshoot
- Phase 4 adds parallelization when infrastructure is stable

**Trade-offs**:

- Slower full test suite execution
- Mitigated by: Full Test runs are user-initiated; users can run individual profiles in parallel manually

### 3. Local File System Storage for Results

**Decision**: Store all results (JSON, screenshots, reports) in local file system under `./hauntview-results/`

**Rationale**:

- Privacy-first: No data leaves the user's machine
- No database setup required
- Simple backup and archival (copy directory)
- Easy to inspect results manually

**Trade-offs**:

- No built-in versioning or concurrent access control
- File system performance limits for large result sets
- Mitigated by: Implementing cleanup policies and result pagination

### 4. MCP Server as Optional Sidecar

**Decision**: Run MCP server on a separate port; users enable it explicitly

**Rationale**:

- Kiro integration is optional for non-AI workflows
- Reduces surface area for users not using Kiro
- Allows testing MCP independently
- Clear separation of concerns

**Trade-offs**:

- Adds deployment complexity for Kiro users
- Mitigated by: Clear documentation and startup scripts

### 5. Screenshot Comparison via Pixel-Level Diff

**Decision**: Use pixel-by-pixel comparison with percentage-based diff reporting

**Rationale**:

- Objective, deterministic comparison
- Works across different image formats
- Can highlight specific changed areas
- Human-friendly percentage reporting

**Trade-offs**:

- Minor rendering differences trigger diffs (anti-aliasing, font rendering)
- Not semantic understanding of layout
- Mitigated by: Configurable diff thresholds; visual inspection by user

### 6. Fast-Check for Property-Based Testing

**Decision**: Use fast-check library for all PBT

**Rationale**:

- Mature, well-maintained library
- TypeScript-first with strong type support
- Comprehensive built-in arbitraries (string, number, array, record, etc.)
- Excellent shrinking for failed counterexamples
- Active community and documentation

**Trade-offs**:

- Additional dependency to manage
- Learning curve for team unfamiliar with PBT
- Mitigated by: Excellent documentation; properties written with clear intent

### 7. Phased Implementation Strategy

**Decision**: Implement 16 profiles across 4 phases + MCP integration in Phase 5

**Rationale**:

- Allows MVP release after Phase 1 (3 profiles + core infrastructure)
- Each phase adds testing category (responsive → resilience → security → performance)
- Allows user feedback between phases
- Reduces initial development complexity
- Enables integration testing of core infrastructure early

**Trade-offs**:

- Users see incomplete feature set initially
- Mitigated by: Clear communication about roadmap; MVP is fully functional

---

## API Specification

### Test Execution Endpoints

```typescript
// POST /api/test/run
// Start a new test run
Request:
{
  targetUrl: string; // Required: URL to test
  profileIds?: string[]; // Optional: Array of profile IDs; if omitted, defaults to all
  options?: {
    parallel?: boolean; // Optional: Execute profiles in parallel (Phase 4+)
    retryOnFailure?: boolean; // Optional: Automatically retry failed profiles
    includeScreenshots?: boolean; // Optional: Capture screenshots (default: true)
  };
}

Response (201 Created):
{
  runId: string;
  status: 'queued';
  url: string;
  profileIds: string[];
  createdAt: ISO8601;
}

// GET /api/test/status/:runId
// Get current status of a test run
Response:
{
  runId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'canceled';
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  currentProfile?: {
    id: string;
    name: string;
    startedAt: ISO8601;
  };
  estimatedTimeRemaining: number; // milliseconds
  error?: {
    message: string;
    code: string;
  };
}

// GET /api/test/results/:runId
// Get complete results for a test run
Response:
{
  runId: string;
  url: string;
  startedAt: ISO8601;
  completedAt: ISO8601;
  duration: number; // milliseconds
  status: 'completed' | 'failed' | 'canceled';
  summary: {
    totalProfiles: number;
    passedProfiles: number;
    failedProfiles: number;
    totalFindings: number;
    criticalFindings: number;
  };
  profiles: ProfileResult[];
}

// POST /api/test/cancel/:runId
// Cancel an ongoing test run
Response:
{
  runId: string;
  status: 'canceled';
  canceledAt: ISO8601;
}

// GET /api/test/results/:runId/download
// Download results as JSON file
Response: JSON file download

// GET /api/reports/:runId/generate
// Generate and download report in specified format
Query params: format=html|pdf
Response: HTML and Markdown file download

// GET /api/screenshots/:runId/:profileId
// Get screenshots for a specific profile in a run
Response:
{
  profileId: string;
  screenshots: Array<{
    id: string;
    index: number;
    viewport: { width: number; height: number };
    capturedAt: ISO8601;
    dataUrl: string; // Base64-encoded PNG
  }>;
}

// POST /api/screenshots/:runId/:profileId/compare
// Compare two sets of screenshots
Request:
{
  baselineRunId: string;
  currentRunId: string;
  profileId: string;
}
Response:
{
  comparison: Array<{
    baseline: {
      id: string;
      dataUrl: string;
    };
    current: {
      id: string;
      dataUrl: string;
    };
    difference: {
      percentage: number;
      pixels: number;
    };
    diffImageUrl: string; // Diff visualization
  }>;
}
```

---

## Deployment and Configuration

### Environment Variables

```bash
# Required
NODE_ENV=production
NEXT_PUBLIC_API_BASE=http://localhost:3000

# Optional - MCP Server
HAUNTVIEW_MCP_PORT=5050
HAUNTVIEW_MCP_ENABLED=true

# Optional - Performance Tuning
HAUNTVIEW_MAX_BROWSER_INSTANCES=4
HAUNTVIEW_SCREENSHOT_QUALITY=90
HAUNTVIEW_RESULT_RETENTION_DAYS=30

# Optional - Logging
HAUNTVIEW_LOG_LEVEL=info
HAUNTVIEW_LOG_DIR=./logs
```

### File System Structure

```
project-root/
├── app/
│   ├── api/
│   │   ├── test/
│   │   │   ├── run/
│   │   │   ├── status/
│   │   │   ├── results/
│   │   │   ├── cancel/
│   │   │   └── ...
│   │   ├── reports/
│   │   ├── screenshots/
│   │   └── mcp/
│   └── (frontend pages)
├── src/
│   ├── testing/
│   │   ├── ProfileManager.ts
│   │   ├── profiles/
│   │   │   ├── index.ts
│   │   │   ├── ResponsiveMobileProfile.ts
│   │   │   ├── ConsoleErrorsProfile.ts
│   │   │   └── ... (other profiles)
│   │   └── browser/
│   │       ├── BrowserPool.ts
│   │       └── Context types
│   ├── services/
│   │   ├── ScreenshotManager.ts
│   │   ├── ReportGenerator.ts
│   │   ├── FindingClassifier.ts
│   │   ├── ResultService.ts
│   │   └── StorageService.ts
│   ├── mcp/
│   │   └── MCPServer.ts
│   └── types/
│       └── index.ts
├── hauntview-results/
│   └── (Generated test runs and results)
└── (Other Next.js files)
```

### Browser Resource Requirements

**Minimum**:

- 2GB RAM available for one Chromium instance
- 500MB disk space for results and screenshots

**Recommended**:

- 4GB+ RAM for parallel execution
- 2GB+ disk space for result history

### Startup and Health Checks

```bash
# Start HauntView
npm run dev

# Health check endpoint
GET /api/health
Response: { status: 'ok', version: '0.1.0', mcp_enabled: boolean }

# Start with MCP server
HAUNTVIEW_MCP_ENABLED=true npm run dev
```

---
