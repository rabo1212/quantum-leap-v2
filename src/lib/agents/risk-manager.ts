import { MarketData, TradeStrategy, RiskAssessment } from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import { RISK_MANAGER_PROMPT } from "@/lib/prompts/system-prompts";

export async function runRiskManager(
  strategy: TradeStrategy,
  data: MarketData
): Promise<RiskAssessment> {
  const context = `
=== 트레이더 매매 전략 ===
방향: ${strategy.direction}
진입가: $${strategy.entryPrice.toLocaleString()}
목표가: $${strategy.targetPrice.toLocaleString()}
손절가: $${strategy.stopLoss.toLocaleString()}
R:R 비율: ${strategy.riskRewardRatio}
포지션 사이즈: ${strategy.positionSize}
타임프레임: ${strategy.timeframe}
근거: ${strategy.reasoning}

=== 시장 데이터 ===
종목: ${data.symbol}
현재가: $${data.price.toLocaleString()}
24h 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%
24h 거래량: $${(data.volume24h / 1e6).toFixed(1)}M
시가총액: $${(data.marketCap / 1e9).toFixed(1)}B
공포탐욕지수: ${data.fearGreedIndex} (${data.fearGreedLabel})

=== 가재군단 생존규칙 ===
- 원금 70% 이하 → 경고 + 신규 매수 중단
- 원금 50% 이하 → 봇 즉시 종료
- 단일 거래 최대 손실 10%
- 일일 최대 손실 15%

이 전략의 리스크를 3가지 관점에서 평가하세요.
`;

  try {
    const response = await callAgent(RISK_MANAGER_PROMPT, context);
    return parseAgentJSON<RiskAssessment>(response);
  } catch {
    return {
      perspectives: [
        { title: "포지션 사이징", emoji: "📏", assessment: "평가 불가", riskLevel: "medium" },
        { title: "포트폴리오 상관관계", emoji: "🔄", assessment: "평가 불가", riskLevel: "medium" },
        { title: "최악의 시나리오", emoji: "💀", assessment: "평가 불가", riskLevel: "high" },
      ],
      overallRisk: "medium",
      warnings: ["리스크 분석 중 오류 발생. 보수적 접근을 권장합니다."],
    };
  }
}
