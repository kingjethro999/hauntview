# Implementation Plan: HauntView - Local Web Testing Engine

## Overview

HauntView is a full-stack Next.js application that provides comprehensive web application testing through 16 test profiles, a polished React UI, a robust Node.js backend, and MCP (Model Context Protocol) integration with Kiro for AI-driven test execution. The implementation follows a phased approach, starting with core infrastructure and 3 MVP profiles, then progressively adding profiles and features through 10 phases.

## Tasks

### Phase 1: Project Setup & Core Infrastructure

- [ ] 1. Initialize Next.js project structure and dependencies
  - Create Next.js project with TypeScript and App Router
  - Install core dependencies: Playwright, fast-check, Jest, React, TailwindCSS
  - Configure TypeScript, ESLint, Prettier
  - Set up Git and initial commit
  - _Requirements: 22.1, 23.1_

- [ ] 2. Set up directory structure and configuration
  - Create directories: `src/lib`, `src/utils`, `src/types`, `src/testing`, `src/services`, `src/components`, `src/app/api`
  - Create environment configuration (`.env.local`, `.env.example`)
  - Set up `hauntview-results` directory for local storage
  - Configure Next.js for API route long timeouts
  - _Requirements: 22.3_

- [ ] 3. Establish testing framework and tooling
  - Configure Jest with TypeScript support
  - Set up fast-check for property-based testing
  - Create test directory structure (`__tests__`, `__fixtures__`)
  - Create test utilities and helpers
  - _Requirements: None (infrastructure)_

- [ ] 4. Define core type definitions and interfaces
  - Create `src/types/profiles.ts` with TestProfile interface
  - Create `src/types/results.ts` with TestRun, ProfileResult, Finding types
  - Create `src/types/index.ts` with all exported types
  - Document type hierarchy and contracts
  - _Requirements: 1.1, 1.6, 10.4, 18.1_

- [ ] 5. Implement BrowserPool for Playwright management
  - Create `src/lib/BrowserPool.ts` with IBrowserPool interface
  - Implement browser instance launch and cleanup
  - Implement browser context acquisition and release
  - Add connection pooling logic and status tracking
  - Test resource cleanup
  - _Requirements: 22.1, 22.6, 22.7_

- [ ]* 5.1 Write property test for BrowserPool resource management
  - **Property 14: Browser Resource Cleanup**
  - **Validates: Requirements 22.6, 22.7**

- [ ] 6. Implement ScreenshotManager for capture and storage
  - Create `src/lib/ScreenshotManager.ts` with IScreenshotManager interface
  - Implement screenshot capture at specified viewports
  - Implement screenshot file storage with metadata
  - Implement screenshot retrieval and cleanup
  - Create directory structure for organizing screenshots by runId
  - _Requirements: 2.2, 2.5, 3.2, 3.5, 4.2, 4.5, 19.1_

- [ ]* 6.1 Write property test for screenshot round-trip storage
  - **Property 17: Screenshot Capture Round-Trip**
  - **Validates: Requirements 2.1, 2.3, 3.1, 3.3, 4.1, 4.3, 19.1, 19.6**

- [ ] 7. Implement FindingClassifier for result normalization
  - Create `src/lib/FindingClassifier.ts` with IFindingClassifier interface
  - Implement finding normalization across different profile types
  - Implement severity level assignment logic
  - Implement evidence structure and validation
  - _Requirements: 10.4, 10.5, 11.7, 11.8, 18.1_

- [ ]* 7.1 Write property test for finding classification
  - **Property 9: Finding Classification and Structure**
  - **Validates: Requirements 10.4, 10.5, 11.7, 11.8, 14.4, 14.5, 14.6**

- [ ] 8. Create TestProfile interface and base profile class
  - Create `src/testing/TestProfile.ts` with TestProfile interface
  - Create `src/testing/BaseProfile.ts` with common profile logic
  - Implement profile lifecycle methods (setup, execute, cleanup)
  - Implement retry logic for transient errors
  - Implement profile metadata and estimation
  - _Requirements: 1.1, 1.4, 25.2, 25.3_

