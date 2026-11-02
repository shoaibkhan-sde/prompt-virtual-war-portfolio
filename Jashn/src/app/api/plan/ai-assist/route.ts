import { NextRequest, NextResponse } from 'next/server';
import { planFromRequest } from '@/domain/event-planner/plan-builder';
import { PlanRequestRaw, RankedIdea } from '@/domain/event-planner/types';
import { sanitizeAndValidatePrompt } from '@/ai/security';
import { apiRateLimiter } from '@/lib/rateLimit';
import { GoogleGenAI } from '@google/genai';

interface AiAssistRequestBody {
  planRequest: Partial<PlanRequestRaw>;
  action: 'extra_ideas' | 'ask_question';
  question?: string;
}

const MAX_CACHE_ENTRIES = 200;
const cache = new Map<string, { answer: string; extraIdeas?: RankedIdea[]; source: 'ai' | 'builtin'; timestamp: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function setCachedItem(key: string, value: { answer: string; extraIdeas?: RankedIdea[]; source: 'ai' | 'builtin'; timestamp: number }) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey) cache.delete(oldestKey);
  }
  cache.set(key, value);
}

export async function POST(req: NextRequest) {
  // Rate limiting check
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  const rateLimit = apiRateLimiter.check(ip);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too Many Requests: Please slow down.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)),
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const rawText = await req.text();
    if (rawText.length > 50 * 1024) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = JSON.parse(rawText) as AiAssistRequestBody;
    const serverToday = new Date().toISOString().split('T')[0];

    // Rebuild plan deterministically from raw input - NEVER trust client plan state
    const outcome = planFromRequest(body.planRequest, serverToday);
    if (!outcome.success) {
      return NextResponse.json({ error: 'Invalid plan input', details: outcome.errors }, { status: 400 });
    }

    const plan = outcome.plan;
    const action = body.action || 'ask_question';
    const rawQuestion = body.question || (action === 'extra_ideas' ? 'Suggest 3 bespoke celebration concepts' : 'Summary of priorities');

    // Security sanitization: strip angle brackets and prompt injection
    const sanitizedQuestion = rawQuestion.replace(/[<>]/g, '').trim().slice(0, 500);
    const sec = sanitizeAndValidatePrompt(sanitizedQuestion);
    if (!sec.isSafe) {
      return NextResponse.json({
        source: 'builtin',
        answer: 'Your query was flagged by safety filters. Please rephrase in plain celebration planning terms.',
      });
    }

    const cacheKey = `${plan.input.eventType}_${plan.input.totalBudget}_${plan.input.budgetTier}_${action}_${sanitizedQuestion}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cached);
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Deterministic builtin fallback
      const fallback = buildBuiltinFallback(plan, action, sanitizedQuestion);
      return NextResponse.json(fallback);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const promptContext = `
Celebration Plan Summary:
- Type: ${plan.input.eventType}
- Name: ${plan.input.eventName}
- Date: ${plan.input.eventDate}
- Total Budget: ${plan.input.currency} ${plan.input.totalBudget} (${plan.input.budgetTier} tier)
- Contingency: ${plan.budget.contingencyPercent}% (₹${plan.budget.contingencyAmount})
- Guests: ${plan.input.guestCount}
- Venue Type: ${plan.input.venueType}
- Priorities: ${plan.input.priorities.join(', ') || 'None specified'}

User Request: "${sanitizedQuestion}"
Please answer in 2-3 concise paragraphs of actionable, polite advice. Focus on vendor sequencing, cost optimization, or guest delight. Keep under 180 words.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptContext,
      });

      const reply = response.text?.trim() || '';
      if (!reply) {
        throw new Error('Empty AI response');
      }

      const cleanReply = reply.replace(/[<>]/g, '').slice(0, 1500);
      const result = {
        source: 'ai' as const,
        answer: cleanReply,
        timestamp: Date.now(),
      };

      setCachedItem(cacheKey, result);
      return NextResponse.json(result);
    } catch {
      // Failover to builtin deterministic fallback
      const fallback = buildBuiltinFallback(plan, action, sanitizedQuestion);
      return NextResponse.json(fallback);
    }
  } catch {
    return NextResponse.json({ error: 'Server error processing AI assistant' }, { status: 500 });
  }
}

function buildBuiltinFallback(
  plan: import('@/domain/event-planner/types').GeneratedEventPlan,
  action: string,
  question: string
): { source: 'builtin'; answer: string; extraIdeas?: RankedIdea[] } {
  if (action === 'extra_ideas') {
    return {
      source: 'builtin',
      answer: `Here are curated ideas suited for your ${plan.input.budgetTier} tier celebration:`,
      extraIdeas: [
        {
          id: `extra-idea-1`,
          title: 'Curated Guest Welcome Hospitality Lounge',
          summary: `A tranquil check-in station with signature welcome drinks and personalized itineraries for ${plan.input.guestCount} attendees.`,
          category: 'Guest Hospitality',
          tags: ['welcome', 'drinks', 'hospitality'],
          matchedKeywords: ['hospitality'],
          relevanceScore: 15,
          source: 'builtin',
        },
        {
          id: `extra-idea-2`,
          title: 'Live Acoustic Twilight Serenade',
          summary: 'A mellow 45-minute live acoustic performance to set a magical transition from dusk to dinner.',
          category: 'Entertainment',
          tags: ['music', 'acoustic', 'evening'],
          matchedKeywords: ['music'],
          relevanceScore: 12,
          source: 'builtin',
        },
      ],
    };
  }

  return {
    source: 'builtin',
    answer: `For "${plan.input.eventName}" (Budget: ₹${plan.input.totalBudget.toLocaleString('en-IN')}, ${plan.input.guestCount} guests), your contingency buffer is protected at ₹${plan.budget.contingencyAmount.toLocaleString('en-IN')}. All ${plan.timeline.totalTasks} milestone deadlines are sequenced. Recommended next step: finalize your essential vendor contracts before non-critical bookings.`,
  };
}
