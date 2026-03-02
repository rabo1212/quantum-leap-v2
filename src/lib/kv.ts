import { Redis } from "@upstash/redis";
import { VirtualTrade, VirtualPortfolio, PnLSnapshot } from "@/types";

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

const KEYS = {
  portfolio: "ql:portfolio",
  trades: "ql:trades",
  pnlHistory: "ql:pnl_history",
};

const DEFAULT_PORTFOLIO: VirtualPortfolio = {
  initialCapital: 10000,
  cash: 10000,
  totalPnL: 0,
  totalFees: 0,
  tradeCount: 0,
  winCount: 0,
  lossCount: 0,
  winRate: 0,
  survivalRatio: 1.0,
  lastUpdated: new Date().toISOString(),
};

// === Portfolio ===

export async function getPortfolio(): Promise<VirtualPortfolio> {
  const data = await redis.get<VirtualPortfolio>(KEYS.portfolio);
  return data ?? { ...DEFAULT_PORTFOLIO, lastUpdated: new Date().toISOString() };
}

export async function savePortfolio(portfolio: VirtualPortfolio): Promise<void> {
  portfolio.lastUpdated = new Date().toISOString();
  await redis.set(KEYS.portfolio, portfolio);
}

export async function resetPortfolio(): Promise<VirtualPortfolio> {
  const fresh = { ...DEFAULT_PORTFOLIO, lastUpdated: new Date().toISOString() };
  await redis.set(KEYS.portfolio, fresh);
  await redis.set(KEYS.trades, []);
  await redis.set(KEYS.pnlHistory, []);
  return fresh;
}

// === Trades ===

export async function getTrades(): Promise<VirtualTrade[]> {
  const data = await redis.get<VirtualTrade[]>(KEYS.trades);
  return data ?? [];
}

export async function saveTrades(trades: VirtualTrade[]): Promise<void> {
  await redis.set(KEYS.trades, trades);
}

export async function getOpenTrades(): Promise<VirtualTrade[]> {
  const trades = await getTrades();
  return trades.filter((t) => t.status === "open");
}

export async function getTradeById(id: string): Promise<VirtualTrade | undefined> {
  const trades = await getTrades();
  return trades.find((t) => t.id === id);
}

export async function updateTrade(updated: VirtualTrade): Promise<void> {
  const trades = await getTrades();
  const idx = trades.findIndex((t) => t.id === updated.id);
  if (idx >= 0) {
    trades[idx] = updated;
    await saveTrades(trades);
  }
}

// === P&L History ===

export async function getPnLHistory(): Promise<PnLSnapshot[]> {
  const data = await redis.get<PnLSnapshot[]>(KEYS.pnlHistory);
  return data ?? [];
}

export async function addPnLSnapshot(snapshot: PnLSnapshot): Promise<void> {
  const history = await getPnLHistory();
  // 같은 날짜면 업데이트
  const idx = history.findIndex((s) => s.date === snapshot.date);
  if (idx >= 0) {
    history[idx] = snapshot;
  } else {
    history.push(snapshot);
  }
  await redis.set(KEYS.pnlHistory, history);
}
