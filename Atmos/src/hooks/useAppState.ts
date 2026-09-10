/**
 * @module useAppState
 * @description Central application state orchestrator for the Atmos Personal Carbon Ledger.
 *
 * Manages all top-level data, UI state, and async CRUD handlers for the Atmos application.
 * Implements a dual-persistence strategy:
 * - **Primary**: Syncs all carbon ledger data to/from the Express backend API.
 * - **Fallback**: Falls back to `localStorage` when the server is unreachable (offline mode).
 *
 * State managed:
 * - `profile` — The user's onboarding carbon profile used to calculate co2eKg budgets.
 * - `activities` — The full carbon emission ledger (ActivityLog[]) sorted newest-first.
 * - `goals` — The user's reduction offsetTarget (`targetPercent`, `targetAnnualKg`).
 * - `dailyBudget` — The computed daily carbon budget in kg CO₂e.
 * - `adoptedActions` — AI-recommended carbon reduction actions adopted by the user.
 * - `streakCount` — Computed consecutive logging streak from the carbon ledger.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { UserProfile, ActivityLog, calculateOnboardingFootprint } from "../lib/emissionFactors";
import { ActionPlanItem } from "../lib/localInsights";
import { api } from "../services/api";
import { clientLogger } from "../utils/logger";

/** Tab identifiers for the main application navigation. */
export type AppTab = "dashboard" | "activities" | "coach" | "goals" | "actions" | "reports";

/** Return type of the useAppState hook containing all app-level state and handlers. */
export interface AppState {
  // Data states
  profile: UserProfile | null;
  activities: ActivityLog[];
  goals: { targetPercent: number; targetAnnualKg: number };
  dailyBudget: number;
  adoptedActions: ActionPlanItem[];
  streakCount: number;

  // UI states
  loading: boolean;
  offlineMode: boolean;
  activeTab: AppTab;
  mobileMenuOpen: boolean;
  showResetConfirm: boolean;
  isEditingProfile: boolean;

  // Setters
  setActiveTab: (tab: AppTab) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setShowResetConfirm: (show: boolean) => void;
  setIsEditingProfile: (editing: boolean) => void;

  // Handlers
  handleOnboardingComplete: (newProfile: UserProfile, startingBudget: number, annualFootprint: number) => Promise<void>;
  handleAddActivity: (act: Omit<ActivityLog, "id" | "emissions">) => Promise<void>;
  handleUpdateActivity: (id: string, act: Omit<ActivityLog, "id" | "emissions">) => Promise<void>;
  handleDeleteActivity: (id: string) => Promise<void>;
  handleUpdateGoals: (newGoals: { targetPercent: number; targetAnnualKg: number }) => Promise<void>;
  handleAdoptAction: (action: ActionPlanItem) => void;
  handleRemoveAdopted: (id: string) => void;
  handleCompleteActionLog: (id: string, co2Saved: number) => void;
  handleResetProfile: () => void;
}

/**
 * Central app state hook for the Atmos carbon ledger platform.
 *
 * Loads the user's carbon ledger, profile, and offsetTarget from the Express API
 * on mount with localStorage fallback for offline resilience. Exposes typed handlers
 * for all carbon ledger mutations (add, update, delete emission entries, update goals).
 *
 * @returns {AppState} All application state values and mutation handlers.
 */
