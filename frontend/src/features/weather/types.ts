import type { Task } from "../tasks/types";

export type WeatherForecast = {
  id: number;
  farm_id: number;
  forecast_date: string;
  summary: string | null;
  rain_mm: number | null;
  rain_probability: number | null;
  temperature_c: number | null;
  temperature_min_c: number | null;
  temperature_max_c: number | null;
  humidity: number | null;
  wind_kph: number | null;
  weather_code: number | null;
  raw_payload?: unknown;
  fetched_at: string | null;
  created_at: string;
  updated_at: string;
};

export type WeatherImpactSeverity = "low" | "medium" | "high";

export type WeatherImpact = {
  key: string;
  severity: WeatherImpactSeverity;
  title: string;
  message: string;
  action: string;
  forecast_date: string | null;
  source: "weather" | "crop" | string;
  crop_id?: number | null;
  plot_id?: number | null;
};

export type WeatherPayload = {
  forecasts: WeatherForecast[];
  impacts: WeatherImpact[];
};

export type WeatherImpactTasksPayload = {
  created_count: number;
  skipped_count: number;
  tasks: Task[];
};
