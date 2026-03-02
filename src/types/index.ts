// === Market Detection ===
export type MarketType = "crypto" | "stock" | "prediction" | "unknown";

export interface MarketDetection {
  type: MarketType;
  symbol: string;
  name: string;
  coingeckoId: string;
  confidence: number;
}

// === Market Data ===
export interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  candles1h: CandleData[];
  candles4h: CandleData[];
  candles1d: CandleData[];
  fearGreedIndex: number;
  fearGreedLabel: string;
  coingeckoData: {
    rank: number;
    ath: number;
    athDate: string;
    circulatingSupply: number;
    totalSupply: number;
  };
  fetchedAt: string;
  // Enriched data (optional, graceful degradation)
  indicators?: TechnicalIndicators;
  futures?: FuturesData;
  news?: CryptoNews;
  whales?: WhaleMovement;
}

// === Enriched Data Types ===
export interface TechnicalIndicators {
  rsi14: number | null;
  rsi14_4h: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  } | null;
  ema9: number | null;
  ema21: number | null;
  ema50: number | null;
  ema200: number | null;
  sma20: number | null;
  sma50: number | null;
  goldenCross: boolean | null;
  deathCross: boolean | null;
  priceVsEma200: string | null;
  volumeSma20: number | null;
  currentVolumeRatio: number | null;
  support: number | null;
  resistance: number | null;
}

export interface FuturesData {
  fundingRate: number | null;
  fundingRateAnnualized: number | null;
  nextFundingTime: number | null;
  openInterest: number | null;
  openInterestUsd: number | null;
  longShortRatio: number | null;
  longPercent: number | null;
  shortPercent: number | null;
  available: boolean;
}

export interface CryptoNews {
  headlines: Array<{
    title: string;
    source: string;
    publishedAt: string;
    sentiment: "positive" | "negative" | "neutral" | null;
  }>;
  overallSentiment: { positive: number; negative: number; neutral: number };
  available: boolean;
}

export interface WhaleMovement {
  transactions: Array<{
    amount: number;
    amountUsd: number;
    fromType: string;
    toType: string;
    timestamp: number;
  }>;
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netFlow: "exchange_inflow" | "exchange_outflow" | "neutral";
    largestTx: number;
    txCount: number;
  };
  available: boolean;
}

// === Agent Reports ===
export type AnalystRole = "technical" | "sentiment" | "onchain" | "macro";
export type Sentiment = "bullish" | "bearish" | "neutral";
export type Verdict = "BUY" | "SELL" | "HOLD";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface AnalystReport {
  role: AnalystRole;
  emoji: string;
  name: string;
  title: string;
  summary: string;
  details: string[];
  sentiment: Sentiment;
  confidence: number;
}

export interface DebateMessage {
  speaker: "bull" | "bear";
  round: number;
  argument: string;
  keyPoints: string[];
}

export interface TradeStrategy {
  direction: "LONG" | "SHORT" | "NEUTRAL";
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardRatio: number;
  positionSize: string;
  timeframe: string;
  reasoning: string;
}

export interface RiskPerspective {
  title: string;
  emoji: string;
  assessment: string;
  riskLevel: RiskLevel;
}

export interface RiskAssessment {
  perspectives: RiskPerspective[];
  overallRisk: RiskLevel;
  warnings: string[];
}

export interface FinalVerdict {
  verdict: Verdict;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
}

// === Full Analysis Result ===
export interface AnalysisResult {
  id: string;
  query: string;
  market: MarketDetection;
  marketData: MarketData;
  analysts: AnalystReport[];
  debate: DebateMessage[];
  strategy: TradeStrategy;
  risk: RiskAssessment;
  verdict: FinalVerdict;
  startedAt: string;
  completedAt: string;
  totalDuration: number;
}

// === Progress ===
export type AnalysisStage =
  | "detecting"
  | "fetching_data"
  | "analyzing"
  | "debating"
  | "strategizing"
  | "risk_checking"
  | "final_verdict"
  | "complete"
  | "error";

export interface ProgressUpdate {
  stage: AnalysisStage;
  detail: string;
  progress: number;
  timestamp: string;
}

// === Paper Trading (Phase 3) ===
export interface VirtualTrade {
  id: string;
  analysisId: string;
  symbol: string;
  direction: "LONG" | "SHORT";
  entryPrice: number;
  entryTime: string;
  targetPrice: number;
  stopLoss: number;
  positionSize: number; // 투자금 (USD)
  quantity: number; // 수량
  fees: number; // 수수료 (편도 0.1%)
  exitPrice?: number;
  exitTime?: string;
  exitReason?: "target" | "stoploss" | "manual";
  status: "open" | "win" | "loss" | "cancelled";
  pnl?: number; // 수수료 차감 후 순손익
  pnlPercent?: number;
}

export interface VirtualPortfolio {
  initialCapital: number; // $10,000
  cash: number;
  totalPnL: number;
  totalFees: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  survivalRatio: number; // 현재가치/초기자본
  lastUpdated: string;
}

export interface PnLSnapshot {
  date: string;
  totalValue: number;
  pnl: number;
  tradeCount: number;
}
