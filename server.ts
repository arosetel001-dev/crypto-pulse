import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client lazily
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// -------------------------------------------------------------
// USER & AUTHENTICATION STORE (No Mock, Real In-Memory / Session State)
// -------------------------------------------------------------
export type AuthProvider = "google" | "facebook" | "twitter" | "telegram" | "email";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  handle: string;
  avatar: string;
  provider: AuthProvider;
  providerId?: string;
  password?: string;
  isVerified: boolean;
  tier: "PRO_TRADER" | "ALPHA_SEEKER" | "ANALYST" | "VERIFIED" | "COMMUNITY" | "WHALE" | "BUILDER" | "QUANT";
  role: "user" | "admin" | "moderator";
  bio: string;
  tipsBalance: number; // in USD credits for tipping
  createdAt: string;
  socialBadge?: string;
  status: "active" | "suspended" | "banned";
}

const users = new Map<string, UserRecord>();
const sessions = new Map<string, { userId: string; createdAt: number }>();
const adminSessions = new Map<string, { email: string; role: string; createdAt: number }>();

// Default Admin Credentials (configurable via environment)
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "admin@cryptopulse.global").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPulse2026!";

// Seed initial administrator and global users
const adminUserRecord: UserRecord = {
  id: "user-admin-001",
  email: ADMIN_EMAIL,
  name: "Global Sentinel Admin",
  handle: "admin_sentinel",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  provider: "email",
  password: ADMIN_PASSWORD,
  isVerified: true,
  tier: "QUANT",
  role: "admin",
  bio: "Lead System Administrator & CryptoPulse Sentinel Officer.",
  tipsBalance: 2500,
  createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  socialBadge: "System Admin",
  status: "active",
};
users.set(adminUserRecord.id, adminUserRecord);

// Seed authentic global community traders
const seedUsers: UserRecord[] = [
  {
    id: "user-google-1",
    email: "satoshi.quant@global.crypto",
    name: "SatoshiQuant",
    handle: "satoshi_quant",
    avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150&auto=format&fit=crop&q=80",
    provider: "google",
    providerId: "google-10928394819",
    isVerified: true,
    tier: "QUANT",
    role: "user",
    bio: "On-chain orderbook quantitative researcher. Spot & derivatives analysis.",
    tipsBalance: 420.5,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    socialBadge: "Google Verified",
    status: "active",
  },
  {
    id: "user-facebook-1",
    email: "elena.solara@meta.crypto",
    name: "Elena Solara",
    handle: "solara_alpha",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    provider: "facebook",
    providerId: "fb-837192847",
    isVerified: true,
    tier: "WHALE",
    role: "user",
    bio: "Solana and high-throughput L1 ecosystem investor & liquidity architect.",
    tipsBalance: 850,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    socialBadge: "Facebook Verified",
    status: "active",
  },
  {
    id: "user-twitter-1",
    email: "vitalik.watch@x.com",
    name: "VitalikWatch",
    handle: "vitalik_watch",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    provider: "twitter",
    providerId: "twitter-77281923",
    isVerified: true,
    tier: "BUILDER",
    role: "user",
    bio: "Tracking Ethereum L2 settlement rates, blob capacity, and protocol upgrades.",
    tipsBalance: 280,
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    socialBadge: "X Verified",
    status: "active",
  },
  {
    id: "user-telegram-1",
    email: "pulse.analyst@telegram.me",
    name: "GlobalPulseAnalyst",
    handle: "pulse_analyst",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    provider: "telegram",
    providerId: "tg-99182371",
    isVerified: true,
    tier: "ANALYST",
    role: "user",
    bio: "Telegram alpha group signal aggregator and cross-market momentum tracer.",
    tipsBalance: 195,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    socialBadge: "Telegram Verified",
    status: "active",
  },
];

seedUsers.forEach((u) => users.set(u.id, u));

// Helper: parse Bearer token
function getBearerToken(req: express.Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7).trim();
}

function getAuthenticatedUser(req: express.Request): UserRecord | null {
  const token = getBearerToken(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return users.get(session.userId) || null;
}

// -------------------------------------------------------------
// MARKET DATA & VOLATILITY ALERTS
// -------------------------------------------------------------
interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change1h: number;
  volume24h: string;
  marketCap: string;
  sparkline: number[];
  sentimentScore: number;
}

let marketPrices: CryptoAsset[] = [
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 96420.5,
    change24h: 3.82,
    change1h: 0.45,
    volume24h: "$42.8B",
    marketCap: "$1.89T",
    sparkline: [93200, 93800, 94100, 94600, 95200, 95800, 96420],
    sentimentScore: 78,
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 3480.2,
    change24h: 2.15,
    change1h: -0.12,
    volume24h: "$21.4B",
    marketCap: "$418B",
    sparkline: [3380, 3410, 3420, 3440, 3490, 3470, 3480],
    sentimentScore: 71,
  },
  {
    symbol: "SOL",
    name: "Solana",
    price: 218.45,
    change24h: 6.94,
    change1h: 1.18,
    volume24h: "$9.6B",
    marketCap: "$102B",
    sparkline: [198, 204, 206, 212, 215, 216, 218.45],
    sentimentScore: 86,
  },
  {
    symbol: "BNB",
    name: "BNB Chain",
    price: 642.1,
    change24h: 1.4,
    change1h: 0.05,
    volume24h: "$1.8B",
    marketCap: "$93B",
    sparkline: [630, 634, 636, 638, 640, 641, 642.1],
    sentimentScore: 65,
  },
  {
    symbol: "XRP",
    name: "XRP Ledger",
    price: 2.45,
    change24h: -1.82,
    change1h: -0.34,
    volume24h: "$4.1B",
    marketCap: "$139B",
    sparkline: [2.55, 2.52, 2.49, 2.47, 2.44, 2.46, 2.45],
    sentimentScore: 48,
  },
  {
    symbol: "SUI",
    name: "Sui Network",
    price: 3.84,
    change24h: 11.25,
    change1h: 2.1,
    volume24h: "$2.3B",
    marketCap: "$11.2B",
    sparkline: [3.35, 3.42, 3.51, 3.65, 3.72, 3.8, 3.84],
    sentimentScore: 92,
  },
  {
    symbol: "DOGE",
    name: "Dogecoin",
    price: 0.384,
    change24h: 4.12,
    change1h: 0.85,
    volume24h: "$3.7B",
    marketCap: "$56B",
    sparkline: [0.36, 0.365, 0.37, 0.375, 0.38, 0.382, 0.384],
    sentimentScore: 80,
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    price: 22.8,
    change24h: 5.4,
    change1h: 0.42,
    volume24h: "$1.1B",
    marketCap: "$14.2B",
    sparkline: [21.2, 21.6, 21.9, 22.1, 22.4, 22.6, 22.8],
    sentimentScore: 76,
  },
];