export function useAppState(): AppState {
  // Global Data States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [goals, setGoals] = useState<{ targetPercent: number; targetAnnualKg: number }>({ targetPercent: 15, targetAnnualKg: 0 });
  const [dailyBudget, setDailyBudget] = useState<number>(12);
  const [adoptedActions, setAdoptedActions] = useState<ActionPlanItem[]>([]);

  // App Infrastructure States
  const [loading, setLoading] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // 1. Initial State Load (Sync API -> LocalStorage Fallback)
  useEffect(() => {
    const initApp = async (): Promise<void> => {
      try {
        const [apiProfile, apiActivities, apiGoals] = await Promise.all([
          api.getProfile(),
          api.getActivities(),
          api.getGoals(),
        ]);

        if (apiProfile) {
          setProfile(apiProfile);
          const { dailyBudgetKg } = calculateOnboardingFootprint(apiProfile);
          setDailyBudget(apiGoals?.targetAnnualKg ? Number((apiGoals.targetAnnualKg / 365).toFixed(1)) : dailyBudgetKg);
          localStorage.setItem("atmos_profile", JSON.stringify(apiProfile));
        } else {
          const localProf = localStorage.getItem("atmos_profile");
          if (localProf) {
            const parsed = JSON.parse(localProf) as UserProfile;
            setProfile(parsed);
            const { dailyBudgetKg } = calculateOnboardingFootprint(parsed);
            setDailyBudget(dailyBudgetKg);
          }
        }

        setActivities(apiActivities || []);
        localStorage.setItem("atmos_activities", JSON.stringify(apiActivities || []));

        if (apiGoals) {
          setGoals(apiGoals);
          localStorage.setItem("atmos_goals", JSON.stringify(apiGoals));
        } else {
          const localGoals = localStorage.getItem("atmos_goals");
          if (localGoals) {
            setGoals(JSON.parse(localGoals) as { targetPercent: number; targetAnnualKg: number });
          }
        }

        setOfflineMode(false);
      } catch (err) {
        clientLogger.warn("server_offline", { message: "Express server offline. Falling back to localStorage persistence mode.", error: (err as Error).message });
        setOfflineMode(true);

        const localProf = localStorage.getItem("atmos_profile");
        const localActs = localStorage.getItem("atmos_activities");
        const localGoals = localStorage.getItem("atmos_goals");

        if (localProf) {
          const parsed = JSON.parse(localProf) as UserProfile;
          setProfile(parsed);
          const { dailyBudgetKg } = calculateOnboardingFootprint(parsed);
          setDailyBudget(dailyBudgetKg);
        }
        if (localActs) {
          setActivities(JSON.parse(localActs) as ActivityLog[]);
        }
        if (localGoals) {
          setGoals(JSON.parse(localGoals) as { targetPercent: number; targetAnnualKg: number });
        }
      } finally {
        const localAdopted = localStorage.getItem("atmos_adopted_actions");
        if (localAdopted) {
          setAdoptedActions(JSON.parse(localAdopted) as ActionPlanItem[]);
        }
        setLoading(false);
      }
    };

    initApp();
  }, []);

  // 2. Onboarding Complete Handler
  /**
   * Completes onboarding by persisting the user's carbon profile and seeding initial goals.
   *
   * Sets the carbon profile, computes the daily co2eKg budget, seeds a default
   * 15% offsetTarget, and syncs both to the Express backend and localStorage.
   *
   * @param {UserProfile} newProfile - The validated profile from the onboarding wizard.
   * @param {number} startingBudget - Daily carbon budget in kg CO₂e from `calculateOnboardingFootprint`.
   * @param {number} annualFootprint - Annual baseline footprint in kg CO₂e.
   * @returns {Promise<void>}
   */
  const handleOnboardingComplete = useCallback(async (newProfile: UserProfile, startingBudget: number, annualFootprint: number): Promise<void> => {
    setLoading(true);
    setProfile(newProfile);
    setDailyBudget(startingBudget);
    setGoals({ targetPercent: 15, targetAnnualKg: annualFootprint * 0.85 });

    localStorage.setItem("atmos_profile", JSON.stringify(newProfile));
    localStorage.setItem("atmos_goals", JSON.stringify({ targetPercent: 15, targetAnnualKg: annualFootprint * 0.85 }));

    if (!offlineMode) {
      try {
        await api.saveProfile(newProfile);
        await api.saveGoals({ targetPercent: 15, targetAnnualKg: annualFootprint * 0.85 });
      } catch (err) {
        clientLogger.error("onboarding_sync_failed", { error: (err as Error).message });
      }
    }
    setLoading(false);
  }, [offlineMode]);

  // 3. Add Activity Transaction
  /**
   * Logs a new carbon emission entry to the carbon ledger.
   *
   * In online mode, delegates co2eKg calculation to the server (which uses the canonical
   * emission factors). In offline mode, calculates co2eKg client-side and persists to
   * localStorage only. Maintains ledger sort order (newest-first) after every insert.
   *
   * @param {Omit<ActivityLog, 'id' | 'emissions'>} act - The emission entry fields (category, type, value, date, note).
   * @returns {Promise<void>}
   */
  const handleAddActivity = useCallback(async (act: Omit<ActivityLog, "id" | "emissions">): Promise<void> => {
    if (offlineMode) {
      const { calculateEmissions } = await import("../lib/emissionFactors");
      const clientEmissions = calculateEmissions(act.category, act.type, act.value, profile?.country || "US");

      const newAct: ActivityLog = {
        id: `act_${Date.now()}`,
        emissions: clientEmissions,
        ...act
      };
      const updated = [newAct, ...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(updated);
      localStorage.setItem("atmos_activities", JSON.stringify(updated));
    } else {
      const response = await api.addActivity(act);
      const updated = [response.activity, ...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(updated);
      localStorage.setItem("atmos_activities", JSON.stringify(updated));
    }
  }, [offlineMode, activities, profile]);

  // 4. Update Activity Transaction
  /**
   * Updates an existing carbon emission entry in the ledger by ID.
   *
   * Recalculates co2eKg using the updated activity fields. Syncs to the server in
   * online mode; patches localStorage only in offline mode. Maintains sort order.
   *
   * @param {string} id - The unique identifier of the emission entry to update.
   * @param {Omit<ActivityLog, 'id' | 'emissions'>} act - The updated emission entry fields.
   * @returns {Promise<void>}
   */
  const handleUpdateActivity = useCallback(async (id: string, act: Omit<ActivityLog, "id" | "emissions">): Promise<void> => {
    if (offlineMode) {
      const { calculateEmissions } = await import("../lib/emissionFactors");
      const clientEmissions = calculateEmissions(act.category, act.type, act.value, profile?.country || "US");

      const updated = activities.map((a) => {
        if (a.id === id) {
          return { ...a, ...act, emissions: clientEmissions };
        }
        return a;
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(updated);
      localStorage.setItem("atmos_activities", JSON.stringify(updated));
    } else {
      const response = await api.updateActivity(id, act);
      const updated = activities.map((a) => (a.id === id ? response.activity : a))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivities(updated);
      localStorage.setItem("atmos_activities", JSON.stringify(updated));
    }
  }, [offlineMode, activities, profile]);

  // 5. Delete Activity Transaction
  /**
   * Removes a carbon emission entry from the ledger by ID.
   *
   * Immediately updates the local state and localStorage. Sends the DELETE request
   * to the server asynchronously in online mode; logs errors without re-throwing.
   *
   * @param {string} id - The unique identifier of the emission entry to delete.
   * @returns {Promise<void>}
   */
  const handleDeleteActivity = useCallback(async (id: string): Promise<void> => {
    const updated = activities.filter((a) => a.id !== id);
    setActivities(updated);
    localStorage.setItem("atmos_activities", JSON.stringify(updated));

    if (!offlineMode) {
      try {
        await api.deleteActivity(id);
      } catch (err) {
        clientLogger.error("emission_delete_failed", { id, error: (err as Error).message });
      }
    }
  }, [offlineMode, activities]);

  // 6. Update Goals Configuration
  /**
   * Persists updated carbon reduction offsetTarget values.
   *
   * Updates `goals` and recalculates the `dailyBudget` from the new `targetAnnualKg`.
   * Syncs to the server asynchronously in online mode; logs errors without re-throwing.
   *
   * @param {{ targetPercent: number; targetAnnualKg: number }} newGoals - The new offsetTarget values.
   * @returns {Promise<void>}
   */
  const handleUpdateGoals = useCallback(async (newGoals: { targetPercent: number; targetAnnualKg: number }): Promise<void> => {
    setGoals(newGoals);
    const daily = Number((newGoals.targetAnnualKg / 365).toFixed(1));
    setDailyBudget(daily);

    localStorage.setItem("atmos_goals", JSON.stringify(newGoals));

    if (!offlineMode) {
      try {
        await api.saveGoals(newGoals);
      } catch (err) {
        clientLogger.error("goals_sync_failed", { error: (err as Error).message });
      }
    }
  }, [offlineMode]);

  // 7. Adopt action plan checklist item
  /**
   * Adopts a coach-recommended carbon reduction action into the user's active action list.
   *
   * Deduplicates by ID to prevent the same action being adopted twice. Persists the
   * updated list to localStorage and navigates to the Actions tab.
   *
   * @param {ActionPlanItem} action - The carbonReductionAction to adopt from the coach recommendations.
   * @returns {void}
   */
  const handleAdoptAction = useCallback((action: ActionPlanItem): void => {
    if (adoptedActions.some((a) => a.id === action.id)) return;
    const updated = [action, ...adoptedActions];
    setAdoptedActions(updated);
    localStorage.setItem("atmos_adopted_actions", JSON.stringify(updated));
    setActiveTab("actions");
  }, [adoptedActions]);

  /**
   * Removes a previously adopted carbon reduction action from the active list.
   *
   * @param {string} id - The unique identifier of the adopted action to remove.
   * @returns {void}
   */
  const handleRemoveAdopted = useCallback((id: string): void => {
    const updated = adoptedActions.filter((a) => a.id !== id);
    setAdoptedActions(updated);
    localStorage.setItem("atmos_adopted_actions", JSON.stringify(updated));
  }, [adoptedActions]);

  /**
   * Records that the user has completed or toggled a carbon reduction action.
   *
   * Logs the action completion event with the co2eKg saved for observability.
   * Can be extended to persist completion state to the server or award badges.
   *
   * @param {string} id - The unique identifier of the completed action.
   * @param {number} co2Saved - The co2eKg credited for completing this action (negative to undo).
   * @returns {void}
   */
  const handleCompleteActionLog = useCallback((id: string, co2Saved: number): void => {
    clientLogger.info("carbon_action_completed", { id, co2eKg: co2Saved });
  }, []);

  // 8. Log Out / Reset Ledger Profile
  /**
   * Resets the entire carbon ledger by clearing all localStorage keys and reloading.
   *
   * Wipes the profile, emission entries, offsetTarget, and adopted actions from
   * both React state and localStorage, then triggers a full page reload to return
   * the user to the onboarding wizard.
   *
   * @returns {void}
   */
  const handleResetProfile = useCallback((): void => {
    localStorage.clear();
    setProfile(null);
    setActivities([]);
    setAdoptedActions([]);
    setGoals({ targetPercent: 15, targetAnnualKg: 0 });
    setActiveTab("dashboard");
    window.location.reload();
  }, []);

  // 9. Consecutive logging streak calculation
  /**
   * Computes the number of consecutive days the user has logged at least one emission entry.
   *
   * Uses a sorted set of unique logged dates from the carbon ledger and checks for
   * day-by-day continuity backwards from today or yesterday. This is an O(n) computation
   * where n is the number of unique logged dates.
   *
   * @returns {number} The current consecutive logging streak count (0 if no recent logs).
   */
  const streakCount = useMemo((): number => {
    if (activities.length === 0) return 0;
    const loggedDates = Array.from(new Set(activities.map((a) => a.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (loggedDates[0] !== todayStr && loggedDates[0] !== yesterdayStr) return 0;

    let count = 1;
    const expected = new Date(loggedDates[0]);
    for (let i = 1; i < loggedDates.length; i++) {
      expected.setDate(expected.getDate() - 1);
      const expStr = expected.toISOString().split("T")[0];
      if (loggedDates[i] === expStr) count++;
      else break;
    }
    return count;
  }, [activities]);

  return {
    profile, activities, goals, dailyBudget, adoptedActions, streakCount,
    loading, offlineMode, activeTab, mobileMenuOpen, showResetConfirm, isEditingProfile,
    setActiveTab, setMobileMenuOpen, setShowResetConfirm, setIsEditingProfile,
    handleOnboardingComplete, handleAddActivity, handleUpdateActivity,
    handleDeleteActivity, handleUpdateGoals, handleAdoptAction,
    handleRemoveAdopted, handleCompleteActionLog, handleResetProfile,
  };
}
