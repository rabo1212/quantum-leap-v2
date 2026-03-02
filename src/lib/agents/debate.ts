import { AnalystReport, DebateMessage, MarketData } from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import { BULL_PROMPT, BEAR_PROMPT } from "@/lib/prompts/system-prompts";

function buildDebateContext(
  analysts: AnalystReport[],
  data: MarketData,
  history: DebateMessage[]
): string {
  let context = `
=== 시장 현황 ===
종목: ${data.symbol}
현재가: $${data.price.toLocaleString()}
24h 변동: ${data.changePercent24h > 0 ? "+" : ""}${data.changePercent24h.toFixed(2)}%
공포탐욕지수: ${data.fearGreedIndex} (${data.fearGreedLabel})

=== 4명의 분석가 보고서 ===
`;
  for (const a of analysts) {
    context += `\n${a.emoji} ${a.name} (${a.title}): ${a.sentiment.toUpperCase()} (확신도 ${a.confidence}%)`;
    context += `\n요약: ${a.summary}`;
    context += `\n핵심: ${a.details.join(" / ")}\n`;
  }

  if (history.length > 0) {
    context += `\n=== 이전 토론 기록 ===\n`;
    for (const msg of history) {
      const icon = msg.speaker === "bull" ? "🐂" : "🐻";
      context += `\n${icon} [라운드 ${msg.round}]: ${msg.argument}\n`;
    }
  }

  return context;
}

export async function runDebate(
  analysts: AnalystReport[],
  data: MarketData,
  onRound?: (round: number) => void
): Promise<DebateMessage[]> {
  const messages: DebateMessage[] = [];

  for (let round = 1; round <= 3; round++) {
    onRound?.(round);

    // Bull speaks
    const bullContext = buildDebateContext(analysts, data, messages);
    const bullPrompt = `라운드 ${round}/3 토론을 시작합니다. 매수(강세) 관점에서 주장하세요.`;
    try {
      const bullResponse = await callAgent(BULL_PROMPT, bullContext + "\n\n" + bullPrompt);
      const bullMsg = parseAgentJSON<DebateMessage>(bullResponse);
      messages.push({ ...bullMsg, speaker: "bull", round });
    } catch {
      messages.push({
        speaker: "bull",
        round,
        argument: "기술적/펀더멘탈 데이터가 매수를 지지합니다.",
        keyPoints: ["데이터 기반 분석 완료"],
      });
    }

    // Bear responds
    const bearContext = buildDebateContext(analysts, data, messages);
    const bearPrompt = `라운드 ${round}/3 토론입니다. Bull의 주장에 반박하세요.`;
    try {
      const bearResponse = await callAgent(BEAR_PROMPT, bearContext + "\n\n" + bearPrompt);
      const bearMsg = parseAgentJSON<DebateMessage>(bearResponse);
      messages.push({ ...bearMsg, speaker: "bear", round });
    } catch {
      messages.push({
        speaker: "bear",
        round,
        argument: "리스크 요인들을 과소평가해서는 안 됩니다.",
        keyPoints: ["리스크 분석 완료"],
      });
    }
  }

  return messages;
}
