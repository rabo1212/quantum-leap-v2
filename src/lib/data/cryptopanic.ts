import { CryptoNews } from "@/types";

const EMPTY: CryptoNews = {
  headlines: [],
  overallSentiment: { positive: 0, negative: 0, neutral: 0 },
  available: false,
};

export async function getCryptoNews(currency: string): Promise<CryptoNews> {
  const apiKey = process.env.CRYPTOPANIC_API_KEY;
  if (!apiKey) return EMPTY;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${apiKey}&currencies=${currency}&filter=important&public=true`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return EMPTY;

    const data = await res.json();
    const results = data.results ?? [];

    let positive = 0;
    let negative = 0;
    let neutral = 0;

    const headlines = results.slice(0, 10).map(
      (post: {
        title: string;
        source: { title: string };
        published_at: string;
        votes: { positive: number; negative: number };
      }) => {
        const sent =
          post.votes.positive > post.votes.negative
            ? "positive" as const
            : post.votes.negative > post.votes.positive
            ? "negative" as const
            : "neutral" as const;

        if (sent === "positive") positive++;
        else if (sent === "negative") negative++;
        else neutral++;

        return {
          title: post.title,
          source: post.source.title,
          publishedAt: post.published_at,
          sentiment: sent,
        };
      }
    );

    return {
      headlines,
      overallSentiment: { positive, negative, neutral },
      available: headlines.length > 0,
    };
  } catch {
    return EMPTY;
  }
}
