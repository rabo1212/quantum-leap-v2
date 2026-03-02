import { RSI, MACD, BollingerBands, EMA, SMA } from "trading-signals";
import { CandleData, TechnicalIndicators } from "@/types";

function safeNum(val: unknown): number | null {
  try {
    return typeof val === "number" ? val : Number(val);
  } catch {
    return null;
  }
}

function calcRSI(closes: number[], period: number): number | null {
  if (closes.length < period + 1) return null;
  try {
    const rsi = new RSI(period);
    for (const c of closes) rsi.update(c, false);
    return safeNum(rsi.getResult());
  } catch {
    return null;
  }
}

function calcMACD(
  closes: number[]
): { macd: number; signal: number; histogram: number } | null {
  if (closes.length < 35) return null;
  try {
    const macd = new MACD(new EMA(12), new EMA(26), new EMA(9));
    for (const c of closes) macd.update(c, false);
    const r = macd.getResult();
    if (!r) return null;
    return {
      macd: safeNum(r.macd) ?? 0,
      signal: safeNum(r.signal) ?? 0,
      histogram: safeNum(r.histogram) ?? 0,
    };
  } catch {
    return null;
  }
}

function calcBB(
  closes: number[],
  currentPrice: number
): TechnicalIndicators["bollingerBands"] {
  if (closes.length < 20) return null;
  try {
    const bb = new BollingerBands(20, 2);
    for (const c of closes) bb.update(c, false);
    const r = bb.getResult();
    if (!r) return null;
    const upper = safeNum(r.upper) ?? 0;
    const lower = safeNum(r.lower) ?? 0;
    const middle = safeNum(r.middle) ?? 0;
    const range = upper - lower;
    const percentB = range > 0 ? (currentPrice - lower) / range : 0.5;
    return { upper, middle, lower, percentB };
  } catch {
    return null;
  }
}

function calcEMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  try {
    const ema = new EMA(period);
    for (const c of closes) ema.update(c, false);
    return safeNum(ema.getResult());
  } catch {
    return null;
  }
}

function calcSMA(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  try {
    const sma = new SMA(period);
    for (const c of closes) sma.update(c, false);
    return safeNum(sma.getResult());
  } catch {
    return null;
  }
}

function findSupportResistance(candles: CandleData[]): {
  support: number | null;
  resistance: number | null;
} {
  if (candles.length < 5) return { support: null, resistance: null };

  const recent = candles.slice(-30);
  let support: number | null = null;
  let resistance: number | null = null;

  // Swing low (3-candle): low[i] < low[i-1] && low[i] < low[i+1]
  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i].low < recent[i - 1].low && recent[i].low < recent[i + 1].low) {
      if (support === null || recent[i].low > support) {
        support = recent[i].low; // nearest support
      }
    }
    if (recent[i].high > recent[i - 1].high && recent[i].high > recent[i + 1].high) {
      if (resistance === null || recent[i].high < resistance) {
        resistance = recent[i].high; // nearest resistance
      }
    }
  }

  return { support, resistance };
}

export function computeIndicators(
  candles1d: CandleData[],
  candles4h: CandleData[],
  currentPrice: number
): TechnicalIndicators {
  const dailyCloses = candles1d.map((c) => c.close);
  const fourHourCloses = candles4h.map((c) => c.close);
  const dailyVolumes = candles1d.map((c) => c.volume);

  // RSI
  const rsi14 = calcRSI(dailyCloses, 14);
  const rsi14_4h = calcRSI(fourHourCloses, 14);

  // MACD
  const macd = calcMACD(dailyCloses);

  // Bollinger Bands
  const bollingerBands = calcBB(dailyCloses, currentPrice);

  // EMAs
  const ema9 = calcEMA(fourHourCloses, 9);
  const ema21 = calcEMA(fourHourCloses, 21);
  const ema50 = calcEMA(dailyCloses, 50);
  const ema200 = calcEMA(dailyCloses, 200);

  // SMAs
  const sma20 = calcSMA(dailyCloses, 20);
  const sma50 = calcSMA(dailyCloses, 50);

  // Cross signals
  const goldenCross = ema50 !== null && ema200 !== null ? ema50 > ema200 : null;
  const deathCross = ema50 !== null && ema200 !== null ? ema50 < ema200 : null;
  const priceVsEma200 =
    ema200 !== null ? (currentPrice > ema200 ? "above" : "below") : null;

  // Volume
  const volumeSma20 = calcSMA(dailyVolumes, 20);
  const lastVol = dailyVolumes.length > 0 ? dailyVolumes[dailyVolumes.length - 1] : null;
  const currentVolumeRatio =
    volumeSma20 && lastVol && volumeSma20 > 0 ? lastVol / volumeSma20 : null;

  // Support/Resistance
  const { support, resistance } = findSupportResistance(candles1d);

  return {
    rsi14,
    rsi14_4h,
    macd,
    bollingerBands,
    ema9,
    ema21,
    ema50,
    ema200,
    sma20,
    sma50,
    goldenCross,
    deathCross,
    priceVsEma200,
    volumeSma20,
    currentVolumeRatio,
    support,
    resistance,
  };
}
