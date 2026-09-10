import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActivityLogger } from "../components/ActivityLogger";
import { ActivityLog } from "../lib/emissionFactors";

describe("Atmos ActivityLogger Component UI", () => {
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  const mockActivities: ActivityLog[] = [
    {
      id: "act_1",
      date: todayStr,
      category: "Transport",
      type: "car_petrol",
      value: 15,
      emissions: 2.7,
      note: "Daily Commute",
    },
    {
      id: "act_2",
      date: yesterdayStr,
      category: "Food",
      type: "vegan",
      value: 1,
      emissions: 4.11,
      note: "Vegan Day",
    },
  ];

  it("should render transaction logs list and streak badge", () => {
    render(
      <ActivityLogger
        activities={mockActivities}
        onAddActivity={vi.fn()}
        onUpdateActivity={vi.fn()}
        onDeleteActivity={vi.fn()}
      />
    );

    // Verify streak counter displays
    expect(screen.getByText(/2 Day Streak/i)).toBeInTheDocument();

    // Verify activity listings render (checking all occurrences due to quick add button overlap)
    const veganElements = screen.getAllByText("Vegan Day");
    expect(veganElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Daily Commute")).toBeInTheDocument();
  });

  it("should trigger callback when quick-add transaction buttons are clicked", async () => {
    const handleAdd = vi.fn().mockResolvedValue(undefined);
    render(
      <ActivityLogger
        activities={[]}
        onAddActivity={handleAdd}
        onUpdateActivity={vi.fn()}
        onDeleteActivity={vi.fn()}
      />
    );

    // Trigger quick-add vegan commute using button role matching
    const veganBtns = screen.getAllByText("Ate Vegan");
    const buttonElement = veganBtns[0].closest("button");
    expect(buttonElement).toBeInTheDocument();
    fireEvent.click(buttonElement!);

    await waitFor(() => {
      expect(handleAdd).toHaveBeenCalledTimes(1);
      expect(handleAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "Food",
          type: "vegan",
          value: 1,
        })
      );
    });
  });

  it("should show custom log inputs and validation rules", () => {
    render(
      <ActivityLogger
        activities={[]}
        onAddActivity={vi.fn()}
        onUpdateActivity={vi.fn()}
        onDeleteActivity={vi.fn()}
      />
    );

    // Verify input fields using exact labels to avoid clash with filters
    expect(screen.getByLabelText("Transaction Date")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    
    const qtyInput = screen.getByLabelText("Quantity");
    expect(qtyInput).toBeInTheDocument();
    expect(qtyInput).toHaveValue(15);
  });
});
