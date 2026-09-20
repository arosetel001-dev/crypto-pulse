import React from 'react';
import { Zap, X, ArrowUpRight, TrendingUp, AlertTriangle } from 'lucide-react';
import { VolatilityAlert } from '../types';

interface VolatilityAlertToastProps {
  alert: VolatilityAlert | null;
  onDismiss: () => void;
  onView: (alert: VolatilityAlert) => void;
}

export const VolatilityAlertToast: React.FC<VolatilityAlertToastProps> = ({
  alert,
  onDismiss,
  onView,
}) => {
  if (!alert) return null;

  const isCritical = alert.severity === 'CRITICAL';

  return (
    <div className="fixed top-14 right-3 sm:right-6 z-50 max-w-sm w-full animate-bounce-short">
      <div className="p-3.5 rounded-2xl bg-[#0e1017] border border-rose-500/50 shadow-2xl shadow-rose-500/20 backdrop-blur-md flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
          <Zap className="w-4 h-4 text-rose-400 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0 text-xs">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="font-mono font-bold text-rose-400 text-[10px] tracking-wider uppercase">
              🚨 Volatility Push Alert
            </span>
            <span className="text-[10px] font-mono text-slate-400">{alert.timestamp}</span>
          </div>

          <h4 className="font-bold text-slate-100 text-xs leading-tight mb-1 truncate">
            {alert.headline}
          </h4>

          <div className="flex items-center justify-between text-[11px] font-mono mt-2 pt-1.5 border-t border-slate-800">
            <span className="text-cyan-400 font-semibold">${alert.asset}</span>
            <span className="text-rose-400 font-bold">{alert.changeMagnitude}</span>
            <button
              onClick={() => {
                onView(alert);
                onDismiss();
              }}
              className="text-cyan-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Inspect</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
