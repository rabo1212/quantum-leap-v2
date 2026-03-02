"use client";

import { useState } from "react";
import { VirtualTrade } from "@/types";

interface PositionCardProps {
  trade: VirtualTrade;
  onClose: (tradeId: string, currentPrice: number) => Promise<unknown>;
}

export function PositionCard({ trade, onClose }: PositionCardProps) {
  const [closing, setClosing] = useState(false);
  const [price, setPrice] = useState("");

  const isLong = trade.direction === "LONG";

  async function handleClose() {
    const p = parseFloat(price);
    if (!p || p <= 0) return;
    setClosing(true);
    try {
      await onClose(trade.id, p);
    } finally {
      setClosing(false);
    }
  }

  return (
    <div className={`p-3 rounded-lg border text-sm ${
      isLong ? "border-buy/20 bg-buy/5" : "border-sell/20 bg-sell/5"
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2 py-0.5 rounded ${
            isLong ? "bg-buy/20 text-buy" : "bg-sell/20 text-sell"
          }`}>
            {isLong ? "LONG" : "SHORT"}
          </span>
          <span className="font-semibold">{trade.symbol}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          ${trade.positionSize.toFixed(0)} 투자
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-center mb-2">
        <div>
          <p className="text-muted-foreground">진입가</p>
          <p className="font-mono">${trade.entryPrice.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">목표가</p>
          <p className="font-mono text-buy">${trade.targetPrice.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-muted-foreground">손절가</p>
          <p className="font-mono text-sell">${trade.stopLoss.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="현재가 입력"
          className="flex-1 bg-secondary/50 border border-border/50 rounded px-2 py-1 text-xs"
        />
        <button
          onClick={handleClose}
          disabled={closing || !price}
          className="px-3 py-1 rounded text-xs bg-sell/20 text-sell border border-sell/30 hover:bg-sell/30 disabled:opacity-50"
        >
          {closing ? "..." : "수동 청산"}
        </button>
      </div>
    </div>
  );
}
