import { AnalystReport, DebateMessage, MarketData, TradeStrategy } from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import { TRADER_PROMPT } from "@/lib/prompts/system-prompts";

export async function runTrader(
  analysts: AnalystReport[],
  debate: DebateMessage[],
  data: MarketData
): Promise<TradeStrategy> {
  const context = `
=== 시장 현황 ===
종목: ${data.symbol}
현재가: $${data.price.toLocaleString()}
24h 고가: $${data.high24h.toLocaleString()}
24h 저가: $${data.low24h.toLocaleString()}
24h 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%
거래량: $${(data.volume24h / 1e6).toFixed(1)}M

=== 분석가 센티멘트 ===
${analysts.map((a) => `${a.emoji} ${a.name}: ${a.sentiment} (확신도 ${a.confidence}%)`).join("\n")}

=== Bull vs Bear 토론 요약 ===
${debate.map((d) => `${d.speaker === "bull" ? "🐂" : "🐻"} R${d.round}: ${d.argument}`).join("\n")}

=== 매매 전략을 제시하세요 ===
수수료: 편도 0.1% (왕복 0.2%)
현재가 기준으로 구체적인 진입가/목표가/손절가를 제시하세요.
`;

  try {
    const response = await callAgent(TRADER_PROMPT, context);
    return parseAgentJSON<TradeStrategy>(response);
  } catch {
    return {
      direction: "NEUTRAL",
      entryPrice: data.price,
      targetPrice: data.price * 1.05,
      stopLoss: data.price * 0.95,
      riskRewardRatio: 1,
      positionSize: "전체 자산의 2%",
      timeframe: "1-3일",
      reasoning: "분석 데이터가 충분하지 않아 중립 포지션을 권장합니다.",
    };
  }
}
