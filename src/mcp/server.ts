/**
 * HauntView Model Context Protocol (MCP) Server
 * Exposes HauntView's testing engine directly to AI coding agents via stdio.
 * All diagnostic logs are sent to stderr; stdout is reserved for MCP JSON-RPC.
 */

import { McpServer } from '@modelcontextprotocol/server';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { registerHauntViewTools } from './register-tools';
import { VERSION } from '../version';

const server = new McpServer({
  name: 'hauntview',
  version: VERSION,
});

// Register all 6 test suite and analysis tools
registerHauntViewTools(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[HauntView MCP] Server running on stdio transport');
}

main().catch((err) => {
  console.error('[HauntView MCP] Fatal error starting server:', err);
  process.exit(1);
});
