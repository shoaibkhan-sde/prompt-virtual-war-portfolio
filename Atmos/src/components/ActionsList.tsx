import React, { useState, useMemo } from "react";
import { ActionPlanItem } from "../lib/localInsights";
import { motion, AnimatePresence } from "framer-motion";
import { CheckSquare, Square, Trees, Check } from "lucide-react";

interface ActionsListProps {
  adoptedActions: ActionPlanItem[];
  streak: number;
  onCompleteAction: (id: string, co2Saved: number) => void;
  onRemoveAdopted: (id: string) => void;
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  co2SavedKg: number;
  category: "Transport" | "Energy" | "Food" | "Shopping" | "Waste";
}

const DEFAULT_HABITS: ActionItem[] = [
  { id: "habit_laundry", title: "Air-Dry Laundry Today", description: "Skip the electric clothes dryer cycle and hang clothes on a drying rack.", co2SavedKg: 2.1, category: "Energy" },
  { id: "habit_walk", title: "Walk Trips Under 1km", description: "Walk or bike for short trips instead of driving your vehicle.", co2SavedKg: 3.5, category: "Transport" },
  { id: "habit_meatfree", title: "Meat-Free Meal", description: "Swap one meat dish for a fully plant-based meal today.", co2SavedKg: 4.8, category: "Food" },
  { id: "habit_coldwash", title: "Cold Wash Laundry Cycle", description: "Wash laundry in cold water (30°C or less) to save heating power.", co2SavedKg: 1.2, category: "Energy" },
  { id: "habit_recycle", title: "Sort Composts & Recycling", description: "Divert organics and packaging from reaching the landfill.", co2SavedKg: 1.5, category: "Waste" },
];

interface Badge {
  id: string;
  title: string;
  description: string;
  condition: string;
  unlocked: boolean;
  icon: string;
}

