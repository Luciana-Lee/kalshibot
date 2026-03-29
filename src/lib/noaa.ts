const NOAA_BASE = "/noaa-api";

export interface NOAAPointData {
  gridId: string;
  gridX: number;
  gridY: number;
  forecastUrl: string;
}

export interface NOAAForecastPeriod {
  name: string;
  temperature: number;
  temperatureUnit: string;
  probabilityOfPrecipitation: { value: number | null };
  shortForecast: string;
  startTime: string;
  isDaytime: boolean;
}

export interface CityWeather {
  city: string;
  precipProbability: number;
  tempHigh: number;
  conditions: string;
  forecastDate: string;
}

const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  NYC: { lat: 40.7128, lon: -74.006 },
  LA: { lat: 34.0522, lon: -118.2437 },
  Chicago: { lat: 41.8781, lon: -87.6298 },
  Miami: { lat: 25.7617, lon: -80.1918 },
  Houston: { lat: 29.7604, lon: -95.3698 },
  Phoenix: { lat: 33.4484, lon: -112.074 },
  Dallas: { lat: 32.7767, lon: -96.797 },
  Atlanta: { lat: 33.749, lon: -84.388 },
};

export async function getPointData(lat: number, lon: number): Promise<NOAAPointData> {
  const url = `${NOAA_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Kalshibot/1.0 (kalshibot@example.com)", Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`NOAA points error: ${res.status}`);
  }

  const data = await res.json();
  const props = data.properties;
  return {
    gridId: props.gridId,
    gridX: props.gridX,
    gridY: props.gridY,
    forecastUrl: props.forecast,
  };
}

export async function getForecast(forecastUrl: string): Promise<NOAAForecastPeriod[]> {
  // forecastUrl is a full URL from NOAA — strip the NOAA domain so the proxy works
  const path = forecastUrl.replace("https://api.weather.gov", "");
  const url = `${NOAA_BASE}${path}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Kalshibot/1.0 (kalshibot@example.com)", Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`NOAA forecast error: ${res.status}`);
  }

  const data = await res.json();
  return data.properties?.periods ?? [];
}

export async function getPrecipitationProbability(city: string): Promise<CityWeather> {
  const coords = CITY_COORDS[city];
  if (!coords) {
    throw new Error(`Unknown city: ${city}`);
  }

  const pointData = await getPointData(coords.lat, coords.lon);
  const periods = await getForecast(pointData.forecastUrl);

  // Find the next daytime period
  const daytime = periods.find((p) => p.isDaytime) ?? periods[0];

  if (!daytime) {
    throw new Error(`No forecast data for ${city}`);
  }

  const precipProb = daytime.probabilityOfPrecipitation?.value ?? 0;
  const temp =
    daytime.temperatureUnit === "F"
      ? daytime.temperature
      : Math.round(daytime.temperature * 9 / 5 + 32);

  return {
    city,
    precipProbability: precipProb,
    tempHigh: temp,
    conditions: daytime.shortForecast,
    forecastDate: daytime.startTime,
  };
}

export async function getAllCityWeather(): Promise<CityWeather[]> {
  const cities = Object.keys(CITY_COORDS);
  const results = await Promise.allSettled(cities.map((city) => getPrecipitationProbability(city)));

  return results
    .filter((r): r is PromiseFulfilledResult<CityWeather> => r.status === "fulfilled")
    .map((r) => r.value);
}
