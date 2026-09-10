import React, { useState, useMemo } from "react";
import { UserProfile, ActivityLog, calculateOnboardingFootprint } from "../lib/emissionFactors";
import { Calendar, Share2, Copy, Check, TrendingDown } from "lucide-react";

interface ReportsProps {
  profile: UserProfile;
  activities: ActivityLog[];
  dailyBudget: number;
}

export const Reports: React.FC<ReportsProps> = ({ profile, activities }) => {
  const [copied, setCopied] = useState(false);

  // 1. Calculate Monthly stats (filtered for current month/year)
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    // Filter activities for this month
    const thisMonthActs = activities.filter((act) => {
      const actDate = new Date(act.date);
      return actDate.getMonth() === currentMonth && actDate.getFullYear() === currentYear;
    });

    const totalEmissions = thisMonthActs.reduce((sum, a) => sum + a.emissions, 0);

    // Categories
    const categoryTotals: Record<string, number> = {
      Transport: 0,
      Energy: 0,
      Food: 0,
      Shopping: 0,
      Waste: 0,
    };
    thisMonthActs.forEach((act) => {
      if (categoryTotals[act.category] !== undefined) {
        categoryTotals[act.category] += act.emissions;
      }
    });

    // Find top driver category
    let topCategory = "None";
    let maxEmissions = 0;
    Object.entries(categoryTotals).forEach(([cat, val]) => {
      if (val > maxEmissions) {
        maxEmissions = val;
        topCategory = cat;
      }
    });

    // Baseline onboarding monthly comparison
    const onboardingBaseline = calculateOnboardingFootprint(profile).annualFootprintKg / 12;
    const savingsKg = Math.max(0, onboardingBaseline - totalEmissions);
    const reductionPercent = onboardingBaseline > 0 
      ? Math.round((savingsKg / onboardingBaseline) * 100) 
      : 0;

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[currentMonth];

    return {
      monthName,
      year: currentYear,
      totalEmissions: Number(totalEmissions.toFixed(1)),
      categoryTotals,
      topCategory,
      onboardingBaseline: Number(onboardingBaseline.toFixed(1)),
      savingsKg: Number(savingsKg.toFixed(1)),
      reductionPercent,
      logCount: thisMonthActs.length,
    };
  }, [activities, profile]);

  // 2. Local Narrative Summary text
  const narrativeSummary = useMemo(() => {
    if (monthlyStats.logCount === 0) {
      return "No transactions have been posted to the ledger for this month. Once activities are logged, Atmos Coach will compile a comprehensive carbon accounting report.";
    }

    let statement = `During ${monthlyStats.monthName} ${monthlyStats.year}, you registered ${monthlyStats.logCount} transactions on your carbon ledger, totaling ${monthlyStats.totalEmissions} kg CO2e. `;

    if (monthlyStats.savingsKg > 0) {
      statement += `Your monthly carbon expense is ${monthlyStats.reductionPercent}% lower than your onboarding baseline target (saving ${monthlyStats.savingsKg} kg CO2e). `;
    } else {
      statement += `Your monthly carbon expense exceeds your onboarding baseline by ${Math.abs(monthlyStats.savingsKg)} kg CO2e. `;
    }

    if (monthlyStats.topCategory !== "None") {
      statement += `Your single highest driver was ${monthlyStats.topCategory}, representing a primary area to introduce reductions. Swapping car commutes or adopting a low-meat diet are your fastest options to restore ledger alignment.`;
    }

    return statement;
  }, [monthlyStats]);

  // 3. Share message details
  const shareText = `Atmos Carbon Ledger — ${monthlyStats.monthName} Report:
I reduced my carbon footprint by ${monthlyStats.reductionPercent}% this month! 
Diverted ${monthlyStats.savingsKg} kg of CO2e from the atmosphere.
Track your carbon ledger at Atmos.`;

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="space-y-6" aria-label="Monthly carbon accounting reports">
      {/* Title */}
      <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Monthly summaries & sharing
            <Calendar className="text-accent-teal" size={18} />
          </h2>
          <p className="text-xs text-muted">Generate certified ledger reports and branded sharing certificates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Summary View */}
        <div className="lg:col-span-2 space-y-6">
          <div className="ledger-card space-y-5">
            <header className="border-b border-border pb-3 flex justify-between items-center">
              <h3 className="text-base font-bold text-white">
                Summary Report: {monthlyStats.monthName} {monthlyStats.year}
              </h3>
              <span className="font-mono text-xs text-muted">
                {monthlyStats.logCount} transactions
              </span>
            </header>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-background border border-border p-4 rounded-lg">
                <span className="text-xs text-muted font-semibold block">Emissions Expense</span>
                <span className="text-xl font-bold font-tabular text-white block mt-1">
                  {monthlyStats.totalEmissions.toLocaleString()} kg
                </span>
                <span className="text-[10px] text-muted block mt-1">Total CO2e logged this month.</span>
              </div>

              <div className="bg-background border border-border p-4 rounded-lg">
                <span className="text-xs text-muted font-semibold block">Diverted Carbon</span>
                <span className="text-xl font-bold font-tabular text-accent-teal block mt-1 flex items-center gap-1">
                  {monthlyStats.savingsKg.toLocaleString()} kg
                  {monthlyStats.savingsKg > 0 && <TrendingDown size={16} />}
                </span>
                <span className="text-[10px] text-muted block mt-1">Saved relative to baseline.</span>
              </div>

              <div className="bg-background border border-border p-4 rounded-lg">
                <span className="text-xs text-muted font-semibold block">Top Category</span>
                <span className="text-xl font-bold text-white block mt-1 truncate">
                  {monthlyStats.topCategory}
                </span>
                <span className="text-[10px] text-muted block mt-1">Highest emission driver.</span>
              </div>
            </div>

            {/* Narrative summary */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-muted uppercase tracking-wider">Atmos Executive Narrative</h4>
              <p className="text-sm text-[#e2edea] leading-relaxed bg-background/40 border border-border p-4 rounded-lg">
                {narrativeSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Shareable Card Component */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Shareable progress card</h3>
          
          {/* Visual Progress Card */}
          <div className="ledger-card bg-gradient-to-br from-accent-teal/15 to-[#121816] border-accent-teal/30 p-6 flex flex-col justify-between min-h-[300px]">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-accent-teal uppercase tracking-wider font-tabular">ATMOS CARBON LEDGER</span>
                <Share2 size={16} className="text-accent-teal" />
              </div>
              
              <div className="space-y-1">
                <p className="text-xs text-muted uppercase font-mono">Monthly Milestone achieved</p>
                <p className="text-3xl font-extrabold text-white font-tabular leading-tight">
                  -{monthlyStats.reductionPercent}%
                </p>
                <p className="text-sm text-[#e2edea] font-medium mt-1">
                  I cut my carbon footprint by {monthlyStats.reductionPercent}% this month!
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-accent-teal/10 mt-6 flex justify-between items-center text-xs text-muted font-mono">
              <div>
                <span className="block text-[10px]">CARBON DIVERTED:</span>
                <span className="text-white font-bold font-tabular">{monthlyStats.savingsKg} kg CO2e</span>
              </div>
              <div className="text-right">
                <span className="block text-[10px]">MONTH:</span>
                <span className="text-white font-bold">{monthlyStats.monthName.toUpperCase()}</span>
              </div>
            </div>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopyShare}
            className="ledger-btn-primary w-full flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={16} />
                Progress Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Certified Progress Link
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
};

export default Reports;
