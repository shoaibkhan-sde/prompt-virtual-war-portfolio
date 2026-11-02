'use client';

import React from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { EventType } from '@/domain/types';
import { Heart, Cake, Users, Sparkles } from 'lucide-react';

export const TemplateStarters: React.FC = () => {
  const { loadTemplate, plan } = usePlannerStore();

  const templates: {
    type: EventType;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      type: 'wedding',
      title: 'Wedding',
      description: 'Venue, catering, decor, sangeet, mehendi and haldi.',
      icon: <Heart size={24} className="text-white" />,
      color: '#2E2A7A',
    },
    {
      type: 'birthday',
      title: 'Birthday',
      description: 'Theme, cake, games, food and return gifts.',
      icon: <Cake size={24} className="text-[#14161C]" />,
      color: '#F5A524',
    },
    {
      type: 'community',
      title: 'Community event',
      description: 'Permissions, volunteers, sponsors and sound.',
      icon: <Users size={24} className="text-white" />,
      color: '#0E6B6A',
    },
    {
      type: 'festival',
      title: 'Festival',
      description: 'Diwali, Navratri, cultural melas and society celebrations.',
      icon: <Sparkles size={24} className="text-white" />,
      color: '#8A2D6B',
    },
  ];

  return (
    <section aria-labelledby="templates-heading" className="mt-12">
      <h2
        id="templates-heading"
        className="text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#14161C] dark:text-white mb-1"
      >
        Start from a template
      </h2>
      <p className="text-[#5B6070] dark:text-[#C9CCD8] text-sm sm:text-base mb-6">
        Each template brings its own budget split, timeline and vendor list.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {templates.map((tpl) => {
          const isActive = plan.eventType === tpl.type;

          return (
            <div
              key={tpl.type}
              className={`bg-white dark:bg-[#1C1F2B] border rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between ${
                isActive
                  ? 'border-[#2E2A7A] dark:border-[#5A53DA] ring-2 ring-[#2E2A7A]/20'
                  : 'border-[#E6E7EE] dark:border-[#2C3040]'
              }`}
            >
              <div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-sm"
                  style={{ backgroundColor: tpl.color }}
                >
                  {tpl.icon}
                </div>
                <h3 className="text-base font-bold text-[#14161C] dark:text-white mb-1.5">
                  {tpl.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#5B6070] dark:text-[#C9CCD8] leading-relaxed mb-6">
                  {tpl.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => loadTemplate(tpl.type)}
                className={`min-h-[42px] w-full px-4 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#2E2A7A] dark:bg-[#5A53DA] text-white shadow-sm'
                    : 'border border-[#D5D7E2] dark:border-[#3F4457] bg-white dark:bg-[#1C1F2B] text-[#14161C] dark:text-white hover:bg-[#F7F7FA] dark:hover:bg-[#2C3040]'
                }`}
              >
                {isActive ? 'Active plan' : 'Use template'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
