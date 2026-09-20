import React, { useState } from 'react';
import { Post, Reply, CryptoAsset } from '../types';
import { SparklineChart } from './SparklineChart';
import {
  Heart,
  Repeat2,
  MessageCircle,
  Coins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Share2,
  Bookmark,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowUpRight,
  Send,
  Activity,
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  assets?: CryptoAsset[];
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onBookmark: (postId: string) => void;
  onTip: (post: Post) => void;
  onAnalyzeSentiment: (post: Post) => void;
  onSelectCashtag: (tag: string) => void;
  onAddReply: (postId: string, text: string) => void;
  isFocused?: boolean;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  assets = [],
  onLike,
  onRepost,
  onBookmark,
  onTip,
  onAnalyzeSentiment,
  onSelectCashtag,
  onAddReply,
  isFocused = false,
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showAIInsights, setShowAIInsights] = useState(false);

  // Extract mentioned cashtags from post.cashtags and post.content
  const rawTags = [...post.cashtags];
  const matchedInContent = post.content.match(/\$([A-Z0-9]+)/gi) || [];
  matchedInContent.forEach((m) => {
    const clean = m.replace('$', '').toUpperCase();
    if (!rawTags.includes(clean)) {
      rawTags.push(clean);
    }
  });

  const getAssetForTag = (tag: string): CryptoAsset => {
    const found = assets.find((a) => a.symbol.toUpperCase() === tag.toUpperCase());
    if (found) return found;

    // Generate deterministic mini-sparkline for unlisted tags
    let seed = 0;
    for (let i = 0; i < tag.length; i++) {
      seed = (seed << 5) - seed + tag.charCodeAt(i);
    }
    const isUp = Math.abs(seed) % 2 === 0;
    const basePrice = Math.max(0.5, (Math.abs(seed) % 250) + (isUp ? 20 : 5));
    const change24h = Number(((Math.abs(seed) % 18) * (isUp ? 1 : -1) + (isUp ? 2.5 : -1.8)).toFixed(2));
    const sparkline = [
      basePrice * 0.95,
      basePrice * 0.97,
      basePrice * 0.94,
      basePrice * (isUp ? 1.02 : 0.92),
      basePrice * (isUp ? 1.05 : 0.88),
      basePrice * (isUp ? 1.08 : 0.85),
      basePrice * (1 + change24h / 100),
    ];
    return {
      symbol: tag.toUpperCase(),
      name: `${tag.toUpperCase()} Asset`,
      price: basePrice * (1 + change24h / 100),
      change24h,
      change1h: 0.4,
      volume24h: '$12.4M',
      marketCap: '$180M',
      sparkline,
      sentimentScore: isUp ? 75 : 42,
    };
  };

  const mentionedAssets = rawTags.map(getAssetForTag);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onAddReply(post.id, replyText);
    setReplyText('');
  };

  const sentimentStyles: Record<string, { bg: string; text: string; border: string; icon: any; label: string }> = {
    BULLISH: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      icon: TrendingUp,
      label: 'Bullish',
    },
    BEARISH: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      icon: TrendingDown,
      label: 'Bearish',
    },
    ALPHA: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-400',
      border: 'border-cyan-500/30',
      icon: Sparkles,
      label: 'Top Signal',
    },
    DIAMOND_HANDS: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/30',
      icon: CheckCircle2,
      label: 'Diamond Hands',
    },
    NEUTRAL: {
      bg: 'bg-slate-800',
      text: 'text-slate-300',
      border: 'border-slate-700',
      icon: TrendingUp,
      label: 'Neutral',
    },
  };

  const sentimentConfig = sentimentStyles[post.sentiment] || sentimentStyles.NEUTRAL;
  const SentimentIcon = sentimentConfig.icon;

  // Format content with clickable cashtags
  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(\$[A-Z0-9]+|#[a-zA-Z0-9_]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('$')) {
        const tag = part.substring(1).toUpperCase();
        return (
          <button
            key={index}
            onClick={(e) => {
              e.stopPropagation();
              onSelectCashtag(tag);
            }}
            className="font-bold font-mono text-cyan-400 hover:text-cyan-300 hover:underline px-1 py-0.5 rounded hover:bg-cyan-500/10 transition-colors inline-block cursor-pointer"
          >
            {part}
          </button>
        );
      }
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-indigo-400 font-medium">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <article
      id={`post-card-${post.id}`}
      className={`border-b border-slate-800/80 p-3 sm:p-5 hover:bg-slate-900/40 transition-colors ${
        isFocused ? 'bg-cyan-950/20 ring-1 ring-cyan-500/40' : ''
      }`}
    >
      <div className="flex items-start gap-2.5 sm:gap-3">
        {/* Author Avatar */}
        <div className="relative shrink-0">
          <img
            src={post.author.avatar}
            alt={post.author.name}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-slate-700/80"
          />
          {post.author.isVerified && (
            <div
              className="absolute -bottom-1 -right-1 bg-[#090a0f] rounded-full p-0.5"
              title={`Verified Trader (${post.author.provider || 'Global'})`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            </div>
          )}
        </div>

        {/* Post Main Body */}
        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-start justify-between gap-1.5 mb-1.5">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-100 text-sm hover:underline cursor-pointer truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none">
                  {post.author.name}
                </span>
                {post.author.provider && (
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-semibold border ${
                      post.author.provider === 'google'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : post.author.provider === 'facebook'
                        ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        : post.author.provider === 'twitter'
                        ? 'bg-slate-800 text-white border-slate-700'
                        : post.author.provider === 'telegram'
                        ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {post.author.provider}
                  </span>
                )}
                {post.author.tier && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 font-semibold flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="hidden xs:inline">{post.author.tier}</span>
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono shrink-0">@{post.author.handle}</span>
                <span className="text-slate-500 text-xs hidden xs:inline">·</span>
                <span className="text-xs text-slate-400 font-mono shrink-0">{post.createdAt}</span>
              </div>
            </div>

            {/* Sentiment Pill */}
            <div className="shrink-0">
              <span
                className={`inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold border ${sentimentConfig.bg} ${sentimentConfig.text} ${sentimentConfig.border}`}
              >
                <SentimentIcon className="w-3 h-3" />
                <span className="hidden xs:inline">{sentimentConfig.label}</span>
                {post.sentimentScore !== undefined && (
                  <span className="font-mono text-[10px] sm:text-[11px] opacity-90">
                    {post.sentimentScore > 0 ? `+${post.sentimentScore}` : post.sentimentScore}%
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Text Content */}
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-line break-words">
            {renderFormattedContent(post.content)}
          </p>

          {/* Trade Targets if available */}
          {(post.targetPrice || post.stopLoss) && (
            <div className="my-2.5 p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-4 text-xs font-mono">
              {post.targetPrice && (
                <div className="flex items-center gap-1 text-emerald-400">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="text-slate-400">Target:</span>
                  <span className="font-bold">${post.targetPrice.toLocaleString()}</span>
                </div>
              )}
              {post.stopLoss && (
                <div className="flex items-center gap-1 text-rose-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span className="text-slate-400">Stop Loss:</span>
                  <span className="font-bold">${post.stopLoss.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          {/* 24h Real-Time Price Sparkline for Mentioned Assets */}
          {mentionedAssets.length > 0 && (
            <div className="my-3 space-y-2">
              {mentionedAssets.slice(0, 2).map((asset) => {
                const isPos = asset.change24h >= 0;
                const minPrice = Math.min(...asset.sparkline);
                const maxPrice = Math.max(...asset.sparkline);

                return (
                  <div
                    key={asset.symbol}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCashtag(asset.symbol);
                    }}
                    className="p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/90 hover:border-cyan-500/40 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono font-bold text-xs text-cyan-400 group-hover:text-cyan-300 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/25 shrink-0">
                          ${asset.symbol}
                        </span>
                        <span className="text-xs font-medium text-slate-300 truncate max-w-[100px] xs:max-w-[150px] sm:max-w-none">
                          {asset.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono hidden md:inline">24h Sparkline</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs font-bold font-mono text-slate-100">
                          ${asset.price > 10
                            ? asset.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : asset.price.toFixed(4)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[10px] sm:text-[11px] font-semibold font-mono px-1 sm:px-1.5 py-0.5 rounded ${
                            isPos ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {isPos ? <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                          {isPos ? '+' : ''}{asset.change24h}%
                        </span>
                      </div>
                    </div>

                    {/* Recharts 24h Area Sparkline */}
                    <div className="h-10 sm:h-11 w-full pt-1">
                      <SparklineChart
                        data={asset.sparkline}
                        change24h={asset.change24h}
                        symbol={asset.symbol}
                        height={40}
                        strokeWidth={2}
                        id={`post-${post.id}-${asset.symbol}`}
                      />
                    </div>

                    {/* Low / High / Volume Range Footer */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1.5 mt-1 border-t border-slate-800/60">
                      <div>
                        24h L:{' '}
                        <span className="text-slate-300 font-semibold">
                          ${minPrice > 10 ? minPrice.toLocaleString() : minPrice.toFixed(4)}
                        </span>
                      </div>
                      <div>
                        24h H:{' '}
                        <span className="text-slate-300 font-semibold">
                          ${maxPrice > 10 ? maxPrice.toLocaleString() : maxPrice.toFixed(4)}
                        </span>
                      </div>
                      <div className="hidden xs:block">
                        Vol: <span className="text-slate-300 font-semibold">{asset.volume24h}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Sentiment Analysis Accordion Preview */}
          {post.aiAnalysis && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Real-Time AI Market Sentiment Impact</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                    {post.aiAnalysis.confidence}% Conf.
                  </span>
                </div>
                <button
                  onClick={() => setShowAIInsights(!showAIInsights)}
                  className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAIInsights ? 'Hide Details' : 'View Breakdown'}</span>
                  {showAIInsights ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              <p className="text-slate-300 text-xs mt-1.5">{post.aiAnalysis.summary}</p>

              {showAIInsights && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Fear & Greed Impact</span>
                      <span className="text-cyan-400 font-bold font-mono text-sm">
                        {post.aiAnalysis.fearGreedRating} / 100
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800">
                      <span className="text-slate-400 text-[10px] block">Volatility Risk</span>
                      <span
                        className={`font-bold font-mono text-sm ${
                          post.aiAnalysis.volatilityRisk === 'HIGH' || post.aiAnalysis.volatilityRisk === 'EXTREME'
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {post.aiAnalysis.volatilityRisk}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 col-span-2 sm:col-span-1">
                      <span className="text-slate-400 text-[10px] block">Analysis Mode</span>
                      <span className="text-indigo-400 font-mono text-xs font-semibold">
                        {post.aiAnalysis.technicalTone}
                      </span>
                    </div>
                  </div>

                  {post.aiAnalysis.keyCatalysts.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[11px] font-semibold text-slate-300 block mb-1">Key Catalysts:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-400 text-[11px]">
                        {post.aiAnalysis.keyCatalysts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {post.aiAnalysis.riskWarnings.length > 0 && (
                    <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px]">
                      <strong>Risk Warning:</strong> {post.aiAnalysis.riskWarnings.join(' ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-between text-slate-400 text-xs mt-3 pt-2 border-t border-slate-800/40 select-none">
            {/* Replies */}
            <button
              id={`reply-btn-${post.id}`}
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1.5 hover:text-cyan-400 active:scale-90 transition-all p-1.5 sm:p-1 rounded cursor-pointer group"
              aria-label="View or write replies"
            >
              <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-[11px] sm:text-xs">{post.replies.length}</span>
            </button>

            {/* Repost */}
            <button
              id={`repost-btn-${post.id}`}
              onClick={() => onRepost(post.id)}
              className={`flex items-center gap-1.5 hover:text-emerald-400 active:scale-90 transition-all p-1.5 sm:p-1 rounded cursor-pointer group ${
                post.hasReposted ? 'text-emerald-400' : ''
              }`}
              aria-label="Repost signal"
            >
              <Repeat2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-[11px] sm:text-xs">{post.reposts}</span>
            </button>

            {/* Like */}
            <button
              id={`like-btn-${post.id}`}
              onClick={() => onLike(post.id)}
              className={`flex items-center gap-1.5 hover:text-rose-400 active:scale-90 transition-all p-1.5 sm:p-1 rounded cursor-pointer group ${
                post.hasLiked ? 'text-rose-500' : ''
              }`}
              aria-label="Like post"
            >
              <Heart
                className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                  post.hasLiked ? 'fill-rose-500 text-rose-500' : ''
                }`}
              />
              <span className="font-mono text-[11px] sm:text-xs">{post.likes}</span>
            </button>

            {/* Tip with Web3 Crypto */}
            <button
              id={`tip-btn-${post.id}`}
              onClick={() => onTip(post)}
              title="Tip Author in Crypto"
              className="flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 active:scale-95 text-amber-400 border border-amber-500/30 transition-all cursor-pointer group shadow-sm shadow-amber-500/5"
              aria-label="Tip author in crypto"
            >
              <Coins className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
              <span className="font-mono font-semibold text-[11px] sm:text-xs">${post.tipsReceived.toFixed(1)}</span>
            </button>

            {/* Bookmark & AI deep trigger */}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {!post.aiAnalysis && (
                <button
                  id={`ai-analyze-btn-${post.id}`}
                  onClick={() => onAnalyzeSentiment(post)}
                  title="Run AI Sentiment Analysis"
                  className="p-1.5 rounded text-slate-400 hover:text-cyan-400 active:scale-90 hover:bg-slate-800 transition-all cursor-pointer"
                  aria-label="Analyze sentiment"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                id={`bookmark-btn-${post.id}`}
                onClick={() => onBookmark(post.id)}
                className={`p-1.5 rounded hover:text-slate-200 active:scale-90 transition-all cursor-pointer ${
                  post.hasBookmarked ? 'text-cyan-400' : 'text-slate-400'
                }`}
                aria-label="Bookmark post"
              >
                <Bookmark className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Threaded Replies Section */}
          {showReplies && (
            <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3">
              {post.replies.map((reply) => (
                <div key={reply.id} className="flex items-start gap-2.5 text-xs bg-slate-900/50 p-2.5 rounded-lg">
                  <img
                    src={reply.author.avatar}
                    alt={reply.author.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold text-slate-200">{reply.author.name}</span>
                      <span className="text-[10px] font-mono text-slate-400">@{reply.author.handle}</span>
                      <span className="text-[10px] text-slate-400">· {reply.createdAt}</span>
                    </div>
                    <p className="text-slate-300">{reply.content}</p>
                  </div>
                </div>
              ))}

              {/* Reply Input Form */}
              <form onSubmit={handleReplySubmit} className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Post your counter-thesis or reply..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Reply</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