- [ ] 9. Implement ProfileManager for orchestration
  - Create `src/testing/ProfileManager.ts` with IProfileManager interface
  - Implement profile registration and discovery
  - Implement sequential profile execution with state management
  - Implement test run creation and tracking
  - Implement progress tracking and cancellation
  - _Requirements: 1.3, 1.4, 1.5, 1.6, 24.1, 24.2, 24.3, 24.4, 24.5_

- [ ]* 9.1 Write property test for profile discovery
  - **Property 1: Profile Discovery and Registration**
  - **Validates: Requirements 1.1, 23.1**

- [ ]* 9.2 Write property test for profile selection state
  - **Property 2: Profile Selection State**
  - **Validates: Requirements 1.2, 1.6, 23.2**

- [ ]* 9.3 Write property test for full test execution completeness
  - **Property 3: Full Test Execution Completeness**
  - **Validates: Requirements 1.3, 23.3**

- [ ]* 9.4 Write property test for test run progress tracking
  - **Property 4: Test Run Progress Tracking**
  - **Validates: Requirements 1.4, 23.4, 24.1, 24.2, 24.3**

- [ ]* 9.5 Write property test for cancellation idempotency
  - **Property 5: Test Run Cancellation Idempotency**
  - **Validates: Requirements 1.5, 24.4, 24.5**

- [ ]* 9.6 Write property test for profile execution result completeness
  - **Property 6: Profile Execution Result Completeness**
  - **Validates: Requirements 1.6, 18.1, 18.2, 18.3**

- [ ] 10. Implement local file storage service
  - Create `src/services/StorageService.ts`
  - Implement result persistence (JSON serialization)
  - Implement screenshot storage and retrieval
  - Implement cleanup and archival logic
  - Implement result querying and listing
  - _Requirements: 22.3, 22.5_

- [ ] 11. Create test fixtures and mock data
  - Create `__fixtures__/test-pages/` with HTML test pages (simple, accessible, responsive-breaking)
  - Create `__fixtures__/profiles/` with mock profile definitions
  - Create `__fixtures__/results/` with sample test results
  - Document fixture usage
  - _Requirements: None (testing infrastructure)_

- [ ] 12. Checkpoint - Verify core infrastructure builds and core tests pass
  - Run full test suite for Phase 1
  - Verify TypeScript compilation without errors
  - Verify Jest tests pass
  - Ask the user if questions arise.

---

### Phase 2: Testing Engine Core & First 3 Profiles

- [ ] 13. Implement URL validation utility
  - Create `src/utils/urlValidator.ts`
  - Implement localhost validation (localhost:PORT)
  - Implement HTTP/HTTPS URL validation
  - Implement accessibility check with timeout
  - Implement comprehensive error messages
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ]* 13.1 Write property test for URL validation
  - **Property 11: URL Validation Universality**
  - **Validates: Requirements 17.1, 17.2, 17.3, 17.4, 17.5, 17.6**

- [ ] 14. Implement Mobile Responsive Test Profile
  - Create `src/testing/profiles/MobileResponsiveProfile.ts`
  - Implement 3 viewport sizes: 320px, 375px, 428px
  - Implement screenshot capture at each viewport
  - Implement layout issue detection (overflow, unreadable text)
  - Implement finding generation for layout problems
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 14.1 Write property test for mobile viewport coverage
  - **Property 7: Responsive Design Profile Viewport Coverage**
  - **Validates: Requirements 2.2, 2.5, 3.2, 3.5, 4.2, 4.5**

- [ ] 15. Implement Desktop Responsive Test Profile
  - Create `src/testing/profiles/DesktopResponsiveProfile.ts`
  - Implement 2 viewport sizes: 1280px, 1920px
  - Implement screenshot capture at each viewport
  - Implement layout issue detection
  - Implement finding generation for layout problems
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 16. Implement Console Errors Test Profile
  - Create `src/testing/profiles/ConsoleErrorsProfile.ts`
  - Implement browser console monitoring
  - Implement failed network request capture (4xx, 5xx)
  - Implement error message and stack trace extraction
  - Implement finding generation with error details
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [ ]* 16.1 Write property test for console error capture
  - **Property 8: Console Error Capture Completeness**
  - **Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6**

- [ ] 17. Create API route for test execution
  - Create `src/app/api/test/run/route.ts`
  - Implement URL validation and profile selection
  - Implement test run creation with unique ID
  - Implement ProfileManager invocation
  - Implement response with runId and status
  - _Requirements: 1.1, 17.1, 17.2_

