'use client';

import React from 'react';

export const CelebrationMarquee: React.FC = () => {
  const items = [
    'Weddings',
    'Birthdays',
    'Eid celebrations',
    'Baby showers',
    'Anniversaries',
    'Society festivals',
    'Community Celebrations',
    'Reunions',
    'Diwali meets',
    'Sangeet Nights',
    'Haldi Ceremonies',
  ];

  return (
    <div
      className="mq bg-[#F5A524] text-[#14161C] overflow-hidden font-bold text-sm min-h-[44px] flex items-center select-none"
      aria-hidden="true"
    >
      <div className="mqt flex whitespace-nowrap animate-[mq_36s_linear_infinite] motion-reduce:animate-none">
        {Array.from({ length: 4 }).map((_, repeatIndex) => (
          <React.Fragment key={repeatIndex}>
            {items.map((item, idx) => (
              <span key={`${repeatIndex}-${idx}`} className="px-5 flex items-center gap-4">
                <span>{item}</span>
                <span className="opacity-60 text-xs">·</span>
              </span>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
