import { logger } from './logger';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_HEADERS = ['x-osp-token', 'authorization', 'cookie'];

/**
 * HTTP request logger middleware.
 * Redacts sensitive headers to avoid leaking credentials in logs.
 */
export const requestLogger = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const { method, url, body, headers } = req;

  const safeHeaders: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(headers)) {
    safeHeaders[key] = SENSITIVE_HEADERS.includes(key.toLowerCase())
      ? '[REDACTED]'
      : value;
  }

  logger.info(`${method} ${url}`, {
    body: body,
    headers: safeHeaders,
  });
  next();
};