- [ ] 18. Create API route for test status
  - Create `src/app/api/test/status/[runId]/route.ts`
  - Implement progress retrieval from ProfileManager
  - Implement estimated time remaining calculation
  - Implement current profile reporting
  - _Requirements: 1.4, 24.1, 24.2, 24.3_

- [ ] 19. Create API route for test results
  - Create `src/app/api/test/results/[runId]/route.ts`
  - Implement result retrieval from StorageService
  - Implement result aggregation and summary
  - Implement error reporting for failed runs
  - _Requirements: 1.6, 18.1, 18.2, 18.3_

- [ ] 20. Create API route for test cancellation
  - Create `src/app/api/test/cancel/[runId]/route.ts`
  - Implement cancellation via ProfileManager
  - Implement state validation (can only cancel running/queued)
  - Implement resource cleanup
  - _Requirements: 1.5, 24.4, 24.5_

- [ ]* 20.1 Write property test for local-only execution
  - **Property 13: Local-Only Execution**
  - **Validates: Requirements 22.2, 22.3, 22.5**

- [ ]* 20.2 Write property test for error retry logic
  - **Property 15: Error Retry Logic**
  - **Validates: Requirements 25.1, 25.2, 25.6**

- [ ]* 20.3 Write property test for profile continuation on failure
  - **Property 16: Profile Continuation on Failure**
  - **Validates: Requirements 25.3, 25.4, 25.5**

- [ ] 21. Checkpoint - Verify Phase 2 builds and MVP profiles work
  - Run test for all 3 profiles against a real URL
  - Verify screenshots are captured correctly
  - Verify results are stored and retrievable
  - Verify API routes respond correctly
  - Ask the user if questions arise.

---

### Phase 3: Frontend UI & Results Display

- [ ] 22. Create layout component and styling setup
  - Create `src/app/layout.tsx` with global styling
  - Set up TailwindCSS configuration
  - Create reusable component library (Button, Card, Input, etc.)
  - Implement responsive design system
  - _Requirements: 23.6, 23.7_

- [ ] 23. Implement home page with profile selection
  - Create `src/app/page.tsx` (home page)
  - Create profile selection grid component
  - Create URL input component with validation feedback
  - Implement "Full Test" and "Selected Profiles" buttons
  - Implement form state management
  - _Requirements: 1.1, 1.2, 17.1, 23.1, 23.2, 23.3_

- [ ] 24. Implement test progress display
  - Create `src/components/ProgressDisplay.tsx`
  - Implement real-time progress update polling
  - Implement current profile indicator
  - Implement completion percentage display
  - Implement estimated time remaining
  - Implement cancel button
  - _Requirements: 1.4, 24.1, 24.2, 24.3, 24.5_

- [ ] 25. Create results page with filtering and sorting
  - Create `src/app/results/page.tsx`
  - Create results display component showing all profiles
  - Implement filtering by profile
  - Implement sorting by status, severity, or profile
  - Create findings list component with severity indicators
  - _Requirements: 18.4, 18.5, 18.6_

- [ ] 26. Create screenshot viewer component
  - Create `src/components/ScreenshotViewer.tsx`
  - Implement lightbox-style display with navigation
  - Implement viewport size indicator
  - Implement full-screen mode
  - Implement download button for individual screenshots
  - _Requirements: 19.1, 19.6_

- [ ] 27. Implement screenshot comparison tool
  - Create `src/components/ScreenshotComparison.tsx`
  - Implement side-by-side display of baseline and current
  - Implement difference percentage display
  - Implement visual diff highlighting
  - Implement toggle between images
  - _Requirements: 19.2, 19.3, 19.4, 19.5_

- [ ] 28. Create API hooks for frontend integration
  - Create `src/hooks/useTestRun.ts` for test execution
  - Create `src/hooks/useTestStatus.ts` for progress polling
  - Create `src/hooks/useTestResults.ts` for results fetching
  - Implement error handling and loading states
  - Implement automatic polling with cleanup
  - _Requirements: None (internal infrastructure)_

