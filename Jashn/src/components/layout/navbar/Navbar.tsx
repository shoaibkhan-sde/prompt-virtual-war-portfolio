'use client';

import React from 'react';
import styles from './navbar.module.css';
import { Logo } from './Logo';
import { NavLinks } from './NavLinks';
import { ThemeToggle } from './ThemeToggle';
import { MobileMenu } from './MobileMenu';

export const Navbar: React.FC = () => {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.brandGroup}>
          <Logo />
          <span className={styles.taglinePill}>GenAI Celebration Planner</span>
        </div>
        <div className={styles.spacer} />

        <NavLinks />

        <div className={styles.actions}>
          <MobileMenu />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
