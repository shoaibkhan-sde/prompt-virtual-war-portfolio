import { NextRequest, NextResponse } from 'next/server';
import { planFromRequest } from '@/domain/event-planner/plan-builder';
import { PlanRequestRaw } from '@/domain/event-planner/types';
import { apiRateLimiter } from '@/lib/rateLimit';

const MAX_PAYLOAD_BYTES = 50 * 1024; // 50KB safety limit

export async function POST(req: NextRequest) {
  try {
    // 0. Rate limiting check
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const rateLimit = apiRateLimiter.check(ip);
    if (!rateLimit.success) {
      return NextResponse.json(
        {
          success: false,
          errors: [{ field: 'request', message: 'Too Many Requests: Please slow down.' }],
        },
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

    // 1. Content-Type check
    const contentType = req.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        {
          success: false,
          errors: [{ field: 'request', message: 'Invalid Content-Type. Please send application/json.' }],
        },
        { status: 415 }
      );
    }

    // 2. Body size check
    const rawText = await req.text();
    if (rawText.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        {
          success: false,
          errors: [{ field: 'request', message: 'Request payload exceeds maximum allowed size of 50KB.' }],
        },
        { status: 413 }
      );
    }

    let body: Partial<PlanRequestRaw>;
    try {
      body = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          errors: [{ field: 'request', message: 'Malformed JSON payload.' }],
        },
        { status: 400 }
      );
    }

    // 3. Evaluate server UTC date
    const serverTodayUtc = new Date().toISOString().split('T')[0];

    // 4. Validate and build plan with pure deterministic engine
    const outcome = planFromRequest(body, serverTodayUtc);

    if (!outcome.success) {
      return NextResponse.json(
        {
          success: false,
          errors: outcome.errors,
        },
        { status: 400 }
      );
    }

    // Purely deterministic return - zero server persistence
    return NextResponse.json({
      success: true,
      plan: outcome.plan,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        errors: [{ field: 'server', message: 'An unexpected error occurred while generating the celebration plan.' }],
      },
      { status: 500 }
    );
  }
}
