import React, { Suspense, useMemo, useState } from "react";
import { ActivityLog, UserProfile } from "../lib/emissionFactors";
import { ChartSkeleton } from "./Skeleton";
import { AlertCircle, Trees, Car, Table, LayoutGrid, Flame } from "lucide-react";
import { DashboardEmptyState } from "./DashboardEmptyState";

// Lazy load Recharts elements
const DashboardCharts = React.lazy(() => import("./DashboardCharts"));

interface DashboardProps {
  profile: UserProfile;
  activities: ActivityLog[];
  dailyBudget: number;
  /** Current consecutive logging streak in days. */
  streak: number;
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ activities, dailyBudget, streak, onNavigate }) => {
  const [viewMode, setViewMode] = useState<"visual" | "table">("visual");
  const [timeRange, setTimeRange] = useState<7 | 30 | 90>(7);

  // 1. Calculate Today's emissions
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  const todayEmissions = useMemo(() => {
    return activities
      .filter((a) => a.date === todayStr)
      .reduce((sum, a) => sum + a.emissions, 0);
  }, [activities, todayStr]);

  // 2. Budget Gauge details (color shifts and state tags)
  const budgetRatio = dailyBudget > 0 ? todayEmissions / dailyBudget : 0;
  
  const budgetStatus = useMemo(() => {
    if (budgetRatio <= 0.6) {
      return {
        label: "Within Budget Limit",
        colorClass: "text-accent-teal border-accent-teal/20 bg-accent-teal/5",
        ringColor: "#06b6d4" // teal
      };
    } else if (budgetRatio <= 1.0) {
      return {
        label: "Approaching Limit",
        colorClass: "text-accent-amber border-accent-amber/20 bg-accent-amber/5",
        ringColor: "#f59e0b" // amber
      };
    } else {
      return {
        label: "Carbon Budget Debited",
        colorClass: "text-accent-red border-accent-red/20 bg-accent-red/5",
        ringColor: "#ef4444" // red
      };
    }
  }, [budgetRatio]);

  // SVG Gauge calculations
  const radius = 70;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - Math.min(1, budgetRatio) * circumference;

  // 3. Category distribution (Transport, Energy, Food, Shopping, Waste)
  const categorySummary = useMemo(() => {
    const totals: Record<string, { value: number; color: string }> = {
      Transport: { value: 0, color: "#06b6d4" }, // teal
      Energy: { value: 0, color: "#3b82f6" },    // blue
      Food: { value: 0, color: "#f59e0b" },      // amber
      Shopping: { value: 0, color: "#a855f7" },  // purple
      Waste: { value: 0, color: "#ec4899" },     // pink
    };

    activities.forEach((act) => {
      if (totals[act.category]) {
        totals[act.category].value += act.emissions;
      }
    });

    const sum = Object.values(totals).reduce((a, b) => a + b.value, 0);

    return Object.entries(totals).map(([name, data]) => ({
      name,
      value: Number(data.value.toFixed(1)),
      color: data.color,
      percent: sum > 0 ? Math.round((data.value / sum) * 100) : 0,
    }));
  }, [activities]);

  // 4. Time Range Filtered Trend Data
  const trendData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    const now = new Date();
    
    // Initialize dates in the range
    for (let i = timeRange - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      dataMap[dateStr] = 0;
    }

    // Accumulate emissions by date
    activities.forEach((act) => {
      if (dataMap[act.date] !== undefined) {
        dataMap[act.date] += act.emissions;
      }
    });

    // Format dates for display
    return Object.entries(dataMap).map(([date, amount]) => {
      const [,, day] = date.split("-");
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const d = new Date(date);
      const label = `${months[d.getMonth()]} ${day}`;
      return {
        date: label,
        rawDate: date,
        amount: Number(amount.toFixed(1)),
      };
    });
  }, [activities, timeRange]);

  // 5. Comparison data (User projected vs global/national averages in Tons/yr)
  const userAverageDaily = useMemo(() => {
    if (activities.length === 0) return 0;
    // Calculate unique days in log or default to 1
    const uniqueDays = Array.from(new Set(activities.map((a) => a.date))).length || 1;
    const sum = activities.reduce((s, a) => s + a.emissions, 0);
    return sum / uniqueDays;
  }, [activities]);

  const userProjectedAnnualTons = useMemo(() => {
    // If no activities yet, use the onboarding estimated annual footprint
    if (activities.length === 0) {
      return 0; // Will display 0 or pull from profile if needed. Let's make it 0 for clean empty states.
    }
    return Number(((userAverageDaily * 365) / 1000).toFixed(2));
  }, [activities, userAverageDaily]);

  const comparisonData = useMemo(() => {
    return [
      { label: "Your Trajectory", value: userProjectedAnnualTons, color: "bg-accent-teal" },
      { label: "Paris 2030 Target", value: 2.30, color: "bg-emerald-500" },
      { label: "Global Average", value: 4.70, color: "bg-blue-500" },
      { label: "US Average", value: 16.00, color: "bg-accent-red" },
    ];
  }, [userProjectedAnnualTons]);

  // 6. Equivalency calculations
  // 1 tree absorbs ~22kg CO2e per year.
  // Driving a petrol car emits ~0.18kg per km.
  const treesNeeded = useMemo(() => {
    return Number((todayEmissions / 22).toFixed(1));
  }, [todayEmissions]);

  const carDistanceEquivalentKm = useMemo(() => {
    return Number((todayEmissions / 0.18).toFixed(0));
  }, [todayEmissions]);

  if (activities.length === 0) {
    return <DashboardEmptyState onNavigate={onNavigate} />;
  }

  return (
    <section className="space-y-6" aria-label="Ledger Dashboard" data-testid="carbon-ledger-dashboard">
      {/* Dashboard Toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Carbon Ledger</h2>
          <p className="text-xs text-muted mt-0.5">Understand your carbon footprint at a glance. Every activity is a debit against your daily carbon budget.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Streak Badge — visible on Dashboard (Track pillar) */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold font-tabular"
            role="status"
            aria-label={`Current logging streak: ${streak} days`}
          >
            <Flame className="animate-pulse" size={16} fill="currentColor" />
            <span className="text-sm">{streak}d</span>
          </div>

          {/* Accessibility Layout Mode Toggle */}
          <div className="flex bg-surface border border-border rounded-lg p-1 space-x-1">
            <button
              onClick={() => setViewMode("visual")}
              aria-label="Switch to visual chart view"
              aria-pressed={viewMode === "visual"}
              className={`p-2 rounded transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
                viewMode === "visual" ? "bg-border text-white" : "text-muted hover:text-white"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode("table")}
              aria-label="Switch to accessible table data view"
              aria-pressed={viewMode === "table"}
              className={`p-2 rounded transition-all min-w-[36px] min-h-[36px] flex items-center justify-center ${
                viewMode === "table" ? "bg-border text-white" : "text-muted hover:text-white"
              }`}
            >
              <Table size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero row: Gauge + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Carbon Budget Ring Gauge */}
        <div className="ledger-card flex flex-col items-center justify-center text-center p-6 md:col-span-1 min-h-[300px]" data-testid="carbon-budget-meter">
          <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wider">Carbon Budget Ledger</h3>
          
          <div className="relative w-40 h-40 flex items-center justify-center mb-5 mt-1">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160" aria-hidden="true">
              {/* Outer background track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-border"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Colored active fill indicator */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={budgetStatus.ringColor}
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            
            {/* Center numbers */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-tabular">
                {todayEmissions.toFixed(0)}
              </span>
              <span className="text-xs text-muted font-mono">
                / {dailyBudget.toFixed(0)} kg CO2e
              </span>
            </div>
          </div>

          {/* Accessible Status Badge */}
          <div 
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${budgetStatus.colorClass}`}
            role="status"
            aria-live="polite"
          >
            {budgetStatus.label}
          </div>
        </div>

        {/* Real-world Equivalency Translations (Understand pillar: concrete comparisons) */}
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6" aria-live="polite" data-testid="emission-summary">
          {/* Equivalency Card 1: Trees */}
          <div className="ledger-card flex flex-col justify-between p-6 min-h-[300px]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent-teal/10 rounded-lg text-accent-teal shrink-0">
                <Trees size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Absorption requirement</h4>
                <p className="text-xs text-muted font-medium">Forest offset absorption needed</p>
              </div>
            </div>
            
            <div className="mt-4 border-t border-border/40 pt-4 flex flex-col justify-end flex-grow">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-tabular text-white">{treesNeeded}</span>
                <span className="text-sm text-muted font-semibold">Mature Trees</span>
              </div>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Mature trees required for 1 year to absorb today's logged emissions.
              </p>
            </div>
          </div>

          {/* Equivalency Card 2: Gas Car */}
          <div className="ledger-card flex flex-col justify-between p-6 min-h-[300px]">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent-amber/10 rounded-lg text-accent-amber shrink-0">
                <Car size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Petrol Car Offset</h4>
                <p className="text-xs text-muted font-medium">Equivalent gasoline travel</p>
              </div>
            </div>
            
            <div className="mt-4 border-t border-border/40 pt-4 flex flex-col justify-end flex-grow">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold font-tabular text-white">{carDistanceEquivalentKm}</span>
                <span className="text-sm font-bold text-white">km</span>
                <span className="text-sm text-muted font-semibold">Travelled</span>
              </div>
              <p className="text-xs text-muted mt-2 leading-relaxed">
                Driving distance in an average petrol car to yield the same carbon footprint.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content view: Visual Charts vs. Accessible Tables */}
      {viewMode === "visual" ? (
        <div className="space-y-6" data-testid="emission-chart">
          {/* Lazy loaded Recharts component */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Emissions analysis</h3>
            
            {/* Filter controls */}
            <div className="flex space-x-2 text-xs font-mono">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeRange(days as 7 | 30 | 90)}
                  className={`px-3 py-1 rounded border transition-colors ${
                    timeRange === days
                      ? "border-accent-teal text-accent-teal bg-accent-teal/5"
                      : "border-border text-muted hover:text-white bg-background"
                  }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          <Suspense fallback={<ChartSkeleton />}>
            <DashboardCharts categoryData={categorySummary} trendData={trendData} />
          </Suspense>
        </div>
      ) : (
        /* Accessible Non-Chart Table View for Screen Readers & Tab navigation */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown Table */}
          <div className="ledger-card space-y-4">
            <h3 className="text-base font-bold text-white">Category breakdown index</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 font-semibold">Category</th>
                    <th className="py-2 text-right font-semibold">Emissions (kg CO2e)</th>
                    <th className="py-2 text-right font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {categorySummary.map((cat) => (
                    <tr key={cat.name} className="hover:bg-border/20 text-white">
                      <td className="py-3 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                        {cat.name}
                      </td>
                      <td className="py-3 text-right font-tabular">{cat.value.toFixed(1)}</td>
                      <td className="py-3 text-right font-tabular">{cat.percent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Trend Table */}
          <div className="ledger-card space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-white">Daily Ledger history</h3>
              <select
                aria-label="Filter trend days"
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value) as 7 | 30 | 90)}
                className="bg-background border border-border rounded px-2 py-1 text-xs text-white outline-none"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
              </select>
            </div>
            
            <div className="overflow-y-auto max-h-[220px]">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted">
                    <th className="py-2 font-semibold">Date</th>
                    <th className="py-2 text-right font-semibold">Daily emissions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {trendData.map((day) => (
                    <tr key={day.rawDate} className="hover:bg-border/20 text-white">
                      <td className="py-2.5 font-mono">{day.rawDate}</td>
                      <td className="py-2.5 text-right font-tabular">{day.amount.toFixed(1)} kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Panel (Projected Annual vs Global/National/Paris) — Understand pillar */}
      <div className="ledger-card space-y-6" data-testid="comparison-panel">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-white">Yearly carbon comparison</h3>
          <p className="text-xs text-muted">
            <strong>Why this matters:</strong> Understanding how your footprint compares to global benchmarks is the first step to reducing it. The Paris Agreement targets 2.3 tonnes per person by 2030.
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-6 text-muted border border-dashed border-border rounded-lg">
            <AlertCircle className="mx-auto text-muted mb-2 animate-bounce" size={24} />
            <p className="text-sm">Carbon projections will display once you log activities.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {comparisonData.map((comp) => {
              // Scale the progress bar relative to US Average (16 tons)
              const maxScale = 16.0;
              const widthPercent = Math.min(100, (comp.value / maxScale) * 100);

              return (
                <div key={comp.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#e2edea]">{comp.label}</span>
                    <span className="font-tabular font-bold text-white">{comp.value.toFixed(2)} t CO2e/yr</span>
                  </div>
                  <div className="h-3 w-full bg-background rounded-full overflow-hidden border border-border">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${comp.color}`}
                      style={{ width: `${widthPercent}%` }}
                      role="img"
                      aria-label={`${comp.label} equals ${comp.value} metric tons.`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default Dashboard;
