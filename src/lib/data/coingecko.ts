export interface CoinGeckoData {
  rank: number;
  marketCap: number;
  ath: number;
  athDate: string;
  circulatingSupply: number;
  totalSupply: number;
}

export async function getCoinData(coingeckoId: string): Promise<CoinGeckoData> {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/${coingeckoId}?localization=false&tickers=false&community_data=false&developer_data=false`,
    { next: { revalidate: 60 } }
  );

  if (!res.ok) {
    // CoinGecko rate limit — return defaults
    console.warn(`CoinGecko API error: ${res.status}`);
    return {
      rank: 0,
      marketCap: 0,
      ath: 0,
      athDate: "",
      circulatingSupply: 0,
      totalSupply: 0,
    };
  }

  const data = await res.json();
  const md = data.market_data;

  return {
    rank: data.market_cap_rank ?? 0,
    marketCap: md?.market_cap?.usd ?? 0,
    ath: md?.ath?.usd ?? 0,
    athDate: md?.ath_date?.usd ?? "",
    circulatingSupply: md?.circulating_supply ?? 0,
    totalSupply: md?.total_supply ?? 0,
  };
}