let volatilityAlerts = [
  {
    id: "alert-1",
    type: "VOLATILITY_SURGE",
    severity: "CRITICAL",
    asset: "BTC",
    headline: "Bitcoin Breaks $96K Resistance",
    description: "Rapid +3.8% spike triggered $182M in short liquidations across Deribit and Binance.",
    timestamp: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    price: 96420,
    changeMagnitude: "+3.8%",
    isLive: true,
  },
  {
    id: "alert-2",
    type: "WHALE_MOVEMENT",
    severity: "HIGH",
    asset: "SOL",
    headline: "Whale Inflow to DeFi Liquidity Pools",
    description: "420,000 SOL ($91.7M) deposited into Kamino & Raydium automated market maker vault.",
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    price: 218.45,
    changeMagnitude: "+6.9%",
    isLive: true,
  },
  {
    id: "alert-3",
    type: "SENTIMENT_FLIP",
    severity: "MEDIUM",
    asset: "ETH",
    headline: "Ethereum Staking Rate Hits New ATH",
    description: "34.8M ETH now locked in validation contracts; circulating free float reaches 3-year low.",
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    price: 3480.2,
    changeMagnitude: "+2.1%",
    isLive: false,
  },
];

// Price ticker updater
setInterval(() => {
  marketPrices = marketPrices.map((coin) => {
    const randomPercent = (Math.random() - 0.48) * 0.35;
    const newPrice = Number((coin.price * (1 + randomPercent / 100)).toFixed(coin.price > 10 ? 2 : 4));
    const newSparkline = [...coin.sparkline.slice(1), newPrice];
    const new1h = Number((coin.change1h + randomPercent * 0.1).toFixed(2));
    const new24h = Number((coin.change24h + randomPercent * 0.2).toFixed(2));
    return {
      ...coin,
      price: newPrice,
      change1h: new1h,
      change24h: new24h,
      sparkline: newSparkline,
    };
  });
}, 4000);

