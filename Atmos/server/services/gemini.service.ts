/**
 * @module GeminiService
 * @description AI integration service that proxies carbon coaching requests to Google Gemini.
 *
 * Provides two AI-powered capabilities for the Atmos REDUCE pillar:
 * 1. **Dashboard Insights** (`generateInsights`): Structured JSON coaching response
 *    identifying the user's biggest carbon emission driver and a ranked action plan.
 * 2. **Conversational Chat** (`sendChatMessage`): Free-form carbon advisory grounded
 *    in the user's current emission ledger and offsetTarget.
 *
 * Both methods implement graceful degradation: if no API key is configured or the
 * Gemini call fails, they fall back to the local rule-based engine in `localInsights.ts`.
 *
 * @see {@link AtmosAIIntent} for the supported AI intent taxonomy.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { generateLocalCoachData, generateLocalChatResponse } from "../../src/lib/localInsights.js";
import { dbService } from "./db.service.js";
import { AtmosCoachResponse, UserProfile, ActivityLog } from "../types/index.js";

/**
 * Supported AI intent categories for Atmos carbon coaching queries.
 *
 * These labels classify user interactions routed through the Gemini service,
 * enabling structured prompt engineering and analytics tracking. All Gemini
 * prompt templates must be mapped to one of these intent values.
 */
export type AtmosAIIntent =
  | "CALCULATE_CARBON_FOOTPRINT"
  | "GET_REDUCTION_RECOMMENDATIONS"
  | "ANALYZE_EMISSION_TRENDS"
  | "COMPARE_OFFSET_STRATEGIES"
  | "EXPLAIN_EMISSION_SOURCE"
  | "GENERATE_SUSTAINABILITY_REPORT";

/**
 * AI integration service providing carbon coaching capabilities via Google Gemini.
 *
 * Instantiated as a singleton (`geminiService`). The constructor detects API key
 * availability and initialises the Gemini client accordingly. All public methods
 * are safe to call regardless of whether Gemini is active — they fall back to the
 * local rule-based engine transparently.
 */
class GeminiService {
  /** Initialised Gemini client, or `null` if no valid API key is configured. */
  private genAI: GoogleGenerativeAI | null = null;

  /**
   * Initialises the Gemini client if a valid API key is present in the environment.
   * Logs the initialisation status at startup for operational visibility.
   */
  constructor() {
    const key = env.GEMINI_API_KEY;
    if (key && key !== "your_gemini_api_key_here") {
      this.genAI = new GoogleGenerativeAI(key);
      logger.info({ event: "gemini_initialized", message: "Atmos Coach: Gemini API initialised successfully." });
    } else {
      logger.warn({
        event: "gemini_unavailable",
        message: "Atmos Coach: GEMINI_API_KEY not configured. Falling back to local rule-based insights engine.",
      });
    }
  }

  /**
   * Returns whether the Gemini client was successfully initialised.
   *
   * @returns {boolean} `true` if a valid API key was provided; `false` if using local fallback.
   */
  public isGeminiActive(): boolean {
    return this.genAI !== null;
  }

