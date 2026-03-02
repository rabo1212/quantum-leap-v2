"use client";

import { useState } from "react";
import { FinalVerdict as FinalVerdictType, AnalysisResult, VirtualPortfolio } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface FinalVerdictProps {
  verdict: FinalVerdictType;
  result: AnalysisResult;
  portfolio: VirtualPortfolio | null;
  onTradeExecuted?: (portfolio: VirtualPortfolio) => void;
}

const verdictConfig = {
  BUY: {
    color: "text-buy",
    bg: "bg-buy/10",
    border: "border-buy/30",
    glow: "glow-green",
    emoji: "🟢",
    label: "매수",
  },
  SELL: {
    color: "text-sell",
    bg: "bg-sell/10",
    border: "border-sell/30",
    glow: "glow-red",
    emoji: "🔴",
    label: "매도",
  },
  HOLD: {
    color: "text-hold",
    bg: "bg-hold/10",
    border: "border-hold/30",
    glow: "glow-yellow",
    emoji: "🟡",
    label: "관망",
  },
};

export function FinalVerdictCard({ verdict, result, portfolio, onTradeExecuted }: FinalVerdictProps) {
  const v = verdictConfig[verdict.verdict];
  const [tradeLoading, setTradeLoading] = useState(false);
  const [tradeResult, setTradeResult] = useState<string | null>(null);
  const [positionPct, setPositionPct] = useState(5);

  const canTrade =
    verdict.verdict !== "HOLD" &&
    result.strategy.direction !== "NEUTRAL" &&
    portfolio &&
    portfolio.survivalRatio > 0.5;

  const isSurvivalWarning = portfolio && portfolio.survivalRatio <= 0.7;

  async function handleExecuteTrade() {
    if (!canTrade) return;
    setTradeLoading(true);
    setTradeResult(null);

    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysisId: result.id,
          symbol: result.market.symbol,
          strategy: result.strategy,
          positionPercent: positionPct,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setTradeResult(`❌ ${data.error}`);
        return;
      }

      const dir = data.trade.direction === "LONG" ? "롱" : "숏";
      setTradeResult(
        `✅ ${dir} 포지션 오픈! $${data.trade.positionSize.toFixed(0)} 투자 | 진입가 $${data.trade.entryPrice.toLocaleString()}`
      );
      onTradeExecuted?.(data.portfolio);
    } catch {
      setTradeResult("❌ 네트워크 오류가 발생했습니다.");
    } finally {
      setTradeLoading(false);
    }
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🎖️</span> 최종 판정
      </h3>
      <Card className={`glass-card ${v.border} ${v.glow}`}>
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <span className="text-5xl">{v.emoji}</span>
          </div>

          <h2 className={`text-4xl font-black mb-2 ${v.color}`}>
            {verdict.verdict}
          </h2>
          <p className={`text-lg mb-1 ${v.color}`}>{v.label}</p>

          {/* Confidence circle */}
          <div className="inline-flex items-center justify-center my-4">
            <div
              className={`w-24 h-24 rounded-full border-4 ${v.border} flex items-center justify-center ${v.bg}`}
            >
              <div>
                <p className={`text-2xl font-bold ${v.color}`}>
                  {verdict.confidence}%
                </p>
                <p className="text-[10px] text-muted-foreground">확신도</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-foreground/80 max-w-lg mx-auto mb-4">
            {verdict.reasoning}
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {verdict.keyFactors.map((factor, i) => (
              <span
                key={i}
                className={`text-xs px-3 py-1 rounded-full ${v.bg} ${v.color}`}
              >
                {factor}
              </span>
            ))}
          </div>

          {/* Paper Trading Button */}
          {portfolio && (
            <div className="border-t border-border/50 pt-4 mt-4">
              <p className="text-xs text-muted-foreground mb-3">
                🧪 [시뮬레이션] 가상 매매 — 실제 자금이 사용되지 않습니다
              </p>

              {isSurvivalWarning && (
                <p className="text-xs text-sell mb-2">
                  ⚠️ 생존율 {(portfolio.survivalRatio * 100).toFixed(0)}% — 신규 매매가 제한됩니다
                </p>
              )}

              {canTrade && !tradeResult && (
                <div className="flex items-center justify-center gap-3 mb-3">
                  <label className="text-xs text-muted-foreground">포지션 비중:</label>
                  <select
                    value={positionPct}
                    onChange={(e) => setPositionPct(Number(e.target.value))}
                    className="bg-secondary/50 border border-border/50 rounded px-2 py-1 text-xs"
                  >
                    <option value={3}>3%</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                  </select>
                  <span className="text-xs text-muted-foreground">
                    (≈ ${((portfolio.cash + 0) * positionPct / 100).toFixed(0)})
                  </span>
                </div>
              )}

              {canTrade && !tradeResult && (
                <button
                  onClick={handleExecuteTrade}
                  disabled={tradeLoading}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    tradeLoading
                      ? "bg-secondary/50 text-muted-foreground cursor-wait"
                      : verdict.verdict === "BUY"
                      ? "bg-buy/20 text-buy border border-buy/30 hover:bg-buy/30"
                      : "bg-sell/20 text-sell border border-sell/30 hover:bg-sell/30"
                  }`}
                >
                  {tradeLoading
                    ? "실행 중..."
                    : `🧪 시뮬레이션 ${verdict.verdict === "BUY" ? "매수" : "매도"} 실행`}
                </button>
              )}

              {verdict.verdict === "HOLD" && (
                <p className="text-xs text-hold">관망 판정 — 매매를 실행하지 않습니다</p>
              )}

              {tradeResult && (
                <p className={`text-sm mt-2 ${tradeResult.startsWith("✅") ? "text-buy" : "text-sell"}`}>
                  {tradeResult}
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-muted-foreground space-y-1 mt-4">
            <p>
              분석 소요시간: {(result.totalDuration / 1000).toFixed(1)}초 |
              분석가 4명 · 토론 3라운드
            </p>
            <p className="text-[10px] mt-2 border-t border-border/50 pt-2">
              ⚠️ 투자 조언이 아닌 분석 자료입니다. 투자의 책임은 본인에게 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
