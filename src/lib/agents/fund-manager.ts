import {
  AnalystReport,
  DebateMessage,
  TradeStrategy,
  RiskAssessment,
  MarketData,
  FinalVerdict,
} from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import { FUND_MANAGER_PROMPT } from "@/lib/prompts/system-prompts";

const SONNET_MODEL = "claude-sonnet-4-20250514";

export async function runFundManager(
  analysts: AnalystReport[],
  debate: DebateMessage[],
  strategy: TradeStrategy,
  risk: RiskAssessment,
  data: MarketData
): Promise<FinalVerdict> {
  const bullPoints = debate
    .filter((d) => d.speaker === "bull")
    .flatMap((d) => d.keyPoints);
  const bearPoints = debate
    .filter((d) => d.speaker === "bear")
    .flatMap((d) => d.keyPoints);

  const context = `
=== 최종 판정 요청 ===
종목: ${data.symbol} (${data.price.toLocaleString()} USD)

=== 4명의 분석가 종합 ===
${analysts.map((a) => `${a.emoji} ${a.name}: ${a.sentiment.toUpperCase()} (확신도 ${a.confidence}%) — ${a.summary}`).join("\n")}

강세 의견: ${analysts.filter((a) => a.sentiment === "bullish").length}/4
약세 의견: ${analysts.filter((a) => a.sentiment === "bearish").length}/4
중립 의견: ${analysts.filter((a) => a.sentiment === "neutral").length}/4

=== Bull vs Bear 토론 핵심 ===
🐂 강세 핵심: ${bullPoints.join(" / ")}
🐻 약세 핵심: ${bearPoints.join(" / ")}

=== 트레이더 전략 ===
방향: ${strategy.direction}
진입가: $${strategy.entryPrice.toLocaleString()} → 목표가: $${strategy.targetPrice.toLocaleString()} (손절: $${strategy.stopLoss.toLocaleString()})
R:R: ${strategy.riskRewardRatio} | 포지션: ${strategy.positionSize}

=== 리스크 체크 ===
전체 리스크: ${risk.overallRisk.toUpperCase()}
${risk.perspectives.map((p) => `${p.emoji} ${p.title}: ${p.riskLevel} — ${p.assessment}`).join("\n")}
경고: ${risk.warnings.join(" | ")}

=== 판정 규칙 ===
- 리스크가 critical이면 BUY 불가 (HOLD 또는 SELL만)
- 수익보다 생존이 먼저
- 확신도 50% 미만이면 HOLD 권장

모든 정보를 종합하여 최종 BUY/SELL/HOLD 판정을 내리세요.
`;

  try {
    const response = await callAgent(FUND_MANAGER_PROMPT, context, {
      model: SONNET_MODEL,
      maxTokens: 1024,
    });
    const verdict = parseAgentJSON<FinalVerdict>(response);

    // Enforce survival rule: critical risk → no BUY
    if (risk.overallRisk === "critical" && verdict.verdict === "BUY") {
      verdict.verdict = "HOLD";
      verdict.reasoning =
        "리스크매니저가 critical 등급을 부여했으므로, 생존규칙에 따라 HOLD로 조정합니다. " +
        verdict.reasoning;
    }

    return verdict;
  } catch {
    return {
      verdict: "HOLD",
      confidence: 30,
      reasoning:
        "최종 판정 중 오류가 발생했습니다. 불확실한 상황에서는 보수적 접근을 권장합니다.",
      keyFactors: ["판정 오류", "보수적 접근 권장", "추가 분석 필요"],
    };
  }
}
