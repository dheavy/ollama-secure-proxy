import createApp from './app';
import { logger } from './logging/logger';
import { checkAndReturnEnvVars } from './utils/environment';

const {
  PORT,
  OLLAMA_URL,
  TOKEN,
  DEFAULT_MODEL,
  DEFAULT_MODEL_VERSION,
  FORCE_MODEL,
  IS_STREAM,
  ALLOWED_IPS,
  ALLOWED_CORS_ORIGINS,
  TRUST_PROXY,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  BODY_SIZE_LIMIT,
  REQUEST_TIMEOUT_MS,
} = checkAndReturnEnvVars();

const app = createApp({
  OLLAMA_URL,
  TOKEN,
  DEFAULT_MODEL,
  DEFAULT_MODEL_VERSION,
  FORCE_MODEL,
  IS_STREAM,
  ALLOWED_IPS,
  ALLOWED_CORS_ORIGINS,
  TRUST_PROXY,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  BODY_SIZE_LIMIT,
  REQUEST_TIMEOUT_MS,
});

const SHUTDOWN_TIMEOUT_MS = 30000;

const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// For programmatic shutdown (e.g. tests).
export const closeServer = () => {
  server.close();
};

function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully...`);

  // Stop accepting new connections.
  server.close(() => {
    logger.info('All connections closed. Exiting.');
    process.exit(0);
  });

  // Force exit if connections don't close in time.
  setTimeout(() => {
    logger.error(`Shutdown timed out after ${SHUTDOWN_TIMEOUT_MS}ms, forcing exit.`);
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`, error);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error}`, error);
});
