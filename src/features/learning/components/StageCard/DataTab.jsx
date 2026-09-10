import React from 'react';
import { Newspaper, CheckCircle, ExternalLink } from 'lucide-react';
import { REAL_WORLD_DATA } from '@/shared/utils/real_world_data';

export default function DataTab({ stageId, stageTitle }) {
  const rw = (REAL_WORLD_DATA && REAL_WORLD_DATA[stageId]) || (REAL_WORLD_DATA && REAL_WORLD_DATA.announcement) || { stats: [], cases: [], link: { label: '', url: '#' } };
  
  return (
    <div className="tab-data">
      <h3 className="tab-heading">
        Real World · {stageTitle}
      </h3>
      <p className="tab-subtext">
        Actual data, landmark rulings, and verified facts from Indian elections.
      </p>

      {/* Stats grid */}
      <div className="data-stats-grid">
        {rw.stats.map((stat, i) => (
          <div key={i} className="data-stat-card">
            <div className="data-stat-icon">{stat.icon}</div>
            <div className="data-stat-value">{stat.value}</div>
            <div className="data-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Case studies */}
      <div className="data-cases-header">
        <Newspaper size={16} className="icon-gold" />
        <h4>Landmark Cases & Notable Events</h4>
      </div>

      <div className="data-cases-list">
        {rw.cases.map((c, i) => (
          <div key={i} className="data-case-item">
            <div className="data-case-content">
              <span className="data-case-icon">{c.icon}</span>
              <div className="data-case-text">
                <div className="data-case-header-row">
                  <span className="data-case-title">{c.title}</span>
                  <span className="data-case-date">{c.date}</span>
                </div>
                <p className="data-case-body">{c.body}</p>
                <div className="data-case-verdict">
                  <CheckCircle size={13} className="icon-success" />
                  <span>{c.verdict}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* External link */}
      <a
        href={rw.link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="data-external-link"
      >
        <ExternalLink size={15} />
        {rw.link.label}
      </a>
    </div>
  );
}
