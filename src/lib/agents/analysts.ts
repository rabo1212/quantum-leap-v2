import { AnalystReport, MarketData, MarketDetection } from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import {
  TECHNICAL_ANALYST_PROMPT,
  SENTIMENT_ANALYST_PROMPT,
  ONCHAIN_ANALYST_PROMPT,
  MACRO_ANALYST_PROMPT,
} from "@/lib/prompts/system-prompts";

// === Role-specific context builders ===

function buildTechnicalContext(market: MarketDetection, data: MarketData): string {
  const ind = data.indicators;
  let ctx = `=== ${market.name} (${market.symbol}) 기술적 분석 데이터 ===\n\n`;

  ctx += `현재가: $${data.price.toLocaleString()}\n`;
  ctx += `24h 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%\n`;
  ctx += `24h 고가/저가: $${data.high24h.toLocaleString()} / $${data.low24h.toLocaleString()}\n`;
  ctx += `24h 거래량: $${(data.volume24h / 1e6).toFixed(1)}M\n\n`;

  if (ind) {
    ctx += `=== 기술적 지표 (서버에서 실제 계산된 값) ===\n`;
    ctx += `RSI(14, 일봉): ${ind.rsi14 !== null ? ind.rsi14.toFixed(1) : "계산 불가"}\n`;
    ctx += `RSI(14, 4시간): ${ind.rsi14_4h !== null ? ind.rsi14_4h.toFixed(1) : "계산 불가"}\n`;
    if (ind.macd) {
      ctx += `MACD(12,26,9): MACD=${ind.macd.macd.toFixed(2)}, Signal=${ind.macd.signal.toFixed(2)}, Histogram=${ind.macd.histogram.toFixed(2)}\n`;
    } else {
      ctx += `MACD: 계산 불가\n`;
    }
    if (ind.bollingerBands) {
      ctx += `볼린저밴드(20,2): 상단=$${ind.bollingerBands.upper.toFixed(0)}, 중간=$${ind.bollingerBands.middle.toFixed(0)}, 하단=$${ind.bollingerBands.lower.toFixed(0)}, %B=${ind.bollingerBands.percentB.toFixed(2)}\n`;
    } else {
      ctx += `볼린저밴드: 계산 불가\n`;
    }
    ctx += `EMA: 9=${fmt(ind.ema9)}, 21=${fmt(ind.ema21)}, 50=${fmt(ind.ema50)}, 200=${fmt(ind.ema200)}\n`;
    ctx += `SMA: 20=${fmt(ind.sma20)}, 50=${fmt(ind.sma50)}\n`;
    ctx += `골든크로스(EMA50>200): ${ind.goldenCross !== null ? (ind.goldenCross ? "예" : "아니오") : "N/A"}\n`;
    ctx += `현재가 vs EMA200: ${ind.priceVsEma200 === "above" ? "위" : ind.priceVsEma200 === "below" ? "아래" : "N/A"}\n`;
    ctx += `거래량 비율 (현재/SMA20): ${ind.currentVolumeRatio !== null ? ind.currentVolumeRatio.toFixed(2) : "N/A"}\n`;
    ctx += `지지선: ${fmt(ind.support)}, 저항선: ${fmt(ind.resistance)}\n\n`;
  } else {
    ctx += `=== 기술적 지표: 계산 실패 ===\n\n`;
  }

  // Recent candles
  const recentDaily = data.candles1d.slice(-7);
  ctx += `최근 7일 종가: ${recentDaily.map((c) => "$" + c.close.toLocaleString()).join(" → ")}\n`;

  return ctx;
}

function buildSentimentContext(market: MarketDetection, data: MarketData): string {
  let ctx = `=== ${market.name} 뉴스/센티멘트 데이터 ===\n\n`;
  ctx += `공포탐욕지수: ${data.fearGreedIndex} (${data.fearGreedLabel})\n`;
  ctx += `24h 가격 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%\n`;
  ctx += `24h 거래량: $${(data.volume24h / 1e6).toFixed(1)}M\n\n`;

  if (data.news?.available && data.news.headlines.length > 0) {
    ctx += `=== 최근 뉴스 헤드라인 (CryptoPanic 실제 데이터) ===\n`;
    for (const h of data.news.headlines) {
      ctx += `- [${h.sentiment ?? "?"}] ${h.title} (${h.source})\n`;
    }
    const s = data.news.overallSentiment;
    ctx += `\n뉴스 센티멘트 집계: 긍정 ${s.positive}건, 부정 ${s.negative}건, 중립 ${s.neutral}건\n\n`;
  } else {
    ctx += `=== 뉴스: 사용 불가 ===\n`;
    ctx += `뉴스 데이터가 없으므로 Fear & Greed 지수와 가격 변동만으로 분석하세요.\n\n`;
  }

  if (data.futures?.available) {
    ctx += `=== 선물 시장 센티멘트 (Binance Futures 실제 데이터) ===\n`;
    if (data.futures.fundingRate !== null) {
      ctx += `펀딩비: ${(data.futures.fundingRate * 100).toFixed(4)}%\n`;
    }
    if (data.futures.longShortRatio !== null) {
      ctx += `롱/숏 비율: ${data.futures.longShortRatio.toFixed(2)} (롱 ${((data.futures.longPercent ?? 0) * 100).toFixed(1)}% / 숏 ${((data.futures.shortPercent ?? 0) * 100).toFixed(1)}%)\n`;
    }
    ctx += `\n`;
  }

  return ctx;
}

