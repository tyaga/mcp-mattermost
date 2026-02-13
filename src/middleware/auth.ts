import { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';

/**
 * Parse MCP_AUTH_TOKENS environment variable into a Map<token, username>.
 * Format: "alice:token1,bob:token2"
 * Returns null if auth is disabled (variable not set or empty).
 */
export function parseAuthTokens(envValue?: string): Map<string, string> | null {
  if (!envValue || envValue.trim() === '') {
    return null;
  }

  const tokenMap = new Map<string, string>();
  const pairs = envValue.split(',').map(s => s.trim()).filter(Boolean);

  for (const pair of pairs) {
    const colonIndex = pair.indexOf(':');
    if (colonIndex <= 0) {
      logger.warn(`Invalid auth token entry (expected "username:token"): "${pair}"`);
      continue;
    }
    const username = pair.substring(0, colonIndex).trim();
    const token = pair.substring(colonIndex + 1).trim();
    if (!username || !token) {
      logger.warn(`Empty username or token in auth entry: "${pair}"`);
      continue;
    }
    tokenMap.set(token, username);
  }

  if (tokenMap.size === 0) {
    logger.warn('MCP_AUTH_TOKENS is set but no valid entries found — auth disabled');
    return null;
  }

  return tokenMap;
}

/**
 * Create an Express middleware that checks Bearer token authorization.
 * If tokenMap is null, auth is disabled and all requests pass through.
 */
export function createAuthMiddleware(tokenMap: Map<string, string> | null) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Auth disabled — pass through
    if (!tokenMap) {
      next();
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Unauthorized: missing Authorization header',
        },
        id: null,
      });
      return;
    }

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Unauthorized: invalid Authorization header format (expected "Bearer <token>")',
        },
        id: null,
      });
      return;
    }

    const token = match[1];
    const username = tokenMap.get(token);
    if (!username) {
      res.status(401).json({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Unauthorized: invalid token',
        },
        id: null,
      });
      return;
    }

    // Store username on request for logging
    (req as Request & { authUser?: string }).authUser = username;
    next();
  };
}
