'use client';

import React, { useState } from 'react';
import { usePlannerStore } from '@/store/plannerStore';
import { CURATED_IDEAS } from '@/domain/ideas';
import { Bookmark, BookmarkCheck, Sparkles, Filter } from 'lucide-react';

export const IdeasSection: React.FC = () => {
  const { plan, toggleIdea } = usePlannerStore();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [costFilter, setCostFilter] = useState('all');

  const filtered = CURATED_IDEAS.filter((idea) => {
    if (idea.eventType !== plan.eventType) return false;
    if (categoryFilter !== 'all' && idea.category !== categoryFilter) return false;
    if (costFilter !== 'all' && idea.estimatedCostRange !== costFilter) return false;
    return true;
  });

  return (
    <section aria-labelledby="ideas-heading" className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 pb-3 border-b border-[#E6E7EE] dark:border-[#2C3040]">
        <div>
          <h2 id="ideas-heading" className="text-xl font-bold text-[#14161C] dark:text-white flex items-center gap-2">
            <Sparkles size={20} className="text-[#F5A524]" />
            <span>Personalized Celebration Ideas</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#5B6070] dark:text-[#C9CCD8] mt-0.5">
            Handpicked inspirations for {plan.eventType} celebrations in Maharashtra & beyond.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 items-center flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B6070] dark:text-[#C9CCD8] mr-1">
            <Filter size={14} />
            <span>Category:</span>
          </div>
          {['all', 'decor', 'food', 'entertainment', 'ritual'].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                categoryFilter === cat
                  ? 'bg-[#2E2A7A] dark:bg-[#5A53DA] text-white shadow-sm'
                  : 'bg-[#EEF0F6] dark:bg-[#2C3040] text-[#3F4457] dark:text-[#C9CCD8] hover:bg-[#E4E2FA]'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[#5B6070] dark:text-[#C9CCD8] bg-white dark:bg-[#1C1F2B] rounded-2xl border border-[#E6E7EE] dark:border-[#2C3040]">
          No ideas matching this filter for {plan.eventType}. Try selecting &quot;All&quot;.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((idea) => {
            const isSaved = plan.savedIdeaIds.includes(idea.id);

            return (
              <div
                key={idea.id}
                className="bg-white dark:bg-[#1C1F2B] border border-[#E6E7EE] dark:border-[#2C3040] rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="chip px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF1D6] text-[#7A4300] dark:bg-[#7A4300]/25 dark:text-[#FACF79]">
                      {idea.category.toUpperCase()}
                    </span>

                    <button
                      type="button"
                      onClick={() => toggleIdea(idea.id)}
                      aria-label={isSaved ? 'Remove from saved' : 'Save idea'}
                      className="text-[#5B6070] hover:text-[#2E2A7A] dark:hover:text-[#F5A524] transition-colors p-1"
                    >
                      {isSaved ? (
                        <BookmarkCheck size={20} className="text-[#F5A524]" />
                      ) : (
                        <Bookmark size={20} />
                      )}
                    </button>
                  </div>

                  <h3 className="font-bold text-base text-[#14161C] dark:text-white mb-2">
                    {idea.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#5B6070] dark:text-[#C9CCD8] leading-relaxed mb-4">
                    {idea.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#EEF0F6] dark:border-[#2C3040] flex justify-between items-center text-xs">
                  {idea.culturalContext && (
                    <span className="text-[#2E2A7A] dark:text-[#A9A5EE] font-medium truncate max-w-[180px]">
                      {idea.culturalContext}
                    </span>
                  )}
                  <span className="font-semibold text-[#5B6070] dark:text-[#C9CCD8] uppercase tracking-wider text-[11px] ml-auto">
                    {idea.estimatedCostRange}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
