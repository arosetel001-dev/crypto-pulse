export type SentimentType = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'DIAMOND_HANDS' | 'ALPHA';

export type AuthProvider = 'google' | 'facebook' | 'twitter' | 'telegram' | 'email';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  provider: AuthProvider;
  providerId?: string;
  isVerified: boolean;
  tier: 'PRO_TRADER' | 'ALPHA_SEEKER' | 'ANALYST' | 'VERIFIED' | 'COMMUNITY' | 'WHALE' | 'BUILDER' | 'QUANT';
  role: 'user' | 'admin' | 'moderator';
  bio?: string;
  tipsBalance: number; // in USD
  createdAt: string;
  socialBadge?: string;
  status?: 'active' | 'suspended' | 'banned';
}

export interface Author {
  name: string;
  handle: string;
  avatar: string;
  isVerified: boolean;
  tier: 'PRO_TRADER' | 'ALPHA_SEEKER' | 'ANALYST' | 'VERIFIED' | 'COMMUNITY' | 'WHALE' | 'BUILDER' | 'QUANT';
  provider?: AuthProvider;
  followerCount?: number;
  // Legacy optional for smooth rendering
  address?: string;
  did?: string;
  isVerifiedDID?: boolean;
}

export interface Reply {
  id: string;
  author: Author;
  content: string;
  likes: number;
  createdAt: string;
}

export interface SentimentAnalysisResult {
  sentimentScore: number; // -100 to 100
  label: string;
  confidence: number;
  fearGreedRating: number;
  volatilityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  keyCatalysts: string[];
  riskWarnings: string[];
  technicalTone: 'FUNDAMENTAL' | 'TECHNICAL_CHART' | 'MEME_HYPE' | 'NEWS_EVENT' | 'MACRO';
  summary: string;
  source?: string;
}

export interface Post {
  id: string;
  author: Author;
  content: string;
  cashtags: string[];
  sentiment: SentimentType;
  sentimentScore: number;
  targetPrice?: number;
  stopLoss?: number;
  likes: number;
  reposts: number;
  replies: Reply[];
  tipsReceived: number; // in USD
  hasLiked?: boolean;
  hasReposted?: boolean;
  hasBookmarked?: boolean;
  createdAt: string;
  aiAnalysis?: SentimentAnalysisResult;
  image?: string;
}

export interface CryptoAsset {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change1h: number;
  volume24h: string;
  marketCap: string;
  sparkline: number[];
  sentimentScore: number; // 0 to 100
}

export interface VolatilityAlert {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  asset: string;
  headline: string;
  description: string;
  timestamp: string;
  price: number;
  changeMagnitude: string;
  isLive: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
}

export interface AdminUser {
  email: string;
  role: 'SUPER_ADMIN' | 'MODERATOR';
  name: string;
  token?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeTradersToday: number;
  verifiedUsersCount: number;
  postsModerated: number;
  spamBlocked24h: number;
  securityIncidents: number;
  rateLimitStatus: string;
  recentModerationActions: {
    id: string;
    action: string;
    target: string;
    moderator: string;
    timestamp: string;
  }[];
}

export interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    provider: AuthProvider;
    isVerified: boolean;
    tier: 'PRO_TRADER' | 'ALPHA_SEEKER' | 'ANALYST' | 'VERIFIED' | 'COMMUNITY' | 'WHALE' | 'BUILDER' | 'QUANT';
  };
  text: string;
  timestamp: string;
  cashtag?: string;
  tipAmount?: number;
  reactions?: Record<string, number>;
}
