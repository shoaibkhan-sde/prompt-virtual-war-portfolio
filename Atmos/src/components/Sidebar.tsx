import React from "react";
import { UserProfile } from "../lib/emissionFactors";
import { AppTab } from "../hooks/useAppState";
import {
  Leaf,
  LayoutDashboard,
  ClipboardList,
  MessageSquareCode,
  Target,
  CheckSquare,
  FileBarChart2,
  LogOut,
  WifiOff,
  Settings
} from "lucide-react";

interface SidebarProps {
  profile: UserProfile;
  offlineMode: boolean;
  activeTab: AppTab;
  mobileMenuOpen: boolean;
  onTabChange: (tab: AppTab) => void;
  onMobileMenuClose: () => void;
  onEditProfile: () => void;
  onResetAccount: () => void;
}

const navItems: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { id: "activities", label: "Transactions", icon: <ClipboardList size={16} /> },
  { id: "coach", label: "Atmos Coach", icon: <MessageSquareCode size={16} /> },
  { id: "goals", label: "Goals", icon: <Target size={16} /> },
  { id: "actions", label: "Checklist", icon: <CheckSquare size={16} /> },
  { id: "reports", label: "Reports", icon: <FileBarChart2 size={16} /> },
];

/**
 * Primary navigation sidebar with branded logo, tab links,
 * profile widget, offline badge, and reset account action.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  profile,
  offlineMode,
  activeTab,
  mobileMenuOpen,
  onTabChange,
  onMobileMenuClose,
  onEditProfile,
  onResetAccount,
}) => {
  return (
    <nav className={`
      fixed md:relative top-0 bottom-0 left-0 w-64 bg-surface border-r border-border p-5 flex flex-col justify-between z-30 transition-transform duration-300 md:translate-x-0
      ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:block"}
    `}
      aria-label="Main Navigation"
    >
      <div className="space-y-8">
        {/* Branded Logo */}
        <div className="flex items-center gap-2.5 pb-2 border-b border-border/80">
          <div className="w-8 h-8 rounded bg-gradient-to-r from-accent-teal to-cyan-500 flex items-center justify-center text-background animate-pulse">
            <Leaf size={18} />
          </div>
          <div>
            <span className="text-xl font-black tracking-tight text-white font-tabular block">ATMOS</span>
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest block">Carbon Ledger</span>
          </div>
        </div>

        {/* Offline Alert Badge */}
        {offlineMode && (
          <div className="p-3 bg-accent-amber/5 border border-accent-amber/20 rounded-lg flex items-center gap-2 text-[10px] text-accent-amber font-mono" role="alert">
            <WifiOff size={14} className="shrink-0" />
            <span>Running Offline (Local DB)</span>
          </div>
        )}

        {/* Navigation List Links */}
        <ul className="space-y-1.5" role="menu">
          {navItems.map((item) => (
            <li key={item.id} role="none">
              <button
                onClick={() => {
                  onTabChange(item.id);
                  onMobileMenuClose();
                }}
                role="menuitem"
                aria-current={activeTab === item.id ? "page" : undefined}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 outline-none
                  ${
                    activeTab === item.id
                      ? "bg-accent-teal/10 border-l-4 border-accent-teal text-white"
                      : "text-muted hover:bg-border/30 hover:text-white"
                  }
                `}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer Navigation (Profile actions) */}
      <div className="space-y-4 border-t border-border pt-4">
        <button
          onClick={onEditProfile}
          className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-border/60 hover:border-accent-teal/40 bg-surface/40 hover:bg-border/20 text-left transition-all group cursor-pointer outline-none min-h-[44px]"
          aria-label="Edit Household Profile and Region"
        >
          <div className="w-8 h-8 rounded-full bg-border group-hover:bg-accent-teal/10 border border-muted/20 group-hover:border-accent-teal/30 flex items-center justify-center text-xs font-bold text-white group-hover:text-accent-teal uppercase transition-colors shrink-0">
            {profile.country}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-bold text-white group-hover:text-accent-teal truncate transition-colors">
              Region: {profile.country}
            </p>
            <p className="text-[10px] text-muted truncate">Size: {profile.householdSize} {profile.householdSize === 1 ? "person" : "persons"}</p>
          </div>
          <Settings size={14} className="text-muted group-hover:text-accent-teal transition-colors shrink-0 animate-pulse" />
        </button>

        <button
          onClick={onResetAccount}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold text-muted hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/30 transition-all min-h-[44px]"
        >
          <LogOut size={14} className="text-rose-500/80" />
          Reset Account Ledger
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
