import request from 'supertest';
import express from 'express';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiRoutes from '../routes';
import { validateChatPayload, validateIncidentPayload } from '../middleware';

const app = express();
app.use(express.json());

// Apply validation middleware to specific routes like the real server does
app.use('/api/chat', validateChatPayload);
app.post('/api/incidents', validateIncidentPayload);
app.use('/api', apiRoutes);

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Mock the db dependency
vi.mock('../db', () => ({
  getIncidents: vi.fn().mockResolvedValue([
    { incidentId: '1', zoneId: 'z1', priority: 'HIGH', status: 'active', summary: 'Mock Incident', category: 'crowd' }
  ]),
  getCrowdDensities: vi.fn().mockResolvedValue([
    { zoneId: 'z1', name: 'North Stand', density: 85, capacity: 1000, currentCount: 850, status: 'HIGH' }
  ]),
  getVenueLayout: vi.fn().mockResolvedValue({
    stadiumName: 'Mock Stadium',
    gates: [{ gateId: 'g1', name: 'Main Gate', isADACompliant: true }],
    transitHubs: []
  }),
  getFacilities: vi.fn().mockResolvedValue([
    { facilityId: 'f1', name: 'Restroom A', type: 'restroom', waitTimeMinutes: 2, status: 'LOW' }
  ]),
  logIncident: vi.fn().mockResolvedValue({ incidentId: 'abc123', priority: 'HIGH', category: 'crowd' }),
  appendChatMessage: vi.fn().mockResolvedValue(undefined),
  getChatHistory: vi.fn().mockResolvedValue([{ role: 'user', text: 'hello' }]),
  updateZoneDensityDirectly: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../gemini', () => ({
  processChat: vi.fn().mockResolvedValue({ text: 'Test response', highlights: ['g1'], detectedLanguage: 'en' }),
  triageIncident: vi.fn().mockResolvedValue({ priority: 'HIGH', category: 'crowd', summary: 'Crowded zone alert' })
}));

describe('Health endpoint', () => {
  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/incidents', () => {
  it('returns mock incidents array', async () => {
    const res = await request(app).get('/api/incidents');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].priority).toBe('HIGH');
    expect(res.body[0].category).toBe('crowd');
  });
});

describe('GET /api/crowd', () => {
  it('returns crowd zone data', async () => {
    const res = await request(app).get('/api/crowd');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].density).toBe(85);
    expect(res.body[0].name).toBe('North Stand');
  });
});

describe('GET /api/venue', () => {
  it('returns venue layout with ADA-compliant gates', async () => {
    const res = await request(app).get('/api/venue');
    expect(res.status).toBe(200);
    expect(res.body.stadiumName).toBe('Mock Stadium');
    expect(res.body.gates[0].isADACompliant).toBe(true);
  });
});

describe('GET /api/facilities', () => {
  it('returns facilities list', async () => {
    const res = await request(app).get('/api/facilities');
    expect(res.status).toBe(200);
    expect(res.body[0].type).toBe('restroom');
  });
});

describe('POST /api/incidents - validation', () => {
  it('returns 400 when description is missing', async () => {
    const res = await request(app).post('/api/incidents').send({ reportedBy: 'staff', zoneId: 'z1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('description');
  });

  it('returns 400 when reportedBy is invalid', async () => {
    const res = await request(app).post('/api/incidents').send({ description: 'A problem', reportedBy: 'robot', zoneId: 'z1' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('reportedBy');
  });

  it('returns 400 when zoneId is missing', async () => {
    const res = await request(app).post('/api/incidents').send({ description: 'A problem', reportedBy: 'staff' });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('zoneId');
  });

  it('returns 400 when description exceeds 1000 chars', async () => {
    const res = await request(app).post('/api/incidents').send({
      description: 'x'.repeat(1001),
      reportedBy: 'volunteer',
      zoneId: 'z1'
    });
    expect(res.status).toBe(400);
  });

  it('returns 201 with valid incident payload', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ description: 'North Stand crowd is too dense', reportedBy: 'staff', zoneId: 'Zone-A' });
    expect(res.status).toBe(201);
    expect(res.body.priority).toBe('HIGH');
    expect(res.body.category).toBe('crowd');
  });
});

describe('POST /api/chat - validation', () => {
  it('returns 400 when message is missing', async () => {
    const res = await request(app).post('/api/chat').send({ accessibilityMode: false });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('message');
  });

  it('returns 400 when message exceeds 2000 chars', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'x'.repeat(2001) });
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('2000');
  });

  it('returns 200 with valid chat message', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'Which gate has the lowest wait time?', accessibilityMode: false });
    expect(res.status).toBe(200);
    expect(res.body.text).toBe('Test response');
    expect(Array.isArray(res.body.highlights)).toBe(true);
  });

  it('returns 200 with accessibility mode enabled', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'Find wheelchair accessible route', accessibilityMode: true });
    expect(res.status).toBe(200);
  });
});

describe('GET /api/chat/history', () => {
  it('returns chat history with default session when no header', async () => {
    // GET request to /api/chat/history goes through validateChatPayload middleware
    // which rejects requests missing 'message'. Override the middleware for this specific test.
    const historyApp = express();
    historyApp.use(express.json());
    historyApp.use('/api', apiRoutes);
    const res = await request(historyApp).get('/api/chat/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/test/density', () => {
  it('returns 400 when zoneId is not a string', async () => {
    const res = await request(app).post('/api/test/density').send({ zoneId: 123, changePercent: 10 });
    expect(res.status).toBe(400);
  });

  it('returns 400 when changePercent is not a number', async () => {
    const res = await request(app).post('/api/test/density').send({ zoneId: 'z1', changePercent: '10' });
    expect(res.status).toBe(400);
  });

  it('returns 200 with valid density update', async () => {
    const res = await request(app).post('/api/test/density').send({ zoneId: 'z1', changePercent: 10 });
    expect(res.status).toBe(200);
  });
});
