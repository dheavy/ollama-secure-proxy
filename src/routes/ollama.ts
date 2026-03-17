import type { Maybe, OllamaRoutesProps, OllamaGetRouteProps } from '../types';

import express from 'express';
import { Request, Response } from 'express';
import { buildFinalBody } from '../utils/requests';
import { logger } from '../logging/logger';

/**
 * Route for generating text.
 * Proxy to some Ollama routes, with a similar signature and some additional security functionality.
 */

const TOKEN_HEADER = 'x-osp-token';

export function validateApiKey(headerApiKey: string, apiKey: string) {
  if (!headerApiKey || headerApiKey !== apiKey) {
    throw new Error('Unauthorized');
  }
}

const VALID_CHAT_ROLES = ['system', 'user', 'assistant', 'tool'];
const VALID_THINK_VALUES = [true, false, 'high', 'medium', 'low'];

function validateModel(body: Record<string, unknown>) {
  if (!body.model || typeof body.model !== 'string') {
    throw new Error('Field "model" is required and must be a string');
  }
}

function validateFormat(body: Record<string, unknown>) {
  if (body.format !== undefined && body.format !== 'json' && typeof body.format !== 'object') {
    throw new Error('Field "format" must be "json" or a JSON schema object');
  }
}

function validateThink(body: Record<string, unknown>) {
  if (body.think !== undefined && !VALID_THINK_VALUES.includes(body.think as string | boolean)) {
    throw new Error('Field "think" must be a boolean or one of "high", "medium", "low"');
  }
}

function validateOptionalFields(body: Record<string, unknown>) {
  validateFormat(body);
  validateThink(body);
  if (body.keep_alive !== undefined && typeof body.keep_alive !== 'string' && typeof body.keep_alive !== 'number') {
    throw new Error('Field "keep_alive" must be a string or number');
  }
  if (body.options !== undefined && (typeof body.options !== 'object' || body.options === null)) {
    throw new Error('Field "options" must be an object');
  }
}

export function validateRequestBody(type: string, body: Record<string, unknown>) {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object');
  }

  switch (type) {
    case 'generate':
      validateModel(body);
      validateOptionalFields(body);
      if (body.images !== undefined && !Array.isArray(body.images)) {
        throw new Error('Field "images" must be an array');
      }
      break;
    case 'chat': {
      validateModel(body);
      if (!Array.isArray(body.messages)) {
        throw new Error('Field "messages" is required and must be an array');
      }
      for (const msg of body.messages as Array<Record<string, unknown>>) {
        if (!msg.role || !VALID_CHAT_ROLES.includes(msg.role as string)) {
          throw new Error(`Field "messages[].role" must be one of: ${VALID_CHAT_ROLES.join(', ')}`);
        }
      }
      if (body.tools !== undefined && !Array.isArray(body.tools)) {
        throw new Error('Field "tools" must be an array');
      }
      validateOptionalFields(body);
      break;
    }
    case 'show':
      if (!body.name && !body.model) {
        throw new Error('Field "name" or "model" is required');
      }
      if (body.verbose !== undefined && typeof body.verbose !== 'boolean') {
        throw new Error('Field "verbose" must be a boolean');
      }
      break;
    case 'embed':
      validateModel(body);
      if (body.input === undefined) {
        throw new Error('Field "input" is required');
      }
      if (typeof body.input !== 'string' && !Array.isArray(body.input)) {
        throw new Error('Field "input" must be a string or an array of strings');
      }
      if (body.truncate !== undefined && typeof body.truncate !== 'boolean') {
        throw new Error('Field "truncate" must be a boolean');
      }
      if (body.dimensions !== undefined && typeof body.dimensions !== 'number') {
        throw new Error('Field "dimensions" must be a number');
      }
      if (body.keep_alive !== undefined && typeof body.keep_alive !== 'string' && typeof body.keep_alive !== 'number') {
        throw new Error('Field "keep_alive" must be a string or number');
      }
      if (body.options !== undefined && (typeof body.options !== 'object' || body.options === null)) {
        throw new Error('Field "options" must be an object');
      }
      break;
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

function auditLog(event: string, details: Record<string, unknown>) {
  logger.info(`[AUDIT] ${event}`, {
    ...details,
    timestamp: new Date().toISOString(),
  });
}

export function getRoute(props: OllamaGetRouteProps) {
  const {
    type,
    ollamaServerUrl,
    apiKey,
    ipAllowlist,
    requestTimeoutMs = 300000,
  } = props;

  const router = express.Router();

  return router.get('/', async (req: Request, res: Response) => {
    const clientIp =
      (process.env.NODE_ENV === 'test'
        ? (req.headers['x-test-ip'] as string)
        : req.ip) || '';

    // Validate the API key if it is provided in the environment variables.
    try {
      if (apiKey) {
        const headerApiKey = req.headers[TOKEN_HEADER] as string;
        validateApiKey(headerApiKey, apiKey);
      }
    } catch (error) {
      auditLog('AUTH_FAILED', {
        reason: 'invalid_api_key',
        clientIp,
        path: `/api/${type}`,
      });
      return res.status(401).send({
        error: (error as unknown as Error).message || 'Unauthorized',
      });
    }

    // Validate IP address if IP allowlist is provided in the environment variables.
    try {
      if (ipAllowlist && ipAllowlist.length > 0) {
        if (!ipAllowlist.includes(clientIp)) {
          throw new Error('Unauthorized');
        }
      }
    } catch (error) {
      auditLog('AUTH_FAILED', {
        reason: 'ip_not_allowed',
        clientIp,
        path: `/api/${type}`,
      });
      return res.status(401).send({
        error: (error as unknown as Error).message || 'Unauthorized',
      });
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

      const resp = await fetch(`${ollamaServerUrl}/api/${type}`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!resp || !resp.status) {
        throw new Error('No response from Ollama API');
      }

      if (resp.status >= 400) {
        throw new Error(`${resp.status}: ${await resp.text()}`);
      }

      auditLog('REQUEST_PROXIED', {
        clientIp,
        path: `/api/${type}`,
      });

      res.setHeader(
        'Content-Type',
        resp.headers.get('content-type') || 'application/json'
      );
      res.json(await resp.json());
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.error(`Request to Ollama timed out after ${requestTimeoutMs}ms`);
        return res.status(504).send({
          error: 'Request to Ollama timed out',
        });
      }

      logger.error(`Failed to proxy request: ${error}`);

      const errorMessage =
        (error as unknown as Error).message || 'Internal Server Error';
      const statusCode = Number(errorMessage.match(/^(\d{3}):/)?.[1] || 500);

      res.status(statusCode).send({
        error: errorMessage,
      });
    }
  });
}

