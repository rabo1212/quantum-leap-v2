import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

export async function callAgent(
  systemPrompt: string,
  userMessage: string,
  options?: { model?: string; maxTokens?: number }
): Promise<string> {
  const model = options?.model ?? "claude-3-haiku-20240307";
  const maxTokens = options?.maxTokens ?? 2048;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      });
      const textBlock = response.content.find(
        (b): b is Anthropic.TextBlock => b.type === "text"
      );
      return textBlock?.text ?? "";
    } catch (err) {
      if (attempt === 0) {
        console.warn(`Claude call failed (attempt 1), retrying...`, err);
        continue;
      }
      throw err;
    }
  }
  throw new Error("Claude call failed after retries");
}

export function parseAgentJSON<T>(text: string): T {
  let cleaned = text.trim();

  // Strip markdown code blocks
  const codeBlock = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlock) cleaned = codeBlock[1].trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // Find JSON object in text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  }

  throw new Error(`Failed to parse agent JSON: ${cleaned.slice(0, 200)}`);
}
