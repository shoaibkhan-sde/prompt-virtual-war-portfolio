import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface DashboardChartsProps {
  categoryData: Array<{ name: string; value: number; color: string }>;
  trendData: Array<{ date: string; amount: number }>;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ categoryData, trendData }) => {
  // Format tooltips
  const formatCo2 = (val: string | number | readonly (string | number)[] | undefined) => {
    if (val === undefined || val === null) return "0.0 kg";
    const num = Array.isArray(val) ? Number(val[0]) : Number(val);
    return `${num.toFixed(1)} kg`;
  };

  const totalEmissions = React.useMemo(() => {
    return categoryData.reduce((sum, c) => sum + c.value, 0);
  }, [categoryData]);

  const peakEmission = React.useMemo(() => {
    if (trendData.length === 0) return 0;
    return Math.max(...trendData.map((d) => d.amount));
  }, [trendData]);

  // Custom tooltips for dark theme
  const customTooltipStyle = {
    contentStyle: {
      backgroundColor: "#121816",
      borderColor: "#222c29",
      color: "#e2edea",
      borderRadius: "8px",
      fontFamily: "Outfit, sans-serif",
    },
    labelStyle: {
      color: "#8a9a95",
      fontFamily: "JetBrains Mono, monospace",
      fontSize: "12px",
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Donut Chart */}
      <div className="ledger-card flex flex-col justify-between min-h-[350px]">
        <h3 className="text-base font-bold text-white mb-2">Category distribution</h3>
        <div className="flex-1 w-full h-[260px] flex items-center justify-center">
          {categoryData.some((c) => c.value > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart role="img" aria-label={`Carbon emissions distribution by category. Total emissions logged is ${totalEmissions.toFixed(1)} kg CO2e.`}>
                <Pie
                  data={categoryData.filter((c) => c.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData
                    .filter((c) => c.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip formatter={formatCo2} {...customTooltipStyle} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-12">
              <p className="text-sm">No transaction categories to display.</p>
              <p className="text-xs mt-1">Log activities to populate the category index.</p>
            </div>
          )}
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="ledger-card flex flex-col justify-between min-h-[350px]">
        <h3 className="text-base font-bold text-white mb-2">Historical emissions</h3>
        <div className="flex-1 w-full h-[260px]">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} role="img" aria-label={`Carbon emissions daily trend chart. Peak daily emissions reached ${peakEmission.toFixed(1)} kg CO2e.`}>
                <defs>
                  <linearGradient id="colorTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222c29" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#8a9a95" 
                  fontSize={11}
                  tickLine={false} 
                  fontFamily="JetBrains Mono"
                />
                <YAxis 
                  stroke="#8a9a95" 
                  fontSize={11}
                  tickLine={false} 
                  axisLine={false}
                  fontFamily="JetBrains Mono"
                  tickFormatter={(v) => `${v}k`}
                />
                <Tooltip formatter={formatCo2} {...customTooltipStyle} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorTrend)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted py-12">
              <p className="text-sm">Awaiting daily ledger logging history.</p>
              <p className="text-xs mt-1">Check back once you have logged activities over multiple days.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
