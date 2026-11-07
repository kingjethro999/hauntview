/**
 * Full Markdown export of the HauntView Developer Manual
 * Used by the "Copy page as Markdown" button for instant LLM context ingestion.
 */

export const HAUNTVIEW_DOCS_MARKDOWN = `# HauntView Developer Manual (Kiro Hackathon Project)

> Deterministic failure-mode resilience, accessibility, and visual chaos testing engine with Model Context Protocol (MCP) and CLI integration.
> Built for Kiro Hackathon · Primary Support for Kiro IDE & Kiro Powers.
> Hosted Service: https://hauntview.onrender.com
> GitHub: https://github.com/kingjethro999/hauntview
> Protocol Version: Model Context Protocol (MCP) 2024-11-05

---

## 1. Overview

HauntView equips autonomous AI coding agents in Kiro and terminal users with deterministic failure-mode resilience testing, responsive viewport audits, and accessibility defect detection across 25 automated testing profiles.

---

## 2. Command-Line Interface (\`haunt\`)

HauntView includes a standalone CLI compiled for Node 22:

\`\`\`bash
# 1. Install globally via npm
npm install -g hauntview

# 2. Run testing rites against any target URL
haunt https://example.com

# 3. Configure default export formats, target directories, and concurrency
haunt setup

# 4. Diagnose environment, browser installations, and system capabilities
haunt doctor
\`\`\`

### Non-Interactive / CI Flags
\`\`\`bash
haunt https://example.com --output zip,html --out-dir ./reports --concurrency -a 2 --yes
\`\`\`

- Exit code \`0\`: clean or warning/info findings only.
- Exit code \`1\`: one or more \`error\` findings detected (ideal for CI test gates).
- Exit code \`2\`: runtime or configuration error.

---

## 3. Kiro Integration (Primary)

### Option A: Kiro IDE via Remote Endpoint (\`.kiro/settings/mcp.json\`)
Zero-install setup. Direct connection to the hosted engine on Render:

\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

### Option B: Kiro IDE via Local Stdio Subprocess (\`.kiro/settings/mcp.json\`)
Runs a local Node.js process with zero web bloat:

\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "command": "node",
      "args": ["--import", "tsx/esm", "src/mcp/server.ts"],
      "env": {
        "HAUNT_API_URL": "https://hauntview.onrender.com",
        "NODE_ENV": "development"
      }
    }
  }
}
\`\`\`

---

## 4. Installing as a Kiro Power

HauntView ships a fully packaged Kiro Power in the \`power/\` directory:

1. Open Kiro IDE and navigate to the **Powers** panel.
2. Click **Import Power from GitHub**.
3. Enter repository URL: \`https://github.com/kingjethro999/hauntview\`
4. Click **Install**.

### Included Kiro Agent Skills:
- **\`haunt-a-website\`**: Scans target website across failure profiles and returns structured defect plates.
- **\`exorcise-findings\`**: Reads diagnostic findings, inspects source code, and applies patches to fix root causes.
- **\`setup\`**: Verifies local environment, dependencies, and configuration.

### Included Kiro Hooks:
- **\`spec-to-code-quality-gate.json\`**: Blocks spec completion until HauntView passes without critical omens.
- **\`run-tests-on-task-completion.json\`**: Automatically audits the application whenever a task completes.
- **\`format-lint-on-save.json\`**: Automatically runs linters on modified files.

---

## 5. Profile Concurrency & Hardware Limits

HauntView features an opt-in bounded worker pool for parallel rite execution:
- **Sequential:** ~70–80 seconds for 25 profiles.
- **Concurrent:** ~25–30 seconds with 2–4 workers.

### Hardware Capability Heuristic
- \`cpuBound = floor(logicalCores / 2)\`
- \`ramBound = floor(totalMemoryGb / 2)\`
- \`maxConcurrency = min(cpuBound, ramBound, 8)\`
- If \`maxConcurrency < 2\`, concurrency is disabled to prevent memory starvation and system freeze.

### Hosted Environment Notice
The hosted demo instance (\`hauntview.onrender.com\`) runs on 0.5 vCPU and 512 MB RAM. Concurrency is strictly disabled there to protect container stability. For concurrent testing, install the CLI (\`npm i -g hauntview\`) or run locally.

---

## 6. Dual Storage Architecture

- **Web UI:** History is persisted per browser in \`localStorage\` via Zustand (\`crypt-store.ts\`). This ensures complete privacy on public/shared instances with zero cross-tenant leakage. Reports rehydrate on server restart. A "Clear History" button purges local state.
- **Headless (CLI/MCP/REST):** Stored in server-side SQLite at \`.hauntview/data/hauntview.db\`. CLI exports standalone Zip, HTML, and Markdown bundles directly to disk.

---

## 7. Other AI Coding Agents

### Claude Code CLI
\`\`\`bash
claude mcp add --transport sse hauntview https://hauntview.onrender.com/api/mcp
\`\`\`

### Cursor (\`.cursor/mcp.json\` or \`~/.cursor/mcp.json\`)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

### Windsurf (\`~/.codeium/windsurf/mcp_config.json\`)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "serverUrl": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

### VS Code (\`.vscode/mcp.json\`)
\`\`\`json
{
  "servers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

---

## 8. MCP Tools Reference

| Tool Name | Arguments | Description |
| :--- | :--- | :--- |
| \`list-test-profiles\` | *(none)* | Returns all 25 supported failure-mode testing rites, viewports, and timeout settings. |
| \`run-test-profile\` | \`url\` (string, req), \`profiles\` (array, opt), \`concurrency\` (bool, opt), \`concurrencyAmount\` (int, opt) | Drives headless browsers against target URL through selected rites. Returns run ID, duration, and structured findings. |
| \`get-run-status\` | \`runId\` (string, req) | Returns real-time execution progress, status, and severity counters for an active or completed run. |
| \`get-latest-report\` | *(none)* | Retrieves structured JSON report and findings from the most recent test run. |
| \`compare-runs\` | \`runId1\` (string, req), \`runId2\` (string, req) | Performs differential regression analysis: detects new omens, persistent bugs, and resolved defects. |
| \`export-report\` | \`runId\` (string, req), \`format\` ('html' \| 'markdown' \| 'json') | Exports report as interactive HTML Grimoire, clean Markdown, or raw JSON. |

---

## 9. Local Setup & Repository Development

\`\`\`bash
# 1. Clone repository
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview

# 2. Install dependencies (Node 22 LTS + pnpm recommended)
pnpm install
pnpm run setup:hooks

# 3. Start local development server (Parlour UI at http://localhost:3000)
pnpm dev

# 4. Run test suites (34 suites, 169 tests)
pnpm test

# 5. Build CLI executable
pnpm run build:cli

# 6. Run compliance presubmit checks
pnpm run presubmit
\`\`\`
`;