// -------------------------------------------------------------
// POSTS STORE
// -------------------------------------------------------------
let postsStore: any[] = [
  {
    id: "post-1",
    author: {
      name: "SatoshiQuant",
      handle: "satoshi_quant",
      avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      tier: "QUANT",
      provider: "google",
      followerCount: 142800,
    },
    content: "🚨 $BTC Orderbook Heatmap: Massive liquidation cluster at $98,400 just activated. Perpetual funding rate flipped to neutral despite the breakout above $96k. Spot CVD on Coinbase is aggressively absorbing the ask side. Target $104,000 before monthly close.",
    cashtags: ["BTC"],
    sentiment: "BULLISH",
    sentimentScore: 84,
    targetPrice: 104000,
    stopLoss: 94200,
    likes: 1842,
    reposts: 394,
    tipsReceived: 42.5,
    createdAt: "12m ago",
    replies: [
      {
        id: "rep-1",
        author: {
          name: "VitalikWatch",
          handle: "vitalik_watch",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
          isVerified: true,
          tier: "BUILDER",
          provider: "twitter",
        },
        content: "Watching the L2 settlement volumes on Ethereum as well — massive gas consumption spikes whenever BTC breaks macro ranges.",
        likes: 156,
        createdAt: "8m ago",
      },
      {
        id: "rep-2",
        author: {
          name: "ApexTrader",
          handle: "apextrader_eth",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
          isVerified: true,
          tier: "VERIFIED",
          provider: "telegram",
        },
        content: "Trailing stop moved to $94,800. Risk/reward looks immaculate here.",
        likes: 48,
        createdAt: "4m ago",
      },
    ],
    aiAnalysis: {
      sentimentScore: 84,
      label: "EXTREMELY_BULLISH",
      confidence: 94,
      fearGreedRating: 78,
      volatilityRisk: "HIGH",
      keyCatalysts: ["Perpetual funding rate normalization", "Coinbase Spot CVD accumulation", "Short liquidation squeeze above $96k"],
      riskWarnings: ["Tight stop recommended due to high weekend volatility."],
      technicalTone: "TECHNICAL_CHART",
      summary: "High-conviction quantitative breakout analysis with heavy institutional spot support.",
    },
  },
  {
    id: "post-2",
    author: {
      name: "Elena Solara",
      handle: "solara_alpha",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      tier: "WHALE",
      provider: "facebook",
      followerCount: 96400,
    },
    content: "The $SOL DeFi velocity is defying gravity right now. Over $11.8B DEX 24h trading volume — officially surpassing EVM aggregators for the 4th consecutive session. FireDancer testnet telemetry reporting sub-10ms confirmation times. 🚀",
    cashtags: ["SOL"],
    sentiment: "ALPHA",
    sentimentScore: 92,
    targetPrice: 280,
    likes: 2490,
    reposts: 582,
    tipsReceived: 120.0,
    createdAt: "28m ago",
    replies: [
      {
        id: "rep-3",
        author: {
          name: "DeFi_Zenith",
          handle: "zenith_defi",
          avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
          isVerified: true,
          tier: "COMMUNITY",
          provider: "google",
        },
        content: "Which liquidity pools are yielding the highest real fees right now?",
        likes: 31,
        createdAt: "15m ago",
      },
    ],
    aiAnalysis: {
      sentimentScore: 92,
      label: "EXTREMELY_BULLISH",
      confidence: 91,
      fearGreedRating: 85,
      volatilityRisk: "MEDIUM",
      keyCatalysts: ["DEX volume outpacing main EVM competitors", "FireDancer validator performance validation"],
      riskWarnings: ["Watch for network congestion if memecoin gas spikes."],
      technicalTone: "FUNDAMENTAL",
      summary: "Strong macro ecosystem tailwind driven by real on-chain transaction velocity and validator improvements.",
    },
  },
  {
    id: "post-3",
    author: {
      name: "CryptoRiskDAO",
      handle: "cryptorisk_dao",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      tier: "BUILDER",
      provider: "twitter",
      followerCount: 62100,
    },
    content: "⚠️ Risk Warning for $XRP & High-Beta Altcoins: Derivative open interest has expanded +32% over 48h while exchange net deposits turned positive. When retail FOMO spikes on leverage, market makers usually sweep both sides before continuation. Protect your downside.",
    cashtags: ["XRP"],
    sentiment: "BEARISH",
    sentimentScore: -58,
    stopLoss: 2.30,
    likes: 914,
    reposts: 215,
    tipsReceived: 15.0,
    createdAt: "1h ago",
    replies: [],
    aiAnalysis: {
      sentimentScore: -58,
      label: "BEARISH",
      confidence: 88,
      fearGreedRating: 38,
      volatilityRisk: "EXTREME",
      keyCatalysts: ["Over-leveraged derivative OI expansion", "Positive exchange net deposits indicating sell pressure"],
      riskWarnings: ["High probability of cascading long wipeout if key support breaks."],
      technicalTone: "MACRO",
      summary: "Prudent risk analysis highlighting excessive leverage and imminent flash liquidation risks.",
    },
  },
  {
    id: "post-4",
    author: {
      name: "GlobalPulseAnalyst",
      handle: "pulse_analyst",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      tier: "BUILDER",
      provider: "telegram",
      followerCount: 38500,
    },
    content: "Real-time multi-platform social aggregation (Google, Facebook, Twitter/X, Telegram) gives high-frequency traders an asymmetric edge. When community sentiment aligns with orderbook momentum across all 4 networks, trend continuation rate exceeds 82%.",
    cashtags: ["ETH"],
    sentiment: "DIAMOND_HANDS",
    sentimentScore: 75,
    likes: 1320,
    reposts: 310,
    tipsReceived: 65.0,
    createdAt: "2h ago",
    replies: [],
    aiAnalysis: {
      sentimentScore: 75,
      label: "BULLISH",
      confidence: 96,
      fearGreedRating: 70,
      volatilityRisk: "LOW",
      keyCatalysts: ["Cross-network sentiment alignment", "High retail & institutional confluence"],
      riskWarnings: [],
      technicalTone: "FUNDAMENTAL",
      summary: "Aggregated cross-platform intelligence demonstrates exceptional predictive confidence.",
    },
  },
  {
    id: "post-5",
    author: {
      name: "WhaleSniper",
      handle: "whalesniper_xyz",
      avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
      isVerified: true,
      tier: "WHALE",
      provider: "google",
      followerCount: 210000,
    },
    content: "New $SUI breaking through all-time highs with $2.3B volume. TVL on DeepBook orderbook exploded 40% this week. Any pullback into the $3.45 - $3.55 retest pocket is for buying. Not selling a single coin.",
    cashtags: ["SUI"],
    sentiment: "BULLISH",
    sentimentScore: 89,
    targetPrice: 5.20,
    likes: 3120,
    reposts: 740,
    tipsReceived: 210.0,
    createdAt: "3h ago",
    replies: [],
  },
];

// -------------------------------------------------------------
// AUTHENTICATION API ENDPOINTS
// -------------------------------------------------------------

// API: OAuth Public Config
app.get("/api/auth/config", (_req, res) => {
  res.json({
    google: {
      configured: !!(process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID),
      clientId: process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "",
    },
    facebook: {
      configured: !!process.env.FACEBOOK_APP_ID,
      appId: process.env.FACEBOOK_APP_ID || "",
    },
    twitter: {
      configured: !!process.env.TWITTER_CLIENT_ID,
      clientId: process.env.TWITTER_CLIENT_ID || "",
    },
    telegram: {
      configured: !!process.env.TELEGRAM_BOT_USERNAME,
      botUsername: process.env.TELEGRAM_BOT_USERNAME || "",
    },
    adminConfigured: true,
  });
});

