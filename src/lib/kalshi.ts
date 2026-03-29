const KALSHI_BASE = "/kalshi-api";

function getAuthHeader(): Record<string, string> {
  const key = import.meta.env.VITE_KALSHI_API_KEY;
  return key ? { Authorization: `Bearer ${key}` } : {};
}

export interface KalshiMarket {
  ticker: string;
  title: string;
  category: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  last_price: number;
  volume: number;
  close_time: string;
  status: string;
  result: string;
}

export interface KalshiMarketsResponse {
  markets: KalshiMarket[];
  cursor?: string;
}

export interface KalshiOrderbook {
  yes: [number, number][];
  no: [number, number][];
}

export interface GetMarketsParams {
  limit?: number;
  cursor?: string;
  event_ticker?: string;
  series_ticker?: string;
  status?: string;
  category?: string;
}

export async function getMarkets(params: GetMarketsParams = {}): Promise<KalshiMarketsResponse> {
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.cursor) query.set("cursor", params.cursor);
  if (params.event_ticker) query.set("event_ticker", params.event_ticker);
  if (params.series_ticker) query.set("series_ticker", params.series_ticker);
  if (params.status) query.set("status", params.status);
  if (params.category) query.set("category", params.category);

  const url = `${KALSHI_BASE}/markets${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Kalshi API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    markets: data.markets ?? [],
    cursor: data.cursor,
  };
}

export async function getMarket(ticker: string): Promise<KalshiMarket> {
  const url = `${KALSHI_BASE}/markets/${ticker}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Kalshi API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.market;
}

export async function getOrderbook(ticker: string): Promise<KalshiOrderbook> {
  const url = `${KALSHI_BASE}/markets/${ticker}/orderbook`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
    },
  });

  if (!res.ok) {
    throw new Error(`Kalshi API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.orderbook ?? { yes: [], no: [] };
}

/** Fetch all pages up to maxPages for a given category */
export async function getAllMarketsByCategory(
  category: string,
  maxPages = 3
): Promise<KalshiMarket[]> {
  const all: KalshiMarket[] = [];
  let cursor: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const resp = await getMarkets({ limit: 100, status: "open", category, cursor });
    all.push(...resp.markets);
    if (!resp.cursor) break;
    cursor = resp.cursor;
  }

  return all;
}
