import { OllamaRoutesProps, AppProps } from './types';

import express from 'express';
import type { Express } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { requestLogger } from './logging/requestLogger';
import { route as ollamaRouteGenerator } from './routes/ollama';

export default function createApp(props: AppProps): Express {
  const {
    OLLAMA_URL,
    API_KEY,
    DEFAULT_MODEL,
    DEFAULT_MODEL_VERSION,
    FORCE_MODEL,
    IS_STREAM,
    ALLOWED_IPS,
    ALLOWED_CORS_ORIGINS,
  } = props;

  const app = express();
  const corsOptions = {
    ...(ALLOWED_CORS_ORIGINS && { origin: ALLOWED_CORS_ORIGINS }),
  };

  app.use(bodyParser.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());
  app.use(cors(corsOptions));
  if (process.env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }
  const types: Array<OllamaRoutesProps['type']> = [
    'generate',
    'chat',
    'tags',
    'show',
    'embeddings',
  ];

  types.forEach((type) => {
    app.use(
      `/api/${type}`,
      ollamaRouteGenerator({
        type: type,
        ollamaServerUrl: OLLAMA_URL,
        apiKey: API_KEY,
        defaultModel: DEFAULT_MODEL,
        defaultModelVersion: DEFAULT_MODEL_VERSION,
        forceModel: FORCE_MODEL,
        isStream: IS_STREAM,
        ipAllowlist: ALLOWED_IPS,
      })
    );
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
