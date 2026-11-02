/**
 * AI Service Orchestrator: Security, Caching, Gemini SDK with Failover & Deterministic Fallback.
 */

import { GoogleGenAI } from '@google/genai';
import { CelebrationPlan, ExpenseCategory } from '@/domain/types';
import { simulateBudgetCut } from '@/domain/scenarios';
import { ModelFailoverManager } from './config';
import { sanitizeAndValidatePrompt, wrapPromptWithDelimiters } from './security';
import { AssistantResponse, AssistantStructuredOutputSchema } from './schemas';
import { globalAssistantCache, ResponseCache } from './cache';
import { runDeterministicFallback } from './fallback';
import { isSamplePlan, isExplicitSamplePlanQuery, isGreetingQuery } from '@/domain/plan-utils';

export interface AIServiceDependencies {
  failoverManager?: ModelFailoverManager;
  cache?: ResponseCache;
  apiKey?: string;
}

export class CelebrationAIService {
  private failover: ModelFailoverManager;
  private cache: ResponseCache;
  private apiKey?: string;

  constructor(deps: AIServiceDependencies = {}) {
    this.failover = deps.failoverManager ?? new ModelFailoverManager();
    this.cache = deps.cache ?? globalAssistantCache;
    this.apiKey = deps.apiKey ?? process.env.GEMINI_API_KEY;
  }

  public async askPlanner(
    rawPrompt: string,
    plan: CelebrationPlan,
    lockedCategories: ExpenseCategory[] = []
  ): Promise<AssistantResponse> {
    // Step 1: Security guardrails
    const securityCheck = sanitizeAndValidatePrompt(rawPrompt);
    if (!securityCheck.isSafe) {
      return {
        reply: `⚠️ ${securityCheck.rejectionReason}`,
        intent: 'general_advice',
        source: 'built-in',
        modelUsed: 'security-guardrails',
        timestamp: new Date().toISOString(),
      };
    }

    const query = securityCheck.sanitizedQuery;
    const isSample = isSamplePlan(plan);
    const explicitSample = isExplicitSamplePlanQuery(query);
    const isGreeting = isGreetingQuery(query);

    // Step 2: Cache lookup
    const cacheKey = this.cache.generateKey(query, plan.id, plan.totalBudget);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Step 3: Check for API Key; if absent, execute deterministic fallback
    const key = this.apiKey || process.env.GEMINI_API_KEY;
    if (!key) {
      const fallbackResult = runDeterministicFallback(query, plan, lockedCategories);
      this.cache.set(cacheKey, fallbackResult);
      return fallbackResult;
    }

    // Step 4: Ordered model failover
    const availableModels = this.failover.getAvailableModels();
    const systemPrompt = `You are Jashn, an expert, warm, and creative AI Celebration & Event Planner for weddings, birthdays, and festivals.
Help the user with any question they have, from friendly greetings (hi, hello) to etiquette, themes, catering, entertainment, budgets, timeline advice, or general conversation. Always be friendly and helpful.
CRITICAL USER PRIVACY & CONTEXT RULES:
- NEVER introduce, mention, or assume demonstration/sample plans (such as "Priya & Arjun's Wedding", "Aarav's Birthday", "Prompt Wars", etc.) unless the user explicitly asks about sample or demo plans.
- If the user sends a greeting (e.g. "hi", "hello", "hey") or asks general questions, respond warmly and conversationally as Jashn Celebration & Event Planner without unprompted references to sample plans.
- ONLY reference specific celebration details if the user has created their own plan (marked as User's Created Plan) or explicitly asked about the sample plan.
CRITICAL MATHEMATICAL RULE: Never calculate raw budget totals yourself.
If proposing budget cuts or rebalances, only output proposed parameters (type, cutPercentage, lockedCategories). All math is handled by pure domain functions.
Always return valid JSON strictly matching the schema:
{
  "reply": "friendly, structured celebration advice or conversational response in markdown",
  "intent": "general_advice" | "budget_cut" | "budget_rebalance" | "timeline_advice" | "vendor_advice" | "idea_suggestion",
  "proposedBudgetChange": { "type": "cut_percentage", "cutPercentage": 10, "lockedCategories": ["photography"] } // optional
}`;

    let eventContext = '';
    if (!isSample) {
      eventContext = `User's Created Celebration Plan: "${plan.title}" (${plan.eventType})\n` +
        `Date: ${plan.date}, Total Budget: ₹${plan.totalBudget}, Guests: ${plan.guests.length}\n`;
    } else if (explicitSample) {
      eventContext = `Demonstration Sample Plan (Requested by User): "${plan.title}" (${plan.eventType})\n` +
        `Date: ${plan.date}, Total Budget: ₹${plan.totalBudget}, Guests: ${plan.guests.length}\n`;
    } else {
      eventContext = `User Plan State: Browsing / General Mode (No user-created plan loaded).\n` +
        `CRITICAL PRIVACY RULE: Do NOT mention or refer to sample plans like "${plan.title}" or names like Priya, Arjun, or Aarav unless the user explicitly asks about them. Answer the user's query as a friendly, knowledgeable celebration planner.\n`;
    }

    for (const model of availableModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const wrappedInput = wrapPromptWithDelimiters(
          `${eventContext}Query: ${query}`
        );

        const response = await ai.models.generateContent({
          model,
          contents: wrappedInput,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
          },
        });

        const rawResponse = response as { text?: string | (() => string) };
        const text =
          typeof rawResponse.text === 'function'
            ? rawResponse.text()
            : rawResponse.text ?? '';
        const parsedJson = JSON.parse(text);
        const validated = AssistantStructuredOutputSchema.safeParse(parsedJson);

        if (validated.success) {
          let proposedChange = validated.data.proposedBudgetChange;
          if (
            proposedChange &&
            proposedChange.type === 'cut_percentage' &&
            proposedChange.cutPercentage &&
            !proposedChange.targetBudget
          ) {
            const simulation = simulateBudgetCut(
              plan.items,
              proposedChange.cutPercentage,
              proposedChange.lockedCategories
            );
            proposedChange = {
              ...proposedChange,
              targetBudget: simulation.newTotalBudget,
            };
          }

          const successResult: AssistantResponse = {
            reply: validated.data.reply,
            intent: validated.data.intent,
            proposedBudgetChange: proposedChange,
            source: 'gemini',
            modelUsed: model,
            timestamp: new Date().toISOString(),
          };

          this.cache.set(cacheKey, successResult);
          return successResult;
        }
      } catch {
        // Mark model in cooldown and attempt next model in chain
        this.failover.markCooldown(model);
      }
    }

    // Step 5: If all models fail or were in cooldown, fallback gracefully
    const fallbackResult = runDeterministicFallback(query, plan, lockedCategories);
    this.cache.set(cacheKey, fallbackResult);
    return fallbackResult;
  }
}

export const defaultAIService = new CelebrationAIService();
