'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navbar.module.css';
import { NAV_ITEMS } from './nav.config';
import { isActive } from './isActive';

export const MobileMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname() || '/';

  return (
    <>
      <button
        type="button"
        className={styles.mobileToggle}
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div id="mobile-nav-panel" className={`${styles.mobilePanel} ${styles.mobilePanelOpen}`}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.mobileNavLink} ${active ? styles.activeMobileNavLink : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => setIsOpen(false)}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span>{item.label}</span>
                  {item.hasArrow && <span aria-hidden="true">↗</span>}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
};
