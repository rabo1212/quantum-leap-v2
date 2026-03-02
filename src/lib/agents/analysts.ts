import { AnalystReport, MarketData, MarketDetection } from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import {
  TECHNICAL_ANALYST_PROMPT,
  SENTIMENT_ANALYST_PROMPT,
  ONCHAIN_ANALYST_PROMPT,
  MACRO_ANALYST_PROMPT,
} from "@/lib/prompts/system-prompts";

function buildDataContext(market: MarketDetection, data: MarketData): string {
  const candles1d = data.candles1d.slice(-7);
  const closes = candles1d.map((c) => c.close);

  return `
=== ${market.name} (${market.symbol}) 시장 데이터 ===

현재가: $${data.price.toLocaleString()}
24h 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%
24h 고가: $${data.high24h.toLocaleString()}
24h 저가: $${data.low24h.toLocaleString()}
24h 거래량: $${(data.volume24h / 1e6).toFixed(1)}M

시가총액: $${(data.marketCap / 1e9).toFixed(1)}B
시총 순위: #${data.coingeckoData.rank}
ATH: $${data.coingeckoData.ath.toLocaleString()} (${data.coingeckoData.athDate.split("T")[0]})
ATH 대비: ${((data.price / data.coingeckoData.ath) * 100).toFixed(1)}%

유통량: ${(data.coingeckoData.circulatingSupply / 1e6).toFixed(1)}M
총 공급량: ${data.coingeckoData.totalSupply ? (data.coingeckoData.totalSupply / 1e6).toFixed(1) + "M" : "무제한"}

공포탐욕지수: ${data.fearGreedIndex} (${data.fearGreedLabel})

최근 7일 종가: ${closes.map((c) => "$" + c.toLocaleString()).join(" → ")}

1시간봉 (최근 24개): ${data.candles1h
    .slice(-6)
    .map((c) => `O:${c.open.toFixed(0)} H:${c.high.toFixed(0)} L:${c.low.toFixed(0)} C:${c.close.toFixed(0)} V:${(c.volume / 1e3).toFixed(0)}K`)
    .join(" | ")}

4시간봉 (최근 6개): ${data.candles4h
    .slice(-6)
    .map((c) => `O:${c.open.toFixed(0)} H:${c.high.toFixed(0)} L:${c.low.toFixed(0)} C:${c.close.toFixed(0)} V:${(c.volume / 1e3).toFixed(0)}K`)
    .join(" | ")}

데이터 수집 시각: ${data.fetchedAt}
`;
}

const DEFAULTS: Record<string, Partial<AnalystReport>> = {
  technical: { role: "technical", emoji: "📊", name: "차트술사 루카스", title: "기술적 분석" },
  sentiment: { role: "sentiment", emoji: "📰", name: "뉴스헌터 민지", title: "뉴스/센티멘트 분석" },
  onchain: { role: "onchain", emoji: "🔗", name: "체인워커 재혁", title: "온체인 분석" },
  macro: { role: "macro", emoji: "🌍", name: "매크로이코노미스트 서연", title: "매크로 분석" },
};

async function runSingleAnalyst(
  prompt: string,
  role: string,
  context: string
): Promise<AnalystReport> {
  try {
    const response = await callAgent(prompt, context);
    const parsed = parseAgentJSON<AnalystReport>(response);
    return { ...DEFAULTS[role], ...parsed, role: role as AnalystReport["role"] };
  } catch (err) {
    console.error(`Analyst ${role} failed:`, err);
    return {
      ...(DEFAULTS[role] as AnalystReport),
      summary: "분석 중 오류가 발생했습니다.",
      details: ["데이터를 기반으로 분석을 완료하지 못했습니다."],
      sentiment: "neutral",
      confidence: 0,
    };
  }
}

export async function runAnalysts(
  market: MarketDetection,
  data: MarketData
): Promise<AnalystReport[]> {
  const context = buildDataContext(market, data);

  const results = await Promise.allSettled([
    runSingleAnalyst(TECHNICAL_ANALYST_PROMPT, "technical", context),
    runSingleAnalyst(SENTIMENT_ANALYST_PROMPT, "sentiment", context),
    runSingleAnalyst(ONCHAIN_ANALYST_PROMPT, "onchain", context),
    runSingleAnalyst(MACRO_ANALYST_PROMPT, "macro", context),
  ]);

  return results.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const role = ["technical", "sentiment", "onchain", "macro"][i];
    return {
      ...(DEFAULTS[role] as AnalystReport),
      summary: "분석 실패",
      details: ["에이전트 호출 중 오류 발생"],
      sentiment: "neutral" as const,
      confidence: 0,
    };
  });
}
