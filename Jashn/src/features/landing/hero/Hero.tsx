'use client';

import React from 'react';
import styles from './hero.module.css';
import { APP_NAME } from '@/config/brand';
import { Bunting } from './Bunting';
import { FloatingDots } from './FloatingDots';
import { HeadlineCycler } from './HeadlineCycler';
import { EventTypeChips } from './EventTypeChips';
import { CelebrationOrbit } from './CelebrationOrbit';
import { EventTicker } from './EventTicker';
interface HeroProps {
  onStartPlan?: () => void;
  onSamplePlan?: () => void;
  selectedType?: string;
  onSelectType?: (type: string) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onStartPlan,
  onSamplePlan,
}) => {
  const eyebrowText = 'One planner for every celebration';

  return (
    <>
      <section className={styles.hero} aria-label={`Welcome to ${APP_NAME}`}>
        <Bunting />
        <FloatingDots />
        <div className={styles.heroin}>
          <div>
            <span className={styles.eb}>{eyebrowText}</span>
            <HeadlineCycler />
            <p className={styles.subtext}>
              Budget, timeline, vendors and ideas in one place. Private in your browser.
            </p>
            <EventTypeChips />
            <div className={styles.btnRow}>
              <button
                type="button"
                className={`${styles.btn} ${styles.gold}`}
                onClick={onStartPlan}
              >
                Start a new plan
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.ghost}`}
                onClick={onSamplePlan}
              >
                Try a sample plan
              </button>
            </div>
          </div>
          <CelebrationOrbit />
        </div>
      </section>
      <EventTicker />
    </>
  );
};

export default Hero;
