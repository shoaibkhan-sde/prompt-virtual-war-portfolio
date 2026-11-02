/**
 * Tunable constants for the event planner domain engine.
 * Pure constants without side effects.
 */

export const CONTINGENCY_BASE_PERCENT = 8; // 8% base contingency
export const CONTINGENCY_OUTDOOR_SURCHARGE = 4; // +4% for outdoor/hybrid weather readiness (12% total)

export const PRIORITY_MULTIPLIER = 1.35; // 35% boost to priority categories
export const MAX_PRIORITIES = 3; // Maximum priorities allowed

export const TIER_WEIGHT_MODIFIERS = {
  lean: 0.85,
  standard: 1.0,
  premium: 1.25,
} as const;

export const SERVER_DATE_TOLERANCE_DAYS = 1; // Tolerance between client today and server UTC

export const MIN_EVENT_NAME_LENGTH = 2;
export const MAX_EVENT_NAME_LENGTH = 80;
export const MAX_CITY_LENGTH = 60;
export const MAX_THEME_LENGTH = 60;
export const MAX_INTERESTS_COUNT = 8;
export const MAX_INTEREST_LENGTH = 30;

export const MAX_EVENT_FUTURE_YEARS = 3;
