"use client";

import { RiskAssessment } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RiskCheckProps {
  risk: RiskAssessment;
}

const riskConfig = {
  low: { color: "text-buy", bg: "bg-buy/10", label: "낮음" },
  medium: { color: "text-hold", bg: "bg-hold/10", label: "보통" },
  high: { color: "text-orange-400", bg: "bg-orange-400/10", label: "높음" },
  critical: { color: "text-sell", bg: "bg-sell/10", label: "위험" },
};

export function RiskCheck({ risk }: RiskCheckProps) {
  const overall = riskConfig[risk.overallRisk];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span>🛡️</span> 리스크 체크
        <Badge className={`${overall.bg} ${overall.color} border-0 ml-2`}>
          전체: {overall.label}
        </Badge>
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {risk.perspectives.map((p, i) => {
          const r = riskConfig[p.riskLevel];
          return (
            <Card key={i} className={`glass-card border ${r.color.replace("text-", "border-")}/20`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{p.emoji}</span>
                  <Badge className={`${r.bg} ${r.color} border-0 text-xs`}>
                    {r.label}
                  </Badge>
                </div>
                <p className="font-semibold text-sm mb-2">{p.title}</p>
                <p className="text-xs text-muted-foreground">{p.assessment}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {risk.warnings.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-sell/5 border border-sell/20">
          {risk.warnings.map((w, i) => (
            <p key={i} className="text-xs text-sell flex items-start gap-1.5">
              <span>⚠️</span>
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
