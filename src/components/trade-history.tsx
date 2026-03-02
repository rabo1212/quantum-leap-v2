"use client";

import { VirtualTrade } from "@/types";

interface TradeHistoryProps {
  trades: VirtualTrade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  const sorted = [...trades].sort(
    (a, b) => new Date(b.exitTime || b.entryTime).getTime() - new Date(a.exitTime || a.entryTime).getTime()
  );

  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">거래 히스토리</h4>
      <div className="space-y-1">
        {sorted.slice(0, 20).map((trade) => (
          <div
            key={trade.id}
            className="flex items-center justify-between p-2 rounded text-xs bg-secondary/20"
          >
            <div className="flex items-center gap-2">
              <span className={`font-bold ${
                trade.status === "win" ? "text-buy" : "text-sell"
              }`}>
                {trade.status === "win" ? "✅" : "❌"}
              </span>
              <span className="font-semibold">{trade.symbol}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                trade.direction === "LONG" ? "bg-buy/10 text-buy" : "bg-sell/10 text-sell"
              }`}>
                {trade.direction}
              </span>
              <span className="text-muted-foreground">
                {trade.exitReason === "target" ? "익절" : trade.exitReason === "stoploss" ? "손절" : "수동"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">
                ${trade.entryPrice.toLocaleString()} → ${trade.exitPrice?.toLocaleString()}
              </span>
              <span className={`font-semibold ${
                (trade.pnl || 0) >= 0 ? "text-buy" : "text-sell"
              }`}>
                {(trade.pnl || 0) >= 0 ? "+" : ""}${trade.pnl?.toFixed(2)}
                <span className="text-[10px] ml-1">
                  ({(trade.pnlPercent || 0) >= 0 ? "+" : ""}{trade.pnlPercent?.toFixed(1)}%)
                </span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
