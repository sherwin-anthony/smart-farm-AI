export type WeatherForecast = {
  id: number;
  farm_id: number;
  forecast_date: string;
  summary: string | null;
  rain_mm: number | null;
  temperature_c: number | null;
  humidity: number | null;
  wind_kph: number | null;
  created_at: string;
  updated_at: string;
};

export type WeatherSyncPayload = {
  farm_id: number;
};