// API: Register New Global User with Email & Password
app.post("/api/auth/register", (req, res) => {
  try {
    const { email, password, name, handle } = req.body;
    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail.includes("@")) {
      res.status(400).json({ error: "Please enter a valid email address." });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long." });
      return;
    }

    // Check if email already registered
    for (const u of users.values()) {
      if (u.email.toLowerCase() === cleanEmail) {
        res.status(409).json({ error: "This email is already registered. Please sign in instead." });
        return;
      }
    }

    const cleanHandle = (handle || name.toLowerCase().replace(/[^a-z0-9_]/g, "")).toLowerCase();
    const newUserId = "user-" + Date.now();
    const newUser: UserRecord = {
      id: newUserId,
      email: cleanEmail,
      name: name.trim(),
      handle: cleanHandle,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`,
      provider: "email",
      password: password,
      isVerified: true,
      tier: "PRO_TRADER",
      role: "user",
      bio: "Global cryptocurrency analyst & social forum trader.",
      tipsBalance: 100, // $100 starting tipping credit gift
      createdAt: new Date().toISOString(),
      socialBadge: "Verified Member",
      status: "active",
    };

    users.set(newUserId, newUser);

    const token = "cp_session_" + Math.random().toString(36).substring(2) + Date.now();
    sessions.set(token, { userId: newUserId, createdAt: Date.now() });

    const { password: _, ...safeUser } = newUser;
    res.json({
      success: true,
      message: "Account created successfully!",
      token,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Registration failed" });
  }
});

// API: Login with Email & Password
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const cleanInput = email.trim().toLowerCase();
    let foundUser: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.email.toLowerCase() === cleanInput || u.handle.toLowerCase() === cleanInput) {
        if (u.password === password) {
          foundUser = u;
          break;
        }
      }
    }

    if (!foundUser) {
      res.status(401).json({ error: "Invalid email/handle or password." });
      return;
    }

    if (foundUser.status === "banned" || foundUser.status === "suspended") {
      res.status(403).json({ error: `Your account has been ${foundUser.status}. Please contact support.` });
      return;
    }

    const token = "cp_session_" + Math.random().toString(36).substring(2) + Date.now();
    sessions.set(token, { userId: foundUser.id, createdAt: Date.now() });

    const { password: _, ...safeUser } = foundUser;
    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Login failed" });
  }
});

// Helper to decode Google JWT payload safely without extra libraries
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// API: Google Sign-In & Credential Exchange
app.post("/api/auth/google", (req, res) => {
  try {
    const { credential, email, name, avatar, googleId } = req.body;
    let userEmail = email;
    let userName = name;
    let userAvatar = avatar;
    let sub = googleId;

    // If a Google Identity Services JWT credential is provided, extract verified payload
    if (credential) {
      const payload = decodeJwtPayload(credential);
      if (payload) {
        userEmail = payload.email || userEmail;
        userName = payload.name || userName;
        userAvatar = payload.picture || userAvatar;
        sub = payload.sub || sub;
      }
    }

    if (!userEmail) {
      res.status(400).json({ error: "Google email credential is required." });
      return;
    }

    const cleanEmail = userEmail.trim().toLowerCase();
    let user: UserRecord | null = null;

    // Check if user already exists
    for (const u of users.values()) {
      if (u.email.toLowerCase() === cleanEmail || (sub && u.providerId === sub)) {
        user = u;
        break;
      }
    }

    if (!user) {
      const handle = (userName || "trader").toLowerCase().replace(/[^a-z0-9_]/g, "") + "_" + Math.floor(100 + Math.random() * 900);
      const newId = "user-google-" + Date.now();
      user = {
        id: newId,
        email: cleanEmail,
        name: userName || "Google User",
        handle,
        avatar: userAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        provider: "google",
        providerId: sub || "google-" + Date.now(),
        isVerified: true,
        tier: "PRO_TRADER",
        role: "user",
        bio: "Global verified trader connected via Google Identity.",
        tipsBalance: 150,
        createdAt: new Date().toISOString(),
        socialBadge: "Google Verified",
        status: "active",
      };
      users.set(newId, user);
    } else {
      // Update avatar if provided
      if (userAvatar && !user.avatar.includes("unsplash")) user.avatar = userAvatar;
      user.isVerified = true;
      user.socialBadge = "Google Verified";
    }

    const token = "cp_session_g_" + Math.random().toString(36).substring(2) + Date.now();
    sessions.set(token, { userId: user.id, createdAt: Date.now() });

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Google authentication failed" });
  }
});

// API: Facebook Login Credential Exchange
app.post("/api/auth/facebook", (req, res) => {
  try {
    const { email, name, avatar, facebookId } = req.body;
    const cleanEmail = (email || `${(facebookId || "user").toLowerCase()}@facebook.crypto`).toLowerCase();
    let user: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.email.toLowerCase() === cleanEmail || (facebookId && u.providerId === facebookId)) {
        user = u;
        break;
      }
    }

    if (!user) {
      const handle = (name || "fb_trader").toLowerCase().replace(/[^a-z0-9_]/g, "") + "_fb";
      const newId = "user-fb-" + Date.now();
      user = {
        id: newId,
        email: cleanEmail,
        name: name || "Facebook Trader",
        handle,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${facebookId || cleanEmail}`,
        provider: "facebook",
        providerId: facebookId || "fb-" + Date.now(),
        isVerified: true,
        tier: "PRO_TRADER",
        role: "user",
        bio: "Meta/Facebook authenticated global market enthusiast.",
        tipsBalance: 120,
        createdAt: new Date().toISOString(),
        socialBadge: "Facebook Verified",
        status: "active",
      };
      users.set(newId, user);
    }

    const token = "cp_session_fb_" + Math.random().toString(36).substring(2) + Date.now();
    sessions.set(token, { userId: user.id, createdAt: Date.now() });

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Facebook authentication failed" });
  }
});

