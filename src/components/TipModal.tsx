import React, { useState } from 'react';
import { X, Coins, ShieldCheck, CheckCircle2, Sparkles, Loader2, LogIn } from 'lucide-react';
import { Post, UserProfile } from '../types';

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  user: UserProfile | null;
  onExecuteTip: (postId: string, amount: number) => void;
  onOpenAuth: () => void;
}

export const TipModal: React.FC<TipModalProps> = ({
  isOpen,
  onClose,
  post,
  user,
  onExecuteTip,
  onOpenAuth,
}) => {
  const [amount, setAmount] = useState<number>(10);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen || !post) return null;

  const quickAmounts = [5, 10, 25, 50, 100];

  const handleConfirm = () => {
    if (!user) {
      onOpenAuth();
      return;
    }

    if (user.tipsBalance < amount) {
      alert(`Insufficient tipping balance. Your balance is $${user.tipsBalance.toFixed(2)}.`);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      onExecuteTip(post.id, amount);
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0e1017] border border-amber-500/30 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
              <Coins className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Tip Creator</h3>
              <p className="text-[11px] text-amber-400 font-mono">Instant Social Reward</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {isSuccess ? (
            <div className="text-center py-6 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="font-bold text-slate-100 text-sm">Tip Sent Successfully!</h4>
              <p className="text-xs text-slate-400 font-mono">
                ${amount} transferred to {post.author.name}
              </p>
            </div>
          ) : (
            <>
              {/* Creator Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-200 text-xs truncate">{post.author.name}</span>
                    {post.author.isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">@{post.author.handle}</div>
                </div>
              </div>

              {/* Tipping Balance Banner */}
              {user ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                  <span className="text-slate-400">Your Tipping Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">${user.tipsBalance.toFixed(2)}</span>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs text-cyan-300 flex items-center justify-between">
                  <span>Sign in to tip creators</span>
                  <button
                    onClick={onOpenAuth}
                    className="font-bold underline hover:text-cyan-200 cursor-pointer"
                  >
                    Login
                  </button>
                </div>
              )}

              {/* Quick Select Buttons */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Tip Amount ($USD)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmount(val)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                        amount === val
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      ${val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={handleConfirm}
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : user ? (
                  <>
                    <Coins className="w-4 h-4" />
                    <span>Confirm Tip of ${amount}</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Send Tip</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
