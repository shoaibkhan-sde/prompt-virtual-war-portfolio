import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRateLimiter } from '@/lib/rateLimit';

const MAX_BODY_BYTES = 50 * 1024; // 50 KB limit

const IcsExportSchema = z.object({
  title: z.string().default('Jashn Celebration Plan'),
  milestones: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      dueDate: z.string(),
      description: z.string().optional(),
    })
  ),
});

function formatIcsDate(dateStr: string): string {
  // Convert YYYY-MM-DD into YYYYMMDD
  return dateStr.replace(/-/g, '');
}

export async function POST(req: NextRequest) {
  // Body size enforcement
  const contentLength = Number(req.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'Payload Too Large: Maximum allowed request size is 50KB.' },
      { status: 413 }
    );
  }

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
    const body = await req.json();
    const validated = IcsExportSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { title, milestones } = validated.data;
    const nowStamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, 15) + 'Z';

    const events = milestones
      .map((m) => {
        const dt = formatIcsDate(m.dueDate);
        const desc = (m.description || '').replace(/\n/g, '\\n');
        return [
          'BEGIN:VEVENT',
          `UID:${m.id}-${dt}@jashn.planner`,
          `DTSTAMP:${nowStamp}`,
          `DTSTART;VALUE=DATE:${dt}`,
          `DTEND;VALUE=DATE:${dt}`,
          `SUMMARY:[Jashn] ${m.title}`,
          `DESCRIPTION:${desc}`,
          'STATUS:CONFIRMED',
          'END:VEVENT',
        ].join('\r\n');
      })
      .join('\r\n');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Jashn//Celebration Planner//EN',
      `X-WR-CALNAME:${title}`,
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      events,
      'END:VCALENDAR',
    ].join('\r\n');

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename="jashn-celebration-plan.ics"',
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate calendar file' }, { status: 500 });
  }
}
