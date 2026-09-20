import React, { useState } from 'react';
import {
  LineChart,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Send,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { CryptoAsset, SentimentAnalysisResult } from '../types';

interface SentimentTerminalViewProps {
  assets: CryptoAsset[];
  onSelectCoin: (coin: string) => void;
}

const PRESET_SIGNALS = [
  'Bitcoin ETF recorded +$890M net spot inflow today. BlackRock IBIT absorbs 7,400 BTC into cold custody.',
  'Solana FireDancer validator client achieves 65,000 sustained TPS in testnet dry-run. Ecosystem TVL expanding.',
  'Derivatives open interest on altcoins reaches 6-month high with funding rates at +0.08%. Long squeeze risk elevated.',
  'Ethereum layer 2 blob space fee reduction leads to record transaction throughput across Base and Arbitrum.',
];

export const SentimentTerminalView: React.FC<SentimentTerminalViewProps> = ({
  assets,
  onSelectCoin,
}) => {
  const [testInput, setTestInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<SentimentAnalysisResult | null>(null);

  const handleRunAnalysis = async (textToTest?: string) => {
    const text = textToTest || testInput;
    if (!text.trim()) return;

    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/sentiment/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          cashtags: ['BTC', 'ETH', 'SOL'],
        }),
      });
      const data = await res.json();
      if (data && !data.error) {
        setResult(data);
      }
    } catch (err) {
      console.error('Sentiment terminal error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div id="sentiment-terminal-page" className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 border border-cyan-500/30">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-[11px] sm:text-xs uppercase tracking-wider mb-1">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-Time Crypto Sentiment Terminal</span>
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-white">
          Quantitative Sentiment & Volatility Engine
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
          Powered by Gemini AI and automated orderbook social sentiment tracking. Test any market narrative, breaking news event, or trader hypothesis to determine directional bias and liquidation volatility risks.
        </p>
      </div>

      {/* Interactive Analyzer Sandbox */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>AI Sentiment Sandbox</span>
        </h3>

        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Input Crypto Thesis, Tweet, or News Bulletin:
          </label>
          <textarea
            rows={3}
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Type or paste any market statement, e.g., 'Federal Reserve signals rate pauses as Bitcoin holds $96,000 support...'"
            className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
            Quick Market Presets:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SIGNALS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestInput(preset);
                  handleRunAnalysis(preset);
                }}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 border border-slate-700/60 transition-all text-left truncate max-w-full sm:max-w-xs cursor-pointer"
              >
                {preset.slice(0, 42)}...
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => handleRunAnalysis()}
          disabled={isAnalyzing || !testInput.trim()}
          className="w-full sm:w-auto justify-center py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 disabled:opacity-40 text-black font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all"
        >
          {isAnalyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4 fill-black" />
          )}
          <span>{isAnalyzing ? 'Evaluating Signal...' : 'Analyze Market Sentiment with Gemini'}</span>
        </button>

        {/* Analysis Output Card */}
        {result && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-3 mt-3 animate-fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Classified Stance</span>
                <span className="text-sm sm:text-base font-extrabold text-cyan-400 font-mono">
                  {result.label.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Intensity</span>
                  <span className={`text-sm sm:text-base font-bold font-mono ${result.sentimentScore >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {result.sentimentScore > 0 ? `+${result.sentimentScore}` : result.sentimentScore}%
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-slate-400 block">Confidence</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-slate-200">
                    {result.confidence}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {result.summary}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
              <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Fear/Greed</span>
                <span className="font-bold font-mono text-emerald-400 text-xs sm:text-sm">
                  {result.fearGreedRating} / 100
                </span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Volatility Risk</span>
                <span
                  className={`font-bold font-mono text-xs sm:text-sm ${
                    result.volatilityRisk === 'HIGH' || result.volatilityRisk === 'EXTREME'
                      ? 'text-rose-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {result.volatilityRisk}
                </span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Tone</span>
                <span className="font-bold font-mono text-indigo-400 text-xs truncate block">
                  {result.technicalTone}
                </span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-mono">Model</span>
                <span className="font-mono text-cyan-400 text-xs truncate block">
                  {result.source || 'gemini-3.8-flash'}
                </span>
              </div>
            </div>

            {result.keyCatalysts && result.keyCatalysts.length > 0 && (
              <div className="pt-2">
                <span className="text-xs font-semibold text-slate-300 block mb-1">Key Catalysts Detected:</span>
                <div className="flex flex-wrap gap-1.5">
                  {result.keyCatalysts.map((c, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                      • {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset Sentiment Spectrum Heatmap */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3.5">
        <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
          <LineChart className="w-4 h-4 text-emerald-400" />
          <span>Multi-Asset Sentiment Spectrum</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
          {assets.map((asset) => {
            const isHigh = asset.sentimentScore >= 70;
            return (
              <div
                key={asset.symbol}
                onClick={() => onSelectCoin(asset.symbol)}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold font-mono text-sm text-slate-100 group-hover:text-cyan-400">
                    ${asset.symbol}
                  </span>
                  <span
                    className={`text-xs font-mono font-bold ${
                      isHigh ? 'text-emerald-400' : 'text-slate-300'
                    }`}
                  >
                    {asset.sentimentScore} / 100
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mb-2">{asset.name}</div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full ${
                      isHigh
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                        : 'bg-gradient-to-r from-amber-500 to-rose-400'
                    }`}
                    style={{ width: `${asset.sentimentScore}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
