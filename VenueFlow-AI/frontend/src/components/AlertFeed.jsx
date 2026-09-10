/**
 * AlertFeed — Live scrollable real-time event log.
 * New alerts slide in with Framer Motion AnimatePresence.
 * Severity color-coded: Info / Warning / Critical
 */
import { motion, AnimatePresence } from 'framer-motion';
import { useAlerts } from '../hooks/useAlerts';

const LEVEL_CONFIG = {
  info: { bg: 'bg-emerald-500/5 dark:bg-emerald-500/10', border: 'border-emerald-500/10 dark:border-emerald-500/20', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300', dot: 'bg-emerald-500', label: 'Info' },
  warning: { bg: 'bg-amber-500/5 dark:bg-amber-500/10', border: 'border-amber-500/10 dark:border-amber-500/20', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300', dot: 'bg-amber-500', label: 'Warning' },
  critical: { bg: 'bg-red-500/5 dark:bg-red-500/10', border: 'border-red-500/10 dark:border-red-500/30', badge: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300', dot: 'bg-red-600 animate-pulse', label: 'Critical' },
};

function formatTimestamp(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--';
  }
}

/**
 * Standardizes venue nomenclature for legacy alerts.
 */
function translateAlert(text) {
  if (!text) return text;
  return text
    .replace(/East Wing/gi, 'East Stand')
    .replace(/West Wing/gi, 'West Stand')
    .replace(/South Food Court/gi, 'South Food Hub')
    .replace(/North Food Court/gi, 'North Food Hub')
    .replace(/Parking Lot A/gi, 'Parking (Zone A)')
    // Also handle possible ID-style slugs if they leak into messages
    .replace(/east-wing/gi, 'East Stand')
    .replace(/west-wing/gi, 'West Stand')
    .replace(/food-court-north/gi, 'North Food Hub')
    .replace(/food-court-south/gi, 'South Food Hub');
}

export default function AlertFeed({ alerts: propAlerts }) {
  const hookAlerts = useAlerts(10);
  const alerts = propAlerts || hookAlerts;

  return (
    <div className="rounded-none bg-theme-card border border-theme-main overflow-hidden shadow-premium mt-16">
      {/* Alert list */}
      <div className="max-h-[800px] overflow-y-auto divide-y divide-theme-main/30 pt-10">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6 transition-colors">
            <span className="text-3xl mb-3">✅</span>
            <p className="text-sm font-semibold text-theme-primary transition-colors">All Clear</p>
            <p className="text-xs text-theme-secondary transition-colors mt-1">No active alerts. Crowd is flowing smoothly.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {alerts.map((alert) => {
              const cfg = LEVEL_CONFIG[alert.level] || LEVEL_CONFIG.info;
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: -20, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className={`px-8 py-5 ${cfg.bg} border-l-[3px] ${cfg.border} hover:bg-theme-page transition-colors cursor-default`}
                >
                  <div className="flex items-start gap-4">
                    <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-1.5 transition-colors">
                        <span className="text-[15px] font-bold text-theme-primary leading-tight">{translateAlert(alert.title)}</span>
                        <span className={`text-[11px] font-bold uppercase tracking-[0.1em] px-3 py-1 rounded-full ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-theme-secondary leading-relaxed opacity-80">{translateAlert(alert.message)}</p>
                      <p className="text-[11px] font-semibold text-theme-secondary/50 font-mono mt-2 uppercase tracking-tight">{formatTimestamp(alert.timestamp)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
