import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AlertStrip } from '../AlertStrip';
import type { Incident } from '../../types';
import * as matchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';

expect.extend(matchers);

const mockIncidentHigh: Incident = {
  incidentId: 'test-1',
  description: 'North Stand is at 95% capacity',
  reportedBy: 'system',
  zoneId: 'Zone-A',
  priority: 'HIGH',
  category: 'crowd',
  summary: 'Critical Crowd Alert',
  status: 'active',
  createdAt: new Date().toISOString()
};

const mockIncidentMedium: Incident = {
  incidentId: 'test-2',
  description: 'East Stand queue forming',
  reportedBy: 'volunteer',
  zoneId: 'Zone-B',
  priority: 'MEDIUM',
  category: 'crowd',
  summary: 'Elevated Crowd Density',
  status: 'active',
  createdAt: new Date().toISOString()
};

const resolvedIncident: Incident = {
  ...mockIncidentHigh,
  incidentId: 'test-3',
  status: 'resolved',
  summary: 'Old Resolved Incident'
};

describe('AlertStrip component', () => {
  it('renders the Live Ops indicator', () => {
    render(<AlertStrip incidents={[]} />);
    expect(screen.getByText('Live Ops')).toBeInTheDocument();
  });

  it('shows "All zones operating normally" when no active incidents', () => {
    render(<AlertStrip incidents={[]} />);
    expect(screen.getByText(/All zones operating normally/i)).toBeInTheDocument();
  });

  it('does not show resolved incidents in the strip', () => {
    render(<AlertStrip incidents={[resolvedIncident]} />);
    expect(screen.queryByText(/Old Resolved Incident/i)).not.toBeInTheDocument();
    expect(screen.getByText(/All zones operating normally/i)).toBeInTheDocument();
  });

  it('displays HIGH priority incident summary', () => {
    render(<AlertStrip incidents={[mockIncidentHigh]} />);
    expect(screen.getByText(/Critical Crowd Alert/i)).toBeInTheDocument();
  });

  it('displays MEDIUM priority incident', () => {
    render(<AlertStrip incidents={[mockIncidentMedium]} />);
    expect(screen.getByText(/Elevated Crowd Density/i)).toBeInTheDocument();
  });

  it('calls onIncidentClick when clicking an incident', () => {
    const onClick = vi.fn();
    render(<AlertStrip incidents={[mockIncidentHigh]} onIncidentClick={onClick} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledWith(mockIncidentHigh);
  });

  it('renders multiple active incidents', () => {
    render(<AlertStrip incidents={[mockIncidentHigh, mockIncidentMedium]} />);
    expect(screen.getByText(/Critical Crowd Alert/i)).toBeInTheDocument();
    expect(screen.getByText(/Elevated Crowd Density/i)).toBeInTheDocument();
  });

  it('passes accessibility audit', async () => {
    const { container } = render(<AlertStrip incidents={[mockIncidentHigh]} />);
    const results = await axe(container);
    // @ts-ignore - vitest-axe augmentation
    expect(results).toHaveNoViolations();
  });
});
