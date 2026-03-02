"use client";

import { AnalysisStage } from "@/types";
import { Progress } from "@/components/ui/progress";

interface AnalysisProgressProps {
  stage: AnalysisStage;
  detail: string;
  progress: number;
  elapsed: number;
}

const STAGES: { key: AnalysisStage; emoji: string; label: string }[] = [
  { key: "detecting", emoji: "🔍", label: "시장 감지" },
  { key: "fetching_data", emoji: "📡", label: "데이터 수집" },
  { key: "analyzing", emoji: "📊", label: "4대 분석" },
  { key: "debating", emoji: "⚔️", label: "Bull vs Bear" },
  { key: "strategizing", emoji: "🦞", label: "전략 수립" },
  { key: "risk_checking", emoji: "🛡️", label: "리스크 체크" },
  { key: "final_verdict", emoji: "🎖️", label: "최종 판정" },
];

function getStageIndex(stage: AnalysisStage): number {
  return STAGES.findIndex((s) => s.key === stage);
}

export function AnalysisProgress({
  stage,
  detail,
  progress,
  elapsed,
}: AnalysisProgressProps) {
  const currentIndex = getStageIndex(stage);

  return (
    <div className="w-full max-w-2xl mx-auto glass-card p-6 glow-orange">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary">분석 진행 중</h3>
        <span className="text-sm text-muted-foreground">
          {Math.floor(elapsed / 1000)}초 경과
        </span>
      </div>

      <Progress value={progress} className="h-2 mb-6" />

      <div className="space-y-3">
        {STAGES.map((s, i) => {
          const isActive = i === currentIndex;
          const isDone = i < currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={s.key}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                isActive
                  ? "bg-primary/10 border border-primary/30"
                  : isDone
                  ? "opacity-60"
                  : "opacity-30"
              }`}
            >
              <span className="text-xl w-8 text-center">
                {isDone ? "✅" : s.emoji}
              </span>
              <span
                className={`flex-1 ${
                  isActive ? "text-primary font-medium" : ""
                }`}
              >
                {s.label}
              </span>
              {isActive && (
                <span className="text-sm text-primary animate-pulse-slow">
                  ●
                </span>
              )}
              {isPending && (
                <span className="text-xs text-muted-foreground">대기</span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted-foreground mt-4">
        {detail}
      </p>
    </div>
  );
}
