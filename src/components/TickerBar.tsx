import React from 'react';
import { CryptoAsset } from '../types';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface TickerBarProps {
  assets: CryptoAsset[];
  onSelectCoin?: (symbol: string) => void;
}

export const TickerBar: React.FC<TickerBarProps> = ({ assets, onSelectCoin }) => {
  return (
    <div
      id="crypto-ticker-bar"
      className="w-full bg-[#0b0d13] border-b border-slate-800/80 text-xs overflow-x-auto no-scrollbar py-1.5 sm:py-2 px-2.5 sm:px-3 flex items-center gap-3 sm:gap-5 select-none shadow-sm z-30 touch-pan-x"
    >
      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold uppercase tracking-wider shrink-0 text-[10px] sm:text-[11px] pr-2 sm:pr-3 border-r border-slate-800">
        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
        <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        <span className="hidden xs:inline">Live</span> Signals
      </div>

      <div className="flex items-center gap-3 sm:gap-6 whitespace-nowrap">
        {assets.map((coin) => {
          const isPositive = coin.change24h >= 0;
          return (
            <button
              id={`ticker-item-${coin.symbol.toLowerCase()}`}
              key={coin.symbol}
              onClick={() => onSelectCoin?.(coin.symbol)}
              className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-2 py-0.5 rounded hover:bg-slate-800/60 active:bg-slate-800 transition-colors group text-left cursor-pointer shrink-0"
            >
              <span className="font-bold text-[11px] sm:text-xs text-slate-200 group-hover:text-cyan-400 transition-colors">
                ${coin.symbol}
              </span>
              <span className="font-mono text-slate-300 font-medium text-[11px] sm:text-xs">
                ${coin.price > 10 ? coin.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
              </span>
              <span
                className={`flex items-center text-[10px] sm:text-[11px] font-mono font-medium ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 inline" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 inline" />
                )}
                {isPositive ? '+' : ''}{coin.change24h}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
