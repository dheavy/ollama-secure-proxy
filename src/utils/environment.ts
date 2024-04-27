import type { Maybe } from '../types';

export function checkAndReturnEnvVars() {
  const PORT: number = parseInt(process.env.PORT || '3000');
  const OLLAMA_URL: Maybe<string> = process.env.OLLAMA_URL;
  const API_KEY: Maybe<string> = process.env.API_KEY;
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

  if (!OLLAMA_URL || !API_KEY) {
    console.error('Missing required environment variables:');
    if (!OLLAMA_URL) {
      console.error('OLLAMA_URL missing');
    }
    if (!API_KEY) {
      console.error('API_KEY missing');
    }
    process.exit(1);
  }

  return {
    PORT,
    OLLAMA_URL,
    API_KEY,
    DEFAULT_MODEL,
    DEFAULT_MODEL_VERSION,
    FORCE_MODEL,
    IS_STREAM,
    ALLOWED_IPS,
    ALLOWED_CORS_ORIGINS,
  };
}