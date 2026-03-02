import { CandleData } from "@/types";

const BASE_URL = "https://api.binance.com/api/v3";

async function binanceGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Binance API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

function parseCandles(raw: unknown[][]): CandleData[] {
  return raw.map((c) => ({
    time: c[0] as number,
    open: parseFloat(c[1] as string),
    high: parseFloat(c[2] as string),
    close: parseFloat(c[4] as string),
    low: parseFloat(c[3] as string),
    volume: parseFloat(c[5] as string),
  }));
}

export async function getKlines(
  symbol: string,
  interval: string,
  limit: number
): Promise<CandleData[]> {
  const raw = await binanceGet<unknown[][]>(
    `/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
  );
  return parseCandles(raw);
}

export interface Ticker24h {
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}

export async function getTicker24h(symbol: string): Promise<Ticker24h> {
  return binanceGet<Ticker24h>(`/ticker/24hr?symbol=${symbol}`);
}
