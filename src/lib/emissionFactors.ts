/**
 * @module EmissionFactors
 * @description Canonical carbon emission intensity constants and calculation engine for Atmos.
 *
 * This is the **single source of truth** for all CO₂ equivalent (CO₂e) emission factors
 * and calculation logic used across the application — both client-side (React) and
 * server-side (Express). No emission factor values should be duplicated outside this module.
 *
 * All values are expressed in **kg CO₂e** (kilograms of CO₂ equivalent), which normalises
 * different greenhouse gases (CO₂, CH₄, N₂O) to a common carbon-equivalent unit using
 * 100-year Global Warming Potential (GWP100) multipliers from the IPCC.
 *
 * Emission Factor Sources:
 * - **GHGP**: Greenhouse Gas Protocol Corporate Standard
 * - **DEFRA 2023**: UK Department for Environment, Food & Rural Affairs
 * - **EPA 2023**: US Environmental Protection Agency GHG Emission Factors Hub
 * - **IPCC AR6**: Intergovernmental Panel on Climate Change Sixth Assessment Report
 */

/**
 * Grid electricity carbon intensities by country ISO code.
 * Units: kg CO2e per kilowatt-hour (kWh).
 *
 * Values reflect the national average grid mix including transmission losses.
 * Falls back to `GLOBAL_AVG` (0.475 kg/kWh) for unrecognized country codes.
 */
export const GRID_INTENSITIES: Record<string, number> = {
  // Coal-heavy grids
  "IN": 0.82, // India
  "ZA": 0.90, // South Africa
  "CN": 0.62, // China
  "PL": 0.70, // Poland
  // Average / mixed grids
  "US": 0.38, // United States
  "DE": 0.35, // Germany
  "GB": 0.22, // United Kingdom
  "JP": 0.45, // Japan
  "AU": 0.68, // Australia
  "EU_AVG": 0.25, // European Union Average
  // Clean / renewable-heavy grids
  "FR": 0.05, // France (nuclear)
  "NO": 0.01, // Norway (hydroelectric)
  "SE": 0.02, // Sweden (nuclear/hydro)
  "CA": 0.12, // Canada (hydroelectric heavy)
  "IS": 0.00, // Iceland (geothermal/hydro)
  // Default fallback
  "GLOBAL_AVG": 0.475,
};

/**
 * Transport emission factors by vehicle/mode type.
 * Units: kg CO2e per kilometre (km).
 *
 * Passenger-km values for public transit; per-vehicle-km for private transport.
 */
export const TRANSPORT_FACTORS: Record<string, number> = {
  "car_petrol": 0.18,      // Average petrol car (EPA)
  "car_diesel": 0.17,      // Average diesel car (DEFRA)
  "car_hybrid": 0.10,      // Hybrid car (e.g., Prius)
  "car_electric": 0.05,    // EV average (grid-lifecycle, ~50g/km)
  "public_bus": 0.08,      // Average bus ride per passenger-km
  "public_train": 0.03,    // Average rail ride per passenger-km
  "flight_short": 0.25,    // Flight < 1500 km (high takeoff penalty per km)
  "flight_medium": 0.20,   // Flight 1500 - 3700 km
  "flight_long": 0.15,     // Flight > 3700 km
  "cycling_walking": 0.0,  // Zero tailpipe emissions
};

/**
 * Annual diet footprints by dietary pattern.
 * Units: kg CO2e per year.
 *
 * Includes full food-system lifecycle (production, transport, retail, waste).
 * To compute a per-day figure, divide by 365.
 */
export const DIET_FACTORS: Record<string, number> = {
  "meat_heavy": 3300,  // Daily: ~9.0 kg CO2e
  "average": 2500,     // Daily: ~6.8 kg CO2e
  "vegetarian": 1700,  // Daily: ~4.6 kg CO2e
  "vegan": 1500,       // Daily: ~4.1 kg CO2e
};

/**
 * Consumer goods emission factors by product type.
 * Units: kg CO2e per unit (item or kg depending on category).
 *
 * Captures manufacturing, distribution, and lifecycle emissions.
 */
