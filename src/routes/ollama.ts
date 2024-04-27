import type { Maybe, OllamaRoutesProps } from '../types';

import express from 'express';
import { Request, Response } from 'express';
import { buildFinalBody } from '../utils/requests';
import { logger } from '../logging/logger';

/**
 * Route for generating text.
 * Proxy to some Ollama routes, with a similar signature and some additional security functionality.
 */

const router = express.Router();

export function validateApiKey(headerApiKey: string, apiKey: string) {
  if (!headerApiKey || headerApiKey !== apiKey) {
    throw new Error('Unauthorized');
  }
}

export function streamResponse(
  res: Response,
  body: Maybe<ReadableStream<Uint8Array>>
) {
  if (body) {
    const reader = body.getReader();
    // Stream the response body to the client.
    function pump() {
      reader
        .read()
        .then(({ done, value }) => {
          if (done) {
            res.end(); // Close the response stream when reading is done.
            return;
          }
          // If the chunk is okay to send, send it and pump again.
          if (!res.write(new Uint8Array(value))) {
            // Buffer full? Just wait until it drains then (recursively) pump again...
            res.once('drain', pump);
          } else {
            pump();
          }
        })
        .catch((err) => {
          console.error('Stream reading failed:', err);
          res.status(500).end();
        });
    }

    // Pump-pump-pump-pump it up!
    pump();
  } else {
    throw new Error('No response body to stream');
  }
}

export function route(props: OllamaRoutesProps) {
  const {
    ollamaServerUrl,
    isStream,
    apiKey,
    defaultModel,
    defaultModelVersion,
    forceModel,
    ipAllowlist,
  } = props;

  return router.post('/', async (req: Request, res: Response) => {
    // A first layer of validation happens through CORS.
    // See the CORS middleware in app.ts for more details.

    // Validate the API key if it is provided in the config.
    try {
      if (apiKey) {
        const headerApiKey = req.headers['x-api-key'] as string;
        validateApiKey(headerApiKey, apiKey);
      }
    } catch (error) {
      return res.status(401).send({
        error: (error as unknown as Error).message || 'Unauthorized',
      });
    }

    // Validate IP address if IP allowlist is provided in the config.
    try {
      if (ipAllowlist && ipAllowlist.length > 0) {
        const clientIp = req.ip || '';
        if (!ipAllowlist.includes(clientIp)) {
          throw new Error('Unauthorized');
        }
      }
    } catch (error) {
      return res.status(401).send({
        error: (error as unknown as Error).message || 'Unauthorized',
      });
    }

    try {
      // Build request body based on the incoming request.
      const body = buildFinalBody(req.body, isStream, {
        defaultModel,
        defaultModelVersion,
        forceModel: Boolean(forceModel),
      });

      const resp = await fetch(`${ollamaServerUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (resp.status !== 200) {
        throw new Error(
          `Failed to fetch response: ${resp.status}: ${await resp.text()}`
        );
      }

      // Set the response content type based on the content type of the Ollama API response.
      res.setHeader(
        'Content-Type',
        resp.headers.get('content-type') || 'text/plain'
      );

      // Stream the response if the isStream flag is set,
      // otherwise send the response as JSON.
      if (resp.body) {
        isStream ? streamResponse(res, resp.body) : res.json(await resp.json());
      }
    } catch (error) {
      logger.error(`Failed to proxy request: ${error}`);
      res.status(500).send({
        error: (error as unknown as Error).message || 'Internal Server Error',
      });
    }
  });
}
