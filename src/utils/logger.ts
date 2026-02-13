/**
 * Log levels ordered by verbosity (debug is the most verbose).
 * Controlled via MCP_LOG_LEVEL environment variable.
 * Default: 'info'
 */
const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
} as const;

export type LogLevel = keyof typeof LOG_LEVELS;

function resolveLevel(): LogLevel {
  const env = (process.env.MCP_LOG_LEVEL || 'info').toLowerCase();
  if (env in LOG_LEVELS) {
    return env as LogLevel;
  }
  return 'info';
}

const currentLevel = resolveLevel();

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel];
}

function timestamp(): string {
  return new Date().toISOString();
}

export const logger = {
  debug(...args: unknown[]) {
    if (shouldLog('debug')) {
      console.debug(`[${timestamp()}] [DEBUG]`, ...args);
    }
  },
  info(...args: unknown[]) {
    if (shouldLog('info')) {
      console.log(`[${timestamp()}] [INFO]`, ...args);
    }
  },
  warn(...args: unknown[]) {
    if (shouldLog('warn')) {
      console.warn(`[${timestamp()}] [WARN]`, ...args);
    }
  },
  error(...args: unknown[]) {
    if (shouldLog('error')) {
      console.error(`[${timestamp()}] [ERROR]`, ...args);
    }
  },
  /** Returns the current effective log level */
  get level(): LogLevel {
    return currentLevel;
  },
};