- [ ] 29. Implement finding detail display
  - Create `src/components/FindingDetail.tsx`
  - Display severity badge with color coding
  - Display title, description, and recommendation
  - Display evidence (screenshots, console output)
  - Display location information if available
  - _Requirements: 18.1, 18.6, 18.7_

- [ ] 30. Create responsive mobile layout
  - Ensure all pages work on mobile viewports (320px, 768px)
  - Implement responsive grid for profile selection
  - Implement collapsible details for findings
  - Test touch interactions
  - _Requirements: 23.7_

- [ ] 31. Implement accessibility features in UI
  - Add ARIA labels to interactive elements
  - Implement keyboard navigation
  - Implement screen reader support
  - Use semantic HTML
  - Verify color contrast (WCAG AA)
  - _Requirements: 23.8_

- [ ] 32. Checkpoint - Verify UI renders and integrates with backend
  - Load home page and verify profile grid displays
  - Run a test and verify progress updates
  - View results page and verify findings display
  - Test filtering and sorting
  - Ask the user if questions arise.

---

### Phase 4: Reports, Storage & 4 Additional Profiles

- [ ] 33. Implement screenshot comparison logic
  - Create `src/lib/ScreenshotComparator.ts`
  - Implement pixel-by-pixel comparison using pixelmatch
  - Calculate difference percentage
  - Generate visual diff image highlighting changes
  - _Requirements: 19.2, 19.3, 19.4, 19.5_

- [ ]* 33.1 Write property test for screenshot comparison consistency
  - **Property 20: Screenshot Comparison Consistency**
  - **Validates: Requirements 19.2, 19.3, 19.4, 19.5**

- [ ] 34. Implement ReportGenerator for HTML and Markdown output
  - Create `src/services/ReportGenerator.ts` with IReportGenerator interface
  - Create HTML template for report
  - Implement result aggregation and summary generation
  - Embed screenshots as base64 in HTML
  - Implement Markdown generation (use markdown library)
  - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8_

- [ ]* 34.1 Write property test for report generation completeness
  - **Property 18: Report Generation Completeness**
  - **Validates: Requirements 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8**

- [ ] 35. Create API route for report generation and download
  - Create `src/app/api/reports/[runId]/generate/route.ts`
  - Implement format parameter (html/pdf)
  - Implement report generation via ReportGenerator
  - Implement file download response
  - _Requirements: 20.1, 20.7_

- [ ] 36. Create API route for screenshot download
  - Create `src/app/api/screenshots/[runId]/[profileId]/route.ts`
  - Implement screenshot retrieval by runId and profileId
  - Implement image response with correct MIME type
  - _Requirements: 19.6_

- [ ] 37. Create API route for screenshot comparison
  - Create `src/app/api/screenshots/[runId]/compare/route.ts`
  - Implement baseline and current screenshot loading
  - Implement ScreenshotComparator invocation
  - Implement diff results response
  - _Requirements: 19.2, 19.3, 19.4_

- [ ] 38. Add report download button to results page
  - Update `src/app/results/page.tsx`
  - Add button for HTML report download
  - Add button for Markdown report download
  - Implement loading and error states
  - _Requirements: 20.1_

- [ ] 39. Implement Tablet Responsive Test Profile
  - Create `src/testing/profiles/TabletResponsiveProfile.ts`
  - Implement 2 viewport sizes: 768px, 1024px
  - Implement screenshot capture at each viewport
  - Implement layout issue detection
  - Implement finding generation
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 40. Implement Accessibility Test Profile
  - Create `src/testing/profiles/AccessibilityProfile.ts`
  - Implement heading hierarchy validation
  - Implement alt text presence check
  - Implement form label association check
  - Implement color contrast verification
  - Implement descriptive link text check
  - Implement finding generation with WCAG references
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ] 41. Implement Broken Links Test Profile
  - Create `src/testing/profiles/BrokenLinksProfile.ts`
  - Implement link discovery on page
  - Implement HTTP status verification for each link
  - Implement internal vs external link distinction
  - Implement timeout handling
  - Implement finding generation with link details
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 42. Implement Performance Test Profile
  - Create `src/testing/profiles/PerformanceProfile.ts`
  - Implement metric measurement (FCP, LCP, CLS)
  - Implement resource load time tracking
  - Implement resource size analysis
  - Implement finding generation with optimization recommendations
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 43. Checkpoint - Verify reports generate and all Phase 4 profiles work
  - Run tests including new profiles
  - Generate HTML report and verify it contains all data
  - Generate Markdown report and verify format
  - Verify screenshot comparison works
  - Ask the user if questions arise.

