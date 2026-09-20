import React from 'react';
import { CryptoAsset, VolatilityAlert } from '../types';
import { SparklineChart } from './SparklineChart';
import {
  TrendingUp,
  TrendingDown,
  Bell,
  Sparkles,
  ShieldCheck,
  Flame,
  Activity,
  Zap,
} from 'lucide-react';

interface MarketSentimentWidgetProps {
  assets: CryptoAsset[];
  alerts: VolatilityAlert[];
  onSelectCoin: (symbol: string) => void;
  onOpenAlerts: () => void;
  onRequestPushNotifications: () => void;
  pushEnabled: boolean;
}

export const MarketSentimentWidget: React.FC<MarketSentimentWidgetProps> = ({
  assets,
  alerts,
  onSelectCoin,
  onOpenAlerts,
  onRequestPushNotifications,
  pushEnabled,
}) => {
  const topTrending = [...assets].sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5);

  return (
    <aside id="sidebar-right" className="hidden xl:block w-80 shrink-0 py-4 px-3 space-y-4 border-l border-slate-800/80 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto no-scrollbar select-none">
      {/* Fear & Greed Index Dial */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>Crypto Fear & Greed Index</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
            LIVE 76
          </span>
        </div>

        <div className="my-3 flex items-baseline justify-between">
          <div>
            <div className="text-3xl font-extrabold font-mono text-emerald-400">76</div>
            <div className="text-xs font-semibold text-slate-300">Extreme Greed</div>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            <div>Yesterday: <span className="text-slate-300">72</span></div>
            <div>Last Week: <span className="text-slate-300">68</span></div>
          </div>
        </div>

        {/* Visual Gradient Meter */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
            style={{ width: '100%' }}
          ></div>
          <div
            className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-md -ml-1"
            style={{ left: '76%' }}
          ></div>
        </div>

        <p className="text-[11px] text-slate-400 mt-2.5 leading-tight">
          Social discussion volume and derivative open interest indicate strong accumulation with elevated leverage.
        </p>
      </div>

      {/* Volatility Push Notification Opt-in Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 text-xs">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0">
            <Bell className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-100 text-xs">Volatility Push Engine</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Receive alerts for &gt;3% rapid price shocks, whale transfers, and liquidation cascades.
            </p>
            <button
              id="enable-push-btn"
              onClick={onRequestPushNotifications}
              className={`mt-2 w-full py-1.5 px-3 rounded-lg font-semibold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                pushEnabled
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>{pushEnabled ? 'Push Alerts Active' : 'Enable Push Notifications'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trending Cashtags */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>Trending Cashtags</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">24h Sparkline</span>
        </div>

        <div className="space-y-2">
          {topTrending.map((coin, i) => {
            const isPos = coin.change24h >= 0;
            return (
              <div
                key={coin.symbol}
                onClick={() => onSelectCoin(coin.symbol)}
                className="flex items-center justify-between hover:bg-slate-800/50 p-2 rounded-xl transition-colors cursor-pointer group gap-2"
              >
                <div className="flex items-center gap-2 min-w-[70px]">
                  <span className="text-xs font-mono text-slate-400 w-3">{i + 1}</span>
                  <div>
                    <span className="font-bold text-xs text-slate-100 group-hover:text-cyan-400 font-mono">
                      ${coin.symbol}
                    </span>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[60px]">{coin.name}</span>
                  </div>
                </div>

                {/* 24h Recharts mini sparkline */}
                <div className="flex-1 h-7 max-w-[75px] px-0.5">
                  <SparklineChart
                    data={coin.sparkline}
                    change24h={coin.change24h}
                    symbol={coin.symbol}
                    height={28}
                    showTooltip={false}
                    strokeWidth={1.5}
                    id={`widget-${coin.symbol}`}
                  />
                </div>

                <div className="text-right font-mono text-xs min-w-[65px]">
                  <div className="text-slate-200 font-semibold text-[11px]">
                    ${coin.price > 10 ? coin.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : coin.price.toFixed(4)}
                  </div>
                  <div className={`text-[10px] font-semibold flex items-center justify-end gap-0.5 ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isPos ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                    <span>{isPos ? '+' : ''}{coin.change24h}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Volatility Shock Alerts */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Latest Volatility Shocks</span>
          </div>
          <button
            onClick={onOpenAlerts}
            className="text-[10px] font-semibold text-cyan-400 hover:underline cursor-pointer"
          >
            View All
          </button>
        </div>

        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert) => (
            <div
              key={alert.id}
              onClick={onOpenAlerts}
              className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-cyan-500/30 transition-all cursor-pointer text-xs"
            >
              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                <span className="font-bold text-cyan-400">${alert.asset}</span>
                <span className="text-slate-400">{alert.timestamp}</span>
              </div>
              <p className="font-semibold text-slate-200 text-xs leading-snug">{alert.headline}</p>
              <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 font-bold">
                {alert.changeMagnitude} Spike
              </span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};
