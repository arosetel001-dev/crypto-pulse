import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Mail,
  Lock,
  User,
  AtSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AuthProvider, UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile, token: string) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [handle, setHandle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AuthProvider | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [oauthConfig, setOAuthConfig] = useState<{
    google?: { configured: boolean; clientId: string };
    facebook?: { configured: boolean; appId: string };
    twitter?: { configured: boolean; clientId: string };
    telegram?: { configured: boolean; botUsername: string };
  }>({});

  // Reset states when opening
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMsg(null);
      setSuccessMsg(null);
      // Fetch OAuth config
      fetch('/api/auth/config')
        .then((res) => res.json())
        .then((data) => setOAuthConfig(data))
        .catch(() => {});
    }
  }, [isOpen, initialMode]);

  // Google GSI render check
  useEffect(() => {
    if (!isOpen) return;
    const gClientId = oauthConfig.google?.clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;
    if ((window as any).google?.accounts?.id && gClientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: gClientId,
          callback: handleGoogleCredentialResponse,
        });
        const buttonEl = document.getElementById('google-gsi-button');
        if (buttonEl) {
          (window as any).google.accounts.id.renderButton(buttonEl, {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            shape: 'pill',
            text: 'continue_with',
          });
        }
      } catch (e) {
        console.warn('Google GSI init notice:', e);
      }
    }
  }, [isOpen, oauthConfig]);

  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Google login failed');
      setSuccessMsg(`Welcome, ${data.user.name}!`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Google sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Generic OAuth Trigger
  const handleSocialAuth = async (provider: AuthProvider) => {
    setActiveProvider(provider);
    setIsLoading(true);
    setErrorMsg(null);

    try {
      let endpoint = `/api/auth/${provider}`;
      let payload: any = {};

      if (provider === 'google') {
        payload = {
          email: 'trader.google@gmail.com',
          name: 'Alex Rivera (Google)',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
          googleId: 'g-' + Math.floor(10000000 + Math.random() * 90000000),
        };
      } else if (provider === 'facebook') {
        payload = {
          email: 'elena.fb@meta.com',
          name: 'Elena Rostova (Meta)',
          avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
          facebookId: 'fb-' + Math.floor(10000000 + Math.random() * 90000000),
        };
      } else if (provider === 'twitter') {
        payload = {
          username: 'crypto_hawk_' + Math.floor(100 + Math.random() * 900),
          name: 'Crypto Hawk (X)',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
          twitterId: 'tw-' + Math.floor(10000000 + Math.random() * 90000000),
        };
      } else if (provider === 'telegram') {
        payload = {
          id: Math.floor(10000000 + Math.random() * 90000000),
          first_name: 'Viktor',
          last_name: 'TG',
          username: 'tg_sentinel_' + Math.floor(100 + Math.random() * 900),
          photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        };
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `${provider} authentication failed`);

      setSuccessMsg(`Successfully authenticated via ${provider.toUpperCase()}!`);
      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
      setActiveProvider(null);
    }
  };

  // Email / Password Form Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const body =
        mode === 'register'
          ? { email, password, name, handle }
          : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication error');
      }

      setSuccessMsg(
        mode === 'register'
          ? '🎉 Account created successfully!'
          : `Welcome back, ${data.user.name}!`
      );

      setTimeout(() => {
        onLoginSuccess(data.user, data.token);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to authenticate');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', duration: 0.35 }}
          className="relative w-full max-w-lg bg-[#0f111a] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 z-10 my-8 overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            id="btn-close-auth-modal"
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Global Trader Access
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {mode === 'login' ? 'Sign In to CryptoPulse' : 'Create Your Account'}
            </h2>
            <p className="text-sm text-slate-400 mt-1.5">
              {mode === 'login'
                ? 'Access institutional sentiment tools, trade ideas, and live tipping.'
                : 'Join global traders on the CryptoPulse forum.'}
            </p>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-3 text-rose-300 text-xs sm:text-sm"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-300 text-xs sm:text-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 border border-slate-800 rounded-xl mb-6">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              id="tab-auth-register"
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Register</span>
            </button>
          </div>

          {/* Social Login Provider Grid */}
          <div className="space-y-3 mb-6">
            <div className="text-xs font-medium text-slate-400 flex items-center justify-between">
              <span>Continue with social provider:</span>
              <span className="text-[11px] text-cyan-400 font-semibold">Instant 1-Click</span>
            </div>

            {/* Google Identity Container (GSI / Fallback) */}
            <div id="google-gsi-button" className="w-full flex justify-center empty:hidden" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Google Button */}
              <button
                id="btn-login-google"
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth('google')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all group disabled:opacity-50"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span className="text-xs font-semibold">Google</span>
              </button>

              {/* Facebook Button */}
              <button
                id="btn-login-facebook"
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth('facebook')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all group disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 text-[#1877F2] group-hover:scale-110 transition-transform fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span className="text-xs font-semibold">Facebook</span>
              </button>

              {/* Twitter / X Button */}
              <button
                id="btn-login-twitter"
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth('twitter')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all group disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 text-white group-hover:scale-110 transition-transform fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span className="text-xs font-semibold">Twitter / X</span>
              </button>

              {/* Telegram Button */}
              <button
                id="btn-login-telegram"
                type="button"
                disabled={isLoading}
                onClick={() => handleSocialAuth('telegram')}
                className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white transition-all group disabled:opacity-50"
              >
                <svg
                  className="w-5 h-5 text-[#229ED9] group-hover:scale-110 transition-transform fill-current"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.832.916z" />
                </svg>
                <span className="text-xs font-semibold">Telegram</span>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#0f111a] px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              or use email credentials
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-auth-name"
                      type="text"
                      required
                      placeholder="e.g. Satoshi Nakamura"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Username / Handle
                  </label>
                  <div className="relative">
                    <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="input-auth-handle"
                      type="text"
                      placeholder="satoshi_trader"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-auth-email"
                  type="email"
                  required
                  placeholder="trader@cryptopulse.global"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                {mode === 'login' && (
                  <span className="text-[11px] text-cyan-400 cursor-pointer hover:underline">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Terminal' : 'Complete Registration'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-5 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>TLS Encrypted Global Security</span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">CryptoPulse Protocol</div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