---

### Phase 5: 5 Additional Profiles (Resilience & Security)

- [ ] 44. Implement Image Failure Test Profile
  - Create `src/testing/profiles/ImageFailureProfile.ts`
  - Implement image request blocking via Playwright interception
  - Implement screenshot capture with images blocked
  - Implement alt text presence check
  - Implement layout break detection
  - Implement finding generation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 44.1 Write property test for image failure profile
  - **Property 10: Image Failure Profile Behavior**
  - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**

- [ ] 45. Implement Font Failure Test Profile
  - Create `src/testing/profiles/FontFailureProfile.ts`
  - Implement custom font request blocking
  - Implement screenshot capture with fallback fonts only
  - Implement rendering comparison with fallback fonts
  - Implement finding generation for font fallback issues
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 46. Implement JavaScript Disabled Test Profile
  - Create `src/testing/profiles/JavaScriptDisabledProfile.ts`
  - Implement JavaScript disabling via Playwright context
  - Implement page loading without JavaScript
  - Implement screenshot capture
  - Implement non-functional element detection
  - Implement finding generation
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 47. Implement Form Resilience Test Profile
  - Create `src/testing/profiles/FormResilienceProfile.ts`
  - Implement form discovery on page
  - Implement form field population with invalid data
  - Implement form submission without real transaction
  - Implement validation error capture
  - Implement error message clarity assessment
  - Implement finding generation
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [ ] 48. Implement Security Hygiene Test Profile
  - Create `src/testing/profiles/SecurityHygieneProfile.ts`
  - Implement HTTPS verification
  - Implement security header presence check (CSP, X-Frame-Options, X-Content-Type-Options)
  - Implement mixed content detection
  - Implement security header recommendation generation
  - Implement finding generation
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6_

- [ ] 49. Checkpoint - Verify all Phase 5 profiles work and results are correct
  - Run tests with all Phase 5 profiles
  - Verify findings are generated appropriately
  - Verify profile error handling and retries
  - Ask the user if questions arise.

---

### Phase 6: 4 Final Profiles & Full Suite Orchestration

- [ ] 50. Implement Network Resilience Test Profile
  - Create `src/testing/profiles/NetworkResilienceProfile.ts`
  - Implement network throttling (latency injection)
  - Implement packet loss simulation
  - Implement slow connection emulation
  - Implement page load state capture
  - Implement loading indicator detection
  - Implement finding generation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 51. Implement Offline Test Profile
  - Create `src/testing/profiles/OfflineProfile.ts`
  - Implement complete offline simulation (all requests blocked)
  - Implement screenshot capture in offline state
  - Implement cached content verification
  - Implement offline-friendly feature detection
  - Implement finding generation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

- [ ] 52. Implement Reduced Motion Test Profile
  - Create `src/testing/profiles/ReducedMotionProfile.ts`
  - Implement prefers-reduced-motion media query enablement
  - Implement screenshot capture with reduced motion
  - Implement animation detection and reporting
  - Implement side-by-side comparison screenshot capture
  - Implement finding generation
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6_

- [ ] 53. Implement Full Test Suite Profile
  - Create `src/testing/profiles/FullTestProfile.ts`
  - Implement all 16 profiles orchestration
  - Implement result aggregation from all profiles
  - Implement sequential execution management
  - Implement overall status determination
  - _Requirements: 1.3_

- [ ] 54. Update ProfileManager to support "Full Test" execution
  - Modify `src/testing/ProfileManager.ts`
  - Register FullTestProfile
  - Handle Full Test profile request
  - Ensure proper profile execution order
  - _Requirements: 1.3_

- [ ] 55. Add Full Test selection to UI
  - Update `src/app/page.tsx`
  - Add "Run Full Test Suite" button
  - Implement selection of all 16 profiles
  - _Requirements: 1.3, 23.3_

