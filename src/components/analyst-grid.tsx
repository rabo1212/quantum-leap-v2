"use client";

import { AnalystReport } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AnalystGridProps {
  analysts: AnalystReport[];
}

function sentimentConfig(sentiment: string) {
  switch (sentiment) {
    case "bullish":
      return { color: "text-buy", bg: "bg-buy/10", border: "border-buy/30", label: "강세" };
    case "bearish":
      return { color: "text-sell", bg: "bg-sell/10", border: "border-sell/30", label: "약세" };
    default:
      return { color: "text-hold", bg: "bg-hold/10", border: "border-hold/30", label: "중립" };
  }
}

export function AnalystGrid({ analysts }: AnalystGridProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>📋</span> 4대 분석 요약
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {analysts.map((analyst) => {
          const s = sentimentConfig(analyst.sentiment);
          return (
            <Card
              key={analyst.role}
              className={`glass-card border ${s.border} transition-all hover:scale-[1.01]`}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{analyst.emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{analyst.name}</p>
                      <p className="text-xs text-muted-foreground">{analyst.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${s.bg} ${s.color} border-0`}>
                      {s.label}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {analyst.confidence}%
                    </span>
                  </div>
                </div>

                <p className="text-sm mb-3">{analyst.summary}</p>

                <ul className="space-y-1">
                  {analyst.details.map((detail, i) => (
                    <li
                      key={i}
                      className="text-xs text-muted-foreground flex items-start gap-1.5"
                    >
                      <span className="text-primary mt-0.5">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
