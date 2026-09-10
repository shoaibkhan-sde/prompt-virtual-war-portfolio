import { describe, it, expect } from "vitest";
import { calculateEmissions, calculateOnboardingFootprint, UserProfile } from "../lib/emissionFactors";

describe("Emission Calculations - Edge Cases", () => {
  describe("calculateEmissions edge cases", () => {
    it("should return 0 for zero value in any category", () => {
      expect(calculateEmissions("Transport", "car_petrol", 0)).toBe(0);
      expect(calculateEmissions("Energy", "electricity", 0)).toBe(0);
      expect(calculateEmissions("Food", "vegan", 0)).toBe(0);
      expect(calculateEmissions("Shopping", "clothing", 0)).toBe(0);
      expect(calculateEmissions("Waste", "landfill", 0)).toBe(0);
    });

    it("should return 0 for negative values", () => {
      expect(calculateEmissions("Transport", "car_petrol", -100)).toBe(0);
      expect(calculateEmissions("Energy", "electricity", -50)).toBe(0);
      expect(calculateEmissions("Food", "meat_heavy", -1)).toBe(0);
    });

    it("should handle unknown transport type gracefully (0 factor)", () => {
      expect(calculateEmissions("Transport", "unknown_vehicle", 100)).toBe(0);
    });

    it("should handle unknown energy type gracefully", () => {
      expect(calculateEmissions("Energy", "solar_panel", 100)).toBe(0);
    });

    it("should handle unknown food type with average fallback", () => {
      // Unknown diet type should fall back to "average" diet (2500/365 ≈ 6.85/day)
      const result = calculateEmissions("Food", "unknown_diet", 1);
      expect(result).toBeCloseTo(6.85, 1);
    });

    it("should handle unknown waste type gracefully", () => {
      expect(calculateEmissions("Waste", "incineration", 10)).toBe(0);
    });

    it("should handle unknown shopping type gracefully", () => {
      expect(calculateEmissions("Shopping", "unknown_item", 5)).toBe(0);
    });

    it("should handle very large values without overflow", () => {
      const result = calculateEmissions("Transport", "car_petrol", 1000000);
      expect(result).toBe(180000);
      expect(isFinite(result)).toBe(true);
    });

    it("should handle fractional values", () => {
      const result = calculateEmissions("Transport", "car_petrol", 0.5);
      expect(result).toBeCloseTo(0.09, 2);
    });

    it("should use GLOBAL_AVG for unknown country code in electricity", () => {
      // GLOBAL_AVG = 0.475 * 100 = 47.5
      const result = calculateEmissions("Energy", "electricity", 100, "XX");
      expect(result).toBeCloseTo(47.5, 1);
    });

    it("should correctly calculate all transport types exhaustively", () => {
      const types = [
        { type: "car_petrol", factor: 0.18 },
        { type: "car_diesel", factor: 0.17 },
        { type: "car_hybrid", factor: 0.10 },
        { type: "car_electric", factor: 0.05 },
        { type: "public_bus", factor: 0.08 },
        { type: "public_train", factor: 0.03 },
        { type: "flight_short", factor: 0.25 },
        { type: "flight_medium", factor: 0.20 },
        { type: "flight_long", factor: 0.15 },
        { type: "cycling_walking", factor: 0.0 },
      ];

      types.forEach(({ type, factor }) => {
        expect(calculateEmissions("Transport", type, 100)).toBeCloseTo(factor * 100, 1);
      });
    });

    it("should correctly calculate all waste types exhaustively", () => {
      expect(calculateEmissions("Waste", "landfill", 10)).toBe(5.0);
      expect(calculateEmissions("Waste", "recycling", 10)).toBe(1.0);
      expect(calculateEmissions("Waste", "composting", 10)).toBe(0.5);
    });

    it("should correctly calculate shopping types exhaustively", () => {
      expect(calculateEmissions("Shopping", "clothing", 1)).toBe(15.0);
      expect(calculateEmissions("Shopping", "electronics", 1)).toBe(80.0);
      expect(calculateEmissions("Shopping", "general_goods", 1)).toBe(5.0);
    });
  });

  describe("calculateOnboardingFootprint edge cases", () => {
    it("should treat householdSize of 0 as 1", () => {
      const profile: UserProfile = {
        country: "US",
        householdSize: 0,
        primaryTransport: "car_petrol",
        weeklyTransportKm: 50,
        dietType: "average",
        electricityKwh: 200,
        heatingType: "natural_gas",
        heatingQty: 30,
        recycleCompost: true,
      };

      const result = calculateOnboardingFootprint(profile);
      expect(result.annualFootprintKg).toBeGreaterThan(0);
      expect(result.dailyBudgetKg).toBeGreaterThanOrEqual(6.3);
    });

    it("should use global average for unknown country code", () => {
      const profile: UserProfile = {
        country: "XX",
        householdSize: 1,
        primaryTransport: "car_petrol",
        weeklyTransportKm: 50,
        dietType: "average",
        electricityKwh: 200,
        heatingType: "natural_gas",
        heatingQty: 30,
        recycleCompost: false,
      };

      const result = calculateOnboardingFootprint(profile);
      expect(result.annualFootprintKg).toBeGreaterThan(0);
    });

    it("should handle zero-emission profile (active transport, vegan, no electricity)", () => {
      const profile: UserProfile = {
        country: "IS",
        householdSize: 1,
        primaryTransport: "active",
        weeklyTransportKm: 0,
        dietType: "vegan",
        electricityKwh: 0,
        heatingType: "none",
        heatingQty: 0,
        recycleCompost: true,
      };

      const result = calculateOnboardingFootprint(profile);
      // Should still have food + waste footprint
      expect(result.annualFootprintKg).toBeGreaterThan(0);
      expect(result.dailyBudgetKg).toBeGreaterThanOrEqual(6.3);
    });

    it("should cap daily budget at maximum 25 kg/day", () => {
      const profile: UserProfile = {
        country: "ZA", // Very high grid intensity
        householdSize: 1,
        primaryTransport: "car_petrol",
        weeklyTransportKm: 500,
        dietType: "meat_heavy",
        electricityKwh: 2000,
        heatingType: "heating_oil",
        heatingQty: 500,
        recycleCompost: false,
      };

      const result = calculateOnboardingFootprint(profile);
      expect(result.dailyBudgetKg).toBeLessThanOrEqual(25.0);
    });

    it("should enforce minimum daily budget of 6.3 kg/day (Paris target)", () => {
      const profile: UserProfile = {
        country: "IS",
        householdSize: 4,
        primaryTransport: "active",
        weeklyTransportKm: 0,
        dietType: "vegan",
        electricityKwh: 0,
        heatingType: "none",
        heatingQty: 0,
        recycleCompost: true,
      };

      const result = calculateOnboardingFootprint(profile);
      expect(result.dailyBudgetKg).toBeGreaterThanOrEqual(6.3);
    });

    it("should handle electric heating using grid intensity", () => {
      const profile: UserProfile = {
        country: "US",
        householdSize: 1,
        primaryTransport: "active",
        weeklyTransportKm: 0,
        dietType: "vegan",
        electricityKwh: 100,
        heatingType: "electric",
        heatingQty: 100,
        recycleCompost: true,
      };

      const result = calculateOnboardingFootprint(profile);
      expect(result.annualFootprintKg).toBeGreaterThan(1500); // vegan base + electricity + electric heating
    });
  });
});
