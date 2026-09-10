/**
 * @module Atmos
 * @description Express application entry point for the Atmos Personal Carbon Ledger API.
 *
 * Atmos addresses three fundamental pillars of individual climate action:
 *
 * 1. **UNDERSTAND** — Provides visual and textual breakdowns of personal carbon
 *    emissions across Transport, Energy, Food, Shopping, and Waste categories,
 *    with real-world equivalency comparisons against Paris Agreement targets.
 *
 * 2. **TRACK** — Records daily activity emissions as debit transactions against
 *    a personalised carbon budget, with streak tracking and searchable history.
 *
 * 3. **REDUCE** — Integrates with Google Gemini to generate personalised, ranked
 *    action plans with calculated weekly kg CO₂e savings, supported by a
 *    conversational carbon advisory chat interface.
 *
 * Security middleware stack (applied in order):
 * - `compression` — Gzip response compression
 * - `helmet` — Security headers (CSP, HSTS, Referrer-Policy, CORP)
 * - `cors` — Allowlist-based CORS with env-var origin configuration
 * - `express.json` — Body parsing with 50 KB size limit
 * - `globalRateLimiter` — Per-IP request throttling on all `/api/*` routes
 * - `aiRateLimiter` — Tighter per-IP throttle on AI endpoints (applied in routes)
 * - `errorHandler` — Centralised structured error response envelope
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

import { env } from "./config/env.js";
import { globalRateLimiter } from "./middleware/rateLimiters.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";
import { HSTS_MAX_AGE_SECONDS } from "./constants/carbon.constants.js";

// Route imports
import healthRouter from "./routes/health.routes.js";
import profileRouter from "./routes/profile.routes.js";
import goalsRouter from "./routes/goals.routes.js";
import activitiesRouter from "./routes/activities.routes.js";
import insightsRouter from "./routes/insights.routes.js";
import chatRouter from "./routes/chat.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ─── 1. Compression ──────────────────────────────────────────────────────────
app.use(compression());

// ─── 2. Security Headers (Helmet) ────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
    // HSTS: Browsers will enforce HTTPS for 1 year on this domain and all subdomains
    hsts: {
      maxAge: HSTS_MAX_AGE_SECONDS,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// ─── 3. CORS ─────────────────────────────────────────────────────────────────
// Safe fallback to localhost origins if ALLOWED_ORIGINS env var is not set.
// Without this fallback, an unset env var would cause `.split()` to throw a
// runtime crash, breaking the application on deployment.
const allowedOrigins = (
  process.env.ALLOWED_ORIGINS || "http://localhost:5173,http://localhost:3000,http://localhost:5000"
)
  .split(",")
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow server-to-server requests (no Origin header)
      if (!origin) return callback(null, true);

      if (env.NODE_ENV === "production") {
        // Block localhost origins in production to prevent accidental data exposure
        if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
          return callback(new Error("CORS: localhost origins blocked in production"));
        }
        return callback(null, true);
      }

      // In development, enforce the allowedOrigins allowlist
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS: origin not allowed"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ─── 4. Body Parser ──────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));

// ─── 5. Global Rate Limiting ─────────────────────────────────────────────────
app.use("/api", globalRateLimiter);

// ─── 6. API Routes ───────────────────────────────────────────────────────────
app.use("/api/health", healthRouter);
app.use("/api/profile", profileRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/insights", insightsRouter);
app.use("/api/chat", chatRouter);

// ─── 7. Static Asset Serving (Production) ────────────────────────────────────
if (env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../dist");
  logger.info({ event: "static_serving_enabled", distPath });

  if (fs.existsSync(distPath)) {
    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (path.extname(filePath) === ".html") {
            res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
            res.setHeader("Pragma", "no-cache");
            res.setHeader("Expires", "0");
          } else {
            // JS/CSS/image assets are content-hashed by Vite — safe to cache aggressively
            res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
          }
        },
      })
    );
    app.get(/.*/, (_req, res) => {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    logger.warn({ event: "dist_not_found", message: "Production build folder (dist) not found. Static serving disabled." });
  }
} else {
  app.get("/", (_req, res) => {
    res.send("Atmos Personal Carbon Ledger API is running. Direct your Vite dev server proxy here.");
  });
}

// ─── 8. Centralised Error Handler ────────────────────────────────────────────
app.use(errorHandler);

// ─── 9. Server Start ─────────────────────────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.listen(env.PORT, () => {
    logger.info({
      event: "server_started",
      mode: env.NODE_ENV,
      port: env.PORT,
      message: `Atmos Express Server running in ${env.NODE_ENV} mode on port ${env.PORT}`,
    });
  });
}

export default app;
export { app };
