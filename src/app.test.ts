import createApp from './app';
import request from 'supertest';
import { OllamaRoutesProps } from './types';

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

describe('/api/*', () => {
  const routeTypes: Array<OllamaRoutesProps['type']> = [
    'generate',
    'chat',
    'show',
    'embeddings',
  ];

  routeTypes.forEach((routeType) => {
    describe(`POST /api/${routeType}`, () => {
      it('should return 200 OK if no protection is set', async () => {
        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
        });

        const response = await request(app).post(`/api/${routeType}`);
        expect(response.status).toBe(200);
      });

      it('should return 401 Unauthorized if API key is set and not provided', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        const response = await request(app).post(`/api/${routeType}`);
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

        // Set the wrong API key in the header.
        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('x-api-key', wrongApiKey);

        expect(response.status).toBe(401);
      });

      it('should return 200 OK if API key is set and provided correctly', async () => {
        process.env.TOKEN = 'foo';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          TOKEN: process.env.TOKEN,
        });

        // Set the wrong API key in the header.
        const response = await request(app)
          .post(`/api/${routeType}`)
          .set('x-api-key', process.env.TOKEN);

        expect(response.status).toBe(200);
      });

      it('should return 401 Unauthorized if IP allowlist is set and not provided', async () => {
        process.env.ALLOWED_IPS = '127.0.0.1,192.0.0.1';

        app = createApp({
          OLLAMA_URL: 'http://localhost:11434',
          IS_STREAM: false,
          ALLOWED_IPS: process.env.ALLOWED_IPS.split(','),
        });

        const response = await request(app).post(`/api/${routeType}`);
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
          .set('x-test-ip', wrongIp);

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
          .set('x-test-ip', ip);

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
          .set('Origin', wrongOrigin);

        expect(response.headers['access-control-allow-origin']).toBeUndefined();
      });
    });
  });
});
