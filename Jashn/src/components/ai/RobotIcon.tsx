'use client';

import React from 'react';

interface RobotIconProps {
  className?: string;
  size?: number;
}

export const RobotIcon: React.FC<RobotIconProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Celebration sparkle crest */}
    <path
      d="M12 2L13.1 4.7L15.8 5.8L13.1 6.9L12 9.6L10.9 6.9L8.2 5.8L10.9 4.7L12 2Z"
      fill="#F5A524"
    />
    {/* Contoured celebration mascot face */}
    <rect
      x="3.5"
      y="7.5"
      width="17"
      height="13.5"
      rx="6.5"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.12"
    />
    {/* Curved happy expressive eyes */}
    <path
      d="M7.5 13.5C8 12.2 9.5 12.2 10 13.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M14 13.5C14.5 12.2 16 12.2 16.5 13.5"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    {/* Cheerful celebration smile */}
    <path
      d="M10 16.5C10.8 17.6 13.2 17.6 14 16.5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    {/* Golden celebration cheek accents */}
    <circle cx="6.5" cy="15.8" r="1.1" fill="#F5A524" />
    <circle cx="17.5" cy="15.8" r="1.1" fill="#F5A524" />
  </svg>
);

export default RobotIcon;
