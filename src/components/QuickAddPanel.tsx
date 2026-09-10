import React from "react";
import { ActivityLog } from "../lib/emissionFactors";
import { Zap } from "lucide-react";

interface QuickAddPanelProps {
  onQuickAdd: (category: ActivityLog["category"], type: string, value: number, note: string) => void;
  disabled: boolean;
}

export const QuickAddPanel: React.FC<QuickAddPanelProps> = ({ onQuickAdd, disabled }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">Quick debit transaction</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <button
          onClick={() => onQuickAdd("Transport", "car_petrol", 20, "20km Car Commute")}
          disabled={disabled}
          className="ledger-card p-4 hover:border-accent-teal/50 text-center flex flex-col items-center justify-center space-y-2 group transition-all min-h-[44px]"
        >
          <Zap className="text-accent-teal group-hover:scale-110 transition-transform" size={20} />
          <span className="text-xs font-bold text-white block">Drive to Work</span>
          <span className="text-[10px] font-mono text-muted">20 km (3.6kg)</span>
        </button>
        
        <button
          onClick={() => onQuickAdd("Transport", "public_train", 30, "30km Train Journey")}
          disabled={disabled}
          className="ledger-card p-4 hover:border-accent-teal/50 text-center flex flex-col items-center justify-center space-y-2 group transition-all min-h-[44px]"
        >
          <Zap className="text-cyan-500 group-hover:scale-110 transition-transform" size={20} />
          <span className="text-xs font-bold text-white block">Take the Train</span>
          <span className="text-[10px] font-mono text-muted">30 km (0.9kg)</span>
        </button>

        <button
          onClick={() => onQuickAdd("Food", "vegan", 1, "Vegan Diet Day")}
          disabled={disabled}
          className="ledger-card p-4 hover:border-accent-teal/50 text-center flex flex-col items-center justify-center space-y-2 group transition-all min-h-[44px]"
        >
          <Zap className="text-emerald-500 group-hover:scale-110 transition-transform" size={20} />
          <span className="text-xs font-bold text-white block">Ate Vegan</span>
          <span className="text-[10px] font-mono text-muted">(4.1kg)</span>
        </button>

        <button
          onClick={() => onQuickAdd("Food", "meat_heavy", 1, "Meat heavy Meal Day")}
          disabled={disabled}
          className="ledger-card p-4 hover:border-accent-teal/50 text-center flex flex-col items-center justify-center space-y-2 group transition-all min-h-[44px]"
        >
          <Zap className="text-accent-red group-hover:scale-110 transition-transform" size={20} />
          <span className="text-xs font-bold text-white block">Standard Diet</span>
          <span className="text-[10px] font-mono text-muted">(9.0kg)</span>
        </button>

        <button
          onClick={() => onQuickAdd("Shopping", "clothing", 1, "Garment purchase")}
          disabled={disabled}
          className="ledger-card p-4 hover:border-accent-teal/50 text-center flex flex-col items-center justify-center space-y-2 group col-span-2 sm:col-span-1 transition-all min-h-[44px]"
        >
          <Zap className="text-purple-500 group-hover:scale-110 transition-transform" size={20} />
          <span className="text-xs font-bold text-white block">New Clothes</span>
          <span className="text-[10px] font-mono text-muted">(15.0kg)</span>
        </button>
      </div>
    </div>
  );
};
