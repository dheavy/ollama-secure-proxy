import { logger } from './logger';
import { Request, Response, NextFunction } from 'express';

/**
 * HTTP request logger middleware.
 */
export const requestLogger = (
  req: Request,
  _: Response,
  next: NextFunction
) => {
  const { method, url, body, headers } = req;
  logger.info(`${method} ${url}`, {
    body: body,
    headers: headers,
  });
  next();
};