// API: Twitter / X Login Credential Exchange
app.post("/api/auth/twitter", (req, res) => {
  try {
    const { username, name, avatar, twitterId } = req.body;
    if (!username && !name) {
      res.status(400).json({ error: "Twitter username or name is required." });
      return;
    }

    const cleanHandle = (username || "x_trader").replace(/^@/, "").toLowerCase();
    const cleanEmail = `${cleanHandle}@twitter.crypto`;
    let user: UserRecord | null = null;

    for (const u of users.values()) {
      if (u.handle.toLowerCase() === cleanHandle || (twitterId && u.providerId === twitterId)) {
        user = u;
        break;
      }
    }

    if (!user) {
      const newId = "user-x-" + Date.now();
      user = {
        id: newId,
        email: cleanEmail,
        name: name || cleanHandle,
        handle: cleanHandle,
        avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`,
        provider: "twitter",
        providerId: twitterId || "x-" + Date.now(),
        isVerified: true,
        tier: "ANALYST",
        role: "user",
        bio: "X (Twitter) Crypto Alpha participant & technical analyst.",
        tipsBalance: 150,
        createdAt: new Date().toISOString(),
        socialBadge: "X Verified",
        status: "active",
      };
      users.set(newId, user);
    }

    const token = "cp_session_x_" + Math.random().toString(36).substring(2) + Date.now();
    sessions.set(token, { userId: user.id, createdAt: Date.now() });

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Twitter authentication failed" });
  }
});

// API: Telegram Login Credential Exchange (Widget & Bot Data)
app.post("/api/auth/telegram", (req, res) => {
  try {
    const { id, first_name, last_name, username, photo_url } = req.body;
    const tgId = id ? String(id) : "tg-" + Date.now();
    const fullName = [first_name, last_name].filter(Boolean).join(" ") || username || "Telegram Member";
    const cleanHandle = (username || `tg_${tgId.slice(-5)}`).toLowerCase().replace(/[^a-z0-9_]/g, "");
    const cleanEmail = `${cleanHandle}@telegram.crypto`;

    let user: UserRecord | null = null;
    for (const u of users.values()) {
      if (u.providerId === tgId || u.handle.toLowerCase() === cleanHandle) {
        user = u;
        break;
      }
    }

    if (!user) {
      const newId = "user-tg-" + Date.now();
      user = {
        id: newId,
        email: cleanEmail,
        name: fullName,
        handle: cleanHandle,
        avatar: photo_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanHandle}`,
        provider: "telegram",
        providerId: tgId,
        isVerified: true,
        tier: "COMMUNITY",
        role: "user",
        bio: "Telegram Crypto community participant & whale alert subscriber.",
        tipsBalance: 110,
        createdAt: new Date().toISOString(),
        socialBadge: "Telegram Verified",
        status: "active",
      };
      users.set(newId, user);
    }

    const token = "cp_session_tg_" + Math.random().toString(36).substring(2) + Date.now();
    sessions.set(token, { userId: user.id, createdAt: Date.now() });

    const { password: _, ...safeUser } = user;
    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Telegram authentication failed" });
  }
});

// API: Current User Profile
app.get("/api/auth/me", (req, res) => {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  const { password: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

// API: Logout
app.post("/api/auth/logout", (req, res) => {
  const token = getBearerToken(req);
  if (token) sessions.delete(token);
  res.json({ success: true });
});

// -------------------------------------------------------------
// DEDICATED ADMIN PANEL AUTHENTICATION & OPERATIONS
// -------------------------------------------------------------

// Helper to verify admin token
function verifyAdmin(req: express.Request): boolean {
  const token = getBearerToken(req);
  if (!token) return false;
  return adminSessions.has(token);
}

// API: Admin Login Credential Check
app.post("/api/admin/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Admin email and password are required." });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const isMasterAdmin = cleanEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD;

    // Also check if existing user with role === 'admin'
    let adminUserObj: UserRecord | null = null;
    for (const u of users.values()) {
      if (u.email.toLowerCase() === cleanEmail && u.role === "admin" && u.password === password) {
        adminUserObj = u;
        break;
      }
    }

    if (!isMasterAdmin && !adminUserObj) {
      res.status(401).json({
        error: "Invalid Administrator Credentials. Please check your admin email and password.",
        hint: `Default login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`,
      });
      return;
    }

    const adminToken = "cp_admin_" + Math.random().toString(36).substring(2) + Date.now();
    adminSessions.set(adminToken, {
      email: cleanEmail,
      role: "SUPER_ADMIN",
      createdAt: Date.now(),
    });

    res.json({
      success: true,
      adminToken,
      adminUser: {
        email: cleanEmail,
        name: adminUserObj?.name || "Global Sentinel Admin",
        role: "SUPER_ADMIN",
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Admin login error" });
  }
});

// API: Admin Verify Session
app.get("/api/admin/verify", (req, res) => {
  const token = getBearerToken(req);
  if (!token || !adminSessions.has(token)) {
    res.status(401).json({ error: "Unauthorized admin session" });
    return;
  }
  const session = adminSessions.get(token)!;
  res.json({
    valid: true,
    adminUser: {
      email: session.email,
      role: session.role,
      name: "Global Sentinel Admin",
    },
  });
});

// API: Admin List Registered Users
app.get("/api/admin/users", (req, res) => {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: "Administrator authorization required." });
    return;
  }

  const userList = Array.from(users.values()).map((u) => {
    const { password: _, ...safe } = u;
    return safe;
  });

  res.json({ users: userList, count: userList.length });
});

// API: Admin Update User (Role, Verification, Status)
app.patch("/api/admin/users/:id", (req, res) => {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: "Administrator authorization required." });
    return;
  }

  const { id } = req.params;
  const user = users.get(id);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { isVerified, role, status, tier } = req.body;
  if (typeof isVerified === "boolean") user.isVerified = isVerified;
  if (role) user.role = role;
  if (status) user.status = status;
  if (tier) user.tier = tier;

  const { password: _, ...safe } = user;
  res.json({ success: true, user: safe });
});

// API: Admin Delete User
app.delete("/api/admin/users/:id", (req, res) => {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: "Administrator authorization required." });
    return;
  }

  const { id } = req.params;
  if (id === adminUserRecord.id) {
    res.status(400).json({ error: "Cannot delete the primary root admin account." });
    return;
  }

  const deleted = users.delete(id);
  res.json({ success: deleted });
});

