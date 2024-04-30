import { logger } from '../logging/logger';
import type { Maybe } from '../types';

export function checkAndReturnEnvVars() {
  const PORT: number = parseInt(process.env.PORT || '3000');
  const OLLAMA_URL: Maybe<string> = process.env.OLLAMA_URL;
  const TOKEN: Maybe<string> = process.env.TOKEN;
  const DEFAULT_MODEL: Maybe<string> = process.env.DEFAULT_MODEL;
  const DEFAULT_MODEL_VERSION: Maybe<string> =
    process.env.DEFAULT_MODEL_VERSION;
  const FORCE_MODEL: boolean = process.env.FORCE_MODEL === 'true' || false;
  const IS_STREAM: boolean = process.env.IS_STREAM === 'true' || false;
  const ALLOWED_IPS: Maybe<string[]> = process.env.ALLOWED_IPS
    ? process.env.ALLOWED_IPS.split(',')
    : undefined;
  const ALLOWED_CORS_ORIGINS: Maybe<string[]> = process.env.ALLOWED_CORS_ORIGINS
    ? process.env.ALLOWED_CORS_ORIGINS.split(',')
    : undefined;

  if (!OLLAMA_URL) {
    logger.error('OLLAMA_URL is required');
    process.exit(1);
  }

  return {
    PORT,
    OLLAMA_URL,
    TOKEN,
    DEFAULT_MODEL,
    DEFAULT_MODEL_VERSION,
    FORCE_MODEL,
    IS_STREAM,
    ALLOWED_IPS,
    ALLOWED_CORS_ORIGINS,
  };
}