- [ ] 56. Checkpoint - Verify all 16 profiles work and Full Test executes
  - Run Full Test Suite
  - Verify all 16 profiles execute
  - Verify comprehensive results are generated
  - Verify reports include all profile results
  - Ask the user if questions arise.

---

### Phase 7: Property-Based Testing Suite (Correctness Validation)

- [ ] 57. Implement property tests for result filtering and sorting
  - Create `__tests__/properties/filtering-sorting.test.ts`
  - **Property 19: Result Filtering and Sorting Correctness**
  - Implement generators for arbitrary profile result sets
  - Verify filtering by profile ID returns correct results
  - Verify sorting by status maintains consistency
  - Verify sorting by severity maintains consistency
  - _Requirements: 18.4, 18.5, 18.6_

- [ ] 58. Run and validate all 20 property-based tests
  - Execute complete PBT suite with 100+ iterations each
  - Verify Property 1-20 all pass
  - Document any discovered edge cases
  - Fix any failing properties or implementation bugs
  - _Requirements: All correctness properties_

- [ ] 59. Create PBT documentation and testing guide
  - Document property-based testing approach
  - Explain each of 20 properties
  - Provide examples of generated test data
  - Document fast-check configuration
  - _Requirements: None (documentation)_

- [ ] 60. Checkpoint - All property tests pass and system is validated
  - Verify all 20 property tests pass consistently
  - Review edge cases discovered by PBT
  - Ask the user if questions arise.

---

### Phase 8: MCP Server Integration (Kiro Connection)

- [ ] 61. Implement MCP server foundation
  - Create `src/mcp/server.ts`
  - Implement MCP protocol initialization
  - Implement error handling for MCP operations
  - Set up MCP server on separate port (default 5050)
  - _Requirements: 21.1_

- [ ] 62. Expose MCP tool: run_profile
  - Implement `hauntview_run_profile` MCP tool
  - Accept url and profileId parameters
  - Execute test profile via ProfileManager
  - Return results in MCP-compatible format
  - _Requirements: 21.2, 21.3, 21.4, 21.5, 21.6_

- [ ]* 62.1 Write property test for MCP tool availability
  - **Property 12: MCP Tool Availability**
  - **Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5, 21.6, 21.7**

- [ ] 63. Expose MCP tool: run_full_suite
  - Implement `hauntview_run_full_suite` MCP tool
  - Accept url parameter
  - Execute all 16 profiles via ProfileManager
  - Return aggregated results in MCP format
  - _Requirements: 21.2, 21.3, 21.5_

- [ ] 64. Expose MCP tool: get_results
  - Implement `hauntview_get_results` MCP tool
  - Accept runId parameter
  - Retrieve results from StorageService
  - Return results in MCP-structured format
  - _Requirements: 21.3, 21.6_

- [ ] 65. Expose MCP tool: get_status
  - Implement `hauntview_get_status` MCP tool
  - Accept runId parameter
  - Query ProfileManager for run status
  - Return progress and estimated time in MCP format
  - _Requirements: 21.2, 21.6_

- [ ] 66. Expose MCP resources: test-runs
  - Create MCP resource `hauntview://test-runs`
  - List all available test runs with metadata
  - Return in JSON format
  - _Requirements: 21.1_

- [ ] 67. Expose MCP resources: profiles
  - Create MCP resource `hauntview://profiles`
  - List all 16 available profiles with descriptions
  - Return in JSON format
  - _Requirements: 21.1_

- [ ] 68. Create MCP server configuration
  - Create `.mcp-config.json` with server settings
  - Document port and environment variables
  - Document available tools and resources
  - _Requirements: 21.1_

- [ ] 69. Implement MCP server startup in Next.js
  - Create startup logic to launch MCP server alongside Next.js
  - Implement environment variable checking
  - Implement health check endpoint
  - _Requirements: 21.1_

- [ ] 70. Test MCP tool invocations programmatically
  - Create `__tests__/integration/mcp.test.ts`
  - Test each MCP tool with various inputs
  - Verify results format matches MCP spec
  - Test error handling
  - _Requirements: 21.1-21.7_

- [ ] 71. Checkpoint - MCP server runs and Kiro can invoke tools
  - Start MCP server
  - Invoke each MCP tool successfully
  - Verify results are correctly formatted
  - Ask the user if questions arise.

---

### Phase 9: Documentation & Kiro Evidence