export function route(props: OllamaRoutesProps) {
  const {
    type,
    ollamaServerUrl,
    isStream,
    apiKey,
    defaultModel,
    defaultModelVersion,
    forceModel,
    ipAllowlist,
    requestTimeoutMs = 300000,
  } = props;

  const router = express.Router();

  return router.post('/', async (req: Request, res: Response) => {
    const clientIp =
      (process.env.NODE_ENV === 'test'
        ? (req.headers['x-test-ip'] as string)
        : req.ip) || '';

    // Validate the API key if it is provided in the environment variables.
    try {
      if (apiKey) {
        const headerApiKey = req.headers[TOKEN_HEADER] as string;
        validateApiKey(headerApiKey, apiKey);
      }
    } catch (error) {
      auditLog('AUTH_FAILED', {
        reason: 'invalid_api_key',
        clientIp,
        path: `/api/${type}`,
      });
      return res.status(401).send({
        error: (error as unknown as Error).message || 'Unauthorized',
      });
    }

    // Validate IP address if IP allowlist is provided in the environment variables.
    try {
      if (ipAllowlist && ipAllowlist.length > 0) {
        if (!ipAllowlist.includes(clientIp)) {
          throw new Error('Unauthorized');
        }
      }
    } catch (error) {
      auditLog('AUTH_FAILED', {
        reason: 'ip_not_allowed',
        clientIp,
        path: `/api/${type}`,
      });
      return res.status(401).send({
        error: (error as unknown as Error).message || 'Unauthorized',
      });
    }

    // Validate request body schema before forwarding to Ollama.
    try {
      validateRequestBody(type, req.body);
    } catch (error) {
      return res.status(400).send({
        error: (error as unknown as Error).message || 'Bad Request',
      });
    }

    // Another layer of validation happens through CORS.
    // See the CORS middleware in app.ts for more details.

    try {
      // Build request body based on the incoming request.
      const body = buildFinalBody(req.body, type, isStream, {
        defaultModel,
        defaultModelVersion,
        forceModel: Boolean(forceModel),
      });

      // Abort controller for request timeout.
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

      const resp = await fetch(`${ollamaServerUrl}/api/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!resp || !resp.status || !resp.text) {
        throw new Error('No response from Ollama API');
      }

      if (resp.status >= 400) {
        throw new Error(`${resp.status}: ${await resp.text()}`);
      }

      // Set the response content type based on the content type of the Ollama API response.
      res.setHeader(
        'Content-Type',
        resp.headers.get('content-type') || 'text/plain'
      );

      if (!resp.body) {
        throw new Error('No response body');
      }

      auditLog('REQUEST_PROXIED', {
        clientIp,
        path: `/api/${type}`,
        model: req.body?.model,
      });

      // Stream the response if the isStream flag is set,
      // otherwise send the response as JSON.
      if (isStream) {
        streamResponse(res, resp.body);
      } else {
        res.json(await resp.json());
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        logger.error(`Request to Ollama timed out after ${requestTimeoutMs}ms`);
        return res.status(504).send({
          error: 'Request to Ollama timed out',
        });
      }

      logger.error(`Failed to proxy request: ${error}`);

      // Extract the status code from the error message possibly coming from the Ollama API.
      const errorMessage =
        (error as unknown as Error).message || 'Internal Server Error';
      const statusCode = Number(errorMessage.match(/^(\d{3}):/)?.[1] || 500);

      res.status(statusCode).send({
        error: errorMessage,
      });
    }
  });
}
