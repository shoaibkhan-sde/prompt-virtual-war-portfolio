import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function MistakesTab({ mistakes }) {
  return (
    <div className="tab-mistakes">
      <h3 className="tab-heading">Common Roadblocks</h3>
      <div className="mistake-grid">
        {(mistakes || []).map((m, i) => (
          <div key={i} className="mistake-card">
            <div className="mistake-title">
              <AlertTriangle size={14} className="icon-orange" /> {m?.title || 'Unknown Issue'}
            </div>
            <div className="mistake-consequence">↳ {m?.consequence || 'Potential risk'}</div>
            <div className="mistake-fix">
              <CheckCircle size={14} className="icon-green" /> Fix: {m?.fix || 'Consult the ECI guide.'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
