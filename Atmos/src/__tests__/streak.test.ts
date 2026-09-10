import { describe, it, expect } from "vitest";

/**
 * Tests for the streak calculation logic extracted from useAppState.
 * The streak function computes consecutive logging days from an array of activities.
 */

interface ActivityLog {
  id: string;
  date: string;
  category: string;
  type: string;
  value: number;
  emissions: number;
}

/** Replica of streak calculation from useAppState for unit testing. */
function calculateStreak(activities: ActivityLog[]): number {
  if (activities.length === 0) return 0;

  const loggedDates = Array.from(new Set(activities.map((a) => a.date))).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const todayStr = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  if (loggedDates[0] !== todayStr && loggedDates[0] !== yesterdayStr) return 0;

  let count = 1;
  const expected = new Date(loggedDates[0]);
  for (let i = 1; i < loggedDates.length; i++) {
    expected.setDate(expected.getDate() - 1);
    const expStr = expected.toISOString().split("T")[0];
    if (loggedDates[i] === expStr) count++;
    else break;
  }
  return count;
}

function makeActivity(date: string): ActivityLog {
  return {
    id: `act_${date}`,
    date,
    category: "Transport",
    type: "car_petrol",
    value: 10,
    emissions: 1.8,
  };
}

function formatDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

describe("Streak Calculation", () => {
  it("should return 0 for empty activities", () => {
    expect(calculateStreak([])).toBe(0);
  });

  it("should return 1 for a single activity logged today", () => {
    const today = formatDate(new Date());
    expect(calculateStreak([makeActivity(today)])).toBe(1);
  });

  it("should return 1 for a single activity logged yesterday", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(calculateStreak([makeActivity(formatDate(yesterday))])).toBe(1);
  });

  it("should return 0 for an activity older than yesterday", () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    expect(calculateStreak([makeActivity(formatDate(twoDaysAgo))])).toBe(0);
  });

  it("should count consecutive days correctly", () => {
    const today = new Date();
    const activities: ActivityLog[] = [];

    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      activities.push(makeActivity(formatDate(d)));
    }

    expect(calculateStreak(activities)).toBe(5);
  });

  it("should break streak on gap days", () => {
    const today = new Date();
    const activities: ActivityLog[] = [
      makeActivity(formatDate(today)),
    ];

    // Skip yesterday, add day before yesterday
    const dayBeforeYesterday = new Date(today);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    activities.push(makeActivity(formatDate(dayBeforeYesterday)));

    expect(calculateStreak(activities)).toBe(1);
  });

  it("should handle duplicate dates (multiple activities on same day)", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const activities: ActivityLog[] = [
      makeActivity(formatDate(today)),
      { ...makeActivity(formatDate(today)), id: "act_dup" },
      makeActivity(formatDate(yesterday)),
    ];

    expect(calculateStreak(activities)).toBe(2);
  });
});
