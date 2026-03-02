import { nanoid } from "nanoid";
import { VirtualTrade, VirtualPortfolio, TradeStrategy } from "@/types";
import {
  getPortfolio,
  savePortfolio,
  getTrades,
  saveTrades,
  getOpenTrades,
  addPnLSnapshot,
} from "./kv";

const FEE_RATE = 0.001; // 0.1% per side

// === 매매 실행 ===

export async function executeTrade(params: {
  analysisId: string;
  symbol: string;
  strategy: TradeStrategy;
  positionPercent: number; // 포트폴리오의 몇 % 투자 (기본 5)
}): Promise<{ trade: VirtualTrade; portfolio: VirtualPortfolio }> {
  const portfolio = await getPortfolio();
  const trades = await getTrades();

  // 생존규칙 체크
  if (portfolio.survivalRatio <= 0.5) {
    throw new Error("🚨 생존율 50% 이하 — 모든 매매가 중단됩니다.");
  }
  if (portfolio.survivalRatio <= 0.7) {
    throw new Error("⚠️ 생존율 70% 이하 — 신규 매수가 불가합니다.");
  }

  const { strategy, positionPercent } = params;

  if (strategy.direction === "NEUTRAL") {
    throw new Error("중립 판정에서는 매매를 실행할 수 없습니다.");
  }

  // 포지션 사이즈 계산
  const totalValue = portfolio.cash + getOpenPositionsValue(trades, strategy.entryPrice);
  const investAmount = totalValue * (positionPercent / 100);

  if (investAmount > portfolio.cash) {
    throw new Error(
      `현금 부족: 필요 $${investAmount.toFixed(0)}, 보유 $${portfolio.cash.toFixed(0)}`
    );
  }

  // 수수료 계산 (진입 시)
  const entryFee = investAmount * FEE_RATE;
  const netInvest = investAmount - entryFee;
  const quantity = netInvest / strategy.entryPrice;

  const trade: VirtualTrade = {
    id: nanoid(10),
    analysisId: params.analysisId,
    symbol: params.symbol,
    direction: strategy.direction,
    entryPrice: strategy.entryPrice,
    entryTime: new Date().toISOString(),
    targetPrice: strategy.targetPrice,
    stopLoss: strategy.stopLoss,
    positionSize: investAmount,
    quantity,
    fees: entryFee,
    status: "open",
  };

  // 포트폴리오 업데이트
  portfolio.cash -= investAmount;
  portfolio.tradeCount += 1;
  portfolio.totalFees += entryFee;
  recalcSurvival(portfolio, trades, strategy.entryPrice);

  trades.push(trade);
  await Promise.all([savePortfolio(portfolio), saveTrades(trades)]);

  return { trade, portfolio };
}

// === 포지션 청산 ===

export async function closeTrade(
  tradeId: string,
  currentPrice: number,
  reason: "target" | "stoploss" | "manual"
): Promise<{ trade: VirtualTrade; portfolio: VirtualPortfolio }> {
  const portfolio = await getPortfolio();
  const trades = await getTrades();
  const trade = trades.find((t) => t.id === tradeId);

  if (!trade || trade.status !== "open") {
    throw new Error("오픈 포지션을 찾을 수 없습니다.");
  }

  // 청산 수수료
  const exitValue = trade.quantity * currentPrice;
  const exitFee = exitValue * FEE_RATE;

  // P&L 계산
  let rawPnl: number;
  if (trade.direction === "LONG") {
    rawPnl = (currentPrice - trade.entryPrice) * trade.quantity;
  } else {
    rawPnl = (trade.entryPrice - currentPrice) * trade.quantity;
  }
  const netPnl = rawPnl - exitFee;
  const pnlPercent = (netPnl / trade.positionSize) * 100;

  // 트레이드 업데이트
  trade.exitPrice = currentPrice;
  trade.exitTime = new Date().toISOString();
  trade.exitReason = reason;
  trade.status = netPnl >= 0 ? "win" : "loss";
  trade.pnl = Math.round(netPnl * 100) / 100;
  trade.pnlPercent = Math.round(pnlPercent * 100) / 100;
  trade.fees += exitFee;

  // 포트폴리오 업데이트
  portfolio.cash += exitValue - exitFee;
  portfolio.totalPnL += trade.pnl;
  portfolio.totalFees += exitFee;
  if (trade.status === "win") {
    portfolio.winCount += 1;
  } else {
    portfolio.lossCount += 1;
  }
  const closedCount = portfolio.winCount + portfolio.lossCount;
  portfolio.winRate = closedCount > 0 ? Math.round((portfolio.winCount / closedCount) * 100) : 0;

  recalcSurvival(portfolio, trades, currentPrice);

  await Promise.all([savePortfolio(portfolio), saveTrades(trades)]);

  // P&L 스냅샷
  const today = new Date().toISOString().slice(0, 10);
  const totalValue = portfolio.cash + getOpenPositionsValue(trades, currentPrice);
  await addPnLSnapshot({
    date: today,
    totalValue: Math.round(totalValue * 100) / 100,
    pnl: Math.round(portfolio.totalPnL * 100) / 100,
    tradeCount: portfolio.tradeCount,
  });

  return { trade, portfolio };
}

// === 오픈 포지션 자동 체크 (현재가 vs 목표/손절) ===

export async function checkOpenPositions(
  currentPrices: Record<string, number>
): Promise<{ closed: VirtualTrade[]; portfolio: VirtualPortfolio }> {
  const openTrades = await getOpenTrades();
  const closed: VirtualTrade[] = [];

  for (const trade of openTrades) {
    const price = currentPrices[trade.symbol];
    if (!price) continue;

    let shouldClose: "target" | "stoploss" | null = null;

    if (trade.direction === "LONG") {
      if (price >= trade.targetPrice) shouldClose = "target";
      else if (price <= trade.stopLoss) shouldClose = "stoploss";
    } else {
      // SHORT
      if (price <= trade.targetPrice) shouldClose = "target";
      else if (price >= trade.stopLoss) shouldClose = "stoploss";
    }

    if (shouldClose) {
      const result = await closeTrade(trade.id, price, shouldClose);
      closed.push(result.trade);
    }
  }

  const portfolio = await getPortfolio();
  return { closed, portfolio };
}

// === 유틸 ===

function getOpenPositionsValue(trades: VirtualTrade[], currentPrice: number): number {
  return trades
    .filter((t) => t.status === "open")
    .reduce((sum, t) => sum + t.quantity * currentPrice, 0);
}

function recalcSurvival(
  portfolio: VirtualPortfolio,
  trades: VirtualTrade[],
  currentPrice: number
): void {
  const positionsValue = getOpenPositionsValue(trades, currentPrice);
  const totalValue = portfolio.cash + positionsValue;
  portfolio.survivalRatio =
    Math.round((totalValue / portfolio.initialCapital) * 1000) / 1000;
}
