"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnalysisResult, AnalysisStage, VirtualPortfolio } from "@/types";
import { SearchBar } from "@/components/search-bar";
import { AnalysisProgress } from "@/components/analysis-progress";
import { MarketOverview } from "@/components/market-overview";
import { AnalystGrid } from "@/components/analyst-grid";
import { DebatePanel } from "@/components/debate-panel";
import { TraderStrategyCard } from "@/components/trader-strategy";
import { RiskCheck } from "@/components/risk-check";
import { FinalVerdictCard } from "@/components/final-verdict";
import { HistoryList } from "@/components/history-list";
import { PortfolioDashboard } from "@/components/portfolio-dashboard";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [portfolio, setPortfolio] = useState<VirtualPortfolio | null>(null);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 포트폴리오 로드
  const loadPortfolio = useCallback(async () => {
    try {
      const res = await fetch("/api/portfolio");
      if (res.ok) {
        const data = await res.json();
        setPortfolio(data.portfolio);
      }
    } catch {
      // KV 연결 안 되면 무시
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startTimeRef.current);
    }, 100);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSearch = useCallback(
    async (query: string) => {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setElapsed(0);
      startTimer();

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `서버 오류 (${res.status})`);
        }

        const data: AnalysisResult = await res.json();
        setResult(data);
        setHistory((prev) => [data, ...prev].slice(0, 10));

        // 분석 완료 시 오픈 포지션 자동 체크
        fetch("/api/trades/check", { method: "POST" })
          .then((r) => r.json())
          .then((checkData) => {
            if (checkData.portfolio) setPortfolio(checkData.portfolio);
          })
          .catch(() => {});
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
        stopTimer();
      }
    },
    [startTimer, stopTimer]
  );

  const getSimulatedStage = useCallback((): {
    stage: AnalysisStage;
    detail: string;
    pct: number;
  } => {
    const sec = elapsed / 1000;
    if (sec < 2)
      return { stage: "detecting", detail: "시장 유형 감지 중...", pct: 5 };
    if (sec < 5)
      return {
        stage: "fetching_data",
        detail: "실시간 데이터 수집 중...",
        pct: 15,
      };
    if (sec < 20)
      return {
        stage: "analyzing",
        detail: "4명의 분석가가 분석 중... 📊📰🔗🌍",
        pct: 30,
      };
    if (sec < 45)
      return {
        stage: "debating",
        detail: `🐂 vs 🐻 토론 ${Math.min(3, Math.ceil((sec - 20) / 8))}라운드...`,
        pct: 50 + Math.min(24, (sec - 20) * 1),
      };
    if (sec < 55)
      return {
        stage: "strategizing",
        detail: "🦞 트레이더 전략 수립 중...",
        pct: 80,
      };
    if (sec < 65)
      return {
        stage: "risk_checking",
        detail: "🛡️ 리스크 매니저 점검 중...",
        pct: 88,
      };
    return {
      stage: "final_verdict",
      detail: "🦞🎖️ 펀드매니저 최종 판정 중...",
      pct: 95,
    };
  }, [elapsed]);

  const simulated = isLoading ? getSimulatedStage() : null;

  return (
    <main className="min-h-screen px-4 py-8 md:py-16">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-5xl font-black mb-2">
          <span className="text-primary">🦞 QUANTUM LEAP</span>{" "}
          <span className="text-muted-foreground text-2xl md:text-3xl">
            v2
          </span>
        </h1>
        <p className="text-muted-foreground">
          멀티에이전트 AI 팀이 토론하여 크립토를 분석합니다
        </p>
      </div>

      {/* Portfolio Dashboard */}
      {portfolio && (
        <PortfolioDashboard
          portfolio={portfolio}
          onReset={loadPortfolio}
        />
      )}

      {/* Search */}
      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl mx-auto mt-6 p-4 rounded-xl bg-sell/10 border border-sell/30 text-sell text-sm">
          ❌ {error}
        </div>
      )}

      {/* Progress */}
      {isLoading && simulated && (
        <div className="mt-8">
          <AnalysisProgress
            stage={simulated.stage}
            detail={simulated.detail}
            progress={simulated.pct}
            elapsed={elapsed}
          />
        </div>
      )}

      {/* Results */}
      {result && !isLoading && (
        <div className="max-w-4xl mx-auto mt-8 space-y-8">
          <MarketOverview market={result.market} data={result.marketData} />
          <AnalystGrid analysts={result.analysts} />
          <DebatePanel messages={result.debate} />
          <TraderStrategyCard strategy={result.strategy} />
          <RiskCheck risk={result.risk} />
          <FinalVerdictCard
            verdict={result.verdict}
            result={result}
            portfolio={portfolio}
            onTradeExecuted={(p) => setPortfolio(p)}
          />
        </div>
      )}

      {/* History */}
      {!isLoading && (
        <HistoryList analyses={history} onSelect={(r) => setResult(r)} />
      )}
    </main>
  );
}
