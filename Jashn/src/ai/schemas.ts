/**
 * Zod schemas for structured AI outputs and plan mutation function calling.
 */

import { z } from 'zod';
import { ExpenseCategory } from '@/domain/types';

export const ExpenseCategorySchema = z.enum([
  'venue',
  'catering',
  'decor',
  'photography',
  'attire',
  'entertainment',
  'invitations',
  'gifts',
  'miscellaneous',
]);

export const ProposedBudgetChangeSchema = z.object({
  type: z.enum(['cut_percentage', 'rebalance', 'adjust_category']),
  cutPercentage: z.number().min(1).max(90).optional(),
  targetBudget: z.number().min(0).optional(),
  category: ExpenseCategorySchema.optional(),
  categoryAmount: z.number().min(0).optional(),
  lockedCategories: z.array(ExpenseCategorySchema).default([]),
});

export type ProposedBudgetChange = z.infer<typeof ProposedBudgetChangeSchema>;

export const AssistantStructuredOutputSchema = z.object({
  reply: z.string().min(1),
  intent: z.enum([
    'general_advice',
    'budget_cut',
    'budget_rebalance',
    'timeline_advice',
    'vendor_advice',
    'idea_suggestion',
  ]),
  proposedBudgetChange: ProposedBudgetChangeSchema.optional(),
});

export type AssistantStructuredOutput = z.infer<typeof AssistantStructuredOutputSchema>;

export interface AssistantResponse {
  reply: string;
  intent: AssistantStructuredOutput['intent'];
  proposedBudgetChange?: ProposedBudgetChange;
  source: 'gemini' | 'built-in';
  modelUsed: string;
  timestamp: string;
}

export const AssistantRequestSchema = z.object({
  message: z.string().min(1).max(600),
  lockedCategories: z.array(ExpenseCategorySchema).optional(),
});
