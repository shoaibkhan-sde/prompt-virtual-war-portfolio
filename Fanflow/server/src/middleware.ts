import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import crypto from 'crypto';

// Logger interface
interface LogDetails {
  requestId: string;
  method: string;
  url: string;
  statusCode?: number;
  durationMs?: number;
  message: string;
  error?: string;
}

// Zero-leak JSON logging function
export function logJSON(level: 'INFO' | 'WARN' | 'ERROR', details: LogDetails) {
  // Never log raw user prompts or secrets
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...details
  }));
}

// Request ID middleware
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = crypto.randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('x-request-id', requestId);
  
  const start = Date.now();
  
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    logJSON('INFO', {
      requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      message: `Request completed with status ${res.statusCode}`
    });
  });
  
  next();
}

// Helper to get request ID
export function getRequestId(req: Request): string {
  return (req.headers['x-request-id'] as string) || 'unknown';
}

// Payload Validation Middleware
export function validateChatPayload(req: Request, res: Response, next: NextFunction) {
  const { message, accessibilityMode } = req.body;
  const requestId = getRequestId(req);

  if (typeof message !== 'string') {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Invalid payload: message must be a string' });
    return res.status(400).json({ error: 'Payload validation failed: "message" is required and must be a string.' });
  }

  // Strict payload constraints - prevent oversized strings before routing to LLM
  if (message.length > 2000) {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Payload rejected: message too long' });
    return res.status(400).json({ error: 'Payload validation failed: message length exceeds limit (2000 characters).' });
  }

  if (accessibilityMode !== undefined && typeof accessibilityMode !== 'boolean') {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Invalid payload: accessibilityMode must be a boolean' });
    return res.status(400).json({ error: 'Payload validation failed: "accessibilityMode" must be a boolean.' });
  }

  next();
}

export function validateIncidentPayload(req: Request, res: Response, next: NextFunction) {
  const { description, reportedBy, zoneId } = req.body;
  const requestId = getRequestId(req);

  if (typeof description !== 'string' || !description.trim()) {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Invalid payload: description is required and must be a string' });
    return res.status(400).json({ error: 'Payload validation failed: "description" is required.' });
  }

  if (description.length > 1000) {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Payload rejected: description too long' });
    return res.status(400).json({ error: 'Payload validation failed: description length exceeds limit (1000 characters).' });
  }

  if (reportedBy !== 'volunteer' && reportedBy !== 'staff') {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Invalid payload: reportedBy must be "volunteer" or "staff"' });
    return res.status(400).json({ error: 'Payload validation failed: "reportedBy" must be either "volunteer" or "staff".' });
  }

  if (typeof zoneId !== 'string' || !zoneId.trim()) {
    logJSON('WARN', { requestId, method: req.method, url: req.originalUrl, message: 'Invalid payload: zoneId must be a string' });
    return res.status(400).json({ error: 'Payload validation failed: "zoneId" is required.' });
  }

  next();
}

// CORS settings
export const configuredCors = cors({
  origin: (origin, callback) => {
    // Allow localhost for development
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5000',
      'https://fanflow-azure.vercel.app',
    ];

    // Also allow any Vercel preview deployment URLs for this project
    const isVercelPreview = origin && /^https:\/\/fanflow.*\.vercel\.app$/.test(origin);

    // Allow custom origin from env variable
    if (process.env.CLIENT_ORIGIN_URL) {
      allowedOrigins.push(process.env.CLIENT_ORIGIN_URL);
    }

    if (!origin || allowedOrigins.includes(origin) || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy in production settings.'));
    }
  },
  credentials: true
});

// Helmet configurations for security headers
export const configuredHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://flagcdn.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      connectSrc: ["'self'", "http://localhost:5000", "https://generativelanguage.googleapis.com"]
    }
  }
});

// Rate limiting setup
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Stricter rate limit for Gemini POST endpoints
export const geminiApiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute to prevent Gemini API quota abuse
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'API request quota reached. Please wait a minute before querying the AI concierge again.' }
});
