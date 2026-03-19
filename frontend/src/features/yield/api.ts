import { api } from "../../api/client";
import type { YieldPrediction, YieldPredictionPayload } from "./types";

export const listYieldPredictions = async (): Promise<YieldPrediction[]> => {
  const response = await api.get<YieldPrediction[]>("/yield-predictions");
  return response.data;
};

export const createYieldPrediction = async (
  payload: YieldPredictionPayload
): Promise<YieldPrediction> => {
  const response = await api.post<YieldPrediction>("/yield-predictions", payload);
  return response.data;
};
