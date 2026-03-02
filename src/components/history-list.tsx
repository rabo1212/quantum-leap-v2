"use client";

import { AnalysisResult } from "@/types";
import { Badge } from "@/components/ui/badge";

interface HistoryListProps {
  analyses: AnalysisResult[];
  onSelect: (result: AnalysisResult) => void;
}

const verdictStyle = {
  BUY: "bg-buy/10 text-buy",
  SELL: "bg-sell/10 text-sell",
  HOLD: "bg-hold/10 text-hold",
};

export function HistoryList({ analyses, onSelect }: HistoryListProps) {
  if (analyses.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto mt-8">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        최근 분석
      </h3>
      <div className="space-y-2">
        {analyses.map((a) => {
          const elapsed = Math.floor(
            (Date.now() - new Date(a.completedAt).getTime()) / 1000
          );
          const timeAgo =
            elapsed < 60
              ? `${elapsed}초 전`
              : elapsed < 3600
              ? `${Math.floor(elapsed / 60)}분 전`
              : `${Math.floor(elapsed / 3600)}시간 전`;

          return (
            <button
              key={a.id}
              onClick={() => onSelect(a)}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold">{a.market.name}</span>
                <span className="text-sm text-muted-foreground">
                  ${a.marketData.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={`${verdictStyle[a.verdict.verdict]} border-0`}>
                  {a.verdict.verdict}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {a.verdict.confidence}%
                </span>
                <span className="text-xs text-muted-foreground">{timeAgo}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
