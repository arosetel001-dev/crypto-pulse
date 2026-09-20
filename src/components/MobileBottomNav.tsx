import React from 'react';
import { Flame, LineChart, Plus, Bell, User, MessagesSquare } from 'lucide-react';
import { NavTab } from './SidebarLeft';
import { UserProfile } from '../types';

interface MobileBottomNavProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  onOpenCompose: () => void;
  unreadAlertsCount: number;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCompose,
  unreadAlertsCount,
  user,
  onOpenAuth,
}) => {
  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#090a0f]/95 backdrop-blur-xl border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around safe-area-pb shadow-2xl select-none"
    >
      {/* Feed Tab */}
      <button
        id="mobile-tab-feed"
        onClick={() => setCurrentTab('feed')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[48px] min-h-[44px] transition-all cursor-pointer active:scale-95 ${
          currentTab === 'feed'
            ? 'text-cyan-400 font-bold bg-cyan-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Flame className="w-5 h-5" />
        <span className="text-[10px] tracking-tight mt-0.5">Feed</span>
      </button>

      {/* Global Chat Room */}
      <button
        id="mobile-tab-chat"
        onClick={() => setCurrentTab('chat')}
        className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[48px] min-h-[44px] transition-all cursor-pointer active:scale-95 ${
          currentTab === 'chat'
            ? 'text-cyan-400 font-bold bg-cyan-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <div className="relative">
          <MessagesSquare className="w-5 h-5" />
          <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-emerald-400 rounded-full ring-2 ring-[#090a0f] animate-pulse" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5">Chat</span>
      </button>

      {/* Floating Action Compose Button */}
      <button
        id="mobile-fab-compose"
        onClick={onOpenCompose}
        aria-label="Broadcast new signal"
        className="relative -top-3 w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-500 via-indigo-600 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-cyan-500/40 active:scale-90 transition-transform cursor-pointer border-2 border-[#090a0f]"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Sentiment Radar */}
      <button
        id="mobile-tab-terminal"
        onClick={() => setCurrentTab('sentiment')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[48px] min-h-[44px] transition-all cursor-pointer active:scale-95 ${
          currentTab === 'sentiment'
            ? 'text-cyan-400 font-bold bg-cyan-500/10'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LineChart className="w-5 h-5" />
        <span className="text-[10px] tracking-tight mt-0.5">Terminal</span>
      </button>

      {/* Account / Profile Access */}
      <button
        id="mobile-tab-account"
        onClick={onOpenAuth}
        className="flex flex-col items-center justify-center py-1 px-2 rounded-xl min-w-[48px] min-h-[44px] transition-all cursor-pointer active:scale-95 text-slate-400 hover:text-slate-200"
      >
        <div className="relative">
          {user ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-5 h-5 rounded-full border border-cyan-400 object-cover"
            />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 truncate max-w-[48px]">
          {user ? 'Account' : 'Sign In'}
        </span>
      </button>
    </nav>
  );
};
