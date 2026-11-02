'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './hero.module.css';
import { SAMPLE_EVENTS } from './hero.data';

interface OrbitItem {
  idx: number;
  label: string;
  guests: number;
  armClass: string;
  imgSrc: string;
  imgAlt: string;
  imgPosition: string;
  iconBg: string;
  icon: React.ReactNode;
}

export const CelebrationOrbit: React.FC = () => {
  const [wedding, birthday, hackathon] = SAMPLE_EVENTS;
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const items: OrbitItem[] = [
    {
      idx: 0,
      label: wedding.label,
      guests: wedding.guests,
      armClass: styles.a1,
      imgSrc: '/images/hero/wedding.jpg',
      imgAlt: 'Wedding celebration',
      imgPosition: 'center 32%',
      iconBg: '#2E2A7A',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <circle cx="9" cy="14" r="5" />
          <circle cx="15" cy="14" r="5" />
        </svg>
      ),
    },
    {
      idx: 1,
      label: birthday.label,
      guests: birthday.guests,
      armClass: styles.a2,
      imgSrc: '/images/hero/birthday.jpg',
      imgAlt: 'Family birthday celebration',
      imgPosition: 'center 46%',
      iconBg: '#F5A524',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#14161C" strokeWidth="2">
          <rect x="4" y="12" width="16" height="8" rx="2" />
          <path d="M12 4v5" />
        </svg>
      ),
    },
    {
      idx: 2,
      label: hackathon.label,
      guests: hackathon.guests,
      armClass: styles.a3,
      imgSrc: '/images/hero/hackathon.jpg',
      imgAlt: 'Prompt Wars Hackathon celebration',
      imgPosition: 'center 40%',
      iconBg: '#0E6B6A',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.orbitContainer} aria-hidden="true">
      <div className={styles.orbwrap}>
        <svg className={styles.orbsvg} viewBox="0 0 480 440" fill="none">
        <circle
          cx="240"
          cy="220"
          r="170"
          stroke="rgba(255,255,255,.3)"
          strokeWidth="1.5"
          strokeDasharray="3 9"
        />
        <circle
          cx="240"
          cy="220"
          r="118"
          stroke="rgba(255,255,255,.14)"
          strokeWidth="1.5"
        />
      </svg>

      {/* Central circular photo frame with full edge-to-edge circular image */}
      <div className={styles.ctr}>
        {items.map((item) => (
          <div
            key={item.imgSrc}
            className={`${styles.ctrImageWrap} ${
              activeIdx === item.idx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <Image
              src={item.imgSrc}
              alt={item.imgAlt}
              fill
              priority
              sizes="204px"
              className={styles.ctrCircleImg}
              style={{ objectPosition: item.imgPosition, objectFit: 'cover' }}
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        ))}
      </div>

      {items.map((item) => {
        const isActive = activeIdx === item.idx;
        return (
          <div key={item.label} className={`${styles.arm} ${item.armClass}`}>
            <div className={styles.pos}>
              <div className={styles.cw}>
                <div
                  className={`${styles.chipo} ${isActive ? styles.chipoActive : ''}`}
                  onMouseEnter={() => setActiveIdx(item.idx)}
                  onClick={() => setActiveIdx(item.idx)}
                >
                  <span className={styles.av} style={{ background: item.iconBg }}>
                    {item.icon}
                  </span>
                  <span>
                    <b>{item.label}</b>
                    <small>{item.guests} guests</small>
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
};
