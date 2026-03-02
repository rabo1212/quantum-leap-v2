import { MarketDetection } from "@/types";
import { callAgent, parseAgentJSON } from "@/lib/claude";
import { MARKET_DETECTOR_PROMPT } from "@/lib/prompts/system-prompts";
import { resolveSymbol } from "@/lib/data/coin-map";

export async function detectMarket(query: string): Promise<MarketDetection> {
  // Try local resolution first (saves an API call)
  const localMatch = resolveSymbol(query);
  if (localMatch) {
    return {
      type: "crypto",
      symbol: localMatch.binanceSymbol,
      name: localMatch.name,
      coingeckoId: localMatch.coingeckoId,
      confidence: 100,
    };
  }

  // Fall back to Claude for ambiguous inputs
  const response = await callAgent(MARKET_DETECTOR_PROMPT, query);
  const result = parseAgentJSON<MarketDetection>(response);

  // Phase 1: only crypto supported
  if (result.type !== "crypto") {
    throw new Error(
      `현재 Phase 1에서는 크립토만 지원합니다. "${query}"은(는) ${result.type} 시장으로 감지되었습니다.`
    );
  }

  return result;
}
