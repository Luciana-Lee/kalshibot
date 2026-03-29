import type { KalshiMarket } from "./kalshi";
import type { CityWeather } from "./noaa";

export interface BetAnalysis {
  ticker: string;
  title: string;
  category: string;
  kalshiImpliedProb: number; // yes_ask / 100
  modelProb: number; // our estimated probability
  edge: number; // modelProb - kalshiImpliedProb
  expectedValue: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  betDirection: "YES" | "NO";
  reasoning: string;
  dataSource: string;
  closeTime: string;
  volume: number;
}

function calcEV(modelProb: number, price: number): number {
  // price in cents (0-100), modelProb in 0-1
  // EV of betting YES at price P: modelProb*(100-P)/100 - (1-modelProb)*P/100
  return (modelProb * (100 - price) - (1 - modelProb) * price) / 100;
}

function calcEVNo(modelProb: number, noPrice: number): number {
  // EV of betting NO at price P_no: (1-modelProb)*(100-P_no)/100 - modelProb*P_no/100
  return ((1 - modelProb) * (100 - noPrice) - modelProb * noPrice) / 100;
}

function getConfidence(edgeAbs: number): "HIGH" | "MEDIUM" | "LOW" {
  if (edgeAbs > 0.2) return "HIGH";
  if (edgeAbs > 0.1) return "MEDIUM";
  return "LOW";
}

const CITY_ALIASES: Record<string, string> = {
  "new york": "NYC",
  "new york city": "NYC",
  nyc: "NYC",
  "los angeles": "LA",
  "la": "LA",
  chicago: "Chicago",
  miami: "Miami",
  houston: "Houston",
  phoenix: "Phoenix",
  dallas: "Dallas",
  atlanta: "Atlanta",
};

function extractCity(title: string): string | null {
  const lower = title.toLowerCase();
  for (const [alias, canonical] of Object.entries(CITY_ALIASES)) {
    if (lower.includes(alias)) return canonical;
  }
  return null;
}

function isRainMarket(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    lower.includes("rain") ||
    lower.includes("precipitation") ||
    lower.includes("snow") ||
    lower.includes("storm") ||
    lower.includes("wet")
  );
}

function isTempMarket(title: string): boolean {
  const lower = title.toLowerCase();
  return lower.includes("temperature") || lower.includes("degrees") || lower.includes("high of");
}

export function analyzeWeatherBet(
  market: KalshiMarket,
  weatherData: CityWeather[]
): BetAnalysis | null {
  const yesAsk = market.yes_ask;
  const noAsk = market.no_ask;

  if (!yesAsk && !noAsk) return null;

  const city = extractCity(market.title);
  const cityWeather = city ? weatherData.find((w) => w.city === city) : null;

  const kalshiImpliedProb = (yesAsk || 50) / 100;

  let modelProb: number;
  let reasoning: string;
  let dataSource: string;

  if (cityWeather && isRainMarket(market.title)) {
    modelProb = cityWeather.precipProbability / 100;
    reasoning = `NOAA forecast for ${cityWeather.city}: ${cityWeather.precipProbability}% precipitation probability. Conditions: ${cityWeather.conditions}. Kalshi prices YES at ${yesAsk}¢ implying ${(kalshiImpliedProb * 100).toFixed(0)}% probability.`;
    dataSource = `NOAA Weather API (${cityWeather.city})`;
  } else if (cityWeather && isTempMarket(market.title)) {
    // Use temperature data for temperature-based markets
    const titleLower = market.title.toLowerCase();
    // Try to extract target temperature from title
    const tempMatch = market.title.match(/(\d+)\s*°?[Ff]/);
    if (tempMatch) {
      const targetTemp = parseInt(tempMatch[1]);
      const actualHigh = cityWeather.tempHigh;
      // If market asks "will high be above X"
      if (titleLower.includes("above") || titleLower.includes("over") || titleLower.includes("at least")) {
        modelProb = actualHigh >= targetTemp ? 0.75 : 0.25;
        reasoning = `NOAA forecasts high of ${actualHigh}°F for ${cityWeather.city}. Market asks about ${targetTemp}°F threshold. Forecast ${actualHigh >= targetTemp ? "supports" : "does not support"} YES.`;
      } else {
        modelProb = actualHigh <= targetTemp ? 0.75 : 0.25;
        reasoning = `NOAA forecasts high of ${actualHigh}°F for ${cityWeather.city}. Market asks about ${targetTemp}°F threshold.`;
      }
    } else {
      modelProb = 0.5;
      reasoning = `NOAA forecasts high of ${cityWeather.tempHigh}°F for ${cityWeather.city}. Conditions: ${cityWeather.conditions}.`;
    }
    dataSource = `NOAA Weather API (${cityWeather.city})`;
  } else {
    // Generic weather market without specific city data — use heuristics
    const precipKeywords = ["rain", "snow", "storm", "precipitation"];
    const hasPrecipKeyword = precipKeywords.some((k) => market.title.toLowerCase().includes(k));
    if (!hasPrecipKeyword) return null;

    // Without city data, apply small mean-reversion: assume 40% base precip chance
    modelProb = 0.4;
    reasoning = `Heuristic estimate: Weather precipitation markets historically resolve YES ~40% of the time. No city-specific NOAA data available.`;
    dataSource = "Statistical heuristic";
  }

  const edge = modelProb - kalshiImpliedProb;
  const edgeAbs = Math.abs(edge);

  if (edgeAbs < 0.05) return null;

  let betDirection: "YES" | "NO";
  let ev: number;

  if (edge > 0) {
    betDirection = "YES";
    ev = calcEV(modelProb, yesAsk || 50);
  } else {
    betDirection = "NO";
    ev = calcEVNo(modelProb, noAsk || 50);
  }

  return {
    ticker: market.ticker,
    title: market.title,
    category: market.category || "weather",
    kalshiImpliedProb,
    modelProb,
    edge: parseFloat(edge.toFixed(4)),
    expectedValue: parseFloat(ev.toFixed(4)),
    confidence: getConfidence(edgeAbs),
    betDirection,
    reasoning,
    dataSource,
    closeTime: market.close_time,
    volume: market.volume,
  };
}

