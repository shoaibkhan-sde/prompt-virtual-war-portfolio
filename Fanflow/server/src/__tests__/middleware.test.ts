import { describe, it, expect, vi } from 'vitest';
import express, { Request, Response } from 'express';
import request from 'supertest';
import { validateChatPayload, validateIncidentPayload, logJSON } from '../middleware';

// Helper: small express app to test middleware directly
function createTestApp(middleware: express.RequestHandler) {
  const app = express();
  app.use(express.json());
  app.post('/test', middleware, (_req: Request, res: Response) => res.json({ ok: true }));
  return app;
}

describe('validateChatPayload middleware', () => {
  const app = createTestApp(validateChatPayload);

  it('passes when message is valid string', async () => {
    const res = await request(app).post('/test').send({ message: 'Hello stadium!' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('rejects missing message field', async () => {
    const res = await request(app).post('/test').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"message"');
  });

  it('rejects non-string message', async () => {
    const res = await request(app).post('/test').send({ message: 123 });
    expect(res.status).toBe(400);
  });

  it('rejects message exceeding 2000 characters', async () => {
    const res = await request(app).post('/test').send({ message: 'a'.repeat(2001) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('2000');
  });

  it('passes with message at exactly 2000 characters', async () => {
    const res = await request(app).post('/test').send({ message: 'a'.repeat(2000) });
    expect(res.status).toBe(200);
  });

  it('rejects accessibilityMode when not boolean', async () => {
    const res = await request(app).post('/test').send({ message: 'Hi', accessibilityMode: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"accessibilityMode"');
  });

  it('passes with valid accessibilityMode boolean', async () => {
    const res = await request(app).post('/test').send({ message: 'Hi', accessibilityMode: true });
    expect(res.status).toBe(200);
  });
});

describe('validateIncidentPayload middleware', () => {
  const app = createTestApp(validateIncidentPayload);

  it('passes with valid incident fields', async () => {
    const res = await request(app).post('/test').send({
      description: 'Crowd density high at North Stand',
      reportedBy: 'staff',
      zoneId: 'Zone-A'
    });
    expect(res.status).toBe(200);
  });

  it('rejects empty description', async () => {
    const res = await request(app).post('/test').send({ description: '', reportedBy: 'staff', zoneId: 'Zone-A' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"description"');
  });

  it('rejects description over 1000 chars', async () => {
    const res = await request(app).post('/test').send({
      description: 'x'.repeat(1001),
      reportedBy: 'volunteer',
      zoneId: 'Zone-B'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('1000');
  });

  it('rejects unknown reportedBy value', async () => {
    const res = await request(app).post('/test').send({
      description: 'Something happened',
      reportedBy: 'system',
      zoneId: 'Zone-C'
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"reportedBy"');
  });

  it('accepts volunteer as reportedBy', async () => {
    const res = await request(app).post('/test').send({
      description: 'Turnstile jammed',
      reportedBy: 'volunteer',
      zoneId: 'Zone-D'
    });
    expect(res.status).toBe(200);
  });

  it('rejects missing zoneId', async () => {
    const res = await request(app).post('/test').send({ description: 'Issue', reportedBy: 'staff' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('"zoneId"');
  });
});

describe('logJSON utility', () => {
  it('outputs valid JSON with timestamp and level', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logJSON('INFO', { requestId: 'r1', method: 'GET', url: '/test', message: 'Test' });
    
    expect(spy).toHaveBeenCalledOnce();
    const logged = spy.mock.calls[0][0];
    const parsed = JSON.parse(logged);
    expect(parsed.level).toBe('INFO');
    expect(parsed.requestId).toBe('r1');
    expect(parsed.message).toBe('Test');
    expect(parsed.timestamp).toBeDefined();
    spy.mockRestore();
  });

  it('outputs ERROR level correctly', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logJSON('ERROR', { requestId: 'r2', method: 'POST', url: '/fail', message: 'Something failed', error: 'DB timeout' });
    
    const parsed = JSON.parse(spy.mock.calls[0][0]);
    expect(parsed.level).toBe('ERROR');
    expect(parsed.error).toBe('DB timeout');
    spy.mockRestore();
  });
});
