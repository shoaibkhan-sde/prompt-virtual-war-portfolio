import { Router, Request, Response } from 'express';
import { getVenueLayout, getCrowdDensities, getIncidents, logIncident, appendChatMessage, getChatHistory, updateZoneDensityDirectly, getFacilities } from './db';
import { processChat, triageIncident } from './gemini';
import { getRequestId, logJSON } from './middleware';

const router = Router();

// GET /api/venue - static venue layouts
router.get('/venue', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const layout = await getVenueLayout();
    return res.json(layout);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GET', url: '/api/venue', message: 'Failed fetching venue layout.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/crowd - live capacity densities
router.get('/crowd', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const densities = await getCrowdDensities();
    return res.json(densities);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GET', url: '/api/crowd', message: 'Failed fetching crowd densities.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/facilities - Wait time data for restrooms and concessions
router.get('/facilities', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const facilities = await getFacilities();
    return res.json(facilities);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GET', url: '/api/facilities', message: 'Failed fetching facilities.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/chat - GenAI Fan Concierge chat
router.post('/chat', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const { message, accessibilityMode } = req.body;
  
  // Use a default session ID or generate one
  const sessionId = (req.headers['x-session-id'] as string) || 'default-session';

  try {
    // 1. Log chat input (without details to maintain PII compliance, only logs action)
    logJSON('INFO', { requestId, method: 'POST', url: '/api/chat', message: `Processing chat query for session ${sessionId}` });

    // 2. Call Gemini with context injection
    const aiResponse = await processChat(message, !!accessibilityMode, sessionId, requestId);

    // 3. Log query and response into chat history database
    await appendChatMessage(sessionId, 'user', message);
    await appendChatMessage(sessionId, 'model', aiResponse.text);

    // 4. Return structured response
    return res.json(aiResponse);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'POST', url: '/api/chat', message: 'Chat process failed.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/chat/history - Get session chat history
router.get('/chat/history', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const sessionId = (req.headers['x-session-id'] as string) || 'default-session';
  try {
    const history = await getChatHistory(sessionId);
    return res.json(history);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GET', url: '/api/chat/history', message: 'Failed retrieving chat history.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/incidents - Report a new incident
router.post('/incidents', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const { description, reportedBy, zoneId } = req.body;

  try {
    logJSON('INFO', { requestId, method: 'POST', url: '/api/incidents', message: `Incident reported in zone ${zoneId}` });

    // 1. Send description to Gemini for categorizing, priority ranking, and summary
    const triage = await triageIncident(description, reportedBy, zoneId, requestId);

    // 2. Log incident into MongoDB/In-memory DB
    const logged = await logIncident({
      description,
      reportedBy,
      zoneId,
      priority: triage.priority,
      category: triage.category,
      summary: triage.summary
    });

    logJSON('INFO', { requestId, method: 'POST', url: '/api/incidents', message: `Incident successfully logged with priority ${triage.priority}` });
    return res.status(201).json(logged);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'POST', url: '/api/incidents', message: 'Failed logging incident.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/incidents - Expose active and historical incidents feed
router.get('/incidents', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const incidents = await getIncidents();
    return res.json(incidents);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'GET', url: '/api/incidents', message: 'Failed fetching incidents.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/test/density - Debug route to manually alter zone density
router.post('/test/density', async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const { zoneId, changePercent } = req.body;

  if (typeof zoneId !== 'string' || typeof changePercent !== 'number') {
    return res.status(400).json({ error: 'Missing zoneId (string) or changePercent (number).' });
  }

  try {
    await updateZoneDensityDirectly(zoneId, changePercent);
    logJSON('INFO', { requestId, method: 'POST', url: '/api/test/density', message: `Manually altered zone ${zoneId} density by ${changePercent}%` });
    
    // Return updated zones
    const densities = await getCrowdDensities();
    return res.json(densities);
  } catch (err: unknown) {
    logJSON('ERROR', { requestId, method: 'POST', url: '/api/test/density', message: 'Failed updating density manually.', error: err instanceof Error ? err.message : String(err) });
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
