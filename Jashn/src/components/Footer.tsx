'use client';

import React from 'react';
export const Footer: React.FC = () => {
  return (
    <footer className="ft bg-[#161822] dark:bg-[#0B0D13] text-[#C9CCD8] dark:text-[#A0A4B8] mt-16 border-t border-[#262A3B] dark:border-[#1F2230] print:hidden transition-colors">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8 py-12">
        {/* Top Call to Action Row */}
        <div className="flex justify-between items-center gap-5 flex-wrap pb-8 border-b border-[#262A3B] dark:border-[#1F2230]">
          <div>
            <div className="text-white text-2xl font-extrabold">
              Your celebration, planned.
            </div>
            <div className="text-sm mt-1 text-[#A0A4B8]">
              Free to use. No sign-up. Your plans stay on your device.
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] gap-8 py-8">
          <div>
            <div className="flex items-center gap-2.5 text-white font-extrabold text-xl">
              <svg width="32" height="32" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" />
                <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" transform="rotate(90 20 20)" />
                <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" transform="rotate(180 20 20)" />
                <rect x="18" y="2" width="4" height="12" rx="2" fill="#F5A524" transform="rotate(270 20 20)" />
                <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(45 20 20)" />
                <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(135 20 20)" />
                <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(225 20 20)" />
                <rect x="18.5" y="5" width="3" height="8" rx="1.5" fill="#FFD98A" transform="rotate(315 20 20)" />
                <circle cx="20" cy="20" r="4.5" fill="#FFFFFF" />
              </svg>
              <span>Jashn</span>
            </div>
            <p className="text-sm leading-relaxed mt-3 max-w-[300px] text-[#A0A4B8]">
              A planning assistant for weddings, birthdays, hackathons, and community celebrations.
            </p>
          </div>

          <div>
            <p className="text-white font-bold text-sm mb-2">Plan</p>
            <div className="space-y-1.5 text-sm">
              <span className="block text-[#A0A4B8]">Budget breakdown</span>
              <span className="block text-[#A0A4B8]">Milestone timeline</span>
              <span className="block text-[#A0A4B8]">Vendor checklist</span>
            </div>
          </div>

          <div>
            <p className="text-white font-bold text-sm mb-2">Event types</p>
            <div className="space-y-1.5 text-sm">
              <span className="block text-[#A0A4B8]">Weddings</span>
              <span className="block text-[#A0A4B8]">Birthdays</span>
              <span className="block text-[#A0A4B8]">Community events</span>
              <span className="block text-[#A0A4B8]">Community Festivals</span>
            </div>
          </div>

          <div>
            <p className="text-white font-bold text-sm mb-2">Architecture & Trust</p>
            <div className="space-y-1.5 text-sm">
              <span className="block text-[#A0A4B8]">Pure Domain Math</span>
              <span className="block text-[#A0A4B8]">Offline Fallback Engine</span>
              <span className="block text-[#A0A4B8]">WCAG AA Compliant</span>
              <span className="block text-[#A0A4B8]">Zero Data Tracking</span>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex justify-between items-center gap-3 flex-wrap pt-5 border-t border-[#262A3B] dark:border-[#1F2230] text-xs text-[#A0A4B8]">
          <span>© 2026 Jashn. Crafted with care for every celebration.</span>
        </div>
      </div>
    </footer>
  );
};
