import React from 'react';
import styles from './hero.module.css';
import { FLOATING_DOTS } from './hero.data';

export const FloatingDots: React.FC = () => {
  return (
    <>
      {FLOATING_DOTS.map((dot, idx) => (
        <b
          key={idx}
          className={styles.bub}
          aria-hidden="true"
          style={{
            left: dot.left,
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            animationDuration: dot.duration,
            animationDelay: dot.delay,
          }}
        />
      ))}
    </>
  );
};