function buildOnchainContext(market: MarketDetection, data: MarketData): string {
  let ctx = `=== ${market.name} 온체인/파생상품 데이터 ===\n\n`;
  ctx += `시가총액: $${(data.marketCap / 1e9).toFixed(1)}B\n`;
  ctx += `시총 순위: #${data.coingeckoData.rank}\n`;
  ctx += `ATH: $${data.coingeckoData.ath.toLocaleString()} (${data.coingeckoData.athDate.split("T")[0]})\n`;
  ctx += `ATH 대비: ${((data.price / data.coingeckoData.ath) * 100).toFixed(1)}%\n`;
  ctx += `유통량: ${(data.coingeckoData.circulatingSupply / 1e6).toFixed(1)}M\n`;
  ctx += `총 공급량: ${data.coingeckoData.totalSupply ? (data.coingeckoData.totalSupply / 1e6).toFixed(1) + "M" : "무제한"}\n\n`;

  if (data.futures?.available) {
    ctx += `=== 파생상품 데이터 (Binance Futures 실제 데이터) ===\n`;
    if (data.futures.openInterest !== null) {
      ctx += `미결제약정(OI): ${data.futures.openInterest.toFixed(2)} ${market.symbol.replace("USDT", "")} ($${((data.futures.openInterestUsd ?? 0) / 1e9).toFixed(2)}B)\n`;
    }
    if (data.futures.fundingRate !== null) {
      ctx += `펀딩비: ${(data.futures.fundingRate * 100).toFixed(4)}% (연환산 ${((data.futures.fundingRateAnnualized ?? 0) * 100).toFixed(1)}%)\n`;
    }
    if (data.futures.longShortRatio !== null) {
      ctx += `롱/숏 비율: ${data.futures.longShortRatio.toFixed(2)}\n`;
    }
    ctx += `\n`;
  } else {
    ctx += `=== 파생상품 데이터: 사용 불가 (리전 제한 가능) ===\n\n`;
  }

  if (data.whales?.available) {
    const w = data.whales.summary;
    ctx += `=== 고래 이동 (Whale Alert, 최근 1시간, $1M+) ===\n`;
    ctx += `거래소 유입: $${(w.totalInflow / 1e6).toFixed(1)}M\n`;
    ctx += `거래소 유출: $${(w.totalOutflow / 1e6).toFixed(1)}M\n`;
    ctx += `순흐름: ${w.netFlow === "exchange_inflow" ? "거래소 유입 (매도 압력 가능)" : w.netFlow === "exchange_outflow" ? "거래소 유출 (축적 신호)" : "중립"}\n`;
    ctx += `대형 거래 ${w.txCount}건, 최대 $${(w.largestTx / 1e6).toFixed(1)}M\n\n`;
  } else {
    ctx += `=== 고래 이동: 사용 불가 ===\n`;
    ctx += `고래 데이터가 없으므로 거래소 유입/유출을 추론하지 마세요.\n\n`;
  }

  return ctx;
}

function buildMacroContext(market: MarketDetection, data: MarketData): string {
  let ctx = `=== ${market.name} 매크로 분석 데이터 ===\n\n`;
  ctx += `공포탐욕지수: ${data.fearGreedIndex} (${data.fearGreedLabel})\n`;
  ctx += `시가총액: $${(data.marketCap / 1e9).toFixed(1)}B (#${data.coingeckoData.rank})\n`;
  ctx += `24h 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%\n`;
  ctx += `24h 거래량: $${(data.volume24h / 1e6).toFixed(1)}M\n\n`;

  ctx += `=== 매크로 참고 정보 ===\n`;
  ctx += `분석 기준일: ${new Date().toISOString().split("T")[0]}\n`;
  ctx += `BTC 최근 반감기: 2024-04-20 (현재 반감기 후 약 ${Math.floor((Date.now() - new Date("2024-04-20").getTime()) / (86400000 * 30))}개월 경과)\n`;
  ctx += `주의: 금리, DXY, M2 실시간 데이터는 제공되지 않습니다.\n`;
  ctx += `학습 데이터 기준 최신 매크로 상황을 참고하되, "학습 데이터 기준"이라고 명시하세요.\n\n`;

  if (data.futures?.available) {
    ctx += `=== 선물 시장 매크로 지표 (실제 데이터) ===\n`;
    if (data.futures.fundingRate !== null) {
      const fr = data.futures.fundingRate;
      ctx += `펀딩비: ${(fr * 100).toFixed(4)}% → ${fr > 0.0001 ? "시장 과열 신호" : fr < -0.0001 ? "과도한 공매도 신호" : "중립"}\n`;
    }
    if (data.futures.openInterestUsd !== null) {
      ctx += `미결제약정: $${(data.futures.openInterestUsd / 1e9).toFixed(2)}B\n`;
    }
    ctx += `\n`;
  }

  return ctx;
}

function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "N/A";
  return "$" + n.toFixed(0);
}

// === Analyst runner ===

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
  // Each analyst gets role-specific context with real data
  const results = await Promise.allSettled([
    runSingleAnalyst(TECHNICAL_ANALYST_PROMPT, "technical", buildTechnicalContext(market, data)),
    runSingleAnalyst(SENTIMENT_ANALYST_PROMPT, "sentiment", buildSentimentContext(market, data)),
    runSingleAnalyst(ONCHAIN_ANALYST_PROMPT, "onchain", buildOnchainContext(market, data)),
    runSingleAnalyst(MACRO_ANALYST_PROMPT, "macro", buildMacroContext(market, data)),
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