  /**
   * Generates a comprehensive personalised carbon coaching dashboard response.
   *
   * Builds a prompt from the user's current carbon ledger and offsetTarget, then calls
   * Gemini to produce a structured JSON response containing:
   * - A plain-language insight identifying the primary emission driver with real-world
   *   equivalencies (e.g., driving distance, tree absorption).
   * - Goal coaching feedback comparing the user's ledger trajectory to their offsetTarget.
   * - A ranked action plan of 3–5 carbon reduction tasks with co2eKg savings estimates.
   *
   * Intent: {@link AtmosAIIntent} `GET_REDUCTION_RECOMMENDATIONS` /
   * `ANALYZE_EMISSION_TRENDS`.
   *
   * @param {UserProfile | null} profile - The user's onboarding carbon profile.
   * @param {ActivityLog[]} activities - The user's full carbon emission ledger.
   * @param {number} targetPercent - The user's offsetTarget as a reduction percentage.
   * @returns {Promise<AtmosCoachResponse & { meta?: { source: string } }>}
   *   Structured coach response; `meta.source` is `'local'` when the fallback engine is used.
   */
  public async generateInsights(
    profile: UserProfile | null,
    activities: ActivityLog[],
    targetPercent: number
  ): Promise<AtmosCoachResponse & { meta?: { source: string } }> {
    if (!this.genAI) {
      const fallback = generateLocalCoachData(activities, profile, targetPercent);
      return { ...fallback, meta: { source: "local" } };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const contextStr = `
User Profile:
- Location: ${profile?.country || "Unknown"}
- Household Size: ${profile?.householdSize || "Unknown"}
- Primary Transport: ${profile?.primaryTransport || "Unknown"} (logs average ${profile?.weeklyTransportKm || 0} km/week)
- Diet: ${profile?.dietType || "average"}
- Heating Fuel: ${profile?.heatingType || "none"}

Recent Activity Ledger (past 30 days):
${JSON.stringify(activities.slice(0, 30))}

Goals: Target is a ${targetPercent}% reduction in emissions.
      `;

      const promptText = `
You are Atmos Coach, an expert carbon accountant. Based on the user carbon ledger details:
${contextStr}

Produce a response in JSON format. The JSON must contain exactly three keys:
1. "insight": A 2-4 sentence summary of their single biggest carbon driver and why it matters in plain, encouraging language. Draw real-world equivalencies (e.g. driving distance or tree absorption).
2. "goalCoaching": A 2-sentence feedback evaluate their progress towards their ${targetPercent}% reduction goal based on actual daily log averages.
3. "actionPlan": A list of exactly 3 to 5 recommended actionable tasks. Each task must be an object with keys:
   - "id": a unique string (e.g., "action_commute")
   - "title": short task name
   - "description": 1-sentence action details
   - "co2SavedKg": estimated weekly carbon savings (number in kg)
   - "category": one of: "Transport", "Energy", "Food", "Shopping", "Waste"
   - "difficulty": one of: "Easy", "Medium", "Hard"

Output ONLY the raw valid JSON, no markdown syntax wrapper (like \`\`\`json).
      `;

      const result = await model.generateContent(promptText);
      const text = result.response.text().trim();

      const cleanJsonText = text.replace(/^```json/, "").replace(/```$/, "").trim();
      const parsedData = JSON.parse(cleanJsonText) as {
        insight?: string;
        actionPlan?: AtmosCoachResponse["actionPlan"];
        goalCoaching?: string;
      };

      return {
        insight: parsedData.insight || "Keep logging to build insights.",
        actionPlan: parsedData.actionPlan || [],
        goalCoaching: parsedData.goalCoaching || "Keep tracking to compare goals.",
        usingFallback: false,
      };
    } catch (error) {
      logger.error({
        event: "gemini_insights_failed",
        message: "Gemini API insights call failed. Falling back to local engine.",
        error: error instanceof Error ? error.message : String(error),
      });
      const fallback = generateLocalCoachData(activities, profile, targetPercent);
      return { ...fallback, meta: { source: "local" } };
    }
  }

  /**
   * Generates a natural language carbon advisory response to a conversational user query.
   *
   * Contextualises the Gemini prompt with the user's current carbon emission totals and
   * offsetTarget to produce grounded, data-specific guidance under 120 words.
   *
   * Intent: {@link AtmosAIIntent} `CALCULATE_CARBON_FOOTPRINT` /
   * `EXPLAIN_EMISSION_SOURCE` / `COMPARE_OFFSET_STRATEGIES`.
   *
   * @param {string} message - The raw user question or chat message.
   * @param {UserProfile | null} profile - The user's onboarding carbon profile.
   * @param {ActivityLog[]} activities - The user's full carbon emission ledger.
   * @returns {Promise<{ reply: string; usingFallback: boolean }>}
   *   The advisory reply string and a flag indicating whether the local fallback was used.
   */
  public async sendChatMessage(
    message: string,
    profile: UserProfile | null,
    activities: ActivityLog[]
  ): Promise<{ reply: string; usingFallback: boolean }> {
    if (!this.genAI) {
      const reply = generateLocalChatResponse(message, activities);
      return { reply, usingFallback: true };
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const totalCarbonDebt = activities.reduce((sum, a) => sum + a.emissions, 0);
      const context = `
You are Atmos Coach, a conversational carbon accountant. Speak in helpful, expert, encouraging terms.
The user is asking: "${message}"

User Profile Context:
- Country: ${profile?.country || "Unknown"}
- Diet: ${profile?.dietType || "average"}
- Primary Transit: ${profile?.primaryTransport || "car_petrol"}
- Goal: ${dbService.getGoals()?.targetPercent || 15}% reduction

Activities summary:
Total logged transactions: ${activities.length}
Total carbon debt: ${totalCarbonDebt.toFixed(1)} kg CO2e.

Formulate an answer under 120 words. Ground your numbers in the user's data context where applicable.
Treat this output as markdown but do not use dangerously nested HTML.
      `;

      const result = await model.generateContent(context);
      return { reply: result.response.text().trim(), usingFallback: false };
    } catch (error) {
      logger.error({
        event: "gemini_chat_failed",
        message: "Gemini chat API call failed. Using local fallback.",
        error: error instanceof Error ? error.message : String(error),
      });
      const reply = generateLocalChatResponse(message, activities);
      return { reply, usingFallback: true };
    }
  }
}

export const geminiService = new GeminiService();