- [ ] 72. Create .kiro/steering files for coding standards
  - Create `.kiro/steering/architecture.md` - system design overview
  - Create `.kiro/steering/testing.md` - testing approach and PBT
  - Create `.kiro/steering/profiles.md` - test profile implementation guide
  - Create `.kiro/steering/api-design.md` - API endpoint patterns
  - Provide clear guidelines for extending system
  - _Requirements: None (Kiro integration)_

- [ ] 73. Create .kiro/hooks for automated checks
  - Create `.kiro/hooks/lint-on-save.sh` - Run ESLint on TypeScript changes
  - Create `.kiro/hooks/test-on-profile-create.sh` - Run tests when profile files change
  - Create `.kiro/hooks/type-check-on-save.sh` - Run TypeScript compiler on save
  - Document hook purpose and configuration
  - _Requirements: None (Kiro integration)_

- [ ] 74. Create comprehensive README
  - Overview of HauntView and its features
  - Quick start guide with npm commands
  - Architecture summary with system diagram
  - Explain 16 testing profiles and their purposes
  - Explain MCP integration for Kiro users
  - Contributing guidelines
  - _Requirements: None (documentation)_

- [ ] 75. Create INSTALLATION guide
  - Prerequisites (Node.js, npm/pnpm, Playwright)
  - Step-by-step setup instructions
  - Environment variable configuration
  - MCP server setup and connection
  - Troubleshooting common issues
  - _Requirements: None (documentation)_

- [ ] 76. Create USER GUIDE for testing profiles
  - Detailed explanation of each 16 profiles
  - When to use each profile
  - Interpreting findings and recommendations
  - Running tests via UI
  - Running tests via MCP (for Kiro users)
  - Exporting and sharing reports
  - _Requirements: None (documentation)_

- [ ] 77. Create ARCHITECTURE.md technical documentation
  - System design and component overview
  - Data model and types
  - Profile implementation pattern
  - API endpoint specification
  - Testing strategy (unit, integration, PBT)
  - Property-based testing approach and 20 properties
  - Deployment considerations
  - _Requirements: None (documentation)_

- [ ] 78. Document Kiro usage and evidence
  - Create `KIRO_INTEGRATION.md`
  - Explain steering files and their purpose
  - Explain hooks and automated checks
  - Explain property-based testing methodology
  - Explain MCP server and tool exposure
  - Provide examples of Kiro-assisted workflows
  - Show how specs drove implementation
  - _Requirements: None (documentation)_

- [ ] 79. Create YouTube demo script
  - Create `DEMO_SCRIPT.md` (<3 minutes)
  - Outline key feature demonstrations
  - Cover profile selection and execution
  - Show results display and findings
  - Show report generation
  - Mention MCP integration for AI users
  - Script for easy recording
  - _Requirements: None (documentation)_

- [ ] 80. Checkpoint - All documentation complete and accurate
  - Review all documentation for clarity
  - Verify instructions work end-to-end
  - Verify examples are accurate
  - Ask the user if questions arise.

---

### Phase 10: Optimization & Final Polish

- [ ] 81. Implement parallel profile execution in BrowserPool
  - Update `src/lib/BrowserPool.ts` for parallel contexts
  - Update `src/testing/ProfileManager.ts` for parallel orchestration
  - Implement concurrent profile execution with resource limits
  - Add configurable concurrency level
  - _Requirements: 22.7_

- [ ] 82. Implement and verify memory leak fixes
  - Audit browser resource cleanup
  - Verify all contexts are released after profiles complete
  - Implement memory profiling in tests
  - Fix any identified memory leaks
  - _Requirements: 22.6, 22.7_

- [ ] 83. Implement error handling for edge cases
  - Handle scenarios where URL becomes unavailable mid-test
  - Handle scenarios where browser crashes
  - Handle scenarios where storage becomes full
  - Implement graceful error messages for users
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 25.6_

- [ ] 84. Conduct cross-browser compatibility testing
  - Test UI in multiple browsers (Chrome, Firefox, Safari)
  - Test UI on multiple devices (desktop, tablet, mobile)
  - Fix compatibility issues found
  - Document browser support matrix
  - _Requirements: 23.7_

