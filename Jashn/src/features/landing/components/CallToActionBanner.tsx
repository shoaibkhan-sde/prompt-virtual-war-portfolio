'use client';

import React from 'react';
import styles from './CallToActionBanner.module.css';

export const CallToActionBanner: React.FC = () => {
  return (
    <section aria-label="Jashn blueprint" className="py-16 sm:py-20 text-center">
      <h2 className={`${styles.heading} text-slate-900 dark:text-white`}>
        Design your{' '}
        <span className={styles.shimmerText}>
          Jashn blueprint
        </span>{' '}
        in{' '}
        <span className={styles.stepHighlight}>
          three simple steps
        </span>
      </h2>
    </section>
  );
};

export default CallToActionBanner;
