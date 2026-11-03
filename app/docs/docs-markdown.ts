/**
 * Full Markdown export of the HauntView Developer Codex
 * Used by the "Copy page as Markdown" button for instant LLM context ingestion.
 */

export const HAUNTVIEW_DOCS_MARKDOWN = `# HauntView Developer Codex & MCP Integration Manual

> Deterministic failure-mode resilience, accessibility, and visual chaos testing engine with Model Context Protocol (MCP) integration.
> Hosted Service: https://hauntview.onrender.com
> GitHub: https://github.com/kingjethro999/hauntview
> Protocol Version: Model Context Protocol (MCP) 2024-11-05

---

## 1. MCP Transports: Remote URL vs. Local Stdio

HauntView supports two transport modes for the Model Context Protocol:

### Why do some servers use URLs while others use commands?
- **Remote HTTP / SSE Transport (\`url\` mode)**:
  Connects directly over the web to a hosted Server-Sent Events (SSE) gateway (similar to Context7).
  - **Best for**: Instant, zero-install setup. No Node.js or Playwright required on the developer's machine.
  - **Endpoint**: \`https://hauntview.onrender.com/api/mcp\`
- **Local Stdio Transport (\`command\` mode)**:
  Launches a lightweight local Node.js process that communicates over standard input/output streams.
  - **Best for**: Running completely offline, private corporate networks, or forwarding heavy tests to a self-hosted engine via \`HAUNT_API_URL\`.
  - **Command**: \`node --import tsx/esm src/mcp/server.ts\`

---

## 2. Client Configurations

### Option A: Remote Hosted Endpoint (Recommended - Zero Install)

#### Cursor (\`.cursor/mcp.json\` or \`~/.cursor/mcp.json\`)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

#### Claude Code CLI
\`\`\`bash
claude mcp add --transport sse hauntview https://hauntview.onrender.com/api/mcp
\`\`\`

#### Kiro IDE (\`.kiro/settings/mcp.json\`)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "url": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

#### Windsurf (\`~/.codeium/windsurf/mcp_config.json\`)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "serverUrl": "https://hauntview.onrender.com/api/mcp"
    }
  }
}
\`\`\`

#### VS Code (\`.vscode/mcp.json\`)
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

### Option B: Local Stdio Subprocess (Offline or Self-Hosted)

#### Hybrid Stdio (Local agent, remote execution)
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

#### Offline Stdio (Fully local engine)
\`\`\`json
{
  "mcpServers": {
    "hauntview": {
      "command": "node",
      "args": ["--import", "tsx/esm", "src/mcp/server.ts"],
      "env": {
        "HAUNT_API_URL": "http://localhost:3000",
        "NODE_ENV": "development"
      }
    }
  }
}
\`\`\`

---

## 3. MCP Tools Reference

| Tool Name | Arguments | Description |
| :--- | :--- | :--- |
| \`list-test-profiles\` | *(none)* | Returns all 25 supported failure-mode testing rites, viewports, and timeout settings. |
| \`run-test-profile\` | \`url\` (string, req), \`profileId\` (string, opt) | Drives headless Chromium against the target URL through selected rites. Returns run ID, duration, and structured findings. |
| \`get-run-status\` | \`runId\` (string, req) | Returns real-time execution progress, status, and severity counters for an active or completed run. |
| \`get-latest-report\` | *(none)* | Retrieves the structured JSON report and findings from the most recent test run. |
| \`compare-runs\` | \`runId1\` (string, req), \`runId2\` (string, req) | Performs differential regression analysis: detects new omens, persistent bugs, and resolved defects. |
| \`export-report\` | \`runId\` (string, req), \`format\` ('html' \| 'markdown' \| 'json') | Exports the report as an interactive HTML Grimoire, clean Markdown, or raw JSON. |

---

## 4. Installing as a Kiro Power

HauntView ships a fully packaged Kiro Power in the \`power/\` directory:

1. Open Kiro IDE and navigate to the **Powers** panel.
2. Click **Import Power from GitHub**.
3. Enter repository URL: \`https://github.com/kingjethro999/hauntview\`
4. Click **Install**.

### Included Kiro Agent Skills:
- **\`haunt-a-website\`**: Scans a target URL across failure profiles and generates structured defect plates.
- **\`exorcise-findings\`**: Reads diagnostic findings, inspects source code, and applies patches to fix root causes.
- **\`setup\`**: Verifies local environment, dependencies, and configuration.

---

## 5. Local Setup & Repository Development

\`\`\`bash
# 1. Clone repository
git clone https://github.com/kingjethro999/hauntview.git
cd hauntview

# 2. Install dependencies (Node 22 LTS + pnpm recommended)
pnpm install

# 3. Start local development server (Parlour UI at http://localhost:3000)
pnpm dev

# 4. Run unit test suites (27 suites, 108 tests)
pnpm test

# 5. Run compliance presubmit checks
pnpm run presubmit
\`\`\`
`;
