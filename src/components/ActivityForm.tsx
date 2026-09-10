/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useMemo, useEffect } from "react";
import { ActivityLog } from "../lib/emissionFactors";
import { Plus } from "lucide-react";

interface ActivityFormProps {
  initialData?: ActivityLog | null;
  onSubmit: (data: Omit<ActivityLog, "id" | "emissions">) => Promise<void>;
  onCancelEdit?: () => void;
  loading: boolean;
  error: string;
}

export const ActivityForm: React.FC<ActivityFormProps> = ({
  initialData,
  onSubmit,
  onCancelEdit,
  loading,
  error: externalError,
}) => {
  const isEditing = !!initialData;

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [category, setCategory] = useState<ActivityLog["category"]>("Transport");
  const [type, setType] = useState("car_petrol");
  const [value, setValue] = useState<number>(15);
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");

  useEffect(() => {
    if (initialData) {
      setDate(initialData.date);
      setCategory(initialData.category);
      // Timeout is needed if category changes options to let them render first
      setTimeout(() => {
        setType(initialData.type);
        setValue(initialData.value);
        setNote(initialData.note || "");
      }, 0);
    } else {
      setDate(new Date().toISOString().split("T")[0]);
      setCategory("Transport");
      setType("car_petrol");
      setValue(15);
      setNote("");
    }
  }, [initialData]);

  const typeOptions = useMemo(() => {
    switch (category) {
      case "Transport":
        return [
          { value: "car_petrol", label: "Gasoline Car Commute (km)" },
          { value: "car_diesel", label: "Diesel Car Commute (km)" },
          { value: "car_hybrid", label: "Hybrid Car Commute (km)" },
          { value: "car_electric", label: "Electric Vehicle Commute (km)" },
          { value: "public_bus", label: "Transit Bus Journey (km)" },
          { value: "public_train", label: "Transit Train Journey (km)" },
          { value: "flight_short", label: "Short-Haul Flight < 1500km (km)" },
          { value: "flight_medium", label: "Medium-Haul Flight < 3700km (km)" },
          { value: "flight_long", label: "Long-Haul Flight > 3700km (km)" },
          { value: "cycling_walking", label: "Active Commute (km)" },
        ];
      case "Energy":
        return [
          { value: "electricity", label: "Grid Electricity (kWh)" },
          { value: "natural_gas", label: "Natural Gas Heating (m3)" },
          { value: "heating_oil", label: "Heating Oil (Liters)" },
        ];
      case "Food":
        return [
          { value: "meat_heavy", label: "Meat-Heavy Diet (Days)" },
          { value: "average", label: "Average Diet (Days)" },
          { value: "vegetarian", label: "Vegetarian Diet (Days)" },
          { value: "vegan", label: "Vegan Diet (Days)" },
        ];
      case "Shopping":
        return [
          { value: "clothing", label: "Clothing Items Purchased (Items)" },
          { value: "electronics", label: "Consumer Electronics (Items)" },
          { value: "general_goods", label: "General Goods Purchased (kg/Items)" },
        ];
      case "Waste":
        return [
          { value: "landfill", label: "Mixed Landfill Waste (kg)" },
          { value: "recycling", label: "Recycled Materials (kg)" },
          { value: "composting", label: "Composted Organics (kg)" },
        ];
      default:
        return [];
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");
    if (value <= 0) {
      setLocalError("Please enter a quantity greater than zero.");
      return;
    }

    try {
      await onSubmit({ date, category, type, value, note });
      if (!isEditing) {
        setNote("");
        setValue(category === "Food" ? 1 : 10);
      }
    } catch (err: unknown) {
      setLocalError((err as Error).message || "Failed to save transaction.");
    }
  };

  const displayError = localError || externalError;

  return (
    <div className="lg:col-span-1 ledger-card h-fit space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <h3 className="text-base font-bold text-white">
          {isEditing ? "Modify Transaction" : "Log custom activity"}
        </h3>
        {isEditing && onCancelEdit && (
          <button 
            onClick={onCancelEdit}
            className="text-xs text-accent-red hover:underline min-h-[44px] px-2"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="log-date" className="text-xs font-semibold text-muted">Transaction Date</label>
          <input
            id="log-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ledger-input font-mono"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="log-category" className="text-xs font-semibold text-muted">Category</label>
          <select
            id="log-category"
            value={category}
            onChange={(e) => {
              const newCat = e.target.value as ActivityLog["category"];
              setCategory(newCat);
              
              let defaultType = "";
              let defaultValue = 10;
              if (newCat === "Transport") {
                defaultType = "car_petrol";
                defaultValue = 15;
              } else if (newCat === "Energy") {
                defaultType = "electricity";
                defaultValue = 50;
              } else if (newCat === "Food") {
                defaultType = "meat_heavy";
                defaultValue = 1;
              } else if (newCat === "Shopping") {
                defaultType = "clothing";
                defaultValue = 1;
              } else if (newCat === "Waste") {
                defaultType = "landfill";
                defaultValue = 5;
              }
              setType(defaultType);
              setValue(defaultValue);
            }}
            className="ledger-input"
          >
            <option value="Transport">Transport</option>
            <option value="Energy">Energy</option>
            <option value="Food">Food & Diet</option>
            <option value="Shopping">Shopping & Goods</option>
            <option value="Waste">Waste disposal</option>
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="log-type" className="text-xs font-semibold text-muted">Activity Type</label>
          <select
            id="log-type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="ledger-input"
          >
            {typeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="log-value" className="text-xs font-semibold text-muted">Quantity</label>
          <input
            id="log-value"
            type="number"
            step="any"
            min="0.01"
            value={value || ""}
            onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
            className="ledger-input font-tabular"
            required
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="log-note" className="text-xs font-semibold text-muted">Description/Note (Optional)</label>
          <input
            id="log-note"
            type="text"
            placeholder="e.g. Work commute, Weekly grocery shop"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="ledger-input"
          />
        </div>

        {displayError && <p className="text-xs text-accent-red font-medium">{displayError}</p>}

        <button
          type="submit"
          disabled={loading}
          className="ledger-btn-primary w-full min-h-[44px]"
        >
          {isEditing ? "Update Entry" : "Post Transaction"}
          <Plus size={16} />
        </button>
      </form>
    </div>
  );
};