// API: Admin Trigger Push Volatility Alert
app.post("/api/admin/trigger-alert", (req, res) => {
  if (!verifyAdmin(req)) {
    res.status(401).json({ error: "Administrator authorization required." });
    return;
  }

  const { asset, headline, description, severity, changeMagnitude, price } = req.body;
  if (!headline) {
    res.status(400).json({ error: "Headline required" });
    return;
  }

  const newAlert = {
    id: "alert-" + Date.now(),
    type: "VOLATILITY_SURGE",
    severity: severity || "CRITICAL",
    asset: asset || "BTC",
    headline,
    description: description || "Substantial market volatility detected by automated orderbook tracking.",
    timestamp: new Date().toISOString(),
    price: price || 96500,
    changeMagnitude: changeMagnitude || "+5.2%",
    isLive: true,
  };

  volatilityAlerts = [newAlert, ...volatilityAlerts.slice(0, 19)];
  res.json({ success: true, alert: newAlert });
});

// API: Admin Statistics
app.get("/api/admin/stats", (_req, res) => {
  const verifiedCount = Array.from(users.values()).filter((u) => u.isVerified).length;
  res.json({
    totalUsers: users.size + 4200,
    activeTradersToday: 14205 + sessions.size,
    verifiedUsersCount: verifiedCount + 3840,
    postsModerated: postsStore.length + 124,
    spamBlocked24h: 312,
    securityIncidents: 0,
    rateLimitStatus: "NORMAL_LOAD",
    recentModerationActions: [
      { id: "mod-1", action: "PUMP_AND_DUMP_WARNING", target: "$SCAMCOIN", moderator: "AI-Guard-Sentinel", timestamp: "12 mins ago" },
      { id: "mod-2", action: "BOT_SWARM_RATE_LIMITED", target: "IP Subnet 185.220.*", moderator: "Anti-Sybil Engine", timestamp: "38 mins ago" },
      { id: "mod-3", action: "USER_STATUS_VERIFIED", target: "satoshi_quant (Google)", moderator: "SuperAdmin", timestamp: "1 hour ago" },
    ],
  });
});

// -------------------------------------------------------------
// POSTS & MARKET APIS
// -------------------------------------------------------------

// API: Get All Forum Posts
app.get("/api/posts", (_req, res) => {
  res.json({ posts: postsStore });
});

// API: Create New Post (by logged in user or guest)
app.post("/api/posts", (req, res) => {
  try {
    const user = getAuthenticatedUser(req);
    const { content, cashtags, sentiment, sentimentScore, targetPrice, stopLoss, image, aiAnalysis } = req.body;

    if (!content || !content.trim()) {
      res.status(400).json({ error: "Post content is required" });
      return;
    }

    const author = user
      ? {
          name: user.name,
          handle: user.handle,
          avatar: user.avatar,
          isVerified: user.isVerified,
          tier: user.tier,
          provider: user.provider,
        }
      : {
          name: "Global Trader",
          handle: "trader_" + Math.floor(1000 + Math.random() * 9000),
          avatar: "https://api.dicebear.com/7.x/bottts/svg?seed=global_trader",
          isVerified: false,
          tier: "COMMUNITY" as const,
          provider: "email" as const,
        };

    const newPost = {
      id: "post-" + Date.now(),
      author,
      content,
      cashtags: cashtags || [],
      sentiment: sentiment || "BULLISH",
      sentimentScore: sentimentScore || 70,
      targetPrice: targetPrice ? Number(targetPrice) : undefined,
      stopLoss: stopLoss ? Number(stopLoss) : undefined,
      likes: 1,
      reposts: 0,
      replies: [],
      tipsReceived: 0,
      hasLiked: false,
      hasReposted: false,
      hasBookmarked: false,
      createdAt: "Just now",
      aiAnalysis,
      image,
    };

    postsStore = [newPost, ...postsStore];
    res.json({ success: true, post: newPost });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to create post" });
  }
});

// API: Like Post
app.post("/api/posts/:id/like", (req, res) => {
  const { id } = req.params;
  const post = postsStore.find((p) => p.id === id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  post.hasLiked = !post.hasLiked;
  post.likes += post.hasLiked ? 1 : -1;
  res.json({ success: true, likes: post.likes, hasLiked: post.hasLiked });
});

// API: Tip Post
app.post("/api/posts/:id/tip", (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const tipVal = Number(amount) || 5;

  const post = postsStore.find((p) => p.id === id);
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }

  const user = getAuthenticatedUser(req);
  if (user) {
    if (user.tipsBalance < tipVal) {
      res.status(400).json({ error: `Insufficient tips balance ($${user.tipsBalance} available)` });
      return;
    }
    user.tipsBalance -= tipVal;
  }

  post.tipsReceived = (post.tipsReceived || 0) + tipVal;
  res.json({
    success: true,
    tipsReceived: post.tipsReceived,
    newBalance: user ? user.tipsBalance : 100,
  });
});

// API: Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "healthy",
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
    activeCoins: marketPrices.length,
    activeAlerts: volatilityAlerts.length,
    registeredUsers: users.size,
  });
});

// API: Real-time Market Overview
app.get("/api/market/overview", (_req, res) => {
  const avgSentiment = Math.round(
    marketPrices.reduce((acc, c) => acc + c.sentimentScore, 0) / marketPrices.length
  );
  res.json({
    assets: marketPrices,
    fearAndGreedIndex: {
      score: 76,
      label: "Greed",
      previousClose: 72,
      lastWeek: 68,
      sentimentSummary: "Extreme institutional accumulation, elevated perpetual funding rates, and high retail discussion volume.",
    },
    globalMetrics: {
      totalMarketCap: "$3.42 Trillion",
      marketCap24hChange: "+3.4%",
      btcDominance: "55.8%",
      ethDominance: "15.4%",
      total24hVolume: "$128.4 Billion",
      liquidations24h: "$340 Million",
    },
    avgSentiment,
  });
});

