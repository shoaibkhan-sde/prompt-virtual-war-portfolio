import React from 'react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  status?: 'LOW' | 'MEDIUM' | 'HIGH';
  onClick?: () => void;
  isLoading?: boolean;
  isActive?: boolean;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  status = 'LOW',
  onClick,
  isLoading = false,
  isActive = false,
  icon
}) => {
  if (isLoading) {
    return (
      <div className="glass-card p-4 animate-pulse">
        <div className="flex justify-between items-start mb-2">
          <div className="h-4 w-24 bg-slate-700/50 rounded"></div>
          <div className="h-5 w-5 bg-slate-700/50 rounded-full"></div>
        </div>
        <div className="h-8 w-16 bg-slate-700/50 rounded mt-4 mb-2"></div>
        <div className="h-3 w-20 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'HIGH': return 'text-brand-red';
      case 'MEDIUM': return 'text-brand-amber';
      case 'LOW': default: return 'text-brand-teal';
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case 'HIGH': return 'bg-brand-red/10 border-brand-red/20';
      case 'MEDIUM': return 'bg-brand-amber/10 border-brand-amber/20';
      case 'LOW': default: return 'bg-brand-teal/10 border-brand-teal/20';
    }
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={!onClick}
      className={`glass-card p-4 text-left transition-all ${onClick ? 'cursor-pointer hover:border-brand-teal/50' : ''} ${isActive ? 'ring-2 ring-brand-teal border-brand-teal shadow-[0_0_15px_rgba(20,184,166,0.3)]' : ''} w-full`}
    >
      <div className="flex justify-between items-start mb-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        {icon && <div className={`p-1.5 rounded-lg ${getStatusBg()} ${getStatusColor()}`}>{icon}</div>}
      </div>
      <div className="mt-2 mb-1 flex items-baseline gap-2">
        <span className={`text-3xl font-bold tracking-tight ${getStatusColor()}`}>{value}</span>
      </div>
      {subtitle && (
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </motion.button>
  );
};
