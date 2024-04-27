require('dotenv').config();

import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { logger } from './logging/logger';
import { requestLogger } from './logging/requestLogger';
import { checkAndReturnEnvVars } from './utils/environment';
import { route as ollamaRouteGenerator } from './routes/ollama';

const {
  PORT,
  OLLAMA_URL,
  API_KEY,
  DEFAULT_MODEL,
  DEFAULT_MODEL_VERSION,
  FORCE_MODEL,
  IS_STREAM,
  ALLOWED_IPS,
  ALLOWED_CORS_ORIGINS,
} = checkAndReturnEnvVars();

const app = express();
const corsOptions = {
  ...(ALLOWED_CORS_ORIGINS && { origin: ALLOWED_CORS_ORIGINS }),
};

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors(corsOptions));
app.use(requestLogger);

app.use(
  '/api/generate',
  ollamaRouteGenerator({
    ollamaServerUrl: OLLAMA_URL,
    apiKey: API_KEY,
    defaultModel: DEFAULT_MODEL,
    defaultModelVersion: DEFAULT_MODEL_VERSION,
    forceModel: FORCE_MODEL,
    isStream: IS_STREAM,
    ipAllowlist: ALLOWED_IPS,
  })
);

// Use as a health check endpoint.
// Retuns 200 OK and no body.
app.use('/', (_, res) => res.status(200));

app.use('*', (_, res) => {
  res.status(404).send({ error: 'Not Found' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error}`, error);
});

process.on('unhandledRejection', (error) => {
  logger.error(`Unhandled Rejection: ${error}`, error);
});
