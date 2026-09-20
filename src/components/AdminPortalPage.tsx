import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  BellRing,
  Activity,
  Users,
  AlertTriangle,
  Send,
  CheckCircle2,
  Trash2,
  Ban,
  Cpu,
  Lock,
  Mail,
  ArrowLeft,
  LogOut,
  Search,
  Check,
  RefreshCw,
  ExternalLink,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import { VolatilityAlert } from '../types';

interface AdminPortalPageProps {
  onBackToForum: () => void;
  onBroadcastAlert?: (alert: VolatilityAlert) => void;
}

interface UserItem {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  provider: 'google' | 'facebook' | 'twitter' | 'telegram' | 'email';
  isVerified: boolean;
  tier: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'suspended' | 'banned';
  tipsBalance: number;
  createdAt: string;
}

export const AdminPortalPage: React.FC<AdminPortalPageProps> = ({
  onBackToForum,
  onBroadcastAlert,
}) => {
  // Admin Auth State
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return localStorage.getItem('cp_admin_token') || null;
  });
  const [adminUser, setAdminUser] = useState<{ email: string; name: string; role: string } | null>(
    () => {
      const saved = localStorage.getItem('cp_admin_user');
      return saved ? JSON.parse(saved) : null;
    }
  );

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Admin Dashboard State
  const [activeTab, setActiveTab] = useState<'USERS' | 'BROADCAST' | 'LOGS'>('USERS');
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Broadcast Form
  const [alertAsset, setAlertAsset] = useState('BTC');
  const [alertHeadline, setAlertHeadline] = useState('');
  const [alertDescription, setAlertDescription] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('CRITICAL');
  const [alertChange, setAlertChange] = useState('+5.4%');
  const [alertPrice, setAlertPrice] = useState('98400');
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);

  // System Stats
  const [stats, setStats] = useState({
    totalUsers: 48920,
    activeTradersToday: 14205,
    verifiedUsersCount: 3842,
    postsModerated: 128,
    spamBlocked24h: 312,
    securityIncidents: 0,
    rateLimitStatus: 'NORMAL_LOAD',
    recentModerationActions: [
      { id: 'mod-1', action: 'PUMP_AND_DUMP_WARNING', target: '$SCAMCOIN', moderator: 'AI-Guard-Sentinel', timestamp: '12 mins ago' },
      { id: 'mod-2', action: 'BOT_SWARM_RATE_LIMITED', target: 'IP Subnet 185.220.*', moderator: 'Anti-Sybil Engine', timestamp: '38 mins ago' },
      { id: 'mod-3', action: 'USER_STATUS_VERIFIED', target: 'satoshi_quant (Google)', moderator: 'SuperAdmin', timestamp: '1 hour ago' },
    ],
  });

  // Verify stored session on mount
  useEffect(() => {
    if (adminToken) {
      fetch('/api/admin/verify', {
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then((r) => {
          if (!r.ok) {
            handleLogout();
          } else {
            loadAdminData(adminToken);
          }
        })
        .catch(() => {});
    }
  }, [adminToken]);

  const loadAdminData = (token: string) => {
    setIsLoadingUsers(true);
    fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.users) setUsersList(data.users);
      })
      .catch((e) => console.error('Failed to load users', e))
      .finally(() => setIsLoadingUsers(false));

    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) setStats(d);
      })
      .catch(() => {});
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Admin login verification failed');
      }

      setAdminToken(data.adminToken);
      setAdminUser(data.adminUser);
      localStorage.setItem('cp_admin_token', data.adminToken);
      localStorage.setItem('cp_admin_user', JSON.stringify(data.adminUser));
      loadAdminData(data.adminToken);
    } catch (err: any) {
      setLoginError(err.message || 'Authentication error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('cp_admin_token');
    localStorage.removeItem('cp_admin_user');
  };

  const handleToggleVerification = async (user: UserItem) => {
    if (!adminToken) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ isVerified: !user.isVerified }),
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, isVerified: !u.isVerified } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    if (!adminToken) return;
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!adminToken) return;
    if (!confirm(`Are you sure you want to permanently delete user @${user.handle}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setUsersList((prev) => prev.filter((u) => u.id !== user.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertHeadline.trim() || !adminToken) return;

    setBroadcastLoading(true);
    try {
      const res = await fetch('/api/admin/trigger-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          asset: alertAsset,
          headline: alertHeadline,
          description: alertDescription || 'High volatility detected by CryptoPulse Sentinel orderbook tracker.',
          severity: alertSeverity,
          changeMagnitude: alertChange,
          price: parseFloat(alertPrice) || 96500,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (onBroadcastAlert) onBroadcastAlert(data.alert);
        setBroadcastSuccess(true);
        setAlertHeadline('');
        setAlertDescription('');
        setTimeout(() => setBroadcastSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
    } finally {
      setBroadcastLoading(false);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex flex-col">
      {/* Sentinel Top Header */}
      <header className="sticky top-0 z-40 bg-[#0c0e17]/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <button
            id="btn-admin-back-to-forum"
            onClick={onBackToForum}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Public Terminal</span>
          </button>

          <div className="h-4 w-px bg-slate-800" />

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                  CryptoPulse Sentinel
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 border border-rose-500/30 text-rose-400">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono">
                Separate Route: /admin • TLS Strict Access
              </p>
            </div>
          </div>
        </div>

        {/* Right Session Status */}
        <div className="flex items-center gap-3">
          {adminToken ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>SUPER_ADMIN AUTHENTICATED</span>
              </div>
              <button
                id="btn-admin-logout"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-800 text-slate-300 hover:text-rose-400 transition-all text-xs font-semibold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <Lock className="w-3.5 h-3.5" />
              <span>Restricted Clearance Required</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {!adminToken ? (
          /* ============================================================ */
          /* ADMIN LOGIN SCREEN                                           */
          /* ============================================================ */
          <div className="max-w-md mx-auto my-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0e111a] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5 text-rose-400">
                <Lock className="w-6 h-6" />
              </div>

              <h1 className="text-2xl font-bold text-white tracking-tight">
                Sentinel Admin Login
              </h1>
              <p className="text-xs text-slate-400 mt-1 mb-6">
                Privileged access credentials are required to manage users, configure volatility
                thresholds, and broadcast push alerts.
              </p>

              {loginError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-admin-email"
                      type="email"
                      required
                      placeholder="admin@domain.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Secret Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-admin-password"
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-mono"
                    />
                  </div>
                </div>

                <button
                  id="btn-admin-submit-login"
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loginLoading ? (
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Authenticate Sentinel Portal</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          /* ============================================================ */
          /* AUTHENTICATED ADMIN DASHBOARD                                */
          /* ============================================================ */
          <div className="space-y-6">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Registered Global Users</span>
                  <Users className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.totalUsers.toLocaleString()}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                  <span>+34 new today</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Active Traders Today</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.activeTradersToday.toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Google, FB, X, TG, Email</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Spam Swarms Blocked</span>
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-bold font-mono text-white">
                  {stats.spamBlocked24h}
                </div>
                <div className="text-[11px] text-amber-400 mt-1">AI-Sentinel Active</div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0e111a] border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Sentinel Engine</span>
                  <Cpu className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-base sm:text-lg font-bold font-mono text-emerald-400">
                  HEALTHY
                </div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">Load: 0.14 • Latency: 12ms</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  id="tab-admin-users"
                  onClick={() => setActiveTab('USERS')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'USERS'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>User Management ({usersList.length})</span>
                </button>

                <button
                  id="tab-admin-broadcast"
                  onClick={() => setActiveTab('BROADCAST')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'BROADCAST'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                  <span>Broadcast Push Alert</span>
                </button>

                <button
                  id="tab-admin-logs"
                  onClick={() => setActiveTab('LOGS')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    activeTab === 'LOGS'
                      ? 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
                      : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Security & Audit Logs</span>
                </button>
              </div>

              {activeTab === 'USERS' && (
                <button
                  onClick={() => adminToken && loadAdminData(adminToken)}
                  className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Refresh users"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'USERS' && (
              <div className="bg-[#0e111a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                {/* Search Bar */}
                <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search users by name, handle, email, or auth provider (Google, FB, X, TG)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                    Showing {filteredUsers.length} of {usersList.length}
                  </span>
                </div>

                {/* Users Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Auth Provider</th>
                        <th className="py-3 px-4">Tier & Role</th>
                        <th className="py-3 px-4">Tip Balance</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Moderation Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                            No users matched your query.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatar}
                                  alt={u.name}
                                  className="w-8 h-8 rounded-full border border-slate-700 object-cover shrink-0"
                                />
                                <div>
                                  <div className="font-semibold text-white flex items-center gap-1.5">
                                    <span>{u.name}</span>
                                    {u.isVerified && (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                    )}
                                  </div>
                                  <div className="text-slate-400 text-xs font-mono">
                                    @{u.handle} • {u.email}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                                  u.provider === 'google'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : u.provider === 'facebook'
                                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                    : u.provider === 'twitter'
                                    ? 'bg-slate-700/50 text-white border border-slate-600'
                                    : u.provider === 'telegram'
                                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                                }`}
                              >
                                {u.provider}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className="text-xs font-mono">
                                <span className="text-cyan-400 font-bold">{u.tier}</span>
                                <span className="text-slate-500 ml-1.5 uppercase font-semibold text-[10px]">
                                  [{u.role}]
                                </span>
                              </div>
                            </td>

                            <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                              ${u.tipsBalance.toFixed(2)}
                            </td>

                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  u.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                }`}
                              >
                                {u.status}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleVerification(u)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                                    u.isVerified
                                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                      : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
                                  }`}
                                  title="Toggle verification badge"
                                >
                                  {u.isVerified ? 'Unverify' : 'Verify'}
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(u)}
                                  className={`p-1.5 rounded-lg border transition-all ${
                                    u.status === 'active'
                                      ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                                  }`}
                                  title={u.status === 'active' ? 'Suspend Account' : 'Re-activate Account'}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>

                                {u.role !== 'admin' && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
                                    title="Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'BROADCAST' && (
              <div className="max-w-2xl bg-[#0e111a] border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-2">
                  <BellRing className="w-5 h-5 text-rose-400" />
                  <h3 className="text-lg font-bold text-white">Broadcast Real-Time Volatility Alert</h3>
                </div>
                <p className="text-xs text-slate-400 mb-6">
                  Broadcast high-priority market volatility alerts directly into active client sessions
                  and the sentiment ticker terminal.
                </p>

                {broadcastSuccess && (
                  <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Volatility alert successfully deployed and broadcast to network!</span>
                  </div>
                )}

                <form onSubmit={handleBroadcastAlert} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Target Asset
                      </label>
                      <select
                        value={alertAsset}
                        onChange={(e) => setAlertAsset(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="BTC">Bitcoin ($BTC)</option>
                        <option value="ETH">Ethereum ($ETH)</option>
                        <option value="SOL">Solana ($SOL)</option>
                        <option value="XRP">XRP Ledger ($XRP)</option>
                        <option value="SUI">Sui Network ($SUI)</option>
                        <option value="DOGE">Dogecoin ($DOGE)</option>
                        <option value="LINK">Chainlink ($LINK)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Severity Level
                      </label>
                      <select
                        value={alertSeverity}
                        onChange={(e) => setAlertSeverity(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value="CRITICAL">CRITICAL (Immediate Red Alert)</option>
                        <option value="HIGH">HIGH (Whale Momentum)</option>
                        <option value="MEDIUM">MEDIUM (Sentiment Shift)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Alert Headline
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. $BTC Sudden Flash Surge — $140M Short Liquidations"
                      value={alertHeadline}
                      onChange={(e) => setAlertHeadline(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 placeholder-slate-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Trigger Price ($)
                      </label>
                      <input
                        type="text"
                        value={alertPrice}
                        onChange={(e) => setAlertPrice(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Change Magnitude
                      </label>
                      <input
                        type="text"
                        value={alertChange}
                        onChange={(e) => setAlertChange(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Context / Risk Warning
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Details regarding liquidation cascade, orderbook cluster absorption, or spot CVD shift..."
                      value={alertDescription}
                      onChange={(e) => setAlertDescription(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-rose-500 placeholder-slate-500 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={broadcastLoading}
                    className="w-full py-3 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {broadcastLoading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Deploy Alert Across Terminal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'LOGS' && (
              <div className="bg-[#0e111a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Sentinel Real-Time Audit Log
                  </h3>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    LIVE TELEMETRY
                  </span>
                </div>

                <div className="space-y-2">
                  {stats.recentModerationActions.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-white font-bold">{log.target}</span>
                        <span className="text-slate-400 text-[11px] hidden sm:inline">
                          by {log.moderator}
                        </span>
                      </div>
                      <span className="text-slate-500 text-[11px]">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
