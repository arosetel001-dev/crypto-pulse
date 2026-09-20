import React from 'react';
import { X, Bell, Zap, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { VolatilityAlert } from '../types';

interface VolatilityAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: VolatilityAlert[];
  onSelectCoin: (coin: string) => void;
  onRequestPush: () => void;
  pushEnabled: boolean;
}

export const VolatilityAlertsModal: React.FC<VolatilityAlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectCoin,
  onRequestPush,
  pushEnabled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#0c0e15] border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Major Price Volatility Shocks</h3>
              <p className="text-[11px] text-slate-400 font-mono">Real-Time Liquidation & Whale Spikes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Push Notification Toggle Banner */}
        <div className="px-4 py-2.5 bg-indigo-950/30 border-b border-indigo-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-indigo-300">
            <Bell className="w-4 h-4" />
            <span>Browser Volatility Push Notifications</span>
          </div>
          <button
            onClick={onRequestPush}
            className={`px-2.5 py-1 rounded-lg font-mono font-semibold text-[11px] transition-colors cursor-pointer ${
              pushEnabled
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {pushEnabled ? '✓ Enabled' : 'Turn On'}
          </button>
        </div>

        {/* Alerts List */}
        <div className="p-4 space-y-3 overflow-y-auto no-scrollbar flex-1">
          {alerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            return (
              <div
                key={alert.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/30 transition-all text-xs"
              >
                <div className="flex items-center justify-between mb-1.5 font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectCoin(alert.asset);
                        onClose();
                      }}
                      className="font-bold text-cyan-400 hover:underline"
                    >
                      ${alert.asset}
                    </button>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {alert.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">{alert.timestamp}</span>
                </div>

                <h4 className="font-bold text-slate-200 text-sm mb-1">{alert.headline}</h4>
                <p className="text-slate-300 text-xs leading-relaxed">{alert.description}</p>

                <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">
                    Recorded Price: <span className="text-slate-200">${alert.price.toLocaleString()}</span>
                  </span>
                  <span className="font-bold text-rose-400">{alert.changeMagnitude} Swing</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
