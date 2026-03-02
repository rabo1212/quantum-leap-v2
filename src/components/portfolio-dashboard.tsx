"use client";

import { useState, useEffect } from "react";
import { VirtualPortfolio, VirtualTrade, PnLSnapshot } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { PositionCard } from "@/components/position-card";
import { TradeHistory } from "@/components/trade-history";
import { PnLChart } from "@/components/pnl-chart";

interface PortfolioDashboardProps {
  portfolio: VirtualPortfolio;
  onReset: () => void;
}

export function PortfolioDashboard({ portfolio, onReset }: PortfolioDashboardProps) {
  const [trades, setTrades] = useState<VirtualTrade[]>([]);
  const [pnlHistory, setPnlHistory] = useState<PnLSnapshot[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (expanded) {
      Promise.all([
        fetch("/api/trades").then((r) => r.json()),
        fetch("/api/portfolio").then((r) => r.json()),
      ]).then(([tradesData, portfolioData]) => {
        setTrades(tradesData.trades || []);
        setPnlHistory(portfolioData.pnlHistory || []);
      }).catch(() => {});
    }
  }, [expanded]);

  const totalValue = portfolio.cash;
  const pnlColor =
    portfolio.totalPnL > 0
      ? "text-buy"
      : portfolio.totalPnL < 0
      ? "text-sell"
      : "text-muted-foreground";

  const survivalColor =
    portfolio.survivalRatio > 0.9
      ? "text-buy"
      : portfolio.survivalRatio > 0.7
      ? "text-hold"
      : "text-sell";

  const openTrades = trades.filter((t) => t.status === "open");
  const closedTrades = trades.filter((t) => t.status !== "open");

  async function handleReset() {
    if (!confirm("포트폴리오를 초기화하시겠습니까? 모든 거래 기록이 삭제됩니다.")) return;
    setResetting(true);
    try {
      await fetch("/api/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      setTrades([]);
      setPnlHistory([]);
      onReset();
    } finally {
      setResetting(false);
    }
  }

  async function handleClosePosition(tradeId: string, currentPrice: number) {
    const res = await fetch(`/api/trades/${tradeId}/close`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPrice }),
    });
    if (res.ok) {
      const data = await res.json();
      // 리프레시
      const tradesRes = await fetch("/api/trades");
      const tradesData = await tradesRes.json();
      setTrades(tradesData.trades || []);
      onReset();
      return data;
    }
  }

  return (
    <div className="max-w-4xl mx-auto mb-6">
      <Card className="glass-card border-primary/20">
        <CardContent className="p-4">
          {/* 요약 바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">🧪</span>
              <span className="text-xs text-muted-foreground">[시뮬레이션]</span>
              <span className="text-sm font-semibold">
                ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <span className={pnlColor}>
                P&L: {portfolio.totalPnL >= 0 ? "+" : ""}${portfolio.totalPnL.toFixed(0)}
              </span>
              <span className="text-muted-foreground">
                승률: {portfolio.winRate}%
                ({portfolio.winCount}W/{portfolio.lossCount}L)
              </span>
              <span className={survivalColor}>
                생존: {(portfolio.survivalRatio * 100).toFixed(0)}%
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-primary hover:underline"
              >
                {expanded ? "접기" : "상세"}
              </button>
            </div>
          </div>

          {/* 생존율 경고 */}
          {portfolio.survivalRatio <= 0.7 && (
            <div className={`mt-2 p-2 rounded text-xs ${
              portfolio.survivalRatio <= 0.5
                ? "bg-sell/10 text-sell border border-sell/30"
                : "bg-hold/10 text-hold border border-hold/30"
            }`}>
              {portfolio.survivalRatio <= 0.5
                ? "🚨 생존율 50% 이하 — 모든 매매가 중단됩니다"
                : "⚠️ 생존율 70% 이하 — 신규 매수가 제한됩니다"}
            </div>
          )}

          {/* 확장 영역 */}
          {expanded && (
            <div className="mt-4 space-y-4 border-t border-border/50 pt-4">
              {/* 상세 통계 */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground">초기자본</p>
                  <p className="text-sm font-semibold">${portfolio.initialCapital.toLocaleString()}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground">현금</p>
                  <p className="text-sm font-semibold">${portfolio.cash.toFixed(0)}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground">총 수수료</p>
                  <p className="text-sm font-semibold text-muted-foreground">${portfolio.totalFees.toFixed(2)}</p>
                </div>
                <div className="p-2 rounded-lg bg-secondary/30">
                  <p className="text-[10px] text-muted-foreground">총 거래</p>
                  <p className="text-sm font-semibold">{portfolio.tradeCount}건</p>
                </div>
              </div>

              {/* 오픈 포지션 */}
              {openTrades.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-2">진행 중 포지션</h4>
                  <div className="space-y-2">
                    {openTrades.map((trade) => (
                      <PositionCard
                        key={trade.id}
                        trade={trade}
                        onClose={handleClosePosition}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* P&L 차트 */}
              {pnlHistory.length > 0 && <PnLChart history={pnlHistory} />}

              {/* 거래 히스토리 */}
              {closedTrades.length > 0 && <TradeHistory trades={closedTrades} />}

              {/* 리셋 버튼 */}
              <div className="text-center">
                <button
                  onClick={handleReset}
                  disabled={resetting}
                  className="text-xs text-muted-foreground hover:text-sell transition-colors"
                >
                  {resetting ? "초기화 중..." : "🗑 포트폴리오 초기화"}
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
