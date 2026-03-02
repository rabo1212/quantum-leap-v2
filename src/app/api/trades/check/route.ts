import { NextResponse } from "next/server";
import { checkOpenPositions } from "@/lib/portfolio";
import { getOpenTrades } from "@/lib/kv";

// POST: 오픈 포지션 손절/익절 자동 체크
export async function POST() {
  try {
    const openTrades = await getOpenTrades();

    if (openTrades.length === 0) {
      return NextResponse.json({
        checked: 0,
        closed: [],
        message: "오픈 포지션이 없습니다.",
      });
    }

    // 각 심볼의 현재가 가져오기 (Binance)
    const symbols = Array.from(new Set(openTrades.map((t) => t.symbol)));
    const currentPrices: Record<string, number> = {};

    for (const symbol of symbols) {
      try {
        const res = await fetch(
          `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}USDT`
        );
        if (res.ok) {
          const data = await res.json();
          currentPrices[symbol] = parseFloat(data.price);
        }
      } catch {
        // 가격 조회 실패 시 스킵
      }
    }

    const result = await checkOpenPositions(currentPrices);

    return NextResponse.json({
      checked: openTrades.length,
      closed: result.closed,
      portfolio: result.portfolio,
      prices: currentPrices,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "체크 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
