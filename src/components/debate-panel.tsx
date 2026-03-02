"use client";

import { DebateMessage } from "@/types";
import { Card, CardContent } from "@/components/ui/card";

interface DebatePanelProps {
  messages: DebateMessage[];
}

export function DebatePanel({ messages }: DebatePanelProps) {
  const bullWins = messages
    .filter((m) => m.speaker === "bull")
    .reduce((sum, m) => sum + m.keyPoints.length, 0);
  const bearWins = messages
    .filter((m) => m.speaker === "bear")
    .reduce((sum, m) => sum + m.keyPoints.length, 0);
  const total = bullWins + bearWins;
  const bullPercent = total > 0 ? Math.round((bullWins / total) * 100) : 50;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>⚔️</span> Bull vs Bear 토론
      </h3>

      {/* Score bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-buy font-medium">🐂 강세 {bullPercent}%</span>
          <span className="text-sell font-medium">
            약세 {100 - bullPercent}% 🐻
          </span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden flex">
          <div
            className="h-full bg-buy transition-all"
            style={{ width: `${bullPercent}%` }}
          />
          <div
            className="h-full bg-sell transition-all"
            style={{ width: `${100 - bullPercent}%` }}
          />
        </div>
      </div>

      <Card className="glass-card">
        <CardContent className="p-4 space-y-4">
          {messages.map((msg, i) => {
            const isBull = msg.speaker === "bull";
            return (
              <div
                key={i}
                className={`flex gap-3 ${isBull ? "" : "flex-row-reverse"}`}
              >
                <div className="text-2xl flex-shrink-0 mt-1">
                  {isBull ? "🐂" : "🐻"}
                </div>
                <div
                  className={`flex-1 rounded-xl p-4 ${
                    isBull
                      ? "bg-buy/5 border border-buy/20"
                      : "bg-sell/5 border border-sell/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`text-xs font-medium ${
                        isBull ? "text-buy" : "text-sell"
                      }`}
                    >
                      {isBull ? "강세론자 황소" : "약세론자 곰"} · 라운드{" "}
                      {msg.round}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{msg.argument}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.keyPoints.map((point, j) => (
                      <span
                        key={j}
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          isBull
                            ? "bg-buy/10 text-buy"
                            : "bg-sell/10 text-sell"
                        }`}
                      >
                        {point}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
