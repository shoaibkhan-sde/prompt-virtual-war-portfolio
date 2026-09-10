import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Dashboard } from '../components/Dashboard';
import { ActivityLogger } from '../components/ActivityLogger';
import { AtmosCoach } from '../components/AtmosCoach';
import { Goals } from '../components/Goals';

expect.extend(toHaveNoViolations);

// Mock scrollIntoView which is not implemented in jsdom
window.HTMLElement.prototype.scrollIntoView = function() {};

describe('Accessibility Tests (axe-core)', () => {
  const mockProfile = {
    country: "US",
    householdSize: 1,
    primaryTransport: "car_petrol",
    weeklyTransportKm: 100,
    dietType: "average",
    electricityKwh: 200,
    heatingType: "natural_gas",
    heatingQty: 30,
    recycleCompost: false
  };

  const mockActivities = [
    {
      id: "act_1",
      date: "2023-01-01",
      category: "Transport" as const,
      type: "car_petrol",
      value: 10,
      emissions: 1.8,
      note: "Test"
    }
  ];

  it('Dashboard should have no accessibility violations', async () => {
    const { container } = render(
      <Dashboard 
        profile={mockProfile} 
        activities={mockActivities} 
        dailyBudget={10} 
        streak={1}
        onNavigate={() => {}} 
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('ActivityLogger should have no accessibility violations', async () => {
    const { container } = render(
      <ActivityLogger 
        activities={mockActivities} 
        onAddActivity={async () => {}}
        onUpdateActivity={async () => {}}
        onDeleteActivity={async () => {}}
      />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AtmosCoach should have no accessibility violations', async () => {
    const { container } = render(
      <AtmosCoach 
        profile={mockProfile}
        activities={mockActivities}
        onAdoptAction={() => {}}
      />
    );
    // Ignore color-contrast in tests if JSDOM doesn't render CSS styles fully
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(results).toHaveNoViolations();
  });

  it('Goals should have no accessibility violations', async () => {
    const { container } = render(
      <Goals 
        profile={mockProfile}
        activities={mockActivities}
        currentGoals={{ targetPercent: 15, targetAnnualKg: 2000 }}
        onUpdateGoals={async () => {}}
      />
    );
    const results = await axe(container, {
      rules: { 'color-contrast': { enabled: false } }
    });
    expect(results).toHaveNoViolations();
  });
});
