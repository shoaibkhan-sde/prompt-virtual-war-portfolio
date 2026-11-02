import React from 'react';
import styles from './hero.module.css';

const FLAG_COUNT = 22;

export const Bunting: React.FC = () => {
  return (
    <div className={styles.bunt} aria-hidden="true">
      <div className={styles.flags}>
        {Array.from({ length: FLAG_COUNT }).map((_, i) => (
          <i key={i} />
        ))}
      </div>
    </div>
  );
};
