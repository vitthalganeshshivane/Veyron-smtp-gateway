import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';

describe('HTTP API Endpoints', () => {
  it('GET /api/v1/health should respond with service status', async () => {
    const res = await request(app).get('/api/v1/health');
    // Status can be 200 or 503 depending on live DB connection, but returns JSON with service name
    expect(res.body).toHaveProperty('service', 'veyron-smtp-gateway');
  });

  it('GET /api/v1/emails/unknown should return 401 without authentication', async () => {
    const res = await request(app).get('/api/v1/emails/vms_12345');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/emails/send should reject unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/v1/emails/send')
      .send({
        to: ['user@example.com'],
        subject: 'Test',
        text: 'Hello'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Project API key required');
  });

  it('POST /api/v1/emails/send should reject invalid API key format', async () => {
    const res = await request(app)
      .post('/api/v1/emails/send')
      .set('Authorization', 'Bearer invalid_random_token')
      .send({
        to: ['user@example.com'],
        subject: 'Test',
        text: 'Hello'
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid API key format');
  });

  it('POST /api/v1/auth/login should reject empty credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Non-existent endpoints should return 404 JSON', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