export const CONSUMPTION_FACTORS: Record<string, number> = {
  "clothing": 15.0,     // Average garment manufacturing & distribution lifecycle
  "electronics": 80.0,  // Smartphone/laptop average production lifecycle
  "general_goods": 5.0, // General retail goods per kg
};

/**
 * Waste disposal emission factors by disposal method.
 * Units: kg CO2e per kilogram of waste.
 *
 * Landfill values include methane generation (CH4 is 28× more potent than CO2).
 */
export const WASTE_FACTORS: Record<string, number> = {
  "landfill": 0.50,   // Mixed waste sent to landfill (methane emissions)
  "recycling": 0.10,  // Processing emissions for recycled materials
  "composting": 0.05, // Organic waste composting emissions
};

/**
 * Home heating fuel emission factors.
 * Units: kg CO2e per unit (m³ for natural gas, litres for heating oil).
 */
export const ENERGY_FACTORS: Record<string, number> = {
  "natural_gas": 1.90, // per cubic meter (m³)
  "heating_oil": 2.70, // per liter (L)
};

/** User profile captured during onboarding. */
export interface UserProfile {
  country: string;
  householdSize: number;
  /** Transport mode key: "car_petrol", "public", "electric", "active", etc. */
  primaryTransport: string;
  weeklyTransportKm: number;
  /** Diet type key: "meat_heavy", "average", "vegetarian", "vegan". */
  dietType: string;
  /** Monthly household electricity consumption in kWh. */
  electricityKwh: number;
  /** Heating fuel key: "natural_gas", "heating_oil", "electric", "none". */
  heatingType: string;
  /** Monthly household heating quantity (m³, L, or kWh if electric). */
  heatingQty: number;
  recycleCompost: boolean;
}

/** A single carbon activity transaction logged by the user. */
export interface ActivityLog {
  id: string;
  /** Date in YYYY-MM-DD format. */
  date: string;
  category: "Transport" | "Energy" | "Food" | "Shopping" | "Waste";
  /** Activity sub-type key matching the corresponding factor record. */
  type: string;
  /** Quantity (km, kWh, items, kg, days — depends on category). */
  value: number;
  /** Calculated emissions in kg CO2e. */
  emissions: number;
  note?: string;
}

/**
 * Calculates emissions for a single activity transaction.
 *
 * Applies the appropriate emission factor based on category and type,
 * using the user's country code for grid-dependent calculations.
 *
 * @param category - Activity category ("Transport", "Energy", "Food", "Shopping", "Waste").
 * @param type - Activity sub-type key (e.g. "car_petrol", "electricity", "vegan").
 * @param value - Quantity in the category's native unit.
 * @param countryCode - ISO country code for grid intensity lookup (default "US").
 * @returns Emissions in kg CO2e, rounded to 2 decimal places. Returns 0 for non-positive values.
 */
export function calculateEmissions(
  category: ActivityLog["category"],
  type: string,
  value: number,
  countryCode: string = "US"
): number {
  if (value <= 0) return 0;

  switch (category) {
    case "Transport": {
      const transportFactor = TRANSPORT_FACTORS[type] ?? 0;
      return Number((value * transportFactor).toFixed(2));
    }

    case "Energy": {
      if (type === "electricity") {
        const intensity = GRID_INTENSITIES[countryCode] ?? GRID_INTENSITIES["GLOBAL_AVG"];
        return Number((value * intensity).toFixed(2));
      } else {
        const energyFactor = ENERGY_FACTORS[type] ?? 0;
        return Number((value * energyFactor).toFixed(2));
      }
    }

    case "Food": {
      // Diet values are processed as number of days.
      // A daily rate is computed as annual rate / 365.
      const annualDietFootprint = DIET_FACTORS[type] ?? DIET_FACTORS["average"];
      const dailyDietFootprint = annualDietFootprint / 365;
      return Number((value * dailyDietFootprint).toFixed(2));
    }

    case "Shopping": {
      const shoppingFactor = CONSUMPTION_FACTORS[type] ?? 0;
      return Number((value * shoppingFactor).toFixed(2));
    }

    case "Waste": {
      const wasteFactor = WASTE_FACTORS[type] ?? 0;
      return Number((value * wasteFactor).toFixed(2));
    }

    default:
      return 0;
  }
}

