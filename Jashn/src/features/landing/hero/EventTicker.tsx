import React from 'react';
import styles from './hero.module.css';
import { TICKER_ITEMS } from './hero.data';

export const EventTicker: React.FC = () => {
  // Rendered 4 times so translateX(-50%) creates a seamless loop
  const repeatCounts = [0, 1, 2, 3];

  return (
    <div className={styles.mq} aria-hidden="true">
      <div className={styles.mqt}>
        {repeatCounts.map((rep) => (
          <React.Fragment key={rep}>
            {TICKER_ITEMS.map((item, idx) => (
              <React.Fragment key={`${rep}-${idx}`}>
                <span>{item}</span>
                <span>·</span>
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