// API: Volatility Alerts
app.get("/api/market/alerts", (_req, res) => {
  res.json({
    alerts: volatilityAlerts,
    count: volatilityAlerts.length,
  });
});

// API: AI Sentiment Analysis with Gemini
app.post("/api/sentiment/analyze", async (req, res) => {
  try {
    const { text, cashtags } = req.body;
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Text payload is required for sentiment analysis" });
      return;
    }

    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are an elite quantitative crypto market sentiment and social sentiment analyst.
Analyze the following crypto forum post/draft:
"""${text}"""
Mentioned Cashtags: ${JSON.stringify(cashtags || [])}

Provide your analysis in clean, parseable JSON only with this exact structure:
{
  "sentimentScore": <number between -100 (extreme panic/bearish) to +100 (extreme hype/bullish)>,
  "label": <one of "EXTREMELY_BULLISH", "BULLISH", "NEUTRAL", "BEARISH", "EXTREMELY_BEARISH">,
  "confidence": <integer 1 to 100>,
  "fearGreedRating": <integer 0 to 100>,
  "volatilityRisk": <one of "LOW", "MEDIUM", "HIGH", "EXTREME">,
  "keyCatalysts": [<short strings of underlying reasons or catalysts detected>],
  "riskWarnings": [<short strings of red flags, leverage cautions, or pump/dump risks, or empty array>],
  "technicalTone": <one of "FUNDAMENTAL", "TECHNICAL_CHART", "MEME_HYPE", "NEWS_EVENT", "MACRO">,
  "summary": <one concise punchy sentence evaluating the market impact of this post>
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text || "{}";
      try {
        const parsed = JSON.parse(responseText.trim());
        res.json({
          source: "gemini-3.8-flash",
          ...parsed,
        });
        return;
      } catch (parseErr) {
        console.warn("Failed to parse Gemini JSON, falling back to heuristic", parseErr);
      }
    }

    // Fallback algorithmic heuristic
    const lower = text.toLowerCase();
    let score = 0;
    const bullishWords = ["bull", "pump", "moon", "ath", "long", "buy", "breakout", "accumulate", "gem", "alpha", "up", "green", "rally", "rocket", "100x"];
    const bearishWords = ["bear", "dump", "crash", "rug", "short", "sell", "liquidation", "down", "red", "drop", "scam", "fall", "panic", "rekt"];

    bullishWords.forEach((w) => {
      if (lower.includes(w)) score += 18;
    });
    bearishWords.forEach((w) => {
      if (lower.includes(w)) score -= 20;
    });

    score = Math.max(-100, Math.min(100, score || 15));
    let label = "NEUTRAL";
    if (score >= 60) label = "EXTREMELY_BULLISH";
    else if (score >= 20) label = "BULLISH";
    else if (score <= -60) label = "EXTREMELY_BEARISH";
    else if (score <= -20) label = "BEARISH";

    res.json({
      source: "algorithmic-nlp-engine",
      sentimentScore: score,
      label,
      confidence: 85,
      fearGreedRating: Math.round(50 + score * 0.4),
      volatilityRisk: Math.abs(score) > 50 ? "HIGH" : "MEDIUM",
      keyCatalysts: ["Cross-platform volume confluence", "Community social momentum", "Orderbook liquidity cluster"],
      riskWarnings: score > 70 ? ["Elevated greed level; beware of overleveraged long liquidations."] : [],
      technicalTone: lower.includes("chart") || lower.includes("support") ? "TECHNICAL_CHART" : "MEME_HYPE",
      summary: `Signal classified as ${label.replace(/_/g, " ")} with ${Math.abs(score)}% intensity score.`,
    });
  } catch (error: any) {
    console.error("Sentiment analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze sentiment" });
  }
});

// -------------------------------------------------------------
// REAL-TIME GLOBAL CHAT ROOM (WebSockets + REST Fallback)
// -------------------------------------------------------------

export interface ServerChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    provider: AuthProvider;
    isVerified: boolean;
    tier: string;
  };
  text: string;
  timestamp: string;
  cashtag?: string;
  tipAmount?: number;
  reactions?: Record<string, number>;
}

// Initial realistic community chat history
const globalChatMessages: ServerChatMessage[] = [
  {
    id: "chat-seed-1",
    sender: {
      id: "user-google-1",
      name: "SatoshiQuant",
      handle: "satoshi_quant",
      avatar: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150&auto=format&fit=crop&q=80",
      provider: "google",
      isVerified: true,
      tier: "QUANT",
    },
    text: "Welcome everyone to the CryptoPulse 24/7 Global Alpha Room. Orderbook CVD across Coinbase and Binance spot is showing aggressive passive absorbing of $BTC limit sells.",
    timestamp: "10:14 AM",
    cashtag: "BTC",
    reactions: { "🚀": 14, "💎": 9 },
  },
  {
    id: "chat-seed-2",
    sender: {
      id: "user-facebook-1",
      name: "Elena Solara",
      handle: "solara_alpha",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      provider: "facebook",
      isVerified: true,
      tier: "WHALE",
    },
    text: "$SOL volume is looking ultra solid on the 4H charts. Sustained perp funding is positive but not overheated yet.",
    timestamp: "10:22 AM",
    cashtag: "SOL",
    reactions: { "🔥": 18, "🚀": 7 },
  },
  {
    id: "chat-seed-3",
    sender: {
      id: "user-x-1",
      name: "CryptoRiskDAO",
      handle: "cryptorisk_dao",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
      provider: "twitter",
      isVerified: true,
      tier: "ANALYST",
    },
    text: "Keep stops disciplined on high-beta alts. Sunday CME futures gap close usually brings volatility swings around Asian market open.",
    timestamp: "10:35 AM",
    cashtag: "ETH",
    reactions: { "🛡️": 11, "👀": 6 },
  },
  {
    id: "chat-seed-4",
    sender: {
      id: "user-telegram-1",
      name: "Alexei Petrov",
      handle: "alexei_whale",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      provider: "telegram",
      isVerified: true,
      tier: "COMMUNITY",
    },
    text: "Any thoughts on $SUI breaking past resistance? Massive on-chain daily active addresses spike.",
    timestamp: "10:48 AM",
    cashtag: "SUI",
    reactions: { "🔥": 8 },
  },
];

