"use client";

import { MarketData, MarketDetection } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketOverviewProps {
  market: MarketDetection;
  data: MarketData;
}

function formatNumber(n: number, decimals = 2): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(decimals)}`;
}

function getFearGreedColor(value: number): string {
  if (value <= 25) return "text-sell";
  if (value <= 45) return "text-orange-400";
  if (value <= 55) return "text-hold";
  if (value <= 75) return "text-green-400";
  return "text-buy";
}

export function MarketOverview({ market, data }: MarketOverviewProps) {
  const isUp = data.changePercent24h >= 0;
  const athPercent = ((data.price / data.coingeckoData.ath) * 100).toFixed(1);

  return (
    <Card className="glass-card overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{market.name}</h2>
            <Badge variant="outline" className="border-primary/50 text-primary">
              {market.symbol}
            </Badge>
            <Badge variant="secondary">#{data.coingeckoData.rank}</Badge>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(data.fetchedAt).toLocaleTimeString("ko-KR")}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Price */}
          <div>
            <p className="text-sm text-muted-foreground">현재가</p>
            <p className="text-2xl font-bold">
              ${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className={`text-sm font-medium ${isUp ? "text-buy" : "text-sell"}`}>
              {isUp ? "+" : ""}
              {data.changePercent24h.toFixed(2)}%
            </p>
          </div>

          {/* 24h Range */}
          <div>
            <p className="text-sm text-muted-foreground">24h 범위</p>
            <p className="text-sm mt-1">
              <span className="text-sell">${data.low24h.toLocaleString()}</span>
              <span className="text-muted-foreground"> — </span>
              <span className="text-buy">${data.high24h.toLocaleString()}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              거래량 {formatNumber(data.volume24h)}
            </p>
          </div>

          {/* Market Cap */}
          <div>
            <p className="text-sm text-muted-foreground">시가총액</p>
            <p className="text-lg font-semibold">{formatNumber(data.marketCap)}</p>
            <p className="text-sm text-muted-foreground">
              ATH 대비 {athPercent}%
            </p>
          </div>

          {/* Fear & Greed */}
          <div>
            <p className="text-sm text-muted-foreground">공포탐욕지수</p>
            <p className={`text-2xl font-bold ${getFearGreedColor(data.fearGreedIndex)}`}>
              {data.fearGreedIndex}
            </p>
            <p className={`text-sm ${getFearGreedColor(data.fearGreedIndex)}`}>
              {data.fearGreedLabel}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
