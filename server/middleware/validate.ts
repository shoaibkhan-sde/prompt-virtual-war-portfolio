/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @module Validate
 * @description Request validation middleware and Zod schema definitions for the Atmos API.
 *
 * All route handlers that accept user input must pass through the {@link validate}
 * middleware factory with the appropriate schema to ensure sanitization and type safety
 * before any business logic runs.
 *
 * Schemas defined here are the canonical contract for all Atmos API request bodies:
 * - {@link profileSchema} — Onboarding carbon profile (POST `/api/profile`)
 * - {@link goalsSchema} — Reduction offsetTarget configuration (POST `/api/goals`)
 * - {@link activitySchema} — Carbon emission ledger entry (POST/PUT `/api/activities`)
 * - {@link chatSchema} — Conversational query to Atmos Coach (POST `/api/chat`)
 */

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { logger } from "../utils/logger.js";

/**
 * Strips HTML tags from a raw string and trims leading/trailing whitespace.
 *
 * Applied automatically to all string fields via `.transform(sanitizeString)` in
 * the schema definitions below, providing first-pass XSS protection on all
 * user-supplied text before it reaches business logic.
 *
 * @param {string} str - The raw input string from the request body.
 * @returns {string} The sanitized string with HTML removed and whitespace trimmed.
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/<[^>]*>/g, "").trim();
};

/**
 * Zod schema for validating the user's onboarding carbon profile.
 * Used by POST `/api/profile`.
 *
 * All string fields are sanitized via {@link sanitizeString} to prevent XSS.
 */
export const profileSchema = z.object({
  body: z.object({
    /** ISO 3166-1 alpha-2 country code or Atmos region key (e.g., `'US'`, `'EU_AVG'`). */
    country: z.string().min(1).transform(sanitizeString),
    /** Number of people sharing the household, used to apportion energy co2eKg per person. */
    householdSize: z.number().int().positive(),
    /** Primary mode of transit (e.g., `'car_petrol'`, `'public'`, `'active'`). */
    primaryTransport: z.string().transform(sanitizeString).default("car_petrol"),
    /** Average weekly commute distance in km. Used to compute transport co2eKg. */
    weeklyTransportKm: z.number().nonnegative(),
    /** Diet classification that maps to an annual food co2eKg estimate. */
    dietType: z.string().transform(sanitizeString).default("average"),
    /** Monthly household electricity consumption in kWh. */
    electricityKwh: z.number().nonnegative(),
    /** Primary heating fuel type (e.g., `'natural_gas'`, `'electric'`, `'none'`). */
    heatingType: z.string().transform(sanitizeString).default("none"),
    /** Monthly heating fuel quantity in the unit appropriate for the `heatingType`. */
    heatingQty: z.number().nonnegative(),
    /** Whether the household regularly recycles and composts waste. Reduces waste co2eKg. */
    recycleCompost: z.boolean().default(false),
  }),
});

/**
 * Zod schema for validating carbon reduction offsetTarget updates.
 * Used by POST `/api/goals`.
 */
export const goalsSchema = z.object({
  body: z.object({
    /** Target reduction percentage relative to the onboarding baseline (0–100). */
    targetPercent: z.number().min(0).max(100),
    /** Computed absolute offsetTarget in kg CO₂e per year. Defaults to 0 if omitted. */
    targetAnnualKg: z.number().nonnegative().optional().default(0),
  }),
});

/**
 * Zod schema for validating a carbon emission ledger entry.
 * Used by POST and PUT `/api/activities`.
 *
 * **Field names must be used exactly** in integration test request bodies:
 * `category`, `type`, `value`, `date`, `note`.
 */
export const activitySchema = z.object({
  body: z.object({
    /** ISO 8601 date string (YYYY-MM-DD). Defaults to today if omitted. */
    date: z.string().optional().transform((val) => (val ? sanitizeString(val) : new Date().toISOString().split("T")[0])),
    /** Emission source category used to route the co2eKg calculation. */
    category: z.enum(["Transport", "Energy", "Food", "Shopping", "Waste"]),
    /** Specific activity type within the category (e.g., `'car_petrol'`, `'beef'`). */
    type: z.string().min(1).transform(sanitizeString),
    /** Quantity of the activity in its natural unit (km, kWh, kg, etc.). Must be positive. */
    value: z.number().positive("Value must be a positive number"),
    /** Optional user note for the ledger entry. Sanitized to prevent XSS. */
    note: z.string().optional().transform((val) => (val ? sanitizeString(val) : "")),
  }),
});

/**
 * Zod schema for validating a conversational chat message to Atmos Coach.
 * Used by POST `/api/chat`.
 */
export const chatSchema = z.object({
  body: z.object({
    /** The user's raw chat message string. Must be non-empty. Sanitized for XSS. */
    message: z.string().min(1, "Message is required").transform(sanitizeString),
  }),
});

/**
 * Express middleware factory that validates an incoming request against a Zod schema.
 *
 * Parses `{ body, query, params }` from the request using the provided schema.
 * On success, replaces `req.body`, `req.query`, and `req.params` with the parsed
 * and sanitized values so downstream handlers receive typed, safe data.
 * On failure, responds immediately with HTTP 400 and a structured error envelope.
 *
 * @param {z.ZodSchema<any>} schema - The Zod schema to validate the request against.
 * @returns {(req: Request, res: Response, next: NextFunction) => Promise<void>}
 *   An async Express middleware function.
 * @throws Never — validation failures are caught and returned as 400 responses.
 */
export const validate = (schema: z.ZodSchema<any>) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    let parsed;
    try {
      parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
    } catch (error: any) {
      logger.warn({
        event: "request_validation_failed",
        route: req.originalUrl,
        method: req.method,
        details: error instanceof z.ZodError ? error.issues : String(error),
      });
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Input validation failed",
            details: (error as any).errors || (error as any).issues,
          },
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Input validation failed",
          details: error instanceof Error ? error.message : String(error),
        },
      });
      return;
    }

    // Replace req body/params/query with parsed & sanitized versions if present
    if (parsed.body !== undefined) {
      req.body = parsed.body;
    }
    if (parsed.query !== undefined) {
      req.query = parsed.query as typeof req.query;
    }
    if (parsed.params !== undefined) {
      req.params = parsed.params as typeof req.params;
    }
    next();
  };
};