// Heuristic economic indicators (updated as of early 2026)
const ECONOMIC_HEURISTICS: {
  keywords: string[];
  modelProb: number;
  reasoning: string;
  dataSource: string;
}[] = [
  {
    keywords: ["fed", "rate cut", "rate hike", "federal funds"],
    modelProb: 0.35,
    reasoning:
      "Fed policy heuristic: In early 2026, market consensus leans toward rates staying flat or modest cuts. Fed has signaled data-dependency. Rate hike probability is low given current economic conditions.",
    dataSource: "FRED / Fed policy consensus heuristic",
  },
  {
    keywords: ["cpi", "inflation", "consumer price"],
    modelProb: 0.55,
    reasoning:
      "CPI heuristic: Inflation has been running above Fed 2% target. Markets may be underpricing sticky inflation scenarios. Core CPI trend supports elevated readings.",
    dataSource: "FRED CPI trend heuristic",
  },
  {
    keywords: ["unemployment", "jobs", "nonfarm payroll", "labor"],
    modelProb: 0.45,
    reasoning:
      "Labor market heuristic: Job market has shown resilience but hiring pace is slowing. Unemployment beats are roughly coin-flip with modest downside risk.",
    dataSource: "FRED unemployment trend heuristic",
  },
  {
    keywords: ["gdp", "recession", "growth"],
    modelProb: 0.4,
    reasoning:
      "GDP/recession heuristic: While leading indicators suggest softening, technical recession probability remains moderate. Markets may be underpricing resilience.",
    dataSource: "FRED GDP trend heuristic",
  },
  {
    keywords: ["housing", "home price", "real estate"],
    modelProb: 0.5,
    reasoning:
      "Housing heuristic: Mixed signals — affordability constraints weigh on prices but supply remains tight. Roughly balanced probability.",
    dataSource: "FRED housing data heuristic",
  },
];

export function analyzeEconomicBet(market: KalshiMarket): BetAnalysis | null {
  const yesAsk = market.yes_ask;
  const noAsk = market.no_ask;

  if (!yesAsk && !noAsk) return null;

  const kalshiImpliedProb = (yesAsk || 50) / 100;
  const titleLower = market.title.toLowerCase();

  let matched = ECONOMIC_HEURISTICS.find((h) =>
    h.keywords.some((kw) => titleLower.includes(kw))
  );

  if (!matched) {
    // Generic economic market
    matched = {
      keywords: [],
      modelProb: 0.5,
      reasoning:
        "General economic market — insufficient specific data. Using neutral 50% prior. Consider this LOW confidence.",
      dataSource: "Statistical prior",
    };
  }

  const edge = matched.modelProb - kalshiImpliedProb;
  const edgeAbs = Math.abs(edge);

  if (edgeAbs < 0.05) return null;

  let betDirection: "YES" | "NO";
  let ev: number;

  if (edge > 0) {
    betDirection = "YES";
    ev = calcEV(matched.modelProb, yesAsk || 50);
  } else {
    betDirection = "NO";
    ev = calcEVNo(matched.modelProb, noAsk || 50);
  }

  return {
    ticker: market.ticker,
    title: market.title,
    category: market.category || "economics",
    kalshiImpliedProb,
    modelProb: matched.modelProb,
    edge: parseFloat(edge.toFixed(4)),
    expectedValue: parseFloat(ev.toFixed(4)),
    confidence: getConfidence(edgeAbs),
    betDirection,
    reasoning: matched.reasoning,
    dataSource: matched.dataSource,
    closeTime: market.close_time,
    volume: market.volume,
  };
}

export function rankBets(analyses: BetAnalysis[]): BetAnalysis[] {
  return [...analyses].sort((a, b) => b.expectedValue - a.expectedValue);
}

export function filterPositiveEV(analyses: BetAnalysis[]): BetAnalysis[] {
  return analyses.filter((a) => a.expectedValue > 0);
}
