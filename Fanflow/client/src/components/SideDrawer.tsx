import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  isLoading = false,
  children
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
            className="fixed inset-y-0 right-0 w-full max-w-sm glass-panel z-50 flex flex-col border-l border-slate-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-brand-charcoal">
              <div>
                <h2 id="drawer-title" className="text-lg font-bold text-slate-100 uppercase tracking-wide">{title}</h2>
                {subtitle && <p className="text-sm text-brand-teal">{subtitle}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-100 transition-colors"
                aria-label="Close drawer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 bg-brand-navy">
              {isLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-24 bg-slate-800/50 rounded-xl"></div>
                  <div className="h-12 bg-slate-800/50 rounded-xl"></div>
                  <div className="h-32 bg-slate-800/50 rounded-xl"></div>
                </div>
              ) : (
                children
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
