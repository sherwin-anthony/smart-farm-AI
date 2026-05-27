import { api } from "../../api/client";
import type {
  WeatherForecast,
  WeatherImpact,
  WeatherImpactTasksPayload,
  WeatherPayload,
} from "./types";

type WeatherForecastResponse = Omit<
  WeatherForecast,
  | "farm_id"
  | "rain_mm"
  | "rain_probability"
  | "temperature_c"
  | "temperature_min_c"
  | "temperature_max_c"
  | "humidity"
  | "wind_kph"
  | "weather_code"
> & {
  farm_id: number | string;
  rain_mm?: number | string | null;
  rain_probability?: number | string | null;
  temperature_c?: number | string | null;
  temperature_min_c?: number | string | null;
  temperature_max_c?: number | string | null;
  humidity?: number | string | null;
  wind_kph?: number | string | null;
  weather_code?: number | string | null;
};

type WeatherPayloadResponse = {
  forecasts?: WeatherForecastResponse[];
  impacts?: WeatherImpact[];
};

const normalizeNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
};

const normalizeForecast = (forecast: WeatherForecastResponse): WeatherForecast => ({
  ...forecast,
  farm_id: Number(forecast.farm_id),
  rain_mm: normalizeNullableNumber(forecast.rain_mm),
  rain_probability: normalizeNullableNumber(forecast.rain_probability),
  temperature_c: normalizeNullableNumber(forecast.temperature_c),
  temperature_min_c: normalizeNullableNumber(forecast.temperature_min_c),
  temperature_max_c: normalizeNullableNumber(forecast.temperature_max_c),
  humidity: normalizeNullableNumber(forecast.humidity),
  wind_kph: normalizeNullableNumber(forecast.wind_kph),
  weather_code: normalizeNullableNumber(forecast.weather_code),
});

const normalizePayload = (
  data: WeatherPayloadResponse | WeatherForecastResponse[]
): WeatherPayload => {
  if (Array.isArray(data)) {
    return {
      forecasts: data.map(normalizeForecast),
      impacts: [],
    };
  }

  return {
    forecasts: (data.forecasts ?? []).map(normalizeForecast),
    impacts: data.impacts ?? [],
  };
};

export const listWeatherForecasts = async (): Promise<WeatherPayload> => {
  const response = await api.get<WeatherPayloadResponse | WeatherForecastResponse[]>(
    "/weather/forecast"
  );
  return normalizePayload(response.data);
};

export const syncWeatherForecasts = async (): Promise<WeatherPayload> => {
  const response = await api.post<WeatherPayloadResponse | WeatherForecastResponse[]>(
    "/weather/sync"
  );
  return normalizePayload(response.data);
};

export const createWeatherImpactTasks = async (): Promise<WeatherImpactTasksPayload> => {
  const response = await api.post<WeatherImpactTasksPayload>("/weather/tasks");
  return response.data;
};
