import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StadiumMap } from '../StadiumMap';
import * as matchers from 'vitest-axe/matchers';
import { axe } from 'vitest-axe';

expect.extend(matchers);

const mockProps = {
  zones: [
    { zoneId: 'z1', name: 'North Stand', capacity: 20000, currentCount: 17000, density: 85, status: 'HIGH' as const, updatedAt: '' },
    { zoneId: 'z2', name: 'South Stand', capacity: 22000, currentCount: 8800, density: 40, status: 'LOW' as const, updatedAt: '' }
  ],
  gates: [
    { gateId: 'g1', name: 'Gate 1', nearZone: 'z1', isADACompliant: true, notes: 'Wheelchair accessible' },
    { gateId: 'g2', name: 'Gate 2', nearZone: 'z2', isADACompliant: false, notes: '' }
  ],
  transitHubs: [
    { hubId: 'Hub-1', name: 'Metro Station Central', type: 'Train', nearGate: 'g1', isEcoFriendly: true }
  ],
  highlights: [],
  activeIncidentZones: []
};

describe('StadiumMap', () => {
  it('renders the STADIUM VISUALIZER title', () => {
    render(<StadiumMap {...mockProps} />);
    expect(screen.getByText('STADIUM VISUALIZER')).toBeInTheDocument();
  });

  it('renders zone names in the map', () => {
    render(<StadiumMap {...mockProps} />);
    // SVG text elements with zone names should be rendered
    expect(screen.getAllByText(/Stand/i).length).toBeGreaterThan(0);
  });

  it('renders without crashing with empty zones', () => {
    render(<StadiumMap {...{ ...mockProps, zones: [] }} />);
    expect(screen.getByText('STADIUM VISUALIZER')).toBeInTheDocument();
  });

  it('renders without crashing with empty gates', () => {
    render(<StadiumMap {...{ ...mockProps, gates: [] }} />);
    expect(screen.getByText('STADIUM VISUALIZER')).toBeInTheDocument();
  });

  it('renders with highlighted zones', () => {
    const { container } = render(<StadiumMap {...{ ...mockProps, highlights: ['z1'] }} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with active incident zones', () => {
    const { container } = render(<StadiumMap {...{ ...mockProps, activeIncidentZones: ['z1'] }} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('shows ADA compliance info in legend or tooltips', () => {
    render(<StadiumMap {...mockProps} />);
    // ADA label should appear somewhere in the legend
    expect(screen.queryByText(/ADA/i)).not.toBeNull();
    expect(document.body).toBeTruthy();
  });

  it('passes accessibility audit', async () => {
    const { container } = render(<StadiumMap {...mockProps} />);
    const results = await axe(container);
    // @ts-ignore - vitest-axe type augmentation
    expect(results).toHaveNoViolations();
  });
});
