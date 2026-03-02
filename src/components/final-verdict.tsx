"use client";

import { FinalVerdict as FinalVerdictType, AnalysisResult } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface FinalVerdictProps {
  verdict: FinalVerdictType;
  result: AnalysisResult;
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

export function FinalVerdictCard({ verdict, result }: FinalVerdictProps) {
  const v = verdictConfig[verdict.verdict];

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

          <div className="text-xs text-muted-foreground space-y-1">
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
