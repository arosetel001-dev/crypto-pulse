import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Users,
  Radio,
  Smile,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  ArrowDown,
  Flame,
  ShieldCheck,
  TrendingUp,
  CornerDownRight,
  ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, UserProfile } from '../types';

interface GlobalChatRoomProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onSelectCashtag?: (symbol: string) => void;
}

const POPULAR_CASHTAGS = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'SUI'];
const REACTION_EMOJIS = ['🚀', '🔥', '💎', '🐻', '👀'];

export const GlobalChatRoom: React.FC<GlobalChatRoomProps> = ({
  user,
  onOpenAuth,
  onSelectCashtag,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedCashtag, setSelectedCashtag] = useState<string | null>(null);
  const [tipAmount, setTipAmount] = useState<number | null>(null);
  const [showTipSelector, setShowTipSelector] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(24);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasScrolledUp, setHasScrolledUp] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  // Initial fetch from REST API as resilient baseline
  useEffect(() => {
    fetch('/api/chat/messages')
      .then((res) => res.json())
      .then((data) => {
        if (data.messages && Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
        if (data.onlineCount) {
          setOnlineCount(data.onlineCount);
        }
      })
      .catch((err) => {
        console.warn('Initial chat messages fetch warning:', err);
      });
  }, []);

  // WebSockets Connection Lifecycle
  useEffect(() => {
    let isMounted = true;

    function connectWebSocket() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws/chat`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'init') {
              if (Array.isArray(data.messages)) {
                setMessages(data.messages);
              }
              if (data.onlineCount) {
                setOnlineCount(data.onlineCount);
              }
            } else if (data.type === 'new_message' && data.message) {
              setMessages((prev) => {
                // Idempotent check
                if (prev.some((m) => m.id === data.message.id)) return prev;
                return [...prev, data.message];
              });
            } else if (data.type === 'presence' && data.onlineCount) {
              setOnlineCount(data.onlineCount);
            } else if (data.type === 'reaction_updated') {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === data.messageId
                    ? { ...m, reactions: data.reactions }
                    : m
                )
              );
            }
          } catch (e) {
            console.error('Error handling WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Auto reconnect after 2.5s
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted) connectWebSocket();
          }, 2500);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
        };
      } catch (err) {
        console.error('Failed to create WebSocket:', err);
      }
    }

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Handle auto-scroll to bottom
  useEffect(() => {
    if (!hasScrolledUp) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, hasScrolledUp]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 120;
    setHasScrolledUp(isUp);
  };

  const scrollToBottom = () => {
    setHasScrolledUp(false);
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const messageText = inputText.trim();
    const cashtag = selectedCashtag || undefined;
    const tip = tipAmount || undefined;

    // Build payload
    const payload = {
      type: 'send_message',
      text: messageText,
      cashtag,
      tipAmount: tip,
      sender: user
        ? {
            id: user.id,
            name: user.name,
            handle: user.handle,
            avatar: user.avatar,
            provider: user.provider,
            isVerified: user.isVerified,
            tier: user.tier,
          }
        : {
            id: 'trader-guest-' + Date.now(),
            name: 'Guest Trader',
            handle: 'guest_trader',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=guest',
            provider: 'email' as const,
            isVerified: false,
            tier: 'COMMUNITY' as const,
          },
    };

    // Reset input states immediately
    setInputText('');
    setSelectedCashtag(null);
    setTipAmount(null);
    setShowTipSelector(false);
    setHasScrolledUp(false);

    // Send via WebSocket if open
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    } else {
      // Fallback via HTTP REST
      try {
        const token = localStorage.getItem('cp_auth_token');
        const res = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            text: messageText,
            cashtag,
            tipAmount: tip,
            sender: payload.sender,
          }),
        });
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.message.id)) return prev;
            return [...prev, data.message];
          });
        }
      } catch (err) {
        console.error('Error posting message via REST:', err);
      }
    }
  };

  // Add Emoji Reaction
  const handleAddReaction = async (messageId: string, emoji: string) => {
    // Optimistic UI update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === messageId) {
          const reactions = { ...(m.reactions || {}) };
          reactions[emoji] = (reactions[emoji] || 0) + 1;
          return { ...m, reactions };
        }
        return m;
      })
    );

    // Send via WebSocket or REST
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'react',
          messageId,
          emoji,
        })
      );
    } else {
      try {
        await fetch('/api/chat/react', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId, emoji }),
        });
      } catch (e) {
        console.error('Failed to react:', e);
      }
    }
  };

  const handleReplyTo = (handle: string) => {
    setInputText((prev) => `@${handle} ${prev}`);
  };

  return (
    <div
      id="global-chat-room"
      className="flex flex-col h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-5rem)] bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md"
    >
      {/* Chat Room Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900/90 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">
                Global Chat Room
              </h2>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-time peer-to-peer crypto discussions & market insights
            </p>
          </div>
        </div>

        {/* Presence & Connection Badge */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">{onlineCount}</span>
            <span className="text-slate-400 text-[11px]">Traders Online</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-mono ${
              isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'
              }`}
            />
            <span>{isConnected ? 'WebSocket Sync' : 'Reconnecting...'}</span>
          </div>
        </div>
      </div>

      {/* Quick Cashtag Filter Bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 overflow-x-auto no-scrollbar shrink-0 text-xs">
        <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider shrink-0">
          Trending Tickers:
        </span>
        {POPULAR_CASHTAGS.map((ticker) => (
          <button
            key={ticker}
            type="button"
            onClick={() => {
              if (selectedCashtag === ticker) {
                setSelectedCashtag(null);
              } else {
                setSelectedCashtag(ticker);
                if (onSelectCashtag) onSelectCashtag(ticker);
              }
            }}
            className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all text-xs cursor-pointer shrink-0 ${
              selectedCashtag === ticker
                ? 'bg-cyan-500 text-black shadow-sm shadow-cyan-500/30'
                : 'bg-slate-800/80 text-cyan-300 hover:bg-slate-750 border border-slate-700/50'
            }`}
          >
            ${ticker}
          </button>
        ))}
        {selectedCashtag && (
          <button
            type="button"
            onClick={() => setSelectedCashtag(null)}
            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer ml-1"
          >
            Clear tag
          </button>
        )}
      </div>

      {/* Messages Feed Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
            <Radio className="w-10 h-10 text-slate-600 mb-3 animate-pulse" />
            <p className="font-semibold text-slate-300 text-sm">
              Connecting to Global Chat...
            </p>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Initializing WebSockets sync with community traders. Say hello or post a ticker signal!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = user && msg.sender.id === user.id;
            return (
              <div
                key={msg.id}
                id={`chat-msg-${msg.id}`}
                className={`flex gap-3 group transition-all rounded-xl p-2.5 hover:bg-slate-800/40 border border-transparent hover:border-slate-800/60 ${
                  isMe ? 'bg-cyan-950/10' : ''
                }`}
              >
                {/* Sender Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={msg.sender.avatar}
                    alt={msg.sender.name}
                    className="w-9 h-9 rounded-xl object-cover ring-1 ring-slate-700/60"
                  />
                  {msg.sender.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-black rounded-full p-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5 fill-current" />
                    </div>
                  )}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  {/* Sender Metadata Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="font-semibold text-white text-xs hover:text-cyan-300 transition-colors">
                      {msg.sender.name}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      @{msg.sender.handle}
                    </span>

                    {/* Tier or Provider Badge */}
                    {msg.sender.tier && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700 font-medium">
                        {msg.sender.tier}
                      </span>
                    )}

                    {/* Cashtag Pill */}
                    {msg.cashtag && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        ${msg.cashtag}
                      </span>
                    )}

                    {/* Micro-tip Highlight */}
                    {msg.tipAmount && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                        <DollarSign className="w-2.5 h-2.5" />
                        <span>Tipped ${msg.tipAmount}</span>
                      </span>
                    )}

                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Message Text */}
                  <p className="text-sm text-slate-200 leading-relaxed break-words whitespace-pre-wrap selection:bg-cyan-500 selection:text-black">
                    {msg.text}
                  </p>

                  {/* Reactions & Reply Action Bar */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {REACTION_EMOJIS.map((emoji) => {
                      const count = msg.reactions?.[emoji] || 0;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleAddReaction(msg.id, emoji)}
                          className={`text-xs px-2 py-0.5 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            count > 0
                              ? 'bg-slate-800 border-cyan-500/40 text-slate-200 font-semibold shadow-xs'
                              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                          }`}
                        >
                          <span>{emoji}</span>
                          {count > 0 && (
                            <span className="text-[10px] font-mono text-cyan-300">
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}

                    {/* Quick Reply Mention */}
                    <button
                      type="button"
                      onClick={() => handleReplyTo(msg.sender.handle)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-slate-400 hover:text-cyan-300 flex items-center gap-1 ml-2 cursor-pointer"
                    >
                      <CornerDownRight className="w-3 h-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom Indicator */}
      <AnimatePresence>
        {hasScrolledUp && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500 text-black font-semibold text-xs shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 cursor-pointer z-20"
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>New messages below</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Unauthenticated Quick Banner */}
      {!user && (
        <div className="px-4 py-2 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Sign in with Google, Facebook, Twitter, or Telegram to earn verified tier badges and tips.
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs shrink-0 cursor-pointer transition-all"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Message Compose Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-slate-900/95 border-t border-slate-800 shrink-0 space-y-2"
      >
        {/* Selected Cashtag & Micro-Tip Tags Preview */}
        {(selectedCashtag || tipAmount) && (
          <div className="flex items-center gap-2 text-xs">
            {selectedCashtag && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-bold">
                ${selectedCashtag}
                <button
                  type="button"
                  onClick={() => setSelectedCashtag(null)}
                  className="hover:text-white ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
            {tipAmount && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono font-bold">
                🎁 Attached Tip: ${tipAmount}
                <button
                  type="button"
                  onClick={() => setTipAmount(null)}
                  className="hover:text-white ml-1 cursor-pointer"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Micro-Tip Quick Selector */}
        {showTipSelector && (
          <div className="p-2 bg-slate-950 border border-amber-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <DollarSign className="w-4 h-4" />
              <span>Attach Micro-Tip:</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[5, 10, 25, 50].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setTipAmount(amt);
                    setShowTipSelector(false);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                    tipAmount === amt
                      ? 'bg-amber-500 text-black'
                      : 'bg-slate-800 text-amber-300 hover:bg-slate-750'
                  }`}
                >
                  ${amt}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowTipSelector(false)}
                className="text-slate-400 hover:text-white px-1 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          {/* Cashtag Quick Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                const nextTicker =
                  POPULAR_CASHTAGS[
                    (POPULAR_CASHTAGS.indexOf(selectedCashtag || '') + 1) %
                      POPULAR_CASHTAGS.length
                  ];
                setSelectedCashtag(nextTicker);
              }}
              title="Cycle cashtag ($BTC, $ETH, $SOL...)"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-cyan-400 border border-slate-700/60 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-0.5"
            >
              <span>$</span>
            </button>
          </div>

          {/* Micro-tip Trigger */}
          <button
            type="button"
            onClick={() => setShowTipSelector(!showTipSelector)}
            title="Attach a micro-tip to support the room"
            className={`p-2 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
              tipAmount
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border-slate-700/60'
            }`}
          >
            <DollarSign className="w-4 h-4" />
          </button>

          {/* Text Input */}
          <input
            id="input-global-chat"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              user
                ? `Chatting as @${user.handle}... (press Enter to send)`
                : 'Share market insights or questions with global traders...'
            }
            className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
          />

          {/* Submit Button */}
          <button
            id="btn-send-chat-message"
            type="submit"
            disabled={!inputText.trim()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-sm rounded-xl transition-all shadow-md shadow-cyan-500/20 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </form>
    </div>
  );
};
