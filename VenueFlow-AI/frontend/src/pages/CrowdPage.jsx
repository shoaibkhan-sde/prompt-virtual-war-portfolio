import React from 'react';
import CrowdDashboard from '../components/CrowdDashboard';

export default function CrowdPage() {
  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tighter leading-tight font-display">
            Crowd
          </h2>
          <p className="text-sm text-theme-secondary opacity-100 font-medium">
            Real-time occupancy metrics and flow density monitoring.
          </p>
        </div>
      </div>

      <CrowdDashboard />
    </div>
  );
}
