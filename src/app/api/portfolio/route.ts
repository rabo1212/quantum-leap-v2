import { NextRequest, NextResponse } from "next/server";
import { getPortfolio, resetPortfolio, getPnLHistory } from "@/lib/kv";

// GET: 포트폴리오 조회
export async function GET() {
  try {
    const [portfolio, pnlHistory] = await Promise.all([
      getPortfolio(),
      getPnLHistory(),
    ]);

    return NextResponse.json({ portfolio, pnlHistory });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "포트폴리오 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST: 포트폴리오 리셋
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action !== "reset") {
      return NextResponse.json(
        { error: "유효하지 않은 액션입니다." },
        { status: 400 }
      );
    }

    const portfolio = await resetPortfolio();

    return NextResponse.json({
      success: true,
      portfolio,
      message: "포트폴리오가 초기화되었습니다. ($10,000)",
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "리셋 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
