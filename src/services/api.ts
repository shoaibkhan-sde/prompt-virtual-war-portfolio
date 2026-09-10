import { ActivityLog, UserProfile } from "../lib/emissionFactors";
import { AtmosCoachResponse } from "../lib/localInsights";

/**
 * Standardizes fetch response handling.
 * Parses JSON errors from the Express backend into thrown JS Errors.
 *
 * @param response - The raw Fetch API Response object.
 * @returns A promise resolving to the parsed generic type T.
 * @throws Error with the backend's error message if the response is not ok.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred during the network request.";
    try {
      const errorJson = await response.json();
      errorMessage = errorJson.error?.message || errorJson.error || errorMessage;
    } catch {
      // JSON parse failed, fallback to status code message
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }
  return response.json() as Promise<T>;
}

/**
 * Client-side API service proxy for communicating with the Atmos Express backend.
 * Provides typed methods for all REST endpoints.
 */
export const api = {
  // --- Profile ---

  /**
   * Fetches the user's onboarding profile.
   * @returns The user profile or null if not yet onboarded.
   */
  async getProfile(): Promise<UserProfile | null> {
    const response = await fetch("/api/profile");
    return handleResponse<UserProfile | null>(response);
  },

  /**
   * Saves or updates the user's onboarding profile.
   * @param profile - The profile data to save.
   * @returns The saved profile with a success message.
   */
  async saveProfile(profile: UserProfile): Promise<{ message: string; profile: UserProfile }> {
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return handleResponse<{ message: string; profile: UserProfile }>(response);
  },

  // --- Goals ---

  /**
   * Fetches the user's reduction targets.
   * @returns An object containing the target percentage and absolute annual kg limit.
   */
  async getGoals(): Promise<{ targetPercent: number; targetAnnualKg: number }> {
    const response = await fetch("/api/goals");
    return handleResponse<{ targetPercent: number; targetAnnualKg: number }>(response);
  },

  /**
   * Saves new reduction targets.
   * @param goals - The new targets to save.
   * @returns The saved goals with a success message.
   */
  async saveGoals(goals: { targetPercent: number; targetAnnualKg?: number }): Promise<{ message: string; goals: { targetPercent: number; targetAnnualKg: number } }> {
    const response = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goals),
    });
    return handleResponse<{ message: string; goals: { targetPercent: number; targetAnnualKg: number } }>(response);
  },

  // --- Activities ---

  /**
   * Fetches all logged carbon activities for the user.
   * @returns An array of activity logs sorted newest first.
   */
  async getActivities(): Promise<ActivityLog[]> {
    const response = await fetch("/api/activities");
    return handleResponse<ActivityLog[]>(response);
  },

  /**
   * Logs a new carbon activity transaction.
   * @param activity - The activity data excluding the auto-generated ID and calculated emissions.
   * @returns The newly created activity log with calculated emissions.
   */
  async addActivity(activity: Omit<ActivityLog, "id" | "emissions">): Promise<{ message: string; activity: ActivityLog }> {
    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    });
    return handleResponse<{ message: string; activity: ActivityLog }>(response);
  },

  /**
   * Updates an existing activity transaction.
   * @param id - The ID of the activity to update.
   * @param activity - The new activity data.
   * @returns The updated activity log.
   */
  async updateActivity(id: string, activity: Omit<ActivityLog, "id" | "emissions">): Promise<{ message: string; activity: ActivityLog }> {
    const response = await fetch(`/api/activities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(activity),
    });
    return handleResponse<{ message: string; activity: ActivityLog }>(response);
  },

  /**
   * Deletes a carbon activity transaction.
   * @param id - The ID of the activity to delete.
   * @returns A success message.
   */
  async deleteActivity(id: string): Promise<{ message: string }> {
    const response = await fetch(`/api/activities/${id}`, {
      method: "DELETE",
    });
    return handleResponse<{ message: string }>(response);
  },

  // --- Atmos Coach AI ---

  /**
   * Fetches personalized AI coaching insights and reduction plans.
   * Responses are cached server-side based on the current state hash.
   * @returns The structured AI coach response.
   */
  async getInsights(): Promise<AtmosCoachResponse> {
    const response = await fetch("/api/insights");
    return handleResponse<AtmosCoachResponse>(response);
  },

  /**
   * Sends a conversational message to the Atmos Coach.
   * @param message - The user's chat message.
   * @returns The AI's reply and a flag indicating if the local fallback was used.
   */
  async sendChatMessage(message: string): Promise<{ reply: string; usingFallback: boolean }> {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return handleResponse<{ reply: string; usingFallback: boolean }>(response);
  },
};
