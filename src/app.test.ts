import createApp from './app';
import request from 'supertest';
import { OllamaRoutesProps, OllamaGetRouteProps } from './types';

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: jest.fn(),
    text: jest.fn(),
    status: jest.fn(),
    headers: {
      get: jest.fn(),
    },
    setHeaders: jest.fn(),
    body: jest.fn(),
  })
) as jest.Mock;

let app: ReturnType<typeof createApp>;
let server: ReturnType<typeof app.listen>;

beforeEach((done) => {
  jest.resetModules();
  if (app) {
    server = app.listen(4000, () => {
      done();
    });
  } else {
    done();
  }
});

afterEach(() => {
  if (server) {
    server.close();
  }
});

// Valid request bodies for each POST route type.
const validBodies: Record<string, Record<string, unknown>> = {
  generate: { model: 'llama2', prompt: 'hello' },
  chat: { model: 'llama2', messages: [{ role: 'user', content: 'hello' }] },
  show: { name: 'llama2' },
  embed: { model: 'llama2', input: 'hello' },
};

describe('/', () => {
  beforeEach(() => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
    });
  });

  describe('HEAD /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('GET /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).post('/');
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).put('/');
      expect(response.status).toBe(200);
    });
  });

  describe('PATCH /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).patch('/');
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /', () => {
    it('should return 200 OK', async () => {
      const response = await request(app).delete('/');
      expect(response.status).toBe(200);
    });
  });
});

describe('/api/* POST routes', () => {
  const routeTypes: Array<OllamaRoutesProps['type']> = [
    'generate',
    'chat',
    'show',
    'embed',
  ];

  routeTypes.forEach((routeType) => {
    describe(`POST /api/${routeType}`, () => {
      it('should return 200 OK if no protection is set', async () => {
        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .send(validBodies[routeType]);
        expect(response.status).toBe(200);
      });

      it('should return 401 Unauthorized if API key is set and not provided', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .send(validBodies[routeType]);
        expect(response.status).toBe(401);
      });

      it('should return 401 Unauthorized if API key is set and provided but wrong', async () => {
        process.env.TOKEN = 'foo';
        const wrongApiKey = 'not-foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('x-osp-token', wrongApiKey)
          .send(validBodies[routeType]);

        expect(response.status).toBe(401);
      });

      it('should return 200 OK if API key is set and provided correctly', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('x-osp-token', process.env.TOKEN)
          .send(validBodies[routeType]);

        expect(response.status).toBe(200);
      });

      it('should return 401 Unauthorized if IP allowlist is set and not provided', async () => {
        process.env.ALLOWED_IPS = '127.0.0.1,192.0.0.1';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_IPS: process.env.ALLOWED_IPS.split(','),
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .send(validBodies[routeType]);
        expect(response.status).toBe(401);
      });

      it('should return 401 Unauthorized if IP allowlist is set but client IP is not allowed in', async () => {
        process.env.ALLOWED_IPS = '127.0.0.1,192.0.0.1';
        const wrongIp = '0.0.0.0';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_IPS: process.env.ALLOWED_IPS.split(','),
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('x-test-ip', wrongIp)
          .send(validBodies[routeType]);

        expect(response.status).toBe(401);
      });

      it('should return 200 OK if IP allowlist is set and client IP is allowed in', async () => {
        const ip = '127.0.0.1';
        process.env.ALLOWED_IPS = `${ip},192.0.0.1`;

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_IPS: process.env.ALLOWED_IPS.split(','),
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('x-test-ip', ip)
          .send(validBodies[routeType]);

        expect(response.status).toBe(200);
      });

      it("should not allow the request if CORS restricts origins and client's one does not match", async () => {
        process.env.ALLOWED_CORS_ORIGINS = 'http://localhost:3000';
        const wrongOrigin = 'http://localhost:4000';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_CORS_ORIGINS: process.env.ALLOWED_CORS_ORIGINS.split(','),
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('Origin', wrongOrigin)
          .send(validBodies[routeType]);

        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      });

      it('should return 400 Bad Request if request body is missing required fields', async () => {
        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
        });

        const response = await request(app)
          .post(`/api/${routeType}`)
          .send({});

        expect(response.status).toBe(400);
      });
    });
  });
});

describe('/api/* GET routes', () => {
  const getTypes: Array<OllamaGetRouteProps['type']> = [
    'tags',
    'ps',
    'version',
  ];

  getTypes.forEach((routeType) => {
    describe(`GET /api/${routeType}`, () => {
      it('should return 200 OK if no protection is set', async () => {
        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
        });

        const response = await request(app).get(`/api/${routeType}`);
        expect(response.status).toBe(200);
      });

      it('should return 401 Unauthorized if API key is set and not provided', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app).get(`/api/${routeType}`);
        expect(response.status).toBe(401);
      });

      it('should return 401 Unauthorized if API key is set and provided but wrong', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app)
          .get(`/api/${routeType}`)
          .set('x-osp-token', 'wrong-key');

        expect(response.status).toBe(401);
      });

      it('should return 200 OK if API key is set and provided correctly', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app)
          .get(`/api/${routeType}`)
          .set('x-osp-token', process.env.TOKEN);

        expect(response.status).toBe(200);
      });

      it('should return 401 Unauthorized if IP allowlist is set and client IP is not allowed', async () => {
        process.env.ALLOWED_IPS = '127.0.0.1,192.0.0.1';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_IPS: process.env.ALLOWED_IPS.split(','),
        });

        const response = await request(app)
          .get(`/api/${routeType}`)
          .set('x-test-ip', '0.0.0.0');

        expect(response.status).toBe(401);
      });

      it('should return 200 OK if IP allowlist is set and client IP is allowed', async () => {
        const ip = '127.0.0.1';
        process.env.ALLOWED_IPS = `${ip},192.0.0.1`;

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_IPS: process.env.ALLOWED_IPS.split(','),
        });

        const response = await request(app)
          .get(`/api/${routeType}`)
          .set('x-test-ip', ip);

        expect(response.status).toBe(200);
      });
    });
  });
});

describe('/api/embeddings backwards compatibility', () => {
  it('should redirect POST /api/embeddings to /api/embed with 307', async () => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
    });

    const response = await request(app)
      .post('/api/embeddings')
      .send({ model: 'llama2', input: 'hello' });

    expect(response.status).toBe(307);
    expect(response.headers.location).toBe('/api/embed');
  });
});

describe('rate limiting', () => {
  it('should return 429 when rate limit is exceeded', async () => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
      RATE_LIMIT_WINDOW_MS: 60000,
      RATE_LIMIT_MAX: 2,
    });

    // First two requests should succeed.
    await request(app).get('/');
    await request(app).get('/');

    // Third request should be rate limited.
    const response = await request(app).get('/');
    expect(response.status).toBe(429);
    expect(response.body.error).toMatch(/too many requests/i);
  });
});

describe('input validation', () => {
  it('should return 400 for generate without model', async () => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
    });

    const response = await request(app)
      .post('/api/generate')
      .send({ prompt: 'hello' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/model/i);
  });

  it('should return 400 for chat without messages', async () => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
    });

    const response = await request(app)
      .post('/api/chat')
      .send({ model: 'llama2' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/messages/i);
  });

  it('should return 400 for embed without input', async () => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
    });

    const response = await request(app)
      .post('/api/embed')
      .send({ model: 'llama2' });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/input/i);
  });

  it('should return 400 for show without name or model', async () => {
    app = createApp({
      OLLAMA_URL: 'http://localhost:11434',
      IS_STREAM: false,
    });

    const response = await request(app)
      .post('/api/show')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/name|model/i);
  });
});
