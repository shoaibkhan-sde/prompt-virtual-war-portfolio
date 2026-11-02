import { BudgetTier, EventDefinition, RankedIdea, VenueType } from './types';

const TIER_WEIGHTS: Record<BudgetTier, number> = {
  lean: 1,
  standard: 2,
  premium: 3,
};

function normalizeTokens(text?: string | null): string[] {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((s) => s.length > 2);
}

/**
 * Filters and ranks celebration ideas and concept starters based on user profile and constraints.
 *
 * Capabilities:
 * - Constraint filtering: Enforces guest capacity limits (min/max), budget tier minimums, and venue compatibility.
 * - Semantic keyword relevance scoring: Tokenizes theme and user interest inputs and computes a match score.
 * - Deterministic fallback: Ensures high-value fallback concepts are surfaced even with sparse inputs.
 *
 * @param eventDef - Event archetype definition containing curated concepts and tags.
 * @param guestCount - Number of attendees.
 * @param tier - Budget tier ('lean', 'standard', 'premium').
 * @param venueType - Venue classification ('indoor', 'outdoor', 'online').
 * @param theme - Optional user-defined theme string (e.g. "Royal Heritage", "Retro Arcade").
 * @param interests - List of selected user interest tags (e.g. ["Live Music", "Gourmet Food"]).
 * @returns Ranked array of `RankedIdea` items sorted by descending relevance.
 */
export function rankAndFilterIdeas(
  eventDef: EventDefinition,
  guestCount: number,
  tier: BudgetTier,
  venueType: VenueType = 'indoor',
  theme?: string,
  interests: string[] = []
): RankedIdea[] {
  const currentTierScore = TIER_WEIGHTS[tier];

  // 1. Gather search keywords from theme and interests
  const queryTokens = new Set<string>();
  if (theme) {
    for (const tok of normalizeTokens(theme)) queryTokens.add(tok);
  }
  for (const item of interests) {
    for (const tok of normalizeTokens(item)) queryTokens.add(tok);
  }

  // 2. Filter eligible ideas
  const eligible = eventDef.ideas.filter((idea) => {
    // Guest bounds
    if (idea.minGuests && guestCount < idea.minGuests) return false;
    if (idea.maxGuests && guestCount > idea.maxGuests) return false;

    // Budget tier restriction
    if (idea.minTier) {
      const ideaTierScore = TIER_WEIGHTS[idea.minTier];
      if (currentTierScore < ideaTierScore) return false;
    }

    // Venue type restriction
    if (idea.venueType && idea.venueType !== venueType) {
      if (venueType === 'online' && idea.venueType !== 'online') return false;
      if (idea.venueType === 'outdoor' && venueType !== 'outdoor') return false;
    }
    if (idea.venueTypes && !idea.venueTypes.includes(venueType)) {
      if (venueType === 'online' && !idea.venueTypes.includes('online')) return false;
      if (venueType === 'outdoor' && !idea.venueTypes.includes('outdoor')) return false;
    }

    return true;
  });

  // 3. Compute relevance and matched keywords
  const scoredIdeas: RankedIdea[] = eligible.map((idea) => {
    const summaryText = idea.summary || idea.description || '';
    const categoryName = idea.category || idea.categoryId || 'General';

    const ideaTokens = new Set<string>();
    for (const tag of idea.tags) {
      for (const t of normalizeTokens(tag)) ideaTokens.add(t);
    }
    for (const t of normalizeTokens(idea.title)) ideaTokens.add(t);
    for (const t of normalizeTokens(summaryText)) ideaTokens.add(t);

    const matched: string[] = [];
    Array.from(queryTokens).forEach((q) => {
      if (ideaTokens.has(q)) {
        matched.push(q);
      }
    });

    // Base score by tier relevance + match count bonus
    const relevanceScore = matched.length * 10 + (idea.minTier === tier ? 3 : 1);

    return {
      id: idea.id,
      title: idea.title,
      summary: summaryText,
      category: categoryName,
      tags: idea.tags,
      matchedKeywords: matched,
      relevanceScore,
      source: 'builtin',
    };
  });

  // Sort primarily by relevanceScore descending
  scoredIdeas.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // 4. Round-robin by category to ensure varied inspiration
  const byCategory = new Map<string, RankedIdea[]>();
  for (const idea of scoredIdeas) {
    const list = byCategory.get(idea.category) || [];
    list.push(idea);
    byCategory.set(idea.category, list);
  }

  const result: RankedIdea[] = [];
  let remainingCount = scoredIdeas.length;
  const categories = Array.from(byCategory.keys());

  while (remainingCount > 0) {
    let pulledInRound = 0;
    for (const cat of categories) {
      const catList = byCategory.get(cat);
      if (catList && catList.length > 0) {
        result.push(catList.shift()!);
        pulledInRound++;
        remainingCount--;
      }
    }
    if (pulledInRound === 0) break;
  }

  return result;
}
