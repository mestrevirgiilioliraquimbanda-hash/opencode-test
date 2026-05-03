const request = require('supertest');
const app = require('../src/app');

describe('Health Check', () => {
  it('should return healthy status', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
  });
});

describe('404 Handler', () => {
  it('should return 404 for non-existent routes', async () => {
    const response = await request(app)
      .get('/api/non-existent')
      .expect(404);

    expect(response.body).toHaveProperty('error');
  });
});
