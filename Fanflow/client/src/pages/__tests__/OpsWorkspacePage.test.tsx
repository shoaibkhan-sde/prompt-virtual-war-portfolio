import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OpsWorkspacePage } from '../OpsWorkspacePage';
import * as matchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';

expect.extend(matchers);

// Mock recharts to prevent SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="chart-container">{children}</div>
  ),
  AreaChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Area: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: { div: ({ children, ...p }: any) => <div {...p}>{children}</div> },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockZones = [
  { zoneId: 'z1', name: 'North Stand', density: 85, capacity: 20000, currentCount: 17000, status: 'HIGH', updatedAt: new Date().toISOString() },
  { zoneId: 'z2', name: 'South Stand', density: 40, capacity: 22000, currentCount: 8800, status: 'LOW', updatedAt: new Date().toISOString() },
];

const mockIncidents = [
  {
    incidentId: 'i1',
    zoneId: 'North Stand',
    category: 'crowd',
    priority: 'HIGH',
    status: 'active',
    summary: 'Critical Crowd Density',
    description: 'Density has reached 85%. Immediate dispatch recommended.',
    reportedBy: 'system',
    createdAt: new Date().toISOString(),
  },
];

describe('OpsWorkspacePage', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn((url: string) => {
      if (String(url).includes('/api/incidents')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockIncidents) });
      }
      if (String(url).includes('/api/crowd')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockZones) });
      }
      return Promise.reject(new Error('Unknown URL'));
    }) as unknown as typeof fetch;
  });

  it('renders the Incident Triage Queue heading', async () => {
    await act(async () => { render(<OpsWorkspacePage />); });
    expect(screen.getByText(/Incident Triage Queue/i)).toBeInTheDocument();
  });

  it('renders the Crowd Density Trend chart area', async () => {
    await act(async () => { render(<OpsWorkspacePage />); });
    expect(screen.getByText(/Crowd Density Trend/i)).toBeInTheDocument();
    expect(screen.getByTestId('chart-container')).toBeInTheDocument();
  });

  it('shows incident summary text after data loads', async () => {
    await act(async () => { render(<OpsWorkspacePage />); });
    const elements = screen.getAllByText(/Critical Crowd Density/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows HIGH priority badge for critical incident', async () => {
    await act(async () => { render(<OpsWorkspacePage />); });
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  it('shows zone name in incident row', async () => {
    await act(async () => { render(<OpsWorkspacePage />); });
    const elements = screen.getAllByText(/North Stand/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('shows Resource Assignment section heading', async () => {
    await act(async () => { render(<OpsWorkspacePage />); });
    expect(screen.getByText(/Resource Assignment/i)).toBeInTheDocument();
  });

  it('handles fetch failure gracefully with mock fallback data', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error')) as unknown as typeof fetch;
    await act(async () => { render(<OpsWorkspacePage />); });
    // Should still render page structure
    expect(screen.getByText(/Incident Triage Queue/i)).toBeInTheDocument();
  });

  it('passes accessibility audit', async () => {
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<OpsWorkspacePage />));
    });
    const results = await axe(container);
    // @ts-ignore - vitest-axe type augmentation
    expect(results).toHaveNoViolations();
  });
});
