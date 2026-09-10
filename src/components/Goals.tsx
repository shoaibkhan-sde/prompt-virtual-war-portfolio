import React, { useState, useMemo } from "react";
import { UserProfile, ActivityLog, calculateOnboardingFootprint } from "../lib/emissionFactors";
import { Target, TrendingDown, CheckCircle, AlertTriangle, Lightbulb } from "lucide-react";

interface GoalsProps {
  profile: UserProfile;
  activities: ActivityLog[];
  currentGoals: { targetPercent: number; targetAnnualKg: number };
  onUpdateGoals: (goals: { targetPercent: number; targetAnnualKg: number }) => Promise<void>;
}

export const Goals: React.FC<GoalsProps> = ({
  profile,
  activities,
  currentGoals,
  onUpdateGoals,
}) => {
  const [targetPercent, setTargetPercent] = useState(currentGoals.targetPercent);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // 1. Calculate onboarding baseline (in kg)
  const baselineAnnualKg = useMemo(() => {
    return calculateOnboardingFootprint(profile).annualFootprintKg;
  }, [profile]);

  // 2. Calculate actual projected emissions based on activities (daily average * 365)
  const currentProjectedAnnualKg = useMemo(() => {
    if (activities.length === 0) return baselineAnnualKg;
    const uniqueDays = Array.from(new Set(activities.map((a) => a.date))).length || 1;
    const totalEmissions = activities.reduce((sum, a) => sum + a.emissions, 0);
    return Math.round((totalEmissions / uniqueDays) * 365);
  }, [activities, baselineAnnualKg]);

  // 3. Goal threshold based on selected percentage
  const targetAnnualKg = useMemo(() => {
    return Math.round(baselineAnnualKg * (1 - targetPercent / 100));
  }, [baselineAnnualKg, targetPercent]);

  // 4. Calculate actual reduction percentage achieved
  const reductionAchievedPercent = useMemo(() => {
    if (baselineAnnualKg === 0) return 0;
    const diff = baselineAnnualKg - currentProjectedAnnualKg;
    return Number(((diff / baselineAnnualKg) * 100).toFixed(1));
  }, [baselineAnnualKg, currentProjectedAnnualKg]);

  // 5. Check if user is meeting goal
  const isMeetingGoal = currentProjectedAnnualKg <= targetAnnualKg;
  const isReducing = currentProjectedAnnualKg < baselineAnnualKg;

  // 6. Submit handler
  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    try {
      await onUpdateGoals({
        targetPercent,
        targetAnnualKg,
      });
      setMsg("Carbon goals updated successfully.");
    } catch (err: unknown) {
      setMsg((err as Error).message || "Failed to save goals.");
    } finally {
      setSaving(false);
    }
  };

  // 7. AI proposed target recommendation
  const recommendedTarget = useMemo(() => {
    // If transport is high, suggest higher reduction
    if (profile.primaryTransport.includes("car")) {
      return {
        percent: 20,
        text: "Switching just 2 commutes to train/bus cuts transit emissions by 60%, making a 20% total target highly achievable.",
      };
    }
    // If diet is meat, suggest moderate reduction
    if (profile.dietType === "meat_heavy" || profile.dietType === "average") {
      return {
        percent: 15,
        text: "Adopting a meat-free weekday diet cuts food emissions by 30%, making a 15% overall reduction target a realistic milestone.",
      };
    }
    return {
      percent: 10,
      text: "Since your starting footprint is already low, a 10% reduction through home energy efficiency is recommended.",
    };
  }, [profile]);

  return (
    <section className="space-y-6" aria-label="Goals Ledger View" data-testid="goals-section">
      {/* Title */}
      <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Target reductions
            <Target className="text-accent-teal" size={18} />
          </h2>
          <p className="text-xs text-muted">Set and edit carbon reduction targets relative to your onboarding baseline.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goal Settings Form Card */}
        <div className="lg:col-span-1 ledger-card h-fit space-y-6">
          <h3 className="text-base font-bold text-white border-b border-border pb-2">Edit reduction goals</h3>
          
          <div className="space-y-4">
            {/* Range slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-white">Target Reduction</span>
                <span className="font-mono text-accent-teal font-bold text-lg">{targetPercent}%</span>
              </div>
              <input
                aria-label="Target Reduction Percentage"
                type="range"
                min="5"
                max="50"
                step="5"
                value={targetPercent}
                onChange={(e) => setTargetPercent(parseInt(e.target.value))}
                className="w-full h-1.5 bg-background rounded-lg appearance-none cursor-pointer accent-accent-teal"
              />
              <div className="flex justify-between text-[10px] text-muted font-mono">
                <span>5% (Conservative)</span>
                <span>50% (Ambitious)</span>
              </div>
            </div>

            {/* Calculations summaries */}
            <div className="space-y-2 text-xs border-t border-border pt-4">
              <div className="flex justify-between">
                <span className="text-muted">Onboarding Baseline:</span>
                <span className="font-mono text-white font-tabular">{baselineAnnualKg.toLocaleString()} kg/yr</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-muted">Target annual limit:</span>
                <span className="font-mono text-accent-teal font-tabular">{targetAnnualKg.toLocaleString()} kg/yr</span>
              </div>
            </div>

            {msg && (
              <p className={`text-xs font-semibold ${msg.includes("success") ? "text-accent-teal" : "text-accent-red"}`}>
                {msg}
              </p>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="ledger-btn-primary w-full"
            >
              Save Goals Configuration
            </button>
          </div>
        </div>

        {/* Trajectory Tracker Progress Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Trajectory Comparison Card */}
          <div className="ledger-card space-y-6">
            <h3 className="text-base font-bold text-white">Carbon Trajectory Review</h3>

            {/* Visual Progress Bar */}
            <div className="space-y-3">
              <div className="relative pt-1">
                {/* Visual line */}
                <div className="overflow-hidden h-4 text-xs flex rounded-full bg-background border border-border">
                  {/* Current Trajectory representation */}
                  <div
                    style={{ width: `${Math.min(100, (currentProjectedAnnualKg / baselineAnnualKg) * 100)}%` }}
                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-700 ${
                      isMeetingGoal ? "bg-accent-teal" : isReducing ? "bg-accent-amber" : "bg-accent-red"
                    }`}
                    role="img"
                    aria-label={`Current Projected footprint: ${currentProjectedAnnualKg} kg.`}
                  />
                </div>
                
                {/* Marker for Goal limit */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-dashed border-l border-white/60 h-6"
                  style={{ left: `${(targetAnnualKg / baselineAnnualKg) * 100}%` }}
                  title="Target Goal Threshold"
                >
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-surface text-[9px] font-mono text-white px-1 border border-border rounded whitespace-nowrap">
                    Goal Limit
                  </span>
                </div>
              </div>

              {/* Legends */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono pt-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-accent-teal rounded-full" />
                  <span className="text-muted">On Track Target</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-accent-amber rounded-full" />
                  <span className="text-muted">Reducing but Above Goal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-accent-red rounded-full" />
                  <span className="text-muted">Baseline exceeded</span>
                </div>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border pt-4">
              <div className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between">
                <span className="text-xs font-semibold text-muted">Current Trajectory</span>
                <span className="text-2xl font-bold font-tabular text-white mt-1">
                  {currentProjectedAnnualKg.toLocaleString()} <span className="text-xs text-muted">kg/yr</span>
                </span>
                <span className="text-[10px] text-muted mt-1 leading-relaxed">
                  Extrapolated annual total based on logged days.
                </span>
              </div>

              <div className="bg-background border border-border p-4 rounded-lg flex flex-col justify-between">
                <span className="text-xs font-semibold text-muted">Reduction Achieved</span>
                <span className={`text-2xl font-bold font-tabular mt-1 flex items-center gap-2 ${
                  reductionAchievedPercent > 0 ? "text-accent-teal" : "text-muted"
                }`}>
                  {reductionAchievedPercent > 0 ? `-${reductionAchievedPercent}%` : `${reductionAchievedPercent}%`}
                  {reductionAchievedPercent > 0 && <TrendingDown size={20} />}
                </span>
                <span className="text-[10px] text-muted mt-1 leading-relaxed">
                  Emissions decrease relative to onboarding baseline.
                </span>
              </div>
            </div>

            {/* Goals Alert review */}
            <div className={`p-4 rounded-lg border flex gap-3 text-xs leading-relaxed ${
              isMeetingGoal 
                ? "bg-accent-teal/5 border-accent-teal/20 text-[#e2edea]" 
                : "bg-accent-amber/5 border-accent-amber/20 text-[#e2edea]"
            }`}>
              {isMeetingGoal ? (
                <>
                  <CheckCircle className="text-accent-teal shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Goal targets maintained</span>
                    You are currently meeting your target of a <span className="text-accent-teal font-bold">{targetPercent}%</span> reduction. Your average footprint is successfully below the daily budget. Log regularly to solidify this status.
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="text-accent-amber shrink-0 mt-0.5" size={16} />
                  <div>
                    <span className="font-bold text-white block mb-0.5">Goal trajectory exceeded</span>
                    Your current transaction velocity exceeds your goal target of <span className="text-accent-amber font-bold">{targetPercent}%</span>. Swapping car commutes or reducing diet emissions will help realign your ledger with your goals.
                  </div>
                </>
              )}
            </div>
          </div>

          {/* AI Recommended Targets Card */}
          <div className="ledger-card space-y-3 border-accent-teal/20">
            <div className="flex items-center gap-2 text-accent-teal font-bold text-sm uppercase tracking-wider">
              <Lightbulb size={16} />
              <span>AI Target Advisory Suggestion</span>
            </div>
            
            <p className="text-white text-sm">
              We recommend a target of <span className="text-accent-teal font-extrabold font-mono text-base">{recommendedTarget.percent}%</span> based on your onboarding profile profile details.
            </p>
            <p className="text-xs text-muted leading-relaxed">
              {recommendedTarget.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Goals;
