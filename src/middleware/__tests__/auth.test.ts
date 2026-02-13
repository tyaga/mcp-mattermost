import { Request, Response, NextFunction } from 'express';

import { parseAuthTokens, createAuthMiddleware } from '../auth';

// Suppress logger output during tests
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    get level() {
      return 'silent';
    },
  },
}));

function mockRequest(headers: Record<string, string> = {}): Partial<Request> {
  return {
    headers: { ...headers },
  };
}

function mockResponse(): Partial<Response> & { _status: number; _body: unknown } {
  const res = {
    _status: 200,
    _body: null as unknown,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(body: unknown) {
      res._body = body;
      return res;
    },
  };
  return res as Partial<Response> & { _status: number; _body: unknown };
}

describe('parseAuthTokens', () => {
  it('should return null for undefined', () => {
    expect(parseAuthTokens(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseAuthTokens('')).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    expect(parseAuthTokens('   ')).toBeNull();
  });

  it('should parse a single user:token pair', () => {
    const result = parseAuthTokens('alice:secret123');
    expect(result).toBeInstanceOf(Map);
    expect(result!.size).toBe(1);
    expect(result!.get('secret123')).toBe('alice');
  });

  it('should parse multiple user:token pairs', () => {
    const result = parseAuthTokens('alice:token1,bob:token2,charlie:token3');
    expect(result).toBeInstanceOf(Map);
    expect(result!.size).toBe(3);
    expect(result!.get('token1')).toBe('alice');
    expect(result!.get('token2')).toBe('bob');
    expect(result!.get('token3')).toBe('charlie');
  });

  it('should trim whitespace around pairs', () => {
    const result = parseAuthTokens(' alice:token1 , bob:token2 ');
    expect(result!.get('token1')).toBe('alice');
    expect(result!.get('token2')).toBe('bob');
  });

  it('should handle token containing colons', () => {
    const result = parseAuthTokens('alice:token:with:colons');
    expect(result!.get('token:with:colons')).toBe('alice');
  });

  it('should skip invalid entries without colon', () => {
    const result = parseAuthTokens('invalidentry,alice:token1');
    expect(result!.size).toBe(1);
    expect(result!.get('token1')).toBe('alice');
  });

  it('should return null when all entries are invalid', () => {
    expect(parseAuthTokens('invalid,also-invalid')).toBeNull();
  });
});

describe('createAuthMiddleware', () => {
  describe('auth disabled (tokenMap is null)', () => {
    const middleware = createAuthMiddleware(null);

    it('should pass through without auth header', () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect(res._status).toBe(200);
    });
  });

  describe('auth enabled', () => {
    const tokenMap = new Map([
      ['valid-token-1', 'alice'],
      ['valid-token-2', 'bob'],
    ]);
    const middleware = createAuthMiddleware(tokenMap);

    it('should return 401 when no Authorization header', () => {
      const req = mockRequest();
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._body).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({ message: expect.stringContaining('missing') }),
        }),
      );
    });

    it('should return 401 for non-Bearer auth header', () => {
      const req = mockRequest({ authorization: 'Basic dXNlcjpwYXNz' });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._body).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({ message: expect.stringContaining('invalid Authorization header format') }),
        }),
      );
    });

    it('should return 401 for invalid token', () => {
      const req = mockRequest({ authorization: 'Bearer wrong-token' });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).not.toHaveBeenCalled();
      expect(res._status).toBe(401);
      expect(res._body).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({ message: expect.stringContaining('invalid token') }),
        }),
      );
    });

    it('should pass through for valid token and set authUser', () => {
      const req = mockRequest({ authorization: 'Bearer valid-token-1' });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect((req as Request & { authUser?: string }).authUser).toBe('alice');
    });

    it('should accept second valid token', () => {
      const req = mockRequest({ authorization: 'Bearer valid-token-2' });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect((req as Request & { authUser?: string }).authUser).toBe('bob');
    });

    it('should be case-insensitive for Bearer prefix', () => {
      const req = mockRequest({ authorization: 'bearer valid-token-1' });
      const res = mockResponse();
      const next = jest.fn();

      middleware(req as Request, res as unknown as Response, next as NextFunction);

      expect(next).toHaveBeenCalled();
      expect((req as Request & { authUser?: string }).authUser).toBe('alice');
    });
  });
});
