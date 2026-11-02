import { PlanRequestRaw, ValidatedPlanInput, ValidationError, BudgetTier, VenueType, DietaryType } from './types';
import {
  MIN_EVENT_NAME_LENGTH,
  MAX_EVENT_NAME_LENGTH,
  MAX_CITY_LENGTH,
  MAX_THEME_LENGTH,
  MAX_INTERESTS_COUNT,
  MAX_INTEREST_LENGTH,
  MAX_EVENT_FUTURE_YEARS,
  MAX_PRIORITIES,
  SERVER_DATE_TOLERANCE_DAYS,
} from './constants';
import { getEventDefinition, isValidEventType } from './registry';

// Regex to strip control characters & bidirectional overrides
const UNWANTED_CHARS_REGEX = /[\u0000-\u001F\u007F-\u009F\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

/**
 * Sanitizes an unknown text value by stripping control characters, unicode
 * bidirectional overrides, and unwanted whitespace.
 *
 * @param val - The raw text input.
 * @returns Clean, trimmed string.
 */
export function sanitizeText(val: unknown): string {
  if (typeof val !== 'string') return '';
  return val.replace(UNWANTED_CHARS_REGEX, '').trim();
}

function parseUtcDate(dateStr: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const d = new Date(dateStr + 'T00:00:00Z');
  return isNaN(d.getTime()) ? null : d;
}

function getDaysBetween(d1: Date, d2: Date): number {
  const msPerDay = 86400000;
  return Math.round((d2.getTime() - d1.getTime()) / msPerDay);
}

/**
 * Validates and sanitizes raw user event plan parameters against archetype definitions,
 * date bounds, and financial minimums.
 *
 * Validation checks:
 * 1. Device vs Server clock skew tolerance (rejects drift > SERVER_DATE_TOLERANCE_DAYS).
 * 2. Event type registration check.
 * 3. Event name length and character constraints.
 * 4. Event date futurity (event must be today or in the future, up to MAX_EVENT_FUTURE_YEARS).
 * 5. Total budget against archetype minimum budget thresholds.
 * 6. Guest capacity against archetype maximum guest limits.
 * 7. City, theme, and interests limits.
 *
 * @param raw - Untrusted partial user request.
 * @param serverTodayUtcStr - Authoritative current UTC date string.
 * @returns Result object with `isValid`, sanitized input, and list of validation errors.
 */
export function validatePlanRequest(
  raw: Partial<PlanRequestRaw>,
  serverTodayUtcStr: string
): { isValid: boolean; sanitizedInput?: ValidatedPlanInput; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // 1. Verify Today Date
  const rawToday = sanitizeText(raw.todayDate);
  const parsedBrowserToday = parseUtcDate(rawToday);
  const parsedServerToday = parseUtcDate(serverTodayUtcStr);

  if (!parsedBrowserToday) {
    errors.push({ field: 'todayDate', message: 'Current date is invalid. Please supply a valid YYYY-MM-DD date.' });
  } else if (parsedServerToday) {
    const diffDays = Math.abs(getDaysBetween(parsedBrowserToday, parsedServerToday));
    if (diffDays > SERVER_DATE_TOLERANCE_DAYS) {
      errors.push({
        field: 'todayDate',
        message: `System clock date differs by more than ${SERVER_DATE_TOLERANCE_DAYS} day from server UTC (${serverTodayUtcStr}). Please calibrate your device clock.`,
      });
    }
  }

  // 2. Event Type
  const eventType = sanitizeText(raw.eventType);
  if (!eventType) {
    errors.push({ field: 'eventType', message: 'Event type is required. Please select one from the options.' });
  } else if (!isValidEventType(eventType)) {
    errors.push({ field: 'eventType', message: `Unknown celebration type "${eventType}". Please pick a registered celebration type.` });
  }

  const def = isValidEventType(eventType) ? getEventDefinition(eventType) : undefined;

  // 3. Event Name
  const eventName = sanitizeText(raw.eventName);
  if (!eventName || eventName.length < MIN_EVENT_NAME_LENGTH) {
    errors.push({
      field: 'eventName',
      message: `Event title must be at least ${MIN_EVENT_NAME_LENGTH} characters. E.g., "Rohit & Meera's Sangeet".`,
    });
  } else if (eventName.length > MAX_EVENT_NAME_LENGTH) {
    errors.push({
      field: 'eventName',
      message: `Event title is too long (maximum ${MAX_EVENT_NAME_LENGTH} characters). Please shorten it.`,
    });
  }

  // 4. Event Date
  const rawEventDate = sanitizeText(raw.eventDate);
  const parsedEventDate = parseUtcDate(rawEventDate);
  if (!parsedEventDate) {
    errors.push({ field: 'eventDate', message: 'Event date is required and must follow YYYY-MM-DD format.' });
  } else if (parsedBrowserToday) {
    const daysUntilEvent = getDaysBetween(parsedBrowserToday, parsedEventDate);
    if (daysUntilEvent < 0) {
      errors.push({ field: 'eventDate', message: 'Event date cannot be in the past. Please select today or a future date.' });
    }
    const maxFutureDays = MAX_EVENT_FUTURE_YEARS * 365 + 1;
    if (daysUntilEvent > maxFutureDays) {
      errors.push({
        field: 'eventDate',
        message: `Event date cannot be further than ${MAX_EVENT_FUTURE_YEARS} years in the future.`,
      });
    }
  }

  // 5. Guest Count
  const guestCount = Number(raw.guestCount);
  if (isNaN(guestCount) || !Number.isInteger(guestCount) || guestCount <= 0) {
    errors.push({ field: 'guestCount', message: 'Guest count must be a positive whole number greater than zero.' });
  } else if (def) {
    if (guestCount < def.minGuests) {
      errors.push({
        field: 'guestCount',
        message: `Guest count for ${def.displayName} must be at least ${def.minGuests}.`,
      });
    } else if (guestCount > def.maxGuests) {
      errors.push({
        field: 'guestCount',
        message: `Guest count for ${def.displayName} cannot exceed ${def.maxGuests}.`,
      });
    }
  }

  // 6. Currency & Budget
  const currency = sanitizeText(raw.currency) || (def ? def.defaultCurrency : 'INR');
  const totalBudget = Number(raw.totalBudget);
  if (isNaN(totalBudget) || !Number.isInteger(totalBudget) || totalBudget <= 0) {
    errors.push({ field: 'totalBudget', message: 'Total budget must be a positive whole number without decimals.' });
  }

  // 7. Budget Tier
  const tier = (raw.budgetTier || 'standard') as BudgetTier;
  if (!['lean', 'standard', 'premium'].includes(tier)) {
    errors.push({ field: 'budgetTier', message: 'Budget tier must be one of: lean, standard, premium.' });
  }

  // 8. Priorities
  const priorities: string[] = Array.isArray(raw.priorities) ? raw.priorities.map(sanitizeText).filter(Boolean) : [];
  if (priorities.length > MAX_PRIORITIES) {
    errors.push({ field: 'priorities', message: `You can select at most ${MAX_PRIORITIES} priority categories.` });
  }
  const resolvedPriorities: string[] = [];
  if (def && priorities.length > 0) {
    const validCategoryIds = new Set(def.categories.map((c) => c.id));
    const KEYWORD_MAP: Record<string, string[]> = {
      venue: ['venue', 'hospitality', 'banquet', 'grounds', 'hall', 'facility', 'cabana'],
      food: ['culinary', 'gourmet', 'food', 'bites', 'catering', 'spread', 'meals', 'confection', 'bazaar', 'beverage'],
      photo: ['visual', 'photo', 'captures', 'portraits', 'video', 'cinematography'],
      decor: ['floral', 'decor', 'ambience', 'scenography', 'balloon', 'stage', 'props', 'lights'],
      music: ['sound', 'revelry', 'music', 'acoustic', 'dj', 'experience', 'entertainer', 'entertainment', 'performers', 'emcee', 'artists'],
      attire: ['attire', 'wardrobe', 'jewels', 'styling', 'beauty'],
      invitations: ['invitation', 'stationery', 'flyers', 'badges'],
      transport: ['stay', 'transport', 'hospitality', 'permits', 'safety', 'volunteer'],
    };

    for (const rawP of priorities) {
      const p = rawP.toLowerCase().trim();
      if (validCategoryIds.has(p)) {
        resolvedPriorities.push(p);
      } else {
        const canonicalKey = Object.keys(KEYWORD_MAP).find(
          (k) => k === p || p.includes(k) || KEYWORD_MAP[k].some((kw) => p.includes(kw) || kw.includes(p))
        );
        const keywords = canonicalKey ? KEYWORD_MAP[canonicalKey] : [p];
        const match = def.categories.find((c) =>
          keywords.some((kw) => c.id.toLowerCase().includes(kw) || c.name.toLowerCase().includes(kw))
        );
        if (match) {
          if (!resolvedPriorities.includes(match.id)) {
            resolvedPriorities.push(match.id);
          }
        } else if (canonicalKey) {
          if (!resolvedPriorities.includes(canonicalKey)) {
            resolvedPriorities.push(canonicalKey);
          }
        } else {
          errors.push({ field: 'priorities', message: `Priority "${rawP}" is not valid for ${def.displayName}.` });
        }
      }
    }
  }

  // 9. Optional / Contextual fields
  const city = sanitizeText(raw.city);
  if (city.length > MAX_CITY_LENGTH) {
    errors.push({ field: 'city', message: `City name cannot exceed ${MAX_CITY_LENGTH} characters.` });
  }

  const theme = sanitizeText(raw.theme);
  if (theme.length > MAX_THEME_LENGTH) {
    errors.push({ field: 'theme', message: `Theme cannot exceed ${MAX_THEME_LENGTH} characters.` });
  }

  // Interests: comma separated, de-duplicated, normalized
  let interests: string[] = [];
  if (typeof raw.interests === 'string') {
    interests = raw.interests
      .split(',')
      .map((s) => sanitizeText(s).toLowerCase())
      .filter((s) => s.length > 0 && s.length <= MAX_INTEREST_LENGTH);
    interests = Array.from(new Set(interests)).slice(0, MAX_INTERESTS_COUNT);
  } else if (Array.isArray(raw.interests)) {
    interests = Array.from(new Set(raw.interests.map((s) => sanitizeText(s).toLowerCase()).filter(Boolean))).slice(0, MAX_INTERESTS_COUNT);
  }

  // Venue Type
  const venueType = (raw.venueType || 'indoor') as VenueType;
  if (!['indoor', 'outdoor', 'hybrid', 'online'].includes(venueType)) {
    errors.push({ field: 'venueType', message: 'Venue type must be indoor, outdoor, hybrid, or online.' });
  }

  // Dietary
  const dietary = (raw.dietaryRequirement || 'none') as DietaryType;
  if (!['veg_only', 'vegan', 'jain', 'halal', 'none'].includes(dietary)) {
    errors.push({ field: 'dietaryRequirement', message: 'Dietary selection is invalid.' });
  }

  // Children or secondary guest count
  let secondaryGuests = 0;
  if (raw.secondaryGuestCount !== undefined) {
    const num = Number(raw.secondaryGuestCount);
    if (isNaN(num) || num < 0 || !Number.isInteger(num)) {
      errors.push({ field: 'secondaryGuestCount', message: 'Secondary guest count must be 0 or a positive whole integer.' });
    } else {
      secondaryGuests = num;
    }
  }

  if (errors.length > 0 || !def || !parsedBrowserToday) {
    return { isValid: false, errors };
  }

  const sanitizedInput: ValidatedPlanInput = {
    eventType: def.id,
    eventName,
    eventDate: rawEventDate,
    guestCount,
    currency,
    totalBudget,
    budgetTier: tier,
    priorities: resolvedPriorities.length > 0 ? resolvedPriorities : priorities,
    city: city || undefined,
    theme: theme || undefined,
    interests,
    startTime: sanitizeText(raw.startTime) || undefined,
    durationHours: raw.durationHours ? Number(raw.durationHours) : undefined,
    venueType,
    dietaryRequirement: dietary,
    alcoholServed: Boolean(raw.alcoholServed && def.allowAlcohol),
    secondaryGuestCount: secondaryGuests,
    sponsorshipTarget: raw.sponsorshipTarget ? Number(raw.sponsorshipTarget) : undefined,
    prizePool: raw.prizePool ? Number(raw.prizePool) : undefined,
  };

  return { isValid: true, sanitizedInput, errors: [] };
}
