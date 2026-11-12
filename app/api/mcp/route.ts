/**
 * Remote Model Context Protocol (MCP) Streamable HTTP / SSE Endpoint
 * Allows AI agents (Kiro, Cursor, Windsurf, VS Code) to connect directly
 * via URL (e.g. https://hauntview.onrender.com/api/mcp) without running local processes.
 */

import { McpServer, createMcpHandler } from '@modelcontextprotocol/server';
import { registerHauntViewTools } from '@/src/mcp/register-tools';
import { VERSION } from '@/src/version';

function createServerInstance(): McpServer {
  const server = new McpServer({
    name: 'hauntview',
    version: VERSION,
  });
  registerHauntViewTools(server);
  return server;
}

const handler = createMcpHandler(() => createServerInstance());

export async function POST(request: Request) {
  const response = await handler.fetch(request);
  // Ensure CORS headers for cross-origin agent IDEs and browsers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, Last-Event-ID'
  );
  return response;
}

export async function GET(request: Request) {
  const response = await handler.fetch(request);
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, Last-Event-ID'
  );
  return response;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Last-Event-ID',
    },
  });
}