- [ ] 85. Accessibility review and improvements
  - Conduct WCAG 2.1 AA self-assessment of UI
  - Fix identified accessibility issues
  - Test with keyboard navigation
  - Test with screen reader
  - _Requirements: 23.8_

- [ ] 86. Performance optimization pass
  - Profile Next.js build and runtime performance
  - Optimize bundle size
  - Implement code splitting where beneficial
  - Optimize screenshot compression
  - _Requirements: None (optimization)_

- [ ] 87. Final round of property-based testing
  - Re-run full PBT suite
  - Increase iteration counts to 500+ for critical properties
  - Verify all properties pass under stress
  - Document any edge cases found
  - _Requirements: All correctness properties_

- [ ] 88. Create deployment checklist and guide
  - Document deployment steps for various platforms
  - Document environment configuration for production
  - Document monitoring and logging setup
  - Provide troubleshooting guide for deployment issues
  - _Requirements: None (deployment)_

- [ ] 89. Final code review and cleanup
  - Review all implementation for code quality
  - Ensure consistent code style across codebase
  - Remove debug code and temporary files
  - Update dependencies to latest versions
  - _Requirements: None (quality)_

- [ ] 90. Checkpoint - Final verification and release readiness
  - Run full test suite (unit + integration + PBT)
  - Verify all requirements are implemented
  - Verify all properties hold
  - Verify documentation is complete
  - Verify UI works on all target devices
  - Ask the user if questions arise.

---

## Notes

### Task Organization

- **Phases 1-6**: Feature implementation (16 profiles, core infrastructure, UI, reporting)
- **Phase 7**: Property-based testing validation (20 properties across all components)
- **Phase 8**: MCP server and Kiro integration
- **Phase 9**: Comprehensive documentation and evidence
- **Phase 10**: Optimization, polish, and release preparation

### Optional vs Required Tasks

- **Testing sub-tasks** (marked with `*`): Optional for MVP but strongly recommended for correctness
  - Unit tests (without `*`): REQUIRED to implement
  - Property tests (`*`): Optional but provide high-confidence validation
  - All test sub-tasks validate correctness properties from design

### Testing Patterns

- **Unit Tests**: Verify individual components and functions
- **Integration Tests**: Verify API routes work end-to-end
- **Property-Based Tests**: Verify system invariants hold across all inputs
- Each profile implementation includes both unit and integration testing
- PBT suite validates all 20 correctness properties

### Requirements Traceability

- Every task references specific requirements it fulfills
- All 25 requirements covered by implementation tasks
- All 20 correctness properties validated by PBT tasks
- Requirements mapped to acceptance criteria for verification

### Checkpoints

- Checkpoints after each phase allow verification before proceeding
- Each checkpoint includes specific verification steps
- User asked for questions/issues at each checkpoint
- Allows early detection of architectural issues

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2", "3"] },
    { "id": 1, "tasks": ["4", "5", "6", "7", "8"] },
    { "id": 2, "tasks": ["5.1", "6.1", "7.1", "9", "10", "11"] },
    { "id": 3, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "13"] },
    { "id": 4, "tasks": ["13.1", "14", "15", "16", "17", "18", "19", "20"] },
    { "id": 5, "tasks": ["14.1", "16.1", "20.1", "20.2", "20.3", "21"] },
    {
      "id": 6,
      "tasks": ["22", "23", "24", "25", "26", "27", "28", "29", "30", "31"]
    },
    { "id": 7, "tasks": ["33", "34", "35", "36", "37", "38"] },
    { "id": 8, "tasks": ["33.1", "34.1", "39", "40", "41", "42"] },
    { "id": 9, "tasks": ["44", "45", "46", "47", "48", "44.1"] },
    { "id": 10, "tasks": ["50", "51", "52", "53", "54", "55"] },
    { "id": 11, "tasks": ["57", "58", "59"] },
    { "id": 12, "tasks": ["61", "62", "63", "64", "65", "62.1"] },
    { "id": 13, "tasks": ["66", "67", "68", "69", "70"] },
    { "id": 14, "tasks": ["72", "73", "74", "75", "76", "77", "78", "79"] },
    {
      "id": 15,
      "tasks": ["81", "82", "83", "84", "85", "86", "87", "88", "89"]
    }
  ]
}
```
