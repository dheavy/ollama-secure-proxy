import { OllamaRoutesProps, OllamaGetRouteProps, AppProps } from './types';

import express from 'express';
import type { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { requestLogger } from './logging/requestLogger';
import { route as ollamaRouteGenerator, getRoute as ollamaGetRouteGenerator } from './routes/ollama';

export default function createApp(props: AppProps): Express {
  const {
    OLLAMA_URL,
    TOKEN,
    DEFAULT_MODEL,
    DEFAULT_MODEL_VERSION,
    FORCE_MODEL,
    IS_STREAM,
    ALLOWED_IPS,
    ALLOWED_CORS_ORIGINS,
    TRUST_PROXY,
    RATE_LIMIT_WINDOW_MS = 900000,
    RATE_LIMIT_MAX = 100,
    BODY_SIZE_LIMIT = '10mb',
    REQUEST_TIMEOUT_MS = 300000,
  } = props;

  const app = express();

  // Trust proxy headers (X-Forwarded-For) when behind a reverse proxy.
  if (TRUST_PROXY) {
    app.set('trust proxy', true);
  }

  const corsOptions = {
    ...(ALLOWED_CORS_ORIGINS && { origin: ALLOWED_CORS_ORIGINS }),
  };

  // Rate limiting to prevent brute force and DoS attacks.
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  app.use(limiter);
  app.use(bodyParser.json({ limit: BODY_SIZE_LIMIT }));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json({ limit: BODY_SIZE_LIMIT }));
  app.use(cors(corsOptions));
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // POST routes that proxy to Ollama with body forwarding.
  const postTypes: Array<OllamaRoutesProps['type']> = [
    'generate',
    'chat',
    'show',
    'embed',
  ];

  postTypes.forEach((type) => {
    app.use(
      `/api/${type}`,
      ollamaRouteGenerator({
        type: type,
        ollamaServerUrl: OLLAMA_URL,
        apiKey: TOKEN,
        defaultModel: DEFAULT_MODEL,
        defaultModelVersion: DEFAULT_MODEL_VERSION,
        forceModel: FORCE_MODEL,
        isStream: IS_STREAM,
        ipAllowlist: ALLOWED_IPS,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
      })
    );
  });

  // GET routes that pass through to Ollama (read-only, no body).
  const getTypes: Array<OllamaGetRouteProps['type']> = [
    'tags',
    'ps',
    'version',
  ];

  getTypes.forEach((type) => {
    app.use(
      `/api/${type}`,
      ollamaGetRouteGenerator({
        type: type,
        ollamaServerUrl: OLLAMA_URL,
        apiKey: TOKEN,
        ipAllowlist: ALLOWED_IPS,
        requestTimeoutMs: REQUEST_TIMEOUT_MS,
      })
    );
  });

  // Backwards compatibility: redirect deprecated /api/embeddings to /api/embed.
  app.post('/api/embeddings', (req, res) => {
    res.redirect(307, '/api/embed');
  });

  // Use as a health check endpoint.
  // Retuns 200 OK and no body.
  app.use('/', (_, res) => {
    res.status(200).send();
  });

  app.use('*', (_, res) => {
    res.status(404).send({ error: 'Not Found' });
  });

  return app;
}
