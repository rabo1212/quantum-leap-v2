import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/orchestrator";

export const maxDuration = 60; // Vercel Hobby plan max

// Simple in-memory rate limiting
const requestLog = new Map<string, number[]>();
const RATE_LIMIT = 5; // requests per hour
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW);
  requestLog.set(ip, recent);
  return recent.length < RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "요청 한도를 초과했습니다. 1시간 후 다시 시도해주세요." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const query = body.query?.trim();

    if (!query) {
      return NextResponse.json(
        { error: "분석할 종목을 입력해주세요." },
        { status: 400 }
      );
    }

    // Record request
    const timestamps = requestLog.get(ip) ?? [];
    timestamps.push(Date.now());
    requestLog.set(ip, timestamps);

    // Run analysis (progress is simulated on client side)
    const result = await runAnalysis(query, () => {
      // Progress tracked client-side via elapsed time simulation
    });

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
    console.error("Analysis error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
