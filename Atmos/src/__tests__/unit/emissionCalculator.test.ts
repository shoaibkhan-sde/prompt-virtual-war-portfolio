import { describe, it, expect } from "vitest";
import { calculateEmissions, calculateOnboardingFootprint, UserProfile } from "../../lib/emissionFactors";

describe("Atmos Carbon Calculator Math Engine", () => {
  describe("calculateEmissions", () => {
    it("should return 0 for zero or negative values", () => {
      expect(calculateEmissions("Transport", "car_petrol", 0)).toBe(0);
      expect(calculateEmissions("Transport", "car_petrol", -50)).toBe(0);
      expect(calculateEmissions("Energy", "electricity", 0)).toBe(0);
    });

    it("should calculate correct transport emissions", () => {
      // Petrol car emissions = 0.18 kg CO2e / km * 100 km = 18 kg
      expect(calculateEmissions("Transport", "car_petrol", 100)).toBe(18.0);
      
      // Public train emissions = 0.03 kg CO2e / km * 50 km = 1.5 kg
      expect(calculateEmissions("Transport", "public_train", 50)).toBe(1.5);

      // Long flight emissions = 0.15 kg CO2e / km * 1000 km = 150 kg
      expect(calculateEmissions("Transport", "flight_long", 1000)).toBe(150.0);

      // Walk emissions = 0 kg CO2e / km * 20 km = 0 kg
      expect(calculateEmissions("Transport", "cycling_walking", 20)).toBe(0);
    });

    it("should calculate correct energy emissions based on grid intensity", () => {
      // Electricity emissions in US grid = 0.38 kg/kWh * 200 kWh = 76 kg
      expect(calculateEmissions("Energy", "electricity", 200, "US")).toBe(76.0);
      
      // Electricity emissions in Coal India grid = 0.82 kg/kWh * 200 kWh = 164 kg
      expect(calculateEmissions("Energy", "electricity", 200, "IN")).toBe(164.0);
      
      // Heating oil emissions = 2.7 kg/L * 100 L = 270 kg
      expect(calculateEmissions("Energy", "heating_oil", 100)).toBe(270.0);
    });

    it("should calculate diet footprints correctly", () => {
      // Vegan diet = 1500 kg/year. Daily equivalent = 1500 / 365 * 1 day = ~4.11 kg
      expect(calculateEmissions("Food", "vegan", 1)).toBe(4.11);
      
      // Meat heavy diet = 3300 kg/year. Daily = 3300 / 365 = ~9.04 kg
      expect(calculateEmissions("Food", "meat_heavy", 1)).toBe(9.04);
    });

    it("should calculate waste footprints correctly", () => {
      // Landfill waste = 0.50 kg CO2e/kg * 20 kg = 10.0 kg
      expect(calculateEmissions("Waste", "landfill", 20)).toBe(10.0);
      
      // Composting = 0.05 kg CO2e/kg * 20 kg = 1.0 kg
      expect(calculateEmissions("Waste", "composting", 20)).toBe(1.0);
    });
  });

  describe("calculateOnboardingFootprint", () => {
    it("should compute sensible budget values for a typical user profile", () => {
      const profile: UserProfile = {
        country: "US",
        householdSize: 2,
        primaryTransport: "car_petrol",
        weeklyTransportKm: 100,
        dietType: "average",
        electricityKwh: 300,
        heatingType: "natural_gas",
        heatingQty: 50,
        recycleCompost: true,
      };

      const result = calculateOnboardingFootprint(profile);
      
      // Annual footprint should be a positive number
      expect(result.annualFootprintKg).toBeGreaterThan(1000);
      
      // Daily budget should be constrained between Paris alignment and maximum cap
      expect(result.dailyBudgetKg).toBeGreaterThanOrEqual(6.3);
      expect(result.dailyBudgetKg).toBeLessThanOrEqual(25.0);
    });
  });
});
