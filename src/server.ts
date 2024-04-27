import app from './app';
import { logger } from './logging/logger';
import { checkAndReturnEnvVars } from './utils/environment';

const { PORT } = checkAndReturnEnvVars();

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// For gracefully shutting down the server
export const closeServer = () => {
  server.close();
};

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`, error);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error}`, error);
});
