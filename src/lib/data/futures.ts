import { FuturesData } from "@/types";

const FAPI_BASE = "https://fapi.binance.com";
const TIMEOUT_MS = 3000;

async function fapiGet<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${FAPI_BASE}${path}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`fapi ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getFuturesData(
  symbol: string,
  currentPrice: number
): Promise<FuturesData> {
  const empty: FuturesData = {
    fundingRate: null,
    fundingRateAnnualized: null,
    nextFundingTime: null,
    openInterest: null,
    openInterestUsd: null,
    longShortRatio: null,
    longPercent: null,
    shortPercent: null,
    available: false,
  };

  try {
    const [premiumRes, oiRes, lsRes] = await Promise.allSettled([
      fapiGet<{
        lastFundingRate: string;
        nextFundingTime: number;
      }>(`/fapi/v1/premiumIndex?symbol=${symbol}`),
      fapiGet<{
        openInterest: string;
      }>(`/fapi/v1/openInterest?symbol=${symbol}`),
      fapiGet<Array<{
        longShortRatio: string;
        longAccount: string;
        shortAccount: string;
      }>>(`/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=1h&limit=1`),
    ]);

    let anySuccess = false;

    if (premiumRes.status === "fulfilled") {
      const fr = parseFloat(premiumRes.value.lastFundingRate);
      empty.fundingRate = fr;
      empty.fundingRateAnnualized = fr * 3 * 365;
      empty.nextFundingTime = premiumRes.value.nextFundingTime;
      anySuccess = true;
    }

    if (oiRes.status === "fulfilled") {
      const oi = parseFloat(oiRes.value.openInterest);
      empty.openInterest = oi;
      empty.openInterestUsd = oi * currentPrice;
      anySuccess = true;
    }

    if (lsRes.status === "fulfilled" && lsRes.value.length > 0) {
      const ls = lsRes.value[0];
      empty.longShortRatio = parseFloat(ls.longShortRatio);
      empty.longPercent = parseFloat(ls.longAccount);
      empty.shortPercent = parseFloat(ls.shortAccount);
      anySuccess = true;
    }

    empty.available = anySuccess;
    return empty;
  } catch {
    return empty;
  }
}
