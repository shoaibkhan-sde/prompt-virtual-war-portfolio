import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { defaultAIService } from '@/ai/service';
import { apiRateLimiter } from '@/lib/rateLimit';
import { ExpenseCategorySchema } from '@/ai/schemas';
import { CelebrationPlan } from '@/domain/types';

const MAX_BODY_BYTES = 50 * 1024; // 50 KB limit

const BudgetItemSchema = z.object({
  id: z.string(),
  category: ExpenseCategorySchema,
  name: z.string(),
  allocatedAmount: z.number().min(0),
  spentAmount: z.number().min(0),
  notes: z.string().optional(),
});

const TimelineMilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  dueDate: z.string(),
  category: z.union([ExpenseCategorySchema, z.enum(['general', 'ceremony', 'logistics'])]),
  status: z.enum(['pending', 'in_progress', 'completed', 'overdue']),
  urgencyLabel: z.string().optional(),
  description: z.string().optional(),
  estimatedDaysBeforeEvent: z.number(),
});

const VendorItemSchema = z.object({
  id: z.string(),
  category: ExpenseCategorySchema,
  role: z.string(),
  name: z.string().optional(),
  status: z.enum(['not_started', 'contacted', 'tasting_set', 'quote_received', 'booked']),
  deadlineDate: z.string(),
  allocatedBudget: z.number().min(0),
  contactInfo: z.string().optional(),
  notes: z.string().optional(),
});

const GuestItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(['confirmed', 'pending', 'declined']),
  group: z.string().optional(),
  plusOnes: z.number().min(0),
  dietaryRestrictions: z.string().optional(),
});

const CelebrationPlanSchema = z.object({
  id: z.string(),
  eventType: z.enum(['wedding', 'birthday', 'community', 'festival']),
  title: z.string(),
  date: z.string(),
  location: z.string(),
  totalBudget: z.number().min(0),
  reservePercentage: z.number().min(0).max(100),
  items: z.array(BudgetItemSchema),
  timeline: z.array(TimelineMilestoneSchema),
  vendors: z.array(VendorItemSchema),
  guests: z.array(GuestItemSchema),
  savedIdeaIds: z.array(z.string()),
  isSample: z.boolean().optional(),
  isUserCreated: z.boolean().optional(),
});

const RequestBodySchema = z.object({
  message: z.string().min(1).max(600),
  plan: CelebrationPlanSchema,
  lockedCategories: z.array(ExpenseCategorySchema).optional(),
});

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
    const rawJson = await req.json();
    const validated = RequestBodySchema.safeParse(rawJson);

    if (!validated.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { message, plan, lockedCategories } = validated.data;
    const response = await defaultAIService.askPlanner(message, plan as CelebrationPlan, lockedCategories);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'X-RateLimit-Limit': String(rateLimit.limit),
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
