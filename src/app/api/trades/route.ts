import { NextRequest, NextResponse } from "next/server";
import { executeTrade } from "@/lib/portfolio";
import { getTrades } from "@/lib/kv";

// POST: 매매 실행
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { analysisId, symbol, strategy, positionPercent = 5 } = body;

    if (!analysisId || !symbol || !strategy) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const result = await executeTrade({
      analysisId,
      symbol,
      strategy,
      positionPercent,
    });

    return NextResponse.json({
      success: true,
      trade: result.trade,
      portfolio: result.portfolio,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "매매 실행 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// GET: 거래 내역 조회
export async function GET() {
  try {
    const trades = await getTrades();
    return NextResponse.json({ trades });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "거래 내역 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
