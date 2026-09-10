import React, { useState } from "react";
import { UserProfile, calculateOnboardingFootprint } from "../lib/emissionFactors";
import { Leaf, ArrowRight, ArrowLeft } from "lucide-react";

interface OnboardingProps {
  onComplete: (profile: UserProfile, dailyBudget: number, annualFootprint: number) => void;
  initialProfile?: UserProfile;
  onCancel?: () => void;
}

const DEFAULT_PROFILE: UserProfile = {
  country: "US",
  householdSize: 2,
  primaryTransport: "car_petrol",
  weeklyTransportKm: 120,
  dietType: "average",
  electricityKwh: 250,
  heatingType: "natural_gas",
  heatingQty: 40,
  recycleCompost: true,
};

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, initialProfile, onCancel }) => {
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState<UserProfile>(initialProfile || { ...DEFAULT_PROFILE });

  const updateField = (field: keyof UserProfile, value: string | number | boolean) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePrev = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { annualFootprintKg, dailyBudgetKg } = calculateOnboardingFootprint(profile);
    onComplete(profile, dailyBudgetKg, annualFootprintKg);
  };

  const handleSkipClick = () => {
    const { annualFootprintKg, dailyBudgetKg } = calculateOnboardingFootprint(DEFAULT_PROFILE);
    onComplete(DEFAULT_PROFILE, dailyBudgetKg, annualFootprintKg);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-teal/5 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-amber/5 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl ledger-card z-10">
        <header className="flex justify-between items-center mb-8 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-r from-accent-teal to-cyan-500 flex items-center justify-center text-background">
              <Leaf size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-tabular">ATMOS</span>
          </div>
          <div className="text-sm font-mono text-muted">
            Step {step} of 3
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Region & Transportation</h2>
              <p className="text-sm text-muted">We use your region's electricity grid mix to compute home footprints.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="country" className="block text-sm font-semibold text-[#e2edea]">
                    Region Grid Mix
                  </label>
                  <select
                    id="country"
                    value={profile.country}
                    onChange={(e) => updateField("country", e.target.value)}
                    className="ledger-input"
                  >
                    <option value="US">United States (0.38 kg/kWh)</option>
                    <option value="GB">United Kingdom (0.22 kg/kWh)</option>
                    <option value="EU_AVG">European Union Avg (0.25 kg/kWh)</option>
                    <option value="IN">India (0.82 kg/kWh - Coal Heavy)</option>
                    <option value="CN">China (0.62 kg/kWh)</option>
                    <option value="FR">France (0.05 kg/kWh - Nuclear)</option>
                    <option value="NO">Norway (0.01 kg/kWh - Hydro)</option>
                    <option value="GLOBAL_AVG">Global Average (0.48 kg/kWh)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="householdSize" className="block text-sm font-semibold text-[#e2edea]">
                    Household Size
                  </label>
                  <input
                    id="householdSize"
                    type="number"
                    min="1"
                    max="20"
                    value={profile.householdSize}
                    onChange={(e) => updateField("householdSize", parseInt(e.target.value) || 1)}
                    className="ledger-input font-tabular"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="primaryTransport" className="block text-sm font-semibold text-[#e2edea]">
                  Primary Mode of Transit
                </label>
                <select
                  id="primaryTransport"
                  value={profile.primaryTransport}
                  onChange={(e) => updateField("primaryTransport", e.target.value)}
                  className="ledger-input"
                >
                  <option value="car_petrol">Petrol Vehicle (0.18 kg CO2e/km)</option>
                  <option value="car_diesel">Diesel Vehicle (0.17 kg CO2e/km)</option>
                  <option value="electric">Electric Vehicle (0.05 kg CO2e/km)</option>
                  <option value="public">Public Transit - Bus/Train (0.06 kg CO2e/km)</option>
                  <option value="active">Active Transit - Walking/Cycling (0.0 kg/km)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="weeklyTransportKm" className="block text-sm font-semibold text-[#e2edea]">
                  Weekly Commute Distance (km)
                </label>
                <input
                  id="weeklyTransportKm"
                  type="number"
                  min="0"
                  value={profile.weeklyTransportKm}
                  onChange={(e) => updateField("weeklyTransportKm", parseFloat(e.target.value) || 0)}
                  className="ledger-input font-tabular"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Home Energy & Diet</h2>
              <p className="text-sm text-muted">Electricity and heating are shared carbon costs divided by household size.</p>

              <div className="space-y-2">
                <label htmlFor="electricityKwh" className="block text-sm font-semibold text-[#e2edea]">
                  Monthly Household Electricity (kWh)
                </label>
                <input
                  id="electricityKwh"
                  type="number"
                  min="0"
                  value={profile.electricityKwh}
                  onChange={(e) => updateField("electricityKwh", parseFloat(e.target.value) || 0)}
                  className="ledger-input font-tabular"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="heatingType" className="block text-sm font-semibold text-[#e2edea]">
                    Heating Fuel Source
                  </label>
                  <select
                    id="heatingType"
                    value={profile.heatingType}
                    onChange={(e) => updateField("heatingType", e.target.value)}
                    className="ledger-input"
                  >
                    <option value="natural_gas">Natural Gas (m3)</option>
                    <option value="heating_oil">Heating Oil (Liters)</option>
                    <option value="electric">Electric Heat (kWh)</option>
                    <option value="none">No Heating / Heat Pump</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="heatingQty" className="block text-sm font-semibold text-[#e2edea]">
                    Monthly Heating Quantity
                  </label>
                  <input
                    id="heatingQty"
                    type="number"
                    min="0"
                    disabled={profile.heatingType === "none"}
                    value={profile.heatingQty}
                    onChange={(e) => updateField("heatingQty", parseFloat(e.target.value) || 0)}
                    className="ledger-input font-tabular disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="dietType" className="block text-sm font-semibold text-[#e2edea]">
                  Diet Type (Approximate)
                </label>
                <select
                  id="dietType"
                  value={profile.dietType}
                  onChange={(e) => updateField("dietType", e.target.value)}
                  className="ledger-input"
                >
                  <option value="meat_heavy">Meat Heavy (Daily beef/pork - ~3.3t CO2e/yr)</option>
                  <option value="average">Balanced Average (Chicken/fish/mixed - ~2.5t CO2e/yr)</option>
                  <option value="vegetarian">Vegetarian (Dairy, no meat - ~1.7t CO2e/yr)</option>
                  <option value="vegan">Vegan (Zero animal products - ~1.5t CO2e/yr)</option>
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white">Carbon reduction goals</h2>
              <p className="text-sm text-muted">Set up your ledger targets and daily carbon limits.</p>

              <div className="flex items-center space-x-3 bg-surface p-4 border border-border rounded-lg">
                <input
                  id="recycleCompost"
                  type="checkbox"
                  checked={profile.recycleCompost}
                  onChange={(e) => updateField("recycleCompost", e.target.checked)}
                  className="h-5 w-5 rounded border-border text-accent-teal bg-background focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer"
                />
                <label htmlFor="recycleCompost" className="text-sm font-medium text-white cursor-pointer select-none">
                  Our household regularly recycles and composts waste.
                </label>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-sm font-semibold text-[#e2edea]">
                  Daily Carbon Budget Target
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[10, 15, 25].map((percent) => (
                    <button
                      key={percent}
                      type="button"
                      onClick={() => updateField("weeklyTransportKm", profile.weeklyTransportKm)} // Mock selection action
                      className={`border p-4 rounded-lg text-center transition-all ${
                        percent === 15
                          ? "border-accent-teal bg-accent-teal/5 text-accent-teal"
                          : "border-border bg-background hover:bg-border/30 text-white"
                      }`}
                    >
                      <span className="block text-lg font-bold font-tabular">-{percent}%</span>
                      <span className="text-xs text-muted">Paris Trajectory</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-accent-teal/5 border border-accent-teal/20 rounded-lg flex gap-3 text-sm text-[#e2edea] leading-relaxed">
                <Leaf className="text-accent-teal shrink-0 mt-0.5" size={16} />
                <span>
                  By completing onboarding, Atmos sets a recommended carbon budget. Your activities debits this budget. Completing actions credits the budget.
                </span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-6 border-t border-border mt-8">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="ledger-btn-secondary"
              >
                <ArrowLeft size={16} />
                Back
              </button>
            ) : onCancel ? (
              <button
                type="button"
                onClick={onCancel}
                className="ledger-btn-secondary"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSkipClick}
                className="text-muted hover:text-white text-sm font-semibold transition-colors"
              >
                Skip Onboarding
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="ledger-btn-primary"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                type="submit"
                className="ledger-btn-primary"
              >
                {onCancel ? "Save Changes" : "Access Ledger"}
                <Leaf size={16} />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
