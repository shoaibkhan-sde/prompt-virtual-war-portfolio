import { describe, it, expect } from "vitest";
import { generateLocalCoachData, generateLocalChatResponse } from "../lib/localInsights";
import { UserProfile, ActivityLog } from "../lib/emissionFactors";

const mockProfile: UserProfile = {
  country: "US",
  householdSize: 2,
  primaryTransport: "active",
  weeklyTransportKm: 0,
  dietType: "vegan",
  electricityKwh: 0,
  heatingType: "none",
  heatingQty: 0,
  recycleCompost: true,
};

describe("localInsights.ts Module Tests", () => {
  describe("generateLocalCoachData", () => {
    it("should handle empty ledger correctly", () => {
      const result = generateLocalCoachData([], mockProfile, 15);
      expect(result.insight).toContain("Welcome to Atmos");
      expect(result.usingFallback).toBe(true);
    });

    it("should identify Transport as dominant driver", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Transport", type: "car_petrol", value: 100, emissions: 18.0 }
      ];
      const result = generateLocalCoachData(activities, mockProfile);
      expect(result.insight).toContain("Transportation");
    });

    it("should identify Energy as dominant driver", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Energy", type: "electricity", value: 100, emissions: 38.0 }
      ];
      const result = generateLocalCoachData(activities, mockProfile);
      expect(result.insight).toContain("Home Energy");
    });

    it("should identify Food as dominant driver", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Food", type: "meat_heavy", value: 1, emissions: 9.04 }
      ];
      const result = generateLocalCoachData(activities, mockProfile);
      expect(result.insight).toContain("Diet and Food");
    });

    it("should identify Shopping as dominant driver", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Shopping", type: "electronics", value: 1, emissions: 80.0 }
      ];
      const result = generateLocalCoachData(activities, mockProfile);
      expect(result.insight).toContain("Consumer purchases");
    });

    it("should identify Waste as dominant driver", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Waste", type: "landfill", value: 100, emissions: 50.0 }
      ];
      const result = generateLocalCoachData(activities, mockProfile);
      expect(result.insight).toContain("Waste decomposition");
    });

    it("should trigger transport action plan rules", () => {
      const profile: UserProfile = { ...mockProfile, primaryTransport: "car_petrol" };
      const result = generateLocalCoachData([], profile);
      const actionIds = result.actionPlan.map(a => a.id);
      expect(actionIds).toContain("action_transit");
    });

    it("should trigger diet action plan rules", () => {
      const profile: UserProfile = { ...mockProfile, dietType: "meat_heavy" };
      const result = generateLocalCoachData([], profile);
      const actionIds = result.actionPlan.map(a => a.id);
      expect(actionIds).toContain("action_diet");
    });

    it("should trigger energy action plan rules", () => {
      const profile: UserProfile = { ...mockProfile, electricityKwh: 300 };
      const result = generateLocalCoachData([], profile);
      const actionIds = result.actionPlan.map(a => a.id);
      expect(actionIds).toContain("action_energy");
      expect(actionIds).toContain("action_thermostat");
    });

    it("should use fallback action rules when none are triggered", () => {
      const result = generateLocalCoachData([], mockProfile);
      const actionIds = result.actionPlan.map(a => a.id);
      expect(actionIds).toContain("action_shopping");
      expect(actionIds).toContain("action_air_dry");
      expect(actionIds.length).toBe(2);

      // Triggering exactly 1 rule (e.g. dietType average) will cause fallback to push 2 more, resulting in 3 items.
      const profileWithOneRule: UserProfile = { ...mockProfile, dietType: "average" };
      const resultWithOne = generateLocalCoachData([], profileWithOneRule);
      const actionIdsWithOne = resultWithOne.actionPlan.map(a => a.id);
      expect(actionIdsWithOne).toContain("action_diet");
      expect(actionIdsWithOne).toContain("action_shopping");
      expect(actionIdsWithOne).toContain("action_air_dry");
      expect(actionIdsWithOne.length).toBeGreaterThanOrEqual(3);
    });

    it("should sort actions by co2SavedKg descending and limit to at most 5", () => {
      // Setup a profile that triggers transit, diet, energy (which adds 2 actions), plus fallback logic
      const profile: UserProfile = {
        ...mockProfile,
        primaryTransport: "car_petrol",
        dietType: "meat_heavy",
        electricityKwh: 300
      };
      const result = generateLocalCoachData([], profile);
      expect(result.actionPlan.length).toBeLessThanOrEqual(5);

      // Verify sorting
      for (let i = 0; i < result.actionPlan.length - 1; i++) {
        expect(result.actionPlan[i].co2SavedKg).toBeGreaterThanOrEqual(result.actionPlan[i+1].co2SavedKg);
      }
    });

    it("should show goal coaching as on track", () => {
      const profile: UserProfile = {
        ...mockProfile,
        electricityKwh: 100, // setup calculating footprint so dailyBudget is configured
      };
      // budget calculates to around 12 if electricityKwh is positive
      // log a very low emissions activity (daily average will be low)
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Energy", type: "electricity", value: 1, emissions: 0.38 }
      ];
      const result = generateLocalCoachData(activities, profile, 15);
      expect(result.goalCoaching).toContain("Excellent work");
    });

    it("should show goal coaching as over budget", () => {
      const profile: UserProfile = {
        ...mockProfile,
        electricityKwh: 100,
      };
      // log a very high emissions activity
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Shopping", type: "electronics", value: 10, emissions: 800.0 }
      ];
      const result = generateLocalCoachData(activities, profile, 15);
      expect(result.goalCoaching).toContain("above your target");
    });
  });

  describe("generateLocalChatResponse", () => {
    it("should handle vegetarian queries", () => {
      const res = generateLocalChatResponse("I want to know about vegetarian diet savings", []);
      expect(res).toContain("vegetarian diet");
    });

    it("should handle car/transit queries", () => {
      const res = generateLocalChatResponse("Should I drive a car or take public transit?", []);
      expect(res).toContain("public transit");
    });

    it("should handle why high queries with empty ledger", () => {
      const res = generateLocalChatResponse("why is my footprint so high?", []);
      expect(res).toContain("ledger is currently empty");
    });

    it("should handle why high queries with non-empty ledger", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Shopping", type: "electronics", value: 1, emissions: 80.0 }
      ];
      const res = generateLocalChatResponse("why is my footprint high?", activities);
      expect(res).toContain("Shopping");
    });

    it("should handle action/tips queries", () => {
      const res = generateLocalChatResponse("Can you give me a tip to reduce emissions?", []);
      expect(res).toContain("Transportation");
      expect(res).toContain("Home Energy");
      expect(res).toContain("Food");
    });

    it("should handle budget queries", () => {
      const activities: ActivityLog[] = [
        { id: "1", date: "2026-06-12", category: "Energy", type: "electricity", value: 10, emissions: 3.8 }
      ];
      const res = generateLocalChatResponse("what is my budget limit?", activities);
      expect(res).toContain("ledger");
      expect(res).toContain("daily average");
    });

    it("should return default questions for unrecognized queries", () => {
      const res = generateLocalChatResponse("hello how are you", []);
      expect(res).toContain("Atmos Coach here");
      expect(res).toContain("How can I reduce my commute emissions?");
    });
  });
});