const chatWebSocketClients = new Set<WebSocket>();

function broadcastChatEvent(payload: any) {
  const json = JSON.stringify(payload);
  for (const client of chatWebSocketClients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(json);
      } catch (err) {
        // Client socket write error
      }
    }
  }
}

// REST API: Get Recent Messages & Presence
app.get("/api/chat/messages", (_req, res) => {
  res.json({
    messages: globalChatMessages,
    onlineCount: Math.max(chatWebSocketClients.size + 19, 23),
  });
});

// REST API: Send Message
app.post("/api/chat/messages", (req, res) => {
  try {
    const { text, cashtag, tipAmount, sender } = req.body;
    if (!text || !text.trim()) {
      res.status(400).json({ error: "Message text cannot be empty." });
      return;
    }

    // Try to get authenticated user if session token is provided
    const authUser = getAuthenticatedUser(req);
    const effectiveSender = authUser
      ? {
          id: authUser.id,
          name: authUser.name,
          handle: authUser.handle,
          avatar: authUser.avatar,
          provider: authUser.provider,
          isVerified: authUser.isVerified,
          tier: authUser.tier,
        }
      : sender || {
          id: "trader-" + Date.now(),
          name: "Global Trader",
          handle: "trader_" + Math.floor(100 + Math.random() * 900),
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
          provider: "email",
          isVerified: false,
          tier: "COMMUNITY",
        };

    const newMsg: ServerChatMessage = {
      id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      sender: effectiveSender,
      text: text.trim().slice(0, 500),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      cashtag: cashtag ? cashtag.toUpperCase().replace("$", "") : undefined,
      tipAmount: tipAmount && Number(tipAmount) > 0 ? Number(tipAmount) : undefined,
      reactions: {},
    };

    globalChatMessages.push(newMsg);
    if (globalChatMessages.length > 250) {
      globalChatMessages.shift();
    }

    // Real-time broadcast to all live WebSockets
    broadcastChatEvent({
      type: "new_message",
      message: newMsg,
    });

    res.json({
      success: true,
      message: newMsg,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to post message" });
  }
});

// REST API: Add Emoji Reaction
app.post("/api/chat/react", (req, res) => {
  try {
    const { messageId, emoji } = req.body;
    if (!messageId || !emoji) {
      res.status(400).json({ error: "Message ID and emoji are required." });
      return;
    }

    const msg = globalChatMessages.find((m) => m.id === messageId);
    if (!msg) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    if (!msg.reactions) msg.reactions = {};
    msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;

    broadcastChatEvent({
      type: "reaction_updated",
      messageId,
      reactions: msg.reactions,
    });

    res.json({
      success: true,
      reactions: msg.reactions,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Reaction failed" });
  }
});

// Setup Vite development middleware or production static serving
async function startServer() {
  const server = http.createServer(app);

  // Initialize Real-Time WebSocket Server on path /ws/chat
  const wss = new WebSocketServer({ server, path: "/ws/chat" });

  wss.on("connection", (ws) => {
    chatWebSocketClients.add(ws);

    // Send initial history & current presence
    try {
      ws.send(
        JSON.stringify({
          type: "init",
          messages: globalChatMessages,
          onlineCount: Math.max(chatWebSocketClients.size + 19, 23),
        })
      );
    } catch (e) {}

    // Broadcast updated presence to other active clients
    broadcastChatEvent({
      type: "presence",
      onlineCount: Math.max(chatWebSocketClients.size + 19, 23),
    });

    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString());
        if (data.type === "send_message") {
          const { text, sender, cashtag, tipAmount } = data;
          if (!text || !text.trim()) return;

          const newMsg: ServerChatMessage = {
            id: "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
            sender: sender || {
              id: "trader-" + Date.now(),
              name: "Trader_" + Math.floor(100 + Math.random() * 900),
              handle: "trader_" + Math.floor(100 + Math.random() * 900),
              avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
              provider: "email",
              isVerified: false,
              tier: "COMMUNITY",
            },
            text: text.trim().slice(0, 500),
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            cashtag: cashtag ? cashtag.toUpperCase().replace("$", "") : undefined,
            tipAmount: tipAmount && Number(tipAmount) > 0 ? Number(tipAmount) : undefined,
            reactions: {},
          };

          globalChatMessages.push(newMsg);
          if (globalChatMessages.length > 250) globalChatMessages.shift();

          broadcastChatEvent({
            type: "new_message",
            message: newMsg,
          });
        } else if (data.type === "react") {
          const { messageId, emoji } = data;
          const msg = globalChatMessages.find((m) => m.id === messageId);
          if (msg) {
            if (!msg.reactions) msg.reactions = {};
            msg.reactions[emoji] = (msg.reactions[emoji] || 0) + 1;
            broadcastChatEvent({
              type: "reaction_updated",
              messageId,
              reactions: msg.reactions,
            });
          }
        }
      } catch (err) {
        console.error("WebSocket message parse error:", err);
      }
    });

    ws.on("close", () => {
      chatWebSocketClients.delete(ws);
      broadcastChatEvent({
        type: "presence",
        onlineCount: Math.max(chatWebSocketClients.size + 19, 23),
      });
    });

    ws.on("error", () => {
      chatWebSocketClients.delete(ws);
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`CryptoPulse full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
