import React from 'react';
import Link from 'next/link';
import styles from './navbar.module.css';

export const Logo: React.FC = () => {
  return (
    <Link href="/" className={styles.brand} aria-label="Jashn, home">
      <svg
        width="40"
        height="40"
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Four long rounded rays (4x12, radius 2, marigold #F5A524) at 0, 90, 180, 270 degrees */}
        <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" />
        <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" transform="rotate(90 20 20)" />
        <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" transform="rotate(180 20 20)" />
        <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" transform="rotate(270 20 20)" />

        {/* Four shorter rounded rays (3x8, radius 1.5, light marigold #FFD98A) at 45, 135, 225, 315 degrees */}
        <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(45 20 20)" />
        <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(135 20 20)" />
        <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(225 20 20)" />
        <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(315 20 20)" />

        {/* White center circle (radius 4.5) */}
        <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" />
      </svg>
      <span className={styles.wordmark}>Jashn</span>
    </Link>
  );
};
