import React, { useState } from 'react';
import {
  Search,
  Bell,
  User,
  ShieldCheck,
  Moon,
  Sun,
  Keyboard,
  X,
  ArrowLeft,
  LogOut,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { UserProfile } from '../types';

interface NavbarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  user: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
  onOpenAlerts: () => void;
  onOpenShortcuts: () => void;
  unreadAlertsCount: number;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  setSearchQuery,
  user,
  onOpenAuth,
  onLogout,
  onOpenAlerts,
  onOpenShortcuts,
  unreadAlertsCount,
  darkMode,
  setDarkMode,
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header id="app-navbar" className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#090a0f]/95 backdrop-blur-md px-3 sm:px-5 py-2 sm:py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Mobile Full-Width Search View */}
        {mobileSearchOpen ? (
          <div className="flex sm:hidden items-center w-full gap-2 animate-fade-in py-0.5">
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              aria-label="Close search"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                id="mobile-global-search-input"
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search $BTC, $ETH, #crypto..."
                className="w-full pl-9 pr-8 py-1.5 bg-slate-900 border border-cyan-500/50 rounded-full text-xs text-slate-100 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <div className="w-full h-full bg-[#090a0f] rounded-[6px] flex items-center justify-center">
                  <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 text-sm sm:text-base">
                    ⚡
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                    CryptoPulse
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold">
                    GLOBAL
                  </span>
                </div>
                <p className="hidden sm:block text-[10px] text-slate-400 leading-none">
                  Social Sentiment Terminal
                </p>
              </div>
            </div>

            {/* Desktop Global Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-md mx-2 sm:mx-4 relative">
              <div className="relative flex items-center w-full">
                <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
                <input
                  id="global-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search $BTC, #Ethereum, or signals... (Press /)"
                  className="w-full pl-9 pr-8 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-full text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Mobile Search Trigger */}
              <button
                id="mobile-search-toggle"
                onClick={() => setMobileSearchOpen(true)}
                className="flex sm:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="Search Cashtags"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Volatility Alerts Bell */}
              <button
                id="nav-alerts-button"
                onClick={onOpenAlerts}
                title="Volatility Push Alerts"
                className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadAlertsCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-pulse">
                    {unreadAlertsCount}
                  </span>
                )}
              </button>

              {/* Keyboard Shortcuts Guide */}
              <button
                id="nav-shortcuts-button"
                onClick={onOpenShortcuts}
                title="Keyboard Shortcuts (Press ?)"
                className="hidden md:flex p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Keyboard className="w-4 h-4" />
              </button>

              {/* Dark / Light Toggle */}
              <button
                id="nav-theme-toggle"
                onClick={() => setDarkMode(!darkMode)}
                title="Toggle Theme"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* AUTHENTICATION CONTROLS (Replacing Wallet) */}
              {user ? (
                /* Authenticated User Menu */
                <div className="relative">
                  <button
                    id="nav-user-profile-button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-7 h-7 rounded-full border border-cyan-500/50 object-cover"
                    />
                    <div className="hidden sm:block text-left leading-tight">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span className="truncate max-w-[85px]">{user.name}</span>
                        {user.isVerified && (
                          <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        ${user.tipsBalance.toFixed(0)} tips
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-52 bg-[#0e111a] border border-slate-800 rounded-xl shadow-2xl p-2 z-50 animate-fade-in"
                      onClick={() => setUserDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-b border-slate-800/80">
                        <div className="font-semibold text-xs text-white truncate">{user.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">@{user.handle}</div>
                        <div className="text-[10px] text-cyan-400 uppercase font-mono mt-0.5">
                          {user.provider} verified • {user.tier}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={onLogout}
                          className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-rose-400 hover:bg-slate-900 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Unauthenticated Controls */
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    id="btn-nav-login"
                    onClick={() => onOpenAuth('login')}
                    className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold transition-all cursor-pointer"
                  >
                    <span>Sign In</span>
                  </button>

                  <button
                    id="btn-nav-register"
                    onClick={() => onOpenAuth('register')}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-sm shadow-cyan-500/20 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Register</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
