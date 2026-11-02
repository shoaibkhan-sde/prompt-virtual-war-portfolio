'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navbar.module.css';
import { NAV_ITEMS } from './nav.config';
import { isActive } from './isActive';

export const NavLinks: React.FC = () => {
  const pathname = usePathname() || '/';

  return (
    <nav aria-label="Main" className={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className={`${styles.navLink} ${active ? styles.activeNavLink : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <span className="inline-flex items-center gap-1.5">
              <span>{item.label}</span>
              {item.hasArrow && (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-70 group-hover:opacity-100 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  aria-hidden="true"
                >
                  <line x1="7" y1="17" x2="17" y2="7" />
                  <polyline points="7 7 17 7 17 17" />
                </svg>
              )}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
