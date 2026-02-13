#!/usr/bin/env node

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { loadConfig } from './config/config';
import { getMattermostMcpTools } from './handlers';
import { createAuthMiddleware, parseAuthTokens } from './middleware/auth';
import { logger } from './utils/logger';

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

  // Health check (before auth — always accessible)
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // Token-based authentication
  const tokenMap = parseAuthTokens(process.env.MCP_AUTH_TOKENS);
  if (tokenMap) {
    logger.info(`Authentication enabled (${tokenMap.size} token(s) configured)`);
  } else {
    logger.warn('Authentication disabled (MCP_AUTH_TOKENS not set)');
  }
  app.use(createAuthMiddleware(tokenMap));

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const { method, path } = req;
    const body = req.body;
    const methodName = body?.method;
    const toolName =
      methodName === 'tools/call' ? body?.params?.name : undefined;
    const authUser = (req as typeof req & { authUser?: string }).authUser;

    logger.debug(`--> ${method} ${path}`, authUser ? `user=${authUser}` : '', methodName ? `jsonrpc=${methodName}` : '', toolName ? `tool=${toolName}` : '');

    res.on('finish', () => {
      const duration = Date.now() - start;
      const parts = [
        `${method} ${path}`,
        `${res.statusCode}`,
        `${duration}ms`,
      ];
      if (authUser) parts.push(`user=${authUser}`);
      if (methodName) parts.push(`jsonrpc=${methodName}`);
      if (toolName) parts.push(`tool=${toolName}`);
      logger.info(parts.join(' | '));
    });

    next();
  });

  // Verify config + Mattermost connectivity on startup
  try {
    await createMcpServer();
    logger.info('Mattermost MCP server initialized successfully');
  } catch (e) {
    logger.error(`Failed to initialize: ${e instanceof Error ? e.message : String(e)}`);
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
      logger.error('Error handling MCP request:', error);
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

  app.listen(PORT, () => {
    logger.info(`MCP Mattermost HTTP Server listening on port ${PORT} (log level: ${logger.level})`);
  });

  process.on('SIGINT', () => {
    logger.info('Shutting down server...');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('Shutting down server...');
    process.exit(0);
  });
}

main();
