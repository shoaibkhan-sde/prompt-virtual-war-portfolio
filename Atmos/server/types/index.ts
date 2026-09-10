/**
 * @module Types
 * @description Type definitions and interfaces for the Atmos carbon ledger system.
 */

/**
 * Type alias for an emission source category.
 */
export type emissionSource = "Transport" | "Energy" | "Food" | "Shopping" | "Waste";

/**
 * User carbon profile detailing starting parameters from the onboarding survey.
 */
export interface UserProfile {
  /** The user's primary residential country (e.g. "US", "IN"). */
  country: string;
  /** Household size used to partition shared carbon metrics. */
  householdSize: number;
  /** Primary mode of daily transportation. */
  primaryTransport: string;
  /** Weekly distance covered via transit in kilometers. */
  weeklyTransportKm: number;
  /** Dietary lifestyle classification. */
  dietType: string;
  /** Monthly electric power consumption in kilowatt-hours (kWh). */
  electricityKwh: number;
  /** Primary home heating fuel type. */
  heatingType: string;
  /** Monthly fuel quantity consumed for space heating. */
  heatingQty: number;
  /** True if the user active recycles and composts waste. */
  recycleCompost: boolean;
}

/**
 * Individual activity log entry detailing carbon debit.
 */
export interface ActivityLog {
  /** Unique transaction identifier. */
  id: string;
  /** ISO date string (YYYY-MM-DD) when the activity occurred. */
  date: string;
  /** The primary carbon emission source category. */
  category: emissionSource;
  /** Specific activity sub-type matching the category. */
  type: string;
  /** Quantitative value in the activity's base unit. */
  value: number;
  /** The calculated carbon debit amount in CO2 equivalent kilograms (co2eKg). */
  emissions: number;
  /** Optional transaction note. */
  note?: string;
}

/**
 * Interface alias representing the complete sorted chronological carbon ledger.
 */
export type carbonLedger = Array<ActivityLog>;

/**
 * Suggested carbon reduction action item recommended by the Coach.
 */
export interface ActionPlanItem {
  /** Unique action task identifier. */
  id: string;
  /** Concise action headline. */
  title: string;
  /** Encouraging details explaining how to complete the action. */
  description: string;
  /** Estimated carbon savings in CO2 equivalent kilograms (co2eKg) per week. */
  co2SavedKg: number;
  /** The carbon category targeted by this action. */
  category: string;
  /** Action task difficulty level. */
  difficulty: "Easy" | "Medium" | "Hard";
}

/**
 * Structured response payload returned by the Atmos AI Coach service.
 */
export interface AtmosCoachResponse {
  /** plain-language analysis identifying the primary carbon driver. */
  insight: string;
  /** List of 3-5 recommended carbon reduction actions. */
  actionPlan: ActionPlanItem[];
  /** Structured goal tracking feedback text. */
  goalCoaching: string;
  /** True if the local advisory engine was used as fallback. */
  usingFallback: boolean;
}

/**
 * In-memory schema matching the structure of the JSON database.
 */
export interface DBState {
  /** The validated profile data from onboarding. */
  profile: UserProfile | null;
  /** The full chronological carbon ledger. */
  activities: ActivityLog[];
  /** User target reduction goals. */
  goals: {
    /** Target reduction percentage (0-100). */
    targetPercent: number;
    /** Target annual limit in CO2 equivalent kilograms (co2eKg/yr). */
    targetAnnualKg: number;
  };
  /** Achieved badge IDs during the session. */
  achievements: string[];
}
