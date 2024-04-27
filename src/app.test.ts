import { closeServer } from './server'; // Method to close the server
import app from './app';
import request from 'supertest';

let server: ReturnType<typeof app.listen>;

beforeAll((done) => {
  server = app.listen(4000, () => {
    done();
  });
});

afterAll((done) => {
  server.close(() => {
    done();
  });
});

describe('/', () => {
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