export const ActionsList: React.FC<ActionsListProps> = ({
  adoptedActions,
  streak,
  onCompleteAction,
}) => {
  // States
  const [completedIds, setCompletedIds] = useState<Record<string, boolean>>({});
  const [completedCount, setCompletedCount] = useState(0);
  const [totalSaved, setTotalSaved] = useState(0);

  // Combine default habits + adopted AI actions
  const allActions = useMemo(() => {
    const list = [...DEFAULT_HABITS];
    adoptedActions.forEach((act) => {
      // Avoid duplicates
      if (!list.some((item) => item.id === act.id)) {
        list.push({
          id: act.id,
          title: act.title,
          description: act.description,
          co2SavedKg: act.co2SavedKg,
          category: act.category as "Transport" | "Energy" | "Food" | "Shopping" | "Waste",
        });
      }
    });
    return list;
  }, [adoptedActions]);

  // Handle action toggle completion
  const handleToggle = (id: string, co2Saved: number) => {
    const isCompleted = !!completedIds[id];
    setCompletedIds((prev) => ({ ...prev, [id]: !isCompleted }));
    
    if (!isCompleted) {
      // Complete action
      setCompletedCount((c) => c + 1);
      setTotalSaved((s) => Number((s + co2Saved).toFixed(1)));
      onCompleteAction(id, co2Saved);
    } else {
      // Undo action
      setCompletedCount((c) => Math.max(0, c - 1));
      setTotalSaved((s) => Number(Math.max(0, s - co2Saved).toFixed(1)));
      onCompleteAction(id, -co2Saved); // Deduct savings
    }
  };

  // Badge list and dynamic unlock states
  const badges: Badge[] = useMemo(() => {
    return [
      {
        id: "badge_first",
        title: "First Step",
        description: "Complete your first carbon ledger action item.",
        condition: "Complete 1 action",
        unlocked: completedCount >= 1,
        icon: "🌱",
      },
      {
        id: "badge_warrior",
        title: "Eco Warrior",
        description: "Develop multiple carbon-saving daily habits.",
        condition: "Complete 3 actions",
        unlocked: completedCount >= 3,
        icon: "⚡",
      },
      {
        id: "badge_transit",
        title: "Transit Week",
        description: "Adopt and complete a commute reduction task.",
        condition: "Complete a Transport action",
        unlocked: Object.keys(completedIds).some(
          (id) => completedIds[id] && allActions.find((a) => a.id === id)?.category === "Transport"
        ),
        icon: "🚇",
      },
      {
        id: "badge_streak",
        title: "7-Day Log Streak",
        description: "Maintain consecutive logging activity.",
        condition: "Reach a 7-day streak",
        unlocked: streak >= 7,
        icon: "🔥",
      },
    ];
  }, [completedCount, completedIds, allActions, streak]);

  // Tree equivalency saved
  const treesEquivalent = useMemo(() => {
    // 1 tree absorbs ~22kg / year, which is ~0.06 kg / day.
    // Let's do: 1 tree absorbs 22kg/year. So totalSaved / 22 trees offset for a full year.
    return Number((totalSaved / 22).toFixed(2));
  }, [totalSaved]);

  return (
    <section className="space-y-6" aria-label="Eco actions ledger checklist" data-testid="carbon-reduction-actions">
      {/* Hero row: Total Saved counter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Positive Carbon Saved Stat */}
        <div className="md:col-span-2 ledger-card bg-gradient-to-br from-accent-teal/10 to-transparent border-accent-teal/20 flex flex-col justify-between p-6">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Carbon reduction metrics</h2>
            <p className="text-xs text-muted leading-relaxed">
              Every action checked off represents carbon emissions diverted from the atmosphere. Atmos tracks your cumulative savings positive balance.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-border/60">
            <div>
              <span className="text-xs text-muted font-semibold">Total Carbon Diverted</span>
              <p className="text-3xl font-extrabold text-accent-teal font-tabular mt-1">
                {totalSaved.toFixed(1)} <span className="text-lg">kg</span>
              </p>
            </div>
            <div>
              <span className="text-xs text-muted font-semibold">Forest Equivalency</span>
              <p className="text-3xl font-extrabold text-emerald-400 font-tabular mt-1 flex items-center gap-1.5">
                {treesEquivalent} <Trees size={20} className="text-emerald-400 shrink-0" />
              </p>
            </div>
          </div>
        </div>

        {/* Action summaries stats card */}
        <div className="ledger-card p-6 flex flex-col justify-between">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Action completions</h3>
          
          <div className="mt-4">
            <p className="text-4xl font-extrabold font-tabular text-white">{completedCount}</p>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Daily/weekly habits completed during this session.
            </p>
          </div>

          <div className="h-2 w-full bg-background rounded-full overflow-hidden border border-border mt-4">
            <div 
              className="h-full bg-accent-teal rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (completedCount / allActions.length) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main split: Checklist vs Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Checklist */}
        <div className="lg:col-span-2 ledger-card space-y-4">
          <h3 className="text-base font-bold text-white border-b border-border pb-2">Diverted emission actions</h3>
          
          <div className="space-y-3">
            {allActions.map((action) => {
              const isChecked = !!completedIds[action.id];
              return (
                <div
                  key={action.id}
                  onClick={() => handleToggle(action.id, action.co2SavedKg)}
                  className={`border p-4 rounded-xl flex items-center justify-between cursor-pointer select-none transition-all ${
                    isChecked 
                      ? "border-accent-teal/50 bg-accent-teal/5 hover:bg-accent-teal/10" 
                      : "border-border bg-background hover:bg-border/30"
                  }`}
                  role="checkbox"
                  aria-checked={isChecked}
                  data-testid={`action-card-${action.id}`}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      handleToggle(action.id, action.co2SavedKg);
                    }
                  }}
                >
                  <div className="flex items-center space-x-3.5 flex-1 pr-4">
                    <div className="text-accent-teal shrink-0">
                      {isChecked ? (
                        <CheckSquare size={20} className="fill-accent-teal text-background" />
                      ) : (
                        <Square size={20} />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <h4 className={`text-sm font-semibold transition-all ${
                        isChecked ? "text-accent-teal line-through" : "text-white"
                      }`}>
                        {action.title}
                      </h4>
                      <p className="text-xs text-muted leading-relaxed">{action.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-background border border-border text-muted block mb-1">
                      {action.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-accent-teal font-tabular">
                      -{action.co2SavedKg.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gamified Achievements Badges */}
        <div className="lg:col-span-1 ledger-card space-y-4">
          <h3 className="text-base font-bold text-white border-b border-border pb-2">Achievements & Badges</h3>
          
          <div className="space-y-4">
            {badges.map((badge) => (
              <div 
                key={badge.id}
                className={`flex items-center gap-3.5 p-3 rounded-lg border transition-all ${
                  badge.unlocked 
                    ? "bg-surface border-accent-teal/30 shadow-[0_0_15px_rgba(6,182,212,0.05)]" 
                    : "bg-[#121816]/40 border-border/60 opacity-60"
                }`}
              >
                {/* Badge Icon circle */}
                <AnimatePresence mode="wait">
                  {badge.unlocked ? (
                    <motion.div
                      key="unlocked"
                      initial={{ scale: 0.7, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="w-12 h-12 rounded-full bg-accent-teal/10 border border-accent-teal/30 flex items-center justify-center text-xl shrink-0 relative"
                    >
                      <span>{badge.icon}</span>
                      <div className="absolute -top-1 -right-1 bg-accent-teal text-background rounded-full p-0.5 border border-background">
                        <Check size={8} strokeWidth={4} />
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center text-xl shrink-0 grayscale">
                      <span>{badge.icon}</span>
                    </div>
                  )}
                </AnimatePresence>

                {/* Badge text */}
                <div className="space-y-0.5">
                  <h4 className={`text-sm font-bold ${badge.unlocked ? "text-white" : "text-muted"}`}>
                    {badge.title}
                  </h4>
                  <p className="text-[11px] text-muted leading-relaxed">{badge.description}</p>
                  <p className="text-[9px] font-mono text-accent-teal uppercase tracking-wider">{badge.condition}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ActionsList;
