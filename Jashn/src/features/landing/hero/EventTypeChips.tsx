import React from 'react';
import styles from './hero.module.css';
import { EVENT_CHIPS } from './hero.data';

interface EventTypeChipsProps {
  selected?: string;
  onSelect?: (type: string) => void;
}

export const EventTypeChips: React.FC<EventTypeChipsProps> = () => {
  return (
    <div className={styles.chipsRow} aria-label="Celebration types supported">
      {EVENT_CHIPS.map((type) => (
        <span
          key={type}
          className={styles.staticChip}
        >
          {type}
        </span>
      ))}
    </div>
  );
};
