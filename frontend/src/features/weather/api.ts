import { api } from "../../api/client";
import type { WeatherForecast, WeatherSyncPayload } from "./types";

export const listWeatherForecasts = async (farmId?: number): Promise<WeatherForecast[]> => {
  const response = await api.get<WeatherForecast[]>("/weather/forecast", {
    params: farmId ? { farm_id: farmId } : undefined,
  });
  return response.data;
};

export const syncWeatherForecasts = async (payload: WeatherSyncPayload) => {
  const response = await api.post("/weather/sync", payload);
  return response.data;
};
