/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Post, CryptoAsset, VolatilityAlert, UserProfile, SentimentType, SentimentAnalysisResult } from './types';
import { INITIAL_POSTS, INITIAL_ASSETS, INITIAL_ALERTS } from './data/initialData';
import { TickerBar } from './components/TickerBar';
import { Navbar } from './components/Navbar';
import { SidebarLeft, NavTab } from './components/SidebarLeft';
import { PostCard } from './components/PostCard';
import { PostComposer } from './components/PostComposer';
import { MarketSentimentWidget } from './components/MarketSentimentWidget';
import { AuthModal } from './components/AuthModal';
import { AdminPortalPage } from './components/AdminPortalPage';
import { VolatilityAlertsModal } from './components/VolatilityAlertsModal';
import { TipModal } from './components/TipModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { SentimentTerminalView } from './components/SentimentTerminalView';
import { VolatilityAlertToast } from './components/VolatilityAlertToast';
import { GlobalChatRoom } from './components/GlobalChatRoom';
import {
  Flame,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  X,
  Plus,
  LogIn,
} from 'lucide-react';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(true);

  // Route: supports direct path '/admin' and public terminal '/'
  const [currentRoute, setCurrentRoute] = useState<'forum' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/admin') ? 'admin' : 'forum';
    }
    return 'forum';
  });

  // App Navigation & Tabs
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [feedFilter, setFeedFilter] = useState<'for-you' | 'alpha' | 'verified'>('for-you');
  const [selectedCashtag, setSelectedCashtag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Global Auth State (Google, Facebook, Twitter, Telegram, Email)
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem('cp_session_token') || null;
  });
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('cp_user_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Core Data
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [assets, setAssets] = useState<CryptoAsset[]>(INITIAL_ASSETS);
  const [alerts, setAlerts] = useState<VolatilityAlert[]>(INITIAL_ALERTS);

  // Active Volatility Toast Banner
  const [activeToastAlert, setActiveToastAlert] = useState<VolatilityAlert | null>(null);
  const [pushEnabled, setPushEnabled] = useState<boolean>(false);

  // Focused Post index for keyboard navigation
  const [focusedPostIndex, setFocusedPostIndex] = useState<number>(0);

  // Modals state
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTipOpen, setIsTipOpen] = useState(false);
  const [activeTipPost, setActiveTipPost] = useState<Post | null>(null);
  const [isMobileComposerOpen, setIsMobileComposerOpen] = useState(false);

  // Sync route with browser history
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(window.location.pathname.startsWith('/admin') ? 'admin' : 'forum');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: 'forum' | 'admin') => {
    setCurrentRoute(route);
    const targetPath = route === 'admin' ? '/admin' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  // Sync dark mode class with root html
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Verify stored session on mount
  useEffect(() => {
    if (sessionToken) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.user) {
            setUser(data.user);
            localStorage.setItem('cp_user_profile', JSON.stringify(data.user));
          } else {
            handleLogout();
          }
        })
        .catch(() => {});
    }
  }, [sessionToken]);

  // Fetch live market data periodically
  useEffect(() => {
    const fetchMarketOverview = async () => {
      try {
        const res = await fetch('/api/market/overview');
        const data = await res.json();
        if (data.assets && data.assets.length > 0) {
          setAssets(data.assets);
        }
      } catch (err) {
        // Fallback to local state
      }
    };

    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/market/alerts');
        const data = await res.json();
        if (data.alerts && data.alerts.length > 0) {
          setAlerts(data.alerts);
        }
      } catch (err) {}
    };

    fetchMarketOverview();
    fetchAlerts();
    const interval = setInterval(fetchMarketOverview, 6000);
    return () => clearInterval(interval);
  }, []);

  // Periodic push notification simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (alerts.length > 0) {
        const first = alerts[0];
        setActiveToastAlert(first);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [alerts]);

  // Request Web Push Notification permission
  const handleRequestPush = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setPushEnabled(true);
        new Notification('CryptoPulse Volatility Engine Active', {
          body: 'You will receive instant alerts for major price breakouts, dumps, and whale liquidations.',
        });
      }
    } else {
      setPushEnabled(true);
    }
  };

  // Auth Handlers
  const handleAuthSuccess = (token: string, profile: UserProfile) => {
    setSessionToken(token);
    setUser(profile);
    localStorage.setItem('cp_session_token', token);
    localStorage.setItem('cp_user_profile', JSON.stringify(profile));
    setIsAuthOpen(false);
  };

  const handleLogout = () => {
    if (sessionToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
    }
    setSessionToken(null);
    setUser(null);
    localStorage.removeItem('cp_session_token');
    localStorage.removeItem('cp_user_profile');
  };

  const openAuthWithMode = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  };

  // Keyboard navigation shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case '?':
          e.preventDefault();
          setIsShortcutsOpen((prev) => !prev);
          break;
        case 'c':
          e.preventDefault();
          setCurrentTab('chat');
          break;
        case 'n':
          e.preventDefault();
          setCurrentTab('feed');
          setTimeout(() => {
            document.getElementById('composer-textarea')?.focus();
          }, 100);
          break;
        case 'j':
          e.preventDefault();
          setFocusedPostIndex((prev) => Math.min(prev + 1, posts.length - 1));
          break;
        case 'k':
          e.preventDefault();
          setFocusedPostIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'l':
          e.preventDefault();
          if (posts[focusedPostIndex]) {
            handleLikePost(posts[focusedPostIndex].id);
          }
          break;
        case 't':
          e.preventDefault();
          if (posts[focusedPostIndex]) {
            setActiveTipPost(posts[focusedPostIndex]);
            setIsTipOpen(true);
          }
          break;
        case 'u':
          e.preventDefault();
          if (!user) openAuthWithMode('login');
          break;
        case 'v':
          e.preventDefault();
          setIsAlertsOpen((prev) => !prev);
          break;
        case 'm':
          e.preventDefault();
          setDarkMode((prev) => !prev);
          break;
        case '/':
          e.preventDefault();
          document.getElementById('global-search-input')?.focus();
          break;
        case 'escape':
          setIsAlertsOpen(false);
          setIsShortcutsOpen(false);
          setIsTipOpen(false);
          setIsAuthOpen(false);
          setIsMobileComposerOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts, focusedPostIndex, user]);

  // Post Actions
  const handleLikePost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked,
            likes: hasLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  const handleRepost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const hasReposted = !p.hasReposted;
          return {
            ...p,
            hasReposted,
            reposts: hasReposted ? p.reposts + 1 : p.reposts - 1,
          };
        }
        return p;
      })
    );
  };

  const handleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            hasBookmarked: !p.hasBookmarked,
          };
        }
        return p;
      })
    );
  };

  const handleAddReply = (postId: string, text: string) => {
    if (!user) {
      openAuthWithMode('login');
      return;
    }

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const newReply = {
            id: 'rep-' + Date.now(),
            author: {
              name: user.name,
              handle: user.handle,
              avatar: user.avatar,
              provider: user.provider,
              isVerified: user.isVerified,
              tier: user.tier,
            },
            content: text,
            likes: 0,
            createdAt: 'Just now',
          };
          return {
            ...p,
            replies: [...p.replies, newReply],
          };
        }
        return p;
      })
    );
  };

  // Publish new post
  const handlePublishPost = (postData: {
    content: string;
    cashtags: string[];
    sentiment: SentimentType;
    sentimentScore: number;
    targetPrice?: number;
    stopLoss?: number;
    aiAnalysis?: SentimentAnalysisResult;
  }) => {
    if (!user) {
      openAuthWithMode('login');
      return;
    }

    const newPost: Post = {
      id: 'post-' + Date.now(),
      author: {
        name: user.name,
        handle: user.handle,
        avatar: user.avatar,
        provider: user.provider,
        isVerified: user.isVerified,
        tier: user.tier,
      },
      content: postData.content,
      cashtags: postData.cashtags,
      sentiment: postData.sentiment,
      sentimentScore: postData.sentimentScore,
      targetPrice: postData.targetPrice,
      stopLoss: postData.stopLoss,
      likes: 1,
      reposts: 0,
      replies: [],
      tipsReceived: 0,
      createdAt: 'Just now',
      aiAnalysis: postData.aiAnalysis,
    };

    setPosts([newPost, ...posts]);
    setIsMobileComposerOpen(false);
  };

  // Run On-demand AI Analysis on existing post
  const handleAnalyzeSentiment = async (post: Post) => {
    try {
      const res = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: post.content,
          cashtags: post.cashtags,
        }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, aiAnalysis: data } : p))
        );
      }
    } catch (err) {
      console.error('Failed to analyze post:', err);
    }
  };

  const handleExecuteTip = (postId: string, amount: number) => {
    // Deduct user balance
    if (user) {
      const updatedUser = { ...user, tipsBalance: Math.max(0, user.tipsBalance - amount) };
      setUser(updatedUser);
      localStorage.setItem('cp_user_profile', JSON.stringify(updatedUser));
    }

    // Increment post tip
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            tipsReceived: p.tipsReceived + amount,
          };
        }
        return p;
      })
    );
  };

  const handleBroadcastAlert = (alert: VolatilityAlert) => {
    setAlerts((prev) => [alert, ...prev]);
    setActiveToastAlert(alert);
  };

  // Filter posts logic
  const filteredPosts = posts.filter((p) => {
    if (selectedCashtag && !p.cashtags.includes(selectedCashtag)) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesContent = p.content.toLowerCase().includes(q);
      const matchesAuthor = p.author.name.toLowerCase().includes(q) || p.author.handle.toLowerCase().includes(q);
      const matchesTag = p.cashtags.some((t) => t.toLowerCase().includes(q.replace('$', '')));
      if (!matchesContent && !matchesAuthor && !matchesTag) return false;
    }
    if (feedFilter === 'alpha') return p.sentiment === 'ALPHA';
    if (feedFilter === 'verified') return p.author.isVerified;
    return true;
  });

  // Dedicated Route: /admin
  if (currentRoute === 'admin') {
    return (
      <AdminPortalPage
        onBackToForum={() => navigateTo('forum')}
        onBroadcastAlert={handleBroadcastAlert}
      />
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-[#090a0f] text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Live Market Price Ticker with Sparklines */}
      <TickerBar
        assets={assets}
        onSelectCoin={(symbol) => {
          setSelectedCashtag(symbol);
          setCurrentTab('feed');
        }}
      />

      {/* Global Navbar */}
      <Navbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onOpenAuth={openAuthWithMode}
        onLogout={handleLogout}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        unreadAlertsCount={alerts.filter((a) => a.isLive).length}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      {/* Main Container Layout */}
      <div className="max-w-7xl mx-auto w-full flex flex-1">
        {/* Left Sidebar */}
        <SidebarLeft
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'alerts') setIsAlertsOpen(true);
          }}
          onOpenCompose={() => {
            if (!user) {
              openAuthWithMode('login');
              return;
            }
            setCurrentTab('feed');
            setTimeout(() => {
              document.getElementById('composer-textarea')?.focus();
            }, 100);
          }}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          user={user}
          onOpenAuth={openAuthWithMode}
          unreadAlertsCount={alerts.filter((a) => a.isLive).length}
        />

        {/* Center Main Feed or Tab Views */}
        <main id="main-content-column" className="flex-1 min-w-0 border-r border-slate-800/80 pb-20 lg:pb-8">
          {currentTab === 'chat' ? (
            /* Global Alpha Real-Time Chat Room */
            <div className="p-3 sm:p-4">
              <GlobalChatRoom
                user={user}
                onOpenAuth={() => openAuthWithMode('login')}
                onSelectCashtag={(coin) => {
                  setSelectedCashtag(coin);
                  setCurrentTab('feed');
                }}
              />
            </div>
          ) : currentTab === 'sentiment' ? (
            /* Sentiment Analysis Terminal Page */
            <SentimentTerminalView
              assets={assets}
              onSelectCoin={(coin) => {
                setSelectedCashtag(coin);
                setCurrentTab('feed');
              }}
            />
          ) : (
            /* Crypto Forum Feed Page */
            <>
              {/* Feed Sub-Header Filter Bar */}
              <div className="sticky top-14 z-20 bg-[#090a0f]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={() => setFeedFilter('for-you')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                      feedFilter === 'for-you'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔥 For You
                  </button>
                  <button
                    onClick={() => setFeedFilter('alpha')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                      feedFilter === 'alpha'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ⚡ Top Signals
                  </button>
                  <button
                    onClick={() => setFeedFilter('verified')}
                    className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer shrink-0 ${
                      feedFilter === 'verified'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🛡️ Verified Traders
                  </button>
                </div>

                {/* Active Cashtag Pill Filter */}
                {selectedCashtag && (
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono text-xs font-bold shrink-0 ml-auto">
                    <span>${selectedCashtag}</span>
                    <button
                      onClick={() => setSelectedCashtag(null)}
                      className="hover:text-white cursor-pointer"
                      aria-label="Clear cashtag filter"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* In-Feed Post Composer */}
              <PostComposer
                onPublish={handlePublishPost}
                user={user}
                onRequireAuth={() => openAuthWithMode('login')}
                selectedCashtag={selectedCashtag || undefined}
              />

              {/* Feed Stream */}
              <div className="divide-y divide-slate-800/80">
                {filteredPosts.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 space-y-2">
                    <Flame className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-sm font-semibold">No crypto signals found matching filter.</p>
                    <button
                      onClick={() => {
                        setSelectedCashtag(null);
                        setFeedFilter('for-you');
                        setSearchQuery('');
                      }}
                      className="text-xs text-cyan-400 hover:underline font-mono"
                    >
                      Reset all filters
                    </button>
                  </div>
                ) : (
                  filteredPosts.map((post, index) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      assets={assets}
                      isFocused={index === focusedPostIndex}
                      onLike={handleLikePost}
                      onRepost={handleRepost}
                      onBookmark={handleBookmark}
                      onTip={(p) => {
                        setActiveTipPost(p);
                        setIsTipOpen(true);
                      }}
                      onAnalyzeSentiment={handleAnalyzeSentiment}
                      onSelectCashtag={(tag) => setSelectedCashtag(tag)}
                      onAddReply={handleAddReply}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </main>

        {/* Right Sidebar: Market Sentiment & Volatility Radar */}
        <MarketSentimentWidget
          assets={assets}
          alerts={alerts}
          onSelectCoin={(symbol) => {
            setSelectedCashtag(symbol);
            setCurrentTab('feed');
          }}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onRequestPushNotifications={handleRequestPush}
          pushEnabled={pushEnabled}
        />
      </div>

      {/* Floating Push Volatility Toast */}
      <VolatilityAlertToast
        alert={activeToastAlert}
        onDismiss={() => setActiveToastAlert(null)}
        onView={(alert) => {
          setSelectedCashtag(alert.asset);
          setCurrentTab('feed');
          setIsAlertsOpen(true);
        }}
      />

      {/* Mobile Native Bottom Navigation */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'alerts') setIsAlertsOpen(true);
        }}
        onOpenCompose={() => {
          if (!user) {
            openAuthWithMode('login');
            return;
          }
          setIsMobileComposerOpen(true);
        }}
        unreadAlertsCount={alerts.filter((a) => a.isLive).length}
        user={user}
        onOpenAuth={() => openAuthWithMode('login')}
      />

      {/* Mobile Compose Modal */}
      {isMobileComposerOpen && (
        <div className="fixed inset-0 z-50 p-4 bg-black/85 backdrop-blur-md flex flex-col justify-end lg:hidden animate-fade-in">
          <div className="bg-[#0e1017] border border-slate-800 rounded-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-3 border-b border-slate-800 flex justify-between items-center">
              <span className="font-bold text-xs text-slate-100">Broadcast Signal</span>
              <button
                onClick={() => setIsMobileComposerOpen(false)}
                className="p-1 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto">
              <PostComposer
                onPublish={handlePublishPost}
                user={user}
                onRequireAuth={() => openAuthWithMode('login')}
                selectedCashtag={selectedCashtag || undefined}
              />
            </div>
          </div>
        </div>
      )}

      {/* Global OAuth & Email Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        initialMode={authMode}
        onLoginSuccess={(profile, token) => handleAuthSuccess(token, profile)}
      />

      {/* Volatility Alerts Modal */}
      <VolatilityAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onSelectCoin={(coin) => {
          setSelectedCashtag(coin);
          setCurrentTab('feed');
        }}
        onRequestPush={handleRequestPush}
        pushEnabled={pushEnabled}
      />

      {/* Creator Tip Modal */}
      <TipModal
        isOpen={isTipOpen}
        onClose={() => setIsTipOpen(false)}
        post={activeTipPost}
        user={user}
        onExecuteTip={handleExecuteTip}
        onOpenAuth={() => openAuthWithMode('login')}
      />

      {/* Keyboard Shortcuts Guide Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
}