/**
 * Estimates the starting annual carbon footprint and recommended daily budget
 * for a user based on their onboarding profile.
 *
 * Methodology:
 * 1. **Food** — annual diet footprint (individual).
 * 2. **Transport** — weekly km × 52 weeks × modal emission factor.
 * 3. **Electricity** — monthly kWh × 12 × grid intensity, split by household.
 * 4. **Heating** — monthly qty × 12 × fuel factor, split by household.
 * 5. **Waste** — 450 kg/yr base, adjusted for recycling/composting practices.
 *
 * The daily budget is set at 85% of the baseline daily rate (a 15% reduction),
 * bounded between the Paris-aligned target (6.3 kg/day ≈ 2.3 t/yr) and 25 kg/day.
 *
 * @param profile - User profile from onboarding.
 * @returns Object with `annualFootprintKg` (integer) and `dailyBudgetKg` (1 decimal).
 */
export function calculateOnboardingFootprint(profile: UserProfile): {
  annualFootprintKg: number;
  dailyBudgetKg: number;
} {
  const householdSize = Math.max(1, profile.householdSize);

  // 1. Food footprint (individual)
  const annualFoodFootprint = DIET_FACTORS[profile.dietType] ?? DIET_FACTORS["average"];

  // 2. Transport footprint (individual based on weekly km)
  let transportFactor: number;
  if (profile.primaryTransport === "public") {
    transportFactor = TRANSPORT_FACTORS["public_bus"]; // Use bus as average transit
  } else if (profile.primaryTransport === "electric") {
    transportFactor = TRANSPORT_FACTORS["car_electric"];
  } else if (profile.primaryTransport === "active") {
    transportFactor = TRANSPORT_FACTORS["cycling_walking"];
  } else {
    // default to car petrol
    transportFactor = TRANSPORT_FACTORS["car_petrol"];
  }
  const annualTransportFootprint = profile.weeklyTransportKm * 52 * transportFactor;

  // 3. Home Electricity footprint (split by household size)
  const gridIntensity = GRID_INTENSITIES[profile.country] ?? GRID_INTENSITIES["GLOBAL_AVG"];
  const annualElectricityFootprint = (profile.electricityKwh * 12 * gridIntensity) / householdSize;

  // 4. Home Heating footprint (split by household size)
  let annualHeatingFootprint = 0;
  if (profile.heatingType === "electric") {
    // Heating uses electricity, using grid intensity
    annualHeatingFootprint = (profile.heatingQty * 12 * gridIntensity) / householdSize;
  } else if (profile.heatingType !== "none") {
    const heatingFactor = ENERGY_FACTORS[profile.heatingType] ?? 0;
    annualHeatingFootprint = (profile.heatingQty * 12 * heatingFactor) / householdSize;
  }

  // 5. Waste footprint (estimated average modified by recycling)
  // Average waste per person is about 450kg/year. If they recycle/compost, we assume 70% is diverted.
  const baseWasteKg = 450;
  let annualWasteFootprint = baseWasteKg * WASTE_FACTORS["landfill"]; // 225 kg CO2e
  if (profile.recycleCompost) {
    // 70% recycled (0.10 factor), 30% landfill (0.50 factor)
    annualWasteFootprint = (baseWasteKg * 0.70 * WASTE_FACTORS["recycling"]) +
                           (baseWasteKg * 0.30 * WASTE_FACTORS["landfill"]); // 31.5 + 67.5 = 99 kg CO2e
  }

  // Total annual footprint in kg
  const annualFootprintKg = Math.round(
    annualFoodFootprint +
    annualTransportFootprint +
    annualElectricityFootprint +
    annualHeatingFootprint +
    annualWasteFootprint
  );

  // Daily budget calculation:
  // Set a target that cuts 15% from baseline, bounded between 6.3 and 25 kg/day.
  // The Paris Target is ~6.3 kg/day (2.3 tons/year).
  const baselineDaily = annualFootprintKg / 365;
  let dailyBudgetKg = Number((baselineDaily * 0.85).toFixed(1));
  if (dailyBudgetKg < 6.3) dailyBudgetKg = 6.3;
  if (dailyBudgetKg > 25.0) dailyBudgetKg = 25.0;

  return {
    annualFootprintKg,
    dailyBudgetKg
  };
}
