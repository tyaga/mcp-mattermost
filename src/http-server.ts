#!/usr/bin/env node

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { loadConfig } from './config/config';
import { getMattermostMcpTools } from './handlers';

const PORT = parseInt(process.env.MCP_HTTP_PORT || '3002', 10);

/**
 * Create and configure a new MCP server instance with all Mattermost tools.
 * Used in stateless mode: each request gets a fresh server.
 */
async function createMcpServer() {
  const config = loadConfig();
  const server = new McpServer({
    name: 'mcp-mattermost',
    version: '0.0.5',
  });

  const tools = await getMattermostMcpTools(config);
  tools.forEach(tool => {
    server.tool(tool.name, tool.description, tool.parameter, tool.handler);
  });

  return server;
}

/**
 * Main entry point for the Mattermost MCP HTTP server (Streamable HTTP transport).
 * Runs in stateless mode — each POST /mcp creates a new server + transport pair.
 */
async function main() {
  const app = express();
  app.use(express.json());

  // Verify config + Mattermost connectivity on startup
  try {
    await createMcpServer();
    console.log('Mattermost MCP server initialized successfully');
  } catch (e) {
    console.error(`Failed to initialize: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  // POST /mcp — handle MCP JSON-RPC requests (stateless)
  app.post('/mcp', async (req, res) => {
    try {
      const server = await createMcpServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);

      res.on('close', () => {
        transport.close();
        server.close();
      });
    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });

  // GET /mcp — not supported in stateless mode
  app.get('/mcp', (_req, res) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
    );
  });

  // DELETE /mcp — not supported in stateless mode
  app.delete('/mcp', (_req, res) => {
    res.writeHead(405).end(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Method not allowed.',
        },
        id: null,
      }),
    );
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.listen(PORT, () => {
    console.log(`MCP Mattermost HTTP Server listening on port ${PORT}`);
  });

  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Shutting down server...');
    process.exit(0);
  });
}

main();
