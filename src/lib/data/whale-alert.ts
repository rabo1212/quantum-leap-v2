import { WhaleMovement } from "@/types";

const EMPTY: WhaleMovement = {
  transactions: [],
  summary: {
    totalInflow: 0,
    totalOutflow: 0,
    netFlow: "neutral",
    largestTx: 0,
    txCount: 0,
  },
  available: false,
};

// CoinGecko ID → Whale Alert currency name
const CURRENCY_MAP: Record<string, string> = {
  bitcoin: "bitcoin",
  ethereum: "ethereum",
  ripple: "ripple",
  litecoin: "litecoin",
  "binancecoin": "bnb",
};

export async function getWhaleMovements(
  coingeckoId: string
): Promise<WhaleMovement> {
  const apiKey = process.env.WHALE_ALERT_API_KEY;
  if (!apiKey) return EMPTY;

  const currency = CURRENCY_MAP[coingeckoId];
  if (!currency) return EMPTY; // unsupported coin

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);

    const start = Math.floor((Date.now() - 3600000) / 1000); // 1 hour ago
    const res = await fetch(
      `https://api.whale-alert.io/v1/transactions?api_key=${apiKey}&min_value=1000000&currency=${currency}&start=${start}`,
      { signal: controller.signal }
    );
    clearTimeout(timer);

    if (!res.ok) return EMPTY;

    const data = await res.json();
    if (data.result !== "success" || !data.transactions) return EMPTY;

    let totalInflow = 0;
    let totalOutflow = 0;
    let largestTx = 0;

    const transactions = data.transactions.map(
      (tx: {
        amount: number;
        amount_usd: number;
        from: { owner_type: string };
        to: { owner_type: string };
        timestamp: number;
      }) => {
        const amountUsd = tx.amount_usd || 0;

        // Exchange inflow: from unknown/wallet → to exchange
        if (tx.to.owner_type === "exchange" && tx.from.owner_type !== "exchange") {
          totalInflow += amountUsd;
        }
        // Exchange outflow: from exchange → to unknown/wallet
        if (tx.from.owner_type === "exchange" && tx.to.owner_type !== "exchange") {
          totalOutflow += amountUsd;
        }

        if (amountUsd > largestTx) largestTx = amountUsd;

        return {
          amount: tx.amount,
          amountUsd,
          fromType: tx.from.owner_type,
          toType: tx.to.owner_type,
          timestamp: tx.timestamp,
        };
      }
    );

    const netFlow =
      totalInflow > totalOutflow * 1.2
        ? "exchange_inflow" as const
        : totalOutflow > totalInflow * 1.2
        ? "exchange_outflow" as const
        : "neutral" as const;

    return {
      transactions,
      summary: {
        totalInflow,
        totalOutflow,
        netFlow,
        largestTx,
        txCount: transactions.length,
      },
      available: transactions.length > 0,
    };
  } catch {
    return EMPTY;
  }
}
