/**
 * @module Env
 * @description Environment configuration loader and validator for the Atmos Express server.
 *
 * Parses and validates all required environment variables at startup using Zod.
 * If any variable fails validation, the process exits immediately with a
 * descriptive error — preventing silent misconfiguration in production.
 *
 * Required variables (see `.env.example`):
 * - `PORT` — TCP port for the Express server (default: 5000).
 * - `NODE_ENV` — Runtime environment: `'development'`, `'production'`, or `'test'`.
 * - `GEMINI_API_KEY` — Optional Google Gemini API key; falls back to local engine if absent.
 * - `CORS_ORIGIN` — Primary allowed CORS origin (default: `http://localhost:3000`).
 * - `ALLOWED_ORIGINS` — Comma-separated list of additional allowed CORS origins.
 * - `LOG_LEVEL` — Winston log verbosity level (default: `'info'`).
 */

import dotenv from "dotenv";
import { z } from "zod";

// Load .env file variables into process.env
dotenv.config();

/**
 * Zod schema that defines the shape and constraints of all required environment variables.
 * Each field is parsed and coerced from `process.env` raw string values.
 */
const envSchema = z.object({
  /** TCP port number for the Express server. Coerced from string to number. */
  PORT: z.preprocess((val) => Number(val ?? 5000), z.number().positive()),
  /** Runtime environment identifier. Controls logging format and security policies. */
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** Google Gemini API key. Optional — absence triggers local rule-based fallback engine. */
  GEMINI_API_KEY: z.string().optional(),
  /** Primary allowed CORS origin for the dev proxy. */
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  /** Comma-separated additional CORS origins for production deployments. */
  ALLOWED_ORIGINS: z.string().optional(),
  /** Winston log verbosity level. */
  LOG_LEVEL: z.enum(["error", "warn", "info", "http", "verbose", "debug", "silly"]).default("info"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  // Cannot use logger here — it depends on env being valid. Fall back to console.error for startup.
  console.error("❌ Invalid environment configuration:", parsedEnv.error.format());
  process.exit(1);
}

/**
 * Validated and typed environment configuration object.
 * All server modules should import from this export rather than reading
 * `process.env` directly to ensure type safety and validation guarantees.
 */
export const env = parsedEnv.data;
