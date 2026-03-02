import { NextRequest, NextResponse } from "next/server";
import { closeTrade } from "@/lib/portfolio";
import { getTradeById } from "@/lib/kv";

// POST: 포지션 청산
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { currentPrice } = body;

    if (!currentPrice || currentPrice <= 0) {
      return NextResponse.json(
        { error: "현재가를 입력해주세요." },
        { status: 400 }
      );
    }

    const trade = await getTradeById(id);
    if (!trade) {
      return NextResponse.json(
        { error: "거래를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const result = await closeTrade(id, currentPrice, "manual");

    return NextResponse.json({
      success: true,
      trade: result.trade,
      portfolio: result.portfolio,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "청산 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
