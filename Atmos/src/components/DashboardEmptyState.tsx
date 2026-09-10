import React from "react";
import { Leaf, PlusCircle, Car, Zap, Utensils, ShoppingBag } from "lucide-react";

interface DashboardEmptyStateProps {
  onNavigate: (tab: string) => void;
}

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: "Transport",
      description: "Log your petrol/EV commutes, bus trips, trains, or flights.",
      icon: <Car className="text-accent-teal" size={20} />,
    },
    {
      title: "Diet & Food",
      description: "Track carbon impact based on vegan, vegetarian, or meat-heavy meals.",
      icon: <Utensils className="text-accent-amber" size={20} />,
    },
    {
      title: "Home Energy",
      description: "Log utility usage like grid electricity (kWh) and heating gas.",
      icon: <Zap className="text-cyan-500" size={20} />,
    },
    {
      title: "Shopping & Waste",
      description: "Track purchases like clothing/electronics, and recycling or trash weight.",
      icon: <ShoppingBag className="text-purple-500" size={20} />,
    },
  ];

  return (
    <div 
      className="space-y-8 max-w-4xl mx-auto py-8 animate-fadeIn" 
      role="region" 
      aria-label="Welcome and Getting Started Guidance"
    >
      {/* Welcome Card */}
      <div className="ledger-card flex flex-col items-center justify-center text-center p-8 md:p-12 border border-accent-teal/20 bg-gradient-to-b from-accent-teal/5 to-transparent">
        {/* Glow Icon */}
        <div className="w-16 h-16 rounded-full bg-accent-teal/10 border border-accent-teal/20 flex items-center justify-center text-accent-teal mb-6 relative animate-float">
          <Leaf size={32} fill="currentColor" className="opacity-80" />
          <div className="absolute inset-0 rounded-full border border-accent-teal/40 animate-ping opacity-25" />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white mb-3">
          Your Carbon Ledger is Empty
        </h2>
        <p className="text-sm md:text-base text-muted max-w-xl leading-relaxed mb-8">
          Welcome to Atmos! This personal carbon ledger tracks your daily activities as debits against an annual carbon target. Log your first commute, meal, or home energy usage to see insights, trajectories, and offsets.
        </p>

        {/* CTA Button */}
        <button
          onClick={() => onNavigate("activities")}
          className="ledger-btn-primary px-8 py-3.5 text-base font-bold shadow-lg shadow-accent-teal/10 hover:shadow-accent-teal/20 transition-all cursor-pointer"
          aria-label="Log your first activity"
        >
          <PlusCircle size={20} />
          Log Your First Activity
        </button>
      </div>

      {/* Guide Helper Section */}
      <div className="space-y-4">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">What can you track?</h3>
          <p className="text-xs text-muted">Atmos carbon ledger tracks your footprint across five core sectors:</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categories.map((cat) => (
            <div 
              key={cat.title} 
              className="ledger-card flex items-start gap-4 p-5 hover:border-border transition-colors"
            >
              <div className="p-2.5 bg-surface rounded-lg shrink-0 border border-border/80">
                {cat.icon}
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">{cat.title}</h4>
                <p className="text-xs text-muted leading-relaxed">{cat.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardEmptyState;
