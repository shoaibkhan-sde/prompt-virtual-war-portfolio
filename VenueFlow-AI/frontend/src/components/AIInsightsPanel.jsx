import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIInsights } from '../hooks/useAIInsights';

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]',
  warning: 'border-amber-500/30 bg-amber-500/5 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]',
  error: 'border-red-500/30 bg-red-500/5 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.1)]',
};

export default function AIInsightsPanel() {
  const { insights } = useAIInsights();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-[13px] font-black uppercase tracking-[0.25em] text-theme-primary opacity-60 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-50"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-blue"></span>
          </span>
          Live Intelligence Feed
        </h3>
      </div>

      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {insights.length > 0 ? (
            insights.map((insight) => (
              <motion.div
                key={insight.id}
                layout
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-500 hover:scale-[1.02] ${STYLES[insight.type] || STYLES.success}`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-xl mt-0.5">{insight.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[15px] leading-snug mb-1">
                      {insight.title}
                    </div>
                    <div className="text-[12px] opacity-70 font-medium leading-relaxed">
                      {insight.reasoning}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(16,185,129,0.04) 100%)',
                border: '1.5px solid rgba(99,102,241,0.2)',
                boxShadow: '0 0 24px rgba(99,102,241,0.06)',
              }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}>
                <span className="text-2xl">✨</span>
              </div>
              <div className="text-[11px] font-black uppercase tracking-[0.2em] text-theme-primary opacity-70 mb-1">
                Normal Operations
              </div>
              <div className="text-[10px] font-medium text-theme-secondary opacity-50">
                No critical redirects required
              </div>
              <div className="flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                  All Systems Live
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
