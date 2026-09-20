import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Send,
  Loader2,
  DollarSign,
  AlertCircle,
  Hash,
  Coins,
  LogIn,
} from 'lucide-react';
import { SentimentType, SentimentAnalysisResult, UserProfile } from '../types';

interface PostComposerProps {
  onPublish: (postData: {
    content: string;
    cashtags: string[];
    sentiment: SentimentType;
    sentimentScore: number;
    targetPrice?: number;
    stopLoss?: number;
    aiAnalysis?: SentimentAnalysisResult;
  }) => void;
  user: UserProfile | null;
  onRequireAuth?: () => void;
  selectedCashtag?: string;
}

const COMMON_CASHTAGS = ['BTC', 'ETH', 'SOL', 'SUI', 'XRP', 'DOGE', 'LINK', 'BNB'];

export const PostComposer: React.FC<PostComposerProps> = ({
  onPublish,
  user,
  onRequireAuth,
  selectedCashtag,
}) => {
  const [content, setContent] = useState('');
  const [sentiment, setSentiment] = useState<SentimentType>('BULLISH');
  const [activeCashtags, setActiveCashtags] = useState<string[]>([]);
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [stopLoss, setStopLoss] = useState<string>('');
  const [showTargets, setShowTargets] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiPreview, setAiPreview] = useState<SentimentAnalysisResult | null>(null);

  // If a cashtag is passed from outside (e.g. ticker clicked)
  useEffect(() => {
    if (selectedCashtag && !activeCashtags.includes(selectedCashtag)) {
      setActiveCashtags((prev) => [...prev, selectedCashtag]);
      if (!content.includes(`$${selectedCashtag}`)) {
        setContent((prev) => (prev ? `${prev} $${selectedCashtag} ` : `$${selectedCashtag} `));
      }
    }
  }, [selectedCashtag]);

  const toggleCashtag = (tag: string) => {
    if (activeCashtags.includes(tag)) {
      setActiveCashtags(activeCashtags.filter((t) => t !== tag));
    } else {
      setActiveCashtags([...activeCashtags, tag]);
      if (!content.includes(`$${tag}`)) {
        setContent((prev) => (prev ? `${prev} $${tag} ` : `$${tag} `));
      }
    }
  };

  // Run AI Sentiment evaluation
  const handleDeepAnalyze = async () => {
    if (!content.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          cashtags: activeCashtags,
        }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setAiPreview(data);
        if (data.label === 'EXTREMELY_BULLISH' || data.label === 'BULLISH') {
          setSentiment('BULLISH');
        } else if (data.label === 'EXTREMELY_BEARISH' || data.label === 'BEARISH') {
          setSentiment('BEARISH');
        }
      }
    } catch (err) {
      console.error('Failed to run AI sentiment analysis:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePublish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!content.trim()) return;

    if (!user && onRequireAuth) {
      onRequireAuth();
      return;
    }

    // Extract any cashtags automatically from text
    const matchedTags = content.match(/\$([A-Z0-9]+)/g) || [];
    const allTags = Array.from(
      new Set([
        ...activeCashtags,
        ...matchedTags.map((t) => t.substring(1).toUpperCase()),
      ])
    );

    let score = sentiment === 'BULLISH' ? 75 : sentiment === 'BEARISH' ? -70 : sentiment === 'ALPHA' ? 90 : 50;
    if (aiPreview) {
      score = aiPreview.sentimentScore;
    }

    onPublish({
      content,
      cashtags: allTags,
      sentiment,
      sentimentScore: score,
      targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      aiAnalysis: aiPreview || undefined,
    });

    setContent('');
    setActiveCashtags([]);
    setTargetPrice('');
    setStopLoss('');
    setAiPreview(null);
    setShowTargets(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handlePublish();
    }
  };

  return (
    <div id="post-composer-box" className="p-3 sm:p-5 border-b border-slate-800 bg-[#0c0e15]/70">
      <div className="flex items-start gap-2.5 sm:gap-3">
        {user ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-cyan-500/50 object-cover shrink-0"
          />
        ) : (
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0 border border-slate-700">
            ⚡
          </div>
        )}

        <div className="flex-1 min-w-0">
          {/* Active User verification pill */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-200">
              {user ? user.name : 'Global Sentiment Broadcaster'}
            </span>
            {user ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 flex items-center gap-1 font-semibold truncate max-w-[170px] sm:max-w-none">
                <ShieldCheck className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>@{user.handle}</span>
                <span className="uppercase text-[9px] text-cyan-400/80">({user.provider})</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={onRequireAuth}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <LogIn className="w-2.5 h-2.5 text-cyan-400" />
                <span>Sign In to Post</span>
              </button>
            )}
          </div>

          {/* Text Area (16px base font to prevent iOS auto-zoom) */}
          <textarea
            id="composer-textarea"
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Share market insights, orderbook flows, price breakouts, or counter-theses... Type $BTC, $SOL..."
            className="w-full bg-transparent border-0 text-slate-100 placeholder-slate-400 text-sm sm:text-base focus:outline-none resize-none leading-relaxed"
          />

          {/* Cashtags Bar (Horizontal Swipeable on mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar my-2 py-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold shrink-0">
              Cashtags:
            </span>
            {COMMON_CASHTAGS.map((tag) => {
              const active = activeCashtags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleCashtag(tag)}
                  className={`px-2 py-0.5 rounded-full text-xs font-mono font-semibold transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  ${tag}
                </button>
              );
            })}
          </div>

          {/* Trade Targets Drawer */}
          {showTargets && (
            <div className="my-2.5 p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-2 gap-3 animate-fade-in">
              <div>
                <label className="block text-[11px] font-mono text-emerald-400 mb-1">
                  Target Exit Price ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 104500"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-rose-400 mb-1">
                  Stop Loss ($)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 92000"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-rose-300 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          {/* AI Sentiment Analysis Box */}
          {aiPreview && (
            <div className="my-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-xs">
              <div className="flex items-center justify-between font-semibold text-cyan-300 mb-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Gemini Sentiment Engine Score
                </span>
                <span className="font-mono text-emerald-400">{aiPreview.sentimentScore}% Bullish</span>
              </div>
              <p className="text-slate-300 text-[11px]">{aiPreview.summary}</p>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1 flex-wrap gap-2">
            {/* Sentiment Selector */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setSentiment('BULLISH')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sentiment === 'BULLISH'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-transparent'
                }`}
              >
                <TrendingUp className="w-3 h-3 text-emerald-400" />
                <span className="hidden xs:inline">Bullish</span>
              </button>

              <button
                type="button"
                onClick={() => setSentiment('BEARISH')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sentiment === 'BEARISH'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-transparent'
                }`}
              >
                <TrendingDown className="w-3 h-3 text-rose-400" />
                <span className="hidden xs:inline">Bearish</span>
              </button>

              <button
                type="button"
                onClick={() => setSentiment('ALPHA')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  sentiment === 'ALPHA'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-transparent'
                }`}
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="hidden xs:inline">Signal</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTargets(!showTargets)}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  showTargets || targetPrice
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
                }`}
                title="Add price target / stop loss"
              >
                <DollarSign className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right Buttons: AI Analyze & Submit */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleDeepAnalyze}
                disabled={isAnalyzing || !content.trim()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs font-medium text-cyan-300 hover:border-cyan-500/40 transition-all cursor-pointer disabled:opacity-40"
                title="Evaluate sentiment with Gemini AI"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />
                ) : (
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                )}
                <span className="hidden sm:inline">AI Check</span>
              </button>

              <button
                id="composer-publish-button"
                type="button"
                onClick={() => handlePublish()}
                disabled={!content.trim()}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-cyan-500/20 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              >
                <span>Broadcast</span>
                <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
