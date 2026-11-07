# HauntView — Kiro Power

Installable capability for Kiro to run 25 website resilience, accessibility, failure-mode, and visual regression testing profiles directly from conversational prompts.

## Installation

### Method 1: Install as a Kiro Power

1. Open Kiro IDE → **Powers** → **Add Custom Power**
2. Choose **Import power from GitHub** and paste: `https://github.com/kingjethro999/hauntview`
3. Once imported, simply ask Kiro in chat:
   > "Test my site on mobile and check for broken links on http://localhost:3000"

### Method 2: Configure Workspace MCP

Add the server entry to `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "hauntview": {
      "type": "stdio",
      "command": "pnpm",
      "args": ["mcp"]
    }
  }
}
```

### Method 3: Official CLI (`haunt`)

Install globally via npm and run tests directly in your terminal or CI/CD pipelines:

```bash
npm install -g hauntview
haunt http://localhost:3000
```

### Method 4: Local Web Dashboard

Run the web dashboard locally:

```bash
pnpm install
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000) to use the Victorian Parlour interface.
