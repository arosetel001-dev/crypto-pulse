import React from 'react';
import {
  Flame,
  LineChart,
  Settings2,
  Keyboard,
  BellRing,
  PlusCircle,
  Sparkles,
  TrendingUp,
  User,
  ShieldCheck,
  Gift,
  MessagesSquare,
} from 'lucide-react';
import { UserProfile } from '../types';

export type NavTab = 'feed' | 'chat' | 'sentiment' | 'alpha' | 'alerts' | 'profile';

interface SidebarLeftProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onOpenCompose: () => void;
  onOpenShortcuts: () => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  unreadAlertsCount: number;
}

export const SidebarLeft: React.FC<SidebarLeftProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCompose,
  onOpenShortcuts,
  user,
  onOpenAuth,
  unreadAlertsCount,
}) => {
  const navItems = [
    { id: 'feed' as NavTab, label: 'Live Crypto Feed', icon: Flame, badge: null, shortcut: 'F' },
    { id: 'chat' as NavTab, label: 'Global Chat Room', icon: MessagesSquare, badge: 'LIVE', shortcut: 'C' },
    { id: 'sentiment' as NavTab, label: 'Sentiment Terminal', icon: LineChart, badge: 'AI', shortcut: 'S' },
    { id: 'alpha' as NavTab, label: 'Market Signals', icon: Sparkles, badge: null, shortcut: 'A' },
    { id: 'alerts' as NavTab, label: 'Volatility Alerts', icon: BellRing, badge: unreadAlertsCount > 0 ? unreadAlertsCount : null, shortcut: 'V' },
  ];

  return (
    <aside id="sidebar-left" className="hidden lg:flex flex-col justify-between w-64 shrink-0 py-4 px-3 border-r border-slate-800/80 sticky top-14 h-[calc(100vh-3.5rem)] select-none">
      <div className="space-y-4">
        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-500/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-850 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md font-bold ${
                      typeof item.badge === 'number'
                        ? 'bg-rose-500 text-white'
                        : item.badge === 'AI'
                        ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Compose Button */}
        <button
          id="sidebar-compose-button"
          onClick={onOpenCompose}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all cursor-pointer active:scale-[0.98]"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Signal</span>
          <kbd className="ml-1 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded text-white/90">
            N
          </kbd>
        </button>

        {/* Real-time Crypto Sentiment Quick Bar */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              Social Sentiment
            </span>
            <span className="text-emerald-400 font-bold font-mono">76% Greed</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
            <div className="bg-gradient-to-r from-emerald-500 to-cyan-400 h-full" style={{ width: '76%' }}></div>
            <div className="bg-rose-500 h-full" style={{ width: '24%' }}></div>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
            <span>Bullish: 14.8k</span>
            <span>Bearish: 4.2k</span>
          </div>
        </div>
      </div>

      {/* User Global Profile Status Card */}
      <div className="pt-3 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between">
          <button
            onClick={onOpenShortcuts}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts</span>
            <kbd className="text-[10px] font-mono px-1 rounded bg-slate-800 border border-slate-700">?</kbd>
          </button>
          <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Global Feed Active
          </span>
        </div>

        {user ? (
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full border border-cyan-500/50 object-cover shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                  <span>{user.name}</span>
                  {user.isVerified && <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-400 font-mono truncate">
                  @{user.handle} • {user.provider}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-[11px] font-mono font-bold text-emerald-400">
                ${user.tipsBalance.toFixed(0)}
              </div>
              <div className="text-[9px] text-slate-500 uppercase font-mono">Tipping Credits</div>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-950/30 to-blue-950/30 border border-cyan-500/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-cyan-300">
              <span>Sign in to unlock tipping</span>
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-white transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-black font-bold transition-colors"
              >
                Register
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
