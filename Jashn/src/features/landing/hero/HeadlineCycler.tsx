import React from 'react';
import styles from './hero.module.css';
import { HEADLINE_WORDS } from './hero.data';

export const HeadlineCycler: React.FC = () => {
  const wordsWithWrap = [...HEADLINE_WORDS, HEADLINE_WORDS[0]];

  return (
    <p className={styles.hl}>
      <span className={styles.srOnly}>Plan your next celebration</span>
      <span aria-hidden="true">
        Plan your next{' '}
        <span className={styles.win}>
          <span className={styles.words}>
            {wordsWithWrap.map((word, i) => (
              <span key={`${word}-${i}`}>{word}</span>
            ))}
          </span>
        </span>
      </span>
    </p>
  );
};
