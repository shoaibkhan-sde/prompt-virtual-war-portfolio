import React, { useState, useMemo } from "react";
import { ActivityLog } from "../lib/emissionFactors";
import { Trash2, Edit2, Search, Flame, ArrowLeft, ArrowRight } from "lucide-react";
import { QuickAddPanel } from "./QuickAddPanel";
import { ActivityForm } from "./ActivityForm";

interface ActivityLoggerProps {
  activities: ActivityLog[];
  onAddActivity: (act: Omit<ActivityLog, "id" | "emissions">) => Promise<void>;
  onUpdateActivity: (id: string, act: Omit<ActivityLog, "id" | "emissions">) => Promise<void>;
  onDeleteActivity: (id: string) => Promise<void>;
}

export const ActivityLogger: React.FC<ActivityLoggerProps> = ({
  activities,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
}) => {
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Streak Counter Calculation
  const streak = useMemo(() => {
    if (activities.length === 0) return 0;

    const loggedDates = Array.from(new Set(activities.map((a) => a.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    if (loggedDates[0] !== todayStr && loggedDates[0] !== yesterdayStr) {
      return 0;
    }

    let currentStreak = 1;
    const expectedDate = new Date(loggedDates[0]);

    for (let i = 1; i < loggedDates.length; i++) {
      const actualDate = new Date(loggedDates[i]);
      expectedDate.setDate(expectedDate.getDate() - 1);
      const expectedStr = expectedDate.toISOString().split("T")[0];
      const actualStr = actualDate.toISOString().split("T")[0];

      if (actualStr === expectedStr) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [activities]);

  const handleQuickAdd = async (qCat: ActivityLog["category"], qType: string, qVal: number, qNote: string) => {
    setLoading(true);
    setError("");
    try {
      await onAddActivity({
        date: new Date().toISOString().split("T")[0],
        category: qCat,
        type: qType,
        value: qVal,
        note: qNote,
      });
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to log quick-add.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: Omit<ActivityLog, "id" | "emissions">) => {
    setLoading(true);
    setError("");
    try {
      if (editingActivityId) {
        await onUpdateActivity(editingActivityId, data);
        setEditingActivityId(null);
      } else {
        await onAddActivity(data);
      }
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to save transaction.");
      throw err; // Re-throw to be caught by ActivityForm
    } finally {
      setLoading(false);
    }
  };

  const editingActivity = useMemo(() => {
    return activities.find(a => a.id === editingActivityId) || null;
  }, [activities, editingActivityId]);

  // Filtering and Searching
  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      const matchSearch =
        act.note?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchCategory = categoryFilter === "All" || act.category === categoryFilter;

      return matchSearch && matchCategory;
    });
  }, [activities, searchTerm, categoryFilter]);

  // Pagination Calculations
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage]);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage) || 1;

  const handlePageChange = (newPage: number) => {
    setCurrentPage(Math.max(1, Math.min(newPage, totalPages)));
  };

  return (
    <section className="space-y-6" aria-label="Transaction Ledger" data-testid="activity-ledger">
      {/* Header and Streak Counter */}
      <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl">
        <div>
          <h2 className="text-xl font-bold text-white">Activity transaction ledger</h2>
          <p className="text-xs text-muted">Track your daily activities as debits against your carbon budget. Consistent logging builds your streak and strengthens your reduction insights.</p>
        </div>
        
        {/* Streak Indicator */}
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold font-tabular"
          role="status"
          aria-label={`Current login streak: ${streak} days`}
        >
          <Flame className="animate-pulse" size={18} fill="currentColor" />
          <span>{streak} Day Streak</span>
        </div>
      </div>

      <QuickAddPanel onQuickAdd={handleQuickAdd} disabled={loading} />

      {error && !editingActivityId && <p className="text-xs text-accent-red font-medium">{error}</p>}

      {/* Main Forms and List layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActivityForm 
          initialData={editingActivity}
          onSubmit={handleFormSubmit}
          onCancelEdit={() => setEditingActivityId(null)}
          loading={loading}
          error={error}
        />

        {/* Searchable Activity List Table */}
        <div className="lg:col-span-2 ledger-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <h3 className="text-base font-bold text-white">Transaction History Ledger</h3>
              
              <div className="flex gap-2 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" size={14} />
                  <input
                    aria-label="Search activities"
                    type="text"
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="ledger-input pl-8 py-1.5 text-xs"
                  />
                </div>
                
                {/* Category Filter */}
                <select
                  aria-label="Filter category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Transport">Transport</option>
                  <option value="Energy">Energy</option>
                  <option value="Food">Food</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Waste">Waste</option>
                </select>
              </div>
            </div>

            {/* List */}
            <div className="border border-border rounded-xl overflow-hidden" data-testid="emission-log-table">
              {paginatedActivities.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-border/30 text-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Activity</th>
                        <th className="px-4 py-3 font-semibold text-right">Qty</th>
                        <th className="px-4 py-3 font-semibold text-right">Debit (kg CO2)</th>
                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {paginatedActivities.map((act) => (
                        <tr key={act.id} className="hover:bg-border/20 transition-colors">
                          <td className="px-4 py-3 text-muted font-mono whitespace-nowrap">{act.date}</td>
                          <td className="px-4 py-3 text-white">
                            <span className="bg-border/50 px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                              {act.category}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-white font-medium capitalize truncate max-w-[150px]" title={act.type.replace("_", " ")}>
                              {act.type.replace("_", " ")}
                            </p>
                            {act.note && (
                              <p className="text-[10px] text-muted truncate max-w-[150px]" title={act.note}>
                                {act.note}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-white font-tabular">{act.value}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="text-accent-amber font-bold font-tabular bg-accent-amber/10 px-2 py-1 rounded">
                              +{act.emissions.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingActivityId(act.id)}
                                aria-label={`Edit log dated ${act.date}`}
                                className="p-2 hover:text-white rounded hover:bg-border/40 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => onDeleteActivity(act.id)}
                                aria-label={`Delete log dated ${act.date}`}
                                className="p-2 text-accent-red/80 hover:text-accent-red rounded hover:bg-border/40 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8 text-center text-muted">
                  <p className="text-sm font-medium">No transactions found.</p>
                  <p className="text-xs mt-1">Try adjusting your filters or search term.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-xs text-muted">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} entries
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded border border-border text-white hover:bg-border/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Previous Page"
                >
                  <ArrowLeft size={16} />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded border border-border text-white hover:bg-border/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Next Page"
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
