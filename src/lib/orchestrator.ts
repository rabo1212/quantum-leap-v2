import { nanoid } from "nanoid";
import {
  AnalysisResult,
  MarketData,
  MarketDetection,
  ProgressUpdate,
} from "@/types";
import { detectMarket } from "@/lib/agents/market-detector";
import { runAnalysts } from "@/lib/agents/analysts";
import { runDebate } from "@/lib/agents/debate";
import { runTrader } from "@/lib/agents/trader";
import { runRiskManager } from "@/lib/agents/risk-manager";
import { runFundManager } from "@/lib/agents/fund-manager";
import { getKlines, getTicker24h } from "@/lib/data/binance";
import { getCoinData } from "@/lib/data/coingecko";
import { getFearGreedIndex } from "@/lib/data/fear-greed";
import { computeIndicators } from "@/lib/data/indicators";
import { getFuturesData } from "@/lib/data/futures";
import { getCryptoNews } from "@/lib/data/cryptopanic";
import { getWhaleMovements } from "@/lib/data/whale-alert";

async function fetchAllMarketData(
  market: MarketDetection
): Promise<MarketData> {
  const [ticker, candles1h, candles4h, candles1d, coinData, fng] =
    await Promise.allSettled([
      getTicker24h(market.symbol),
      getKlines(market.symbol, "1h", 24),
      getKlines(market.symbol, "4h", 30),
      getKlines(market.symbol, "1d", 210),
      getCoinData(market.coingeckoId),
      getFearGreedIndex(),
    ]);

  const t =
    ticker.status === "fulfilled"
      ? ticker.value
      : {
          lastPrice: "0",
          priceChange: "0",
          priceChangePercent: "0",
          highPrice: "0",
          lowPrice: "0",
          volume: "0",
          quoteVolume: "0",
        };

  const cg =
    coinData.status === "fulfilled"
      ? coinData.value
      : {
          rank: 0,
          marketCap: 0,
          ath: 0,
          athDate: "",
          circulatingSupply: 0,
          totalSupply: 0,
        };

  const fg =
    fng.status === "fulfilled"
      ? fng.value
      : { value: 50, label: "Neutral" };

  const currentPrice = parseFloat(t.lastPrice);
  const dailyCandles = candles1d.status === "fulfilled" ? candles1d.value : [];
  const fourHourCandles = candles4h.status === "fulfilled" ? candles4h.value : [];

  // Phase 2: Enriched data (parallel, all optional)
  const [indicatorsRes, futuresRes, newsRes, whalesRes] =
    await Promise.allSettled([
      Promise.resolve(computeIndicators(dailyCandles, fourHourCandles, currentPrice)),
      getFuturesData(market.symbol, currentPrice),
      getCryptoNews(market.symbol.replace("USDT", "")),
      getWhaleMovements(market.coingeckoId),
    ]);

  return {
    symbol: market.symbol,
    price: currentPrice,
    change24h: parseFloat(t.priceChange),
    changePercent24h: parseFloat(t.priceChangePercent),
    high24h: parseFloat(t.highPrice),
    low24h: parseFloat(t.lowPrice),
    volume24h: parseFloat(t.quoteVolume),
    marketCap: cg.marketCap,
    candles1h: candles1h.status === "fulfilled" ? candles1h.value : [],
    candles4h: fourHourCandles,
    candles1d: dailyCandles,
    fearGreedIndex: fg.value,
    fearGreedLabel: fg.label,
    coingeckoData: {
      rank: cg.rank,
      ath: cg.ath,
      athDate: cg.athDate,
      circulatingSupply: cg.circulatingSupply,
      totalSupply: cg.totalSupply,
    },
    fetchedAt: new Date().toISOString(),
    indicators: indicatorsRes.status === "fulfilled" ? indicatorsRes.value : undefined,
    futures: futuresRes.status === "fulfilled" ? futuresRes.value : undefined,
    news: newsRes.status === "fulfilled" ? newsRes.value : undefined,
    whales: whalesRes.status === "fulfilled" ? whalesRes.value : undefined,
  };
}

export async function runAnalysis(
  query: string,
  onProgress: (update: ProgressUpdate) => void
): Promise<AnalysisResult> {
  const id = nanoid(10);
  const startedAt = new Date().toISOString();
  const startMs = Date.now();

  const progress = (
    stage: ProgressUpdate["stage"],
    detail: string,
    pct: number
  ) => {
    onProgress({
      stage,
      detail,
      progress: pct,
      timestamp: new Date().toISOString(),
    });
  };

  // Step 1: Market Detection
  progress("detecting", "시장 유형 감지 중...", 5);
  const market = await detectMarket(query);

  // Step 2: Data Collection
  progress("fetching_data", "실시간 데이터 수집 중...", 15);
  const marketData = await fetchAllMarketData(market);

  // Step 3: 4 Analysts (parallel)
  progress("analyzing", "4명의 분석가가 분석 중... 📊📰🔗🌍", 30);
  const analysts = await runAnalysts(market, marketData);

  // Step 4: Bull vs Bear Debate (3 rounds)
  progress("debating", "🐂 vs 🐻 토론 시작...", 50);
  const debate = await runDebate(analysts, marketData, (round) => {
    progress("debating", `🐂 vs 🐻 토론 ${round}라운드...`, 50 + round * 8);
  });

  // Step 5: Trader Strategy
  progress("strategizing", "🦞 트레이더 전략 수립 중...", 80);
  const strategy = await runTrader(analysts, debate, marketData);

  // Step 6: Risk Manager
  progress("risk_checking", "🛡️ 리스크 매니저 점검 중...", 88);
  const risk = await runRiskManager(strategy, marketData);

  // Step 7: Fund Manager Final Verdict
  progress("final_verdict", "🦞🎖️ 펀드매니저 최종 판정 중...", 95);
  const verdict = await runFundManager(
    analysts,
    debate,
    strategy,
    risk,
    marketData
  );

  progress("complete", "분석 완료!", 100);

  return {
    id,
    query,
    market,
    marketData,
    analysts,
    debate,
    strategy,
    risk,
    verdict,
    startedAt,
    completedAt: new Date().toISOString(),
    totalDuration: Date.now() - startMs,
  };
}
