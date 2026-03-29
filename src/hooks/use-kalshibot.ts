import { useQuery } from "@tanstack/react-query";
import { getAllMarketsByCategory } from "@/lib/kalshi";
import { getAllCityWeather } from "@/lib/noaa";
import { analyzeWeatherBet, analyzeEconomicBet, rankBets, filterPositiveEV } from "@/lib/model";
import type { BetAnalysis } from "@/lib/model";
import type { KalshiMarket } from "@/lib/kalshi";
import type { CityWeather } from "@/lib/noaa";

export interface KalshibotData {
  allBets: BetAnalysis[];
  positiveEVBets: BetAnalysis[];
  totalMarketsAnalyzed: number;
  avgEdge: number;
  bestBet: BetAnalysis | null;
  weatherData: CityWeather[];
  lastUpdated: Date;
}

async function fetchKalshibotData(): Promise<KalshibotData> {
  // Fetch markets and weather data in parallel
  const [weatherMarkets, economicsMarkets, cityWeather] = await Promise.allSettled([
    getAllMarketsByCategory("weather"),
    getAllMarketsByCategory("economic_indicators"),
    getAllCityWeather(),
  ]);

  const markets: KalshiMarket[] = [
    ...(weatherMarkets.status === "fulfilled" ? weatherMarkets.value : []),
    ...(economicsMarkets.status === "fulfilled" ? economicsMarkets.value : []),
  ];

  const weather: CityWeather[] =
    cityWeather.status === "fulfilled" ? cityWeather.value : [];

  // Run analysis
  const analyses: BetAnalysis[] = [];

  for (const market of markets) {
    if (market.status !== "open") continue;
    if (!market.yes_ask && !market.no_ask) continue;

    const cat = (market.category || "").toLowerCase();
    const isWeather =
      cat.includes("weather") ||
      cat.includes("climate") ||
      ["rain", "snow", "temp", "storm", "precip"].some((kw) =>
        market.title.toLowerCase().includes(kw)
      );

    const isEcon =
      cat.includes("econom") ||
      cat.includes("finance") ||
      cat.includes("indicator") ||
      ["fed", "cpi", "gdp", "inflation", "unemployment", "payroll", "recession"].some(
        (kw) => market.title.toLowerCase().includes(kw)
      );

    let analysis: BetAnalysis | null = null;

    if (isWeather) {
      analysis = analyzeWeatherBet(market, weather);
    } else if (isEcon) {
      analysis = analyzeEconomicBet(market);
    }

    if (analysis) {
      analyses.push(analysis);
    }
  }

  const ranked = rankBets(analyses);
  const positive = filterPositiveEV(ranked);

  const avgEdge =
    positive.length > 0
      ? positive.reduce((sum, b) => sum + Math.abs(b.edge), 0) / positive.length
      : 0;

  return {
    allBets: ranked,
    positiveEVBets: positive,
    totalMarketsAnalyzed: markets.length,
    avgEdge,
    bestBet: positive[0] ?? null,
    weatherData: weather,
    lastUpdated: new Date(),
  };
}

export function useKalshibotData() {
  return useQuery<KalshibotData, Error>({
    queryKey: ["kalshibot"],
    queryFn: fetchKalshibotData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  });
}
