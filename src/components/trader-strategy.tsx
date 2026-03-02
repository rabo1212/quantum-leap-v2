"use client";

import { TradeStrategy } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TraderStrategyProps {
  strategy: TradeStrategy;
}

export function TraderStrategyCard({ strategy }: TraderStrategyProps) {
  const dirConfig = {
    LONG: { color: "text-buy", bg: "bg-buy/10", label: "롱 (매수)" },
    SHORT: { color: "text-sell", bg: "bg-sell/10", label: "숏 (매도)" },
    NEUTRAL: { color: "text-hold", bg: "bg-hold/10", label: "중립 (관망)" },
  };
  const dir = dirConfig[strategy.direction];

  const targetPct = (
    ((strategy.targetPrice - strategy.entryPrice) / strategy.entryPrice) *
    100
  ).toFixed(1);
  const stopPct = (
    ((strategy.stopLoss - strategy.entryPrice) / strategy.entryPrice) *
    100
  ).toFixed(1);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🦞</span> 트레이더 전략
      </h3>
      <Card className="glass-card border-primary/20 glow-orange">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🦞</span>
              <div>
                <p className="font-semibold">트레이더 가재</p>
                <p className="text-xs text-muted-foreground">실전 매매 전략</p>
              </div>
            </div>
            <Badge className={`${dir.bg} ${dir.color} border-0 text-sm`}>
              {dir.label}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">진입가</p>
              <p className="text-lg font-bold">
                ${strategy.entryPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-buy/5 border border-buy/20">
              <p className="text-xs text-muted-foreground mb-1">목표가</p>
              <p className="text-lg font-bold text-buy">
                ${strategy.targetPrice.toLocaleString()}
              </p>
              <p className="text-xs text-buy">+{targetPct}%</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-sell/5 border border-sell/20">
              <p className="text-xs text-muted-foreground mb-1">손절가</p>
              <p className="text-lg font-bold text-sell">
                ${strategy.stopLoss.toLocaleString()}
              </p>
              <p className="text-xs text-sell">{stopPct}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">R:R 비율</p>
              <p className="font-semibold">
                1:{strategy.riskRewardRatio.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">포지션 사이즈</p>
              <p className="font-semibold text-sm">{strategy.positionSize}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">타임프레임</p>
              <p className="font-semibold text-sm">{strategy.timeframe}</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">{strategy.reasoning}</p>
        </CardContent>
      </Card>
    </div>
  );
}
