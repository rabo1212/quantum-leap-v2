export interface CoinInfo {
  coingeckoId: string;
  name: string;
  binanceSymbol: string;
}

export const COIN_MAP: Record<string, CoinInfo> = {
  BTC: { coingeckoId: "bitcoin", name: "Bitcoin", binanceSymbol: "BTCUSDT" },
  ETH: { coingeckoId: "ethereum", name: "Ethereum", binanceSymbol: "ETHUSDT" },
  SOL: { coingeckoId: "solana", name: "Solana", binanceSymbol: "SOLUSDT" },
  BNB: { coingeckoId: "binancecoin", name: "BNB", binanceSymbol: "BNBUSDT" },
  XRP: { coingeckoId: "ripple", name: "XRP", binanceSymbol: "XRPUSDT" },
  ADA: { coingeckoId: "cardano", name: "Cardano", binanceSymbol: "ADAUSDT" },
  DOGE: { coingeckoId: "dogecoin", name: "Dogecoin", binanceSymbol: "DOGEUSDT" },
  AVAX: { coingeckoId: "avalanche-2", name: "Avalanche", binanceSymbol: "AVAXUSDT" },
  DOT: { coingeckoId: "polkadot", name: "Polkadot", binanceSymbol: "DOTUSDT" },
  MATIC: { coingeckoId: "matic-network", name: "Polygon", binanceSymbol: "MATICUSDT" },
  LINK: { coingeckoId: "chainlink", name: "Chainlink", binanceSymbol: "LINKUSDT" },
  UNI: { coingeckoId: "uniswap", name: "Uniswap", binanceSymbol: "UNIUSDT" },
  ATOM: { coingeckoId: "cosmos", name: "Cosmos", binanceSymbol: "ATOMUSDT" },
  LTC: { coingeckoId: "litecoin", name: "Litecoin", binanceSymbol: "LTCUSDT" },
  APT: { coingeckoId: "aptos", name: "Aptos", binanceSymbol: "APTUSDT" },
  ARB: { coingeckoId: "arbitrum", name: "Arbitrum", binanceSymbol: "ARBUSDT" },
  OP: { coingeckoId: "optimism", name: "Optimism", binanceSymbol: "OPUSDT" },
  SUI: { coingeckoId: "sui", name: "Sui", binanceSymbol: "SUIUSDT" },
  SEI: { coingeckoId: "sei-network", name: "Sei", binanceSymbol: "SEIUSDT" },
  NEAR: { coingeckoId: "near", name: "NEAR Protocol", binanceSymbol: "NEARUSDT" },
  FIL: { coingeckoId: "filecoin", name: "Filecoin", binanceSymbol: "FILUSDT" },
  AAVE: { coingeckoId: "aave", name: "Aave", binanceSymbol: "AAVEUSDT" },
  PEPE: { coingeckoId: "pepe", name: "Pepe", binanceSymbol: "PEPEUSDT" },
  SHIB: { coingeckoId: "shiba-inu", name: "Shiba Inu", binanceSymbol: "SHIBUSDT" },
  WIF: { coingeckoId: "dogwifcoin", name: "dogwifhat", binanceSymbol: "WIFUSDT" },
  TIA: { coingeckoId: "celestia", name: "Celestia", binanceSymbol: "TIAUSDT" },
  INJ: { coingeckoId: "injective-protocol", name: "Injective", binanceSymbol: "INJUSDT" },
  RENDER: { coingeckoId: "render-token", name: "Render", binanceSymbol: "RENDERUSDT" },
  FET: { coingeckoId: "fetch-ai", name: "Fetch.ai", binanceSymbol: "FETUSDT" },
  VIRTUAL: { coingeckoId: "virtual-protocol", name: "Virtuals Protocol", binanceSymbol: "VIRTUALUSDT" },
};

// Korean name aliases
const KOREAN_ALIASES: Record<string, string> = {
  "비트코인": "BTC",
  "이더리움": "ETH",
  "솔라나": "SOL",
  "리플": "XRP",
  "도지코인": "DOGE",
  "도지": "DOGE",
  "에이다": "ADA",
  "폴카닷": "DOT",
  "체인링크": "LINK",
  "유니스왑": "UNI",
  "라이트코인": "LTC",
  "아발란체": "AVAX",
  "아톰": "ATOM",
  "코스모스": "ATOM",
  "니어": "NEAR",
  "페페": "PEPE",
  "시바이누": "SHIB",
  "시바": "SHIB",
  "바이낸스코인": "BNB",
  "매틱": "MATIC",
  "폴리곤": "MATIC",
  "아비트럼": "ARB",
  "옵티미즘": "OP",
  "수이": "SUI",
  "앱토스": "APT",
  "파일코인": "FIL",
  "렌더": "RENDER",
  "버추얼": "VIRTUAL",
  "셀레스티아": "TIA",
  "인젝티브": "INJ",
};

export function resolveSymbol(input: string): CoinInfo | null {
  const upper = input.trim().toUpperCase();

  // Direct symbol match
  if (COIN_MAP[upper]) return COIN_MAP[upper];

  // Remove USDT suffix
  const noSuffix = upper.replace(/USDT$/, "");
  if (COIN_MAP[noSuffix]) return COIN_MAP[noSuffix];

  // Korean alias match
  const korean = KOREAN_ALIASES[input.trim()];
  if (korean && COIN_MAP[korean]) return COIN_MAP[korean];

  // Partial name match
  const lowerInput = input.trim().toLowerCase();
  for (const [symbol, info] of Object.entries(COIN_MAP)) {
    if (
      info.name.toLowerCase() === lowerInput ||
      info.coingeckoId === lowerInput ||
      symbol.toLowerCase() === lowerInput
    ) {
      return info;
    }
  }

  return null;
}
