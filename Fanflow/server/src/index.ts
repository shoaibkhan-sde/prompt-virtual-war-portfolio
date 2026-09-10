import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

// Load environment variables FIRST before importing other local modules
dotenv.config({ path: path.join(__dirname, '../../.env') });
// Fallback if not loaded in root
dotenv.config();

import { connectDB } from './db';
import {
  configuredCors,
  configuredHelmet,
  globalRateLimiter,
  geminiApiRateLimiter,
  requestIdMiddleware,
  validateChatPayload,
  validateIncidentPayload,
  logJSON
} from './middleware';
import apiRouter from './routes';
import authRouter from './auth';

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(configuredHelmet);
app.use(configuredCors);
app.use(express.json({ limit: '10kb' })); // Limit body sizes to prevent payload inflation
app.use(cookieParser());
app.use(requestIdMiddleware);

// Apply Global Rate Limiting
app.use(globalRateLimiter);

// Specific Rate Limiting and Payload Validation on Gemini endpoints
app.use('/api/chat', geminiApiRateLimiter, validateChatPayload);
app.post('/api/incidents', geminiApiRateLimiter, validateIncidentPayload);

// API Routes
app.use('/api/auth', authRouter);
app.use('/api', apiRouter);

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Fanflow API', timestamp: new Date().toISOString() });
});

// Serve client in production
app.use(express.static(path.join(__dirname, '../../client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
});

// Global error handler
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) || 'unknown';
  logJSON('ERROR', {
    requestId,
    method: req.method,
    url: req.originalUrl,
    message: 'Unhandled application error occurred.',
    error: err instanceof Error ? (err.message || String(err)) : String(err)
  });

  return res.status((err instanceof Error && 'status' in err) ? (err as Error & {status: number}).status : 500).json({
    error: 'An internal error occurred. Please contact the administrator.'
  });
});

// Bootstrapping the server for local or container environments
async function bootstrap() {
  try {
    // Connect DB & Seed
    await connectDB();

    app.listen(PORT, () => {
      logJSON('INFO', {
        requestId: 'BOOT',
        method: 'SERVER',
        url: 'listen',
        message: `Fanflow Backend running on port ${PORT}`
      });
    });
  } catch (err: unknown) {
    logJSON('ERROR', {
      requestId: 'BOOT',
      method: 'SERVER',
      url: 'listen',
      message: 'Failed to bootstrap backend service.',
      error: err instanceof Error ? err.message : String(err)
    });
    process.exit(1);
  }
}

// If not running on Vercel, start the server normally.
// Vercel serverless functions handle the HTTP server themselves.
if (!process.env.VERCEL) {
  bootstrap();
} else {
  // Connect to DB for Vercel environment (promise floats)
  connectDB().catch(console.error);
}

// Export for Vercel Serverless Functions
module.exports = app;
