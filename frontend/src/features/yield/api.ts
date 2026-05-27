import { api } from "../../api/client";
import type {
  RecordActualYieldPayload,
  YieldPrediction,
  YieldPredictionFilters,
  YieldPredictionPayload,
  YieldPredictionUpdatePayload,
} from "./types";

type YieldPredictionResponse = Omit<
  YieldPrediction,
  | "farm_id"
  | "plot_id"
  | "crop_id"
  | "farm_size_hectares"
  | "days_planted"
  | "predicted_yield_kg"
  | "actual_yield_kg"
  | "confidence_score"
> & {
  farm_id?: number | string | null;
  plot_id?: number | string | null;
  crop_id?: number | string | null;
  farm_size_hectares?: number | string | null;
  days_planted?: number | string | null;
  predicted_yield_kg?: number | string | null;
  actual_yield_kg?: number | string | null;
  confidence_score?: number | string | null;
};

const normalizeOptionalId = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
};

const normalizeNumber = (
  value: number | string | null | undefined,
  fallback = 0
): number => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return Number(value);
};

const normalizeOptionalNumber = (
  value: number | string | null | undefined
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
};

const normalizeYieldPrediction = (prediction: YieldPredictionResponse): YieldPrediction => ({
  ...prediction,
  farm_id: normalizeOptionalId(prediction.farm_id),
  plot_id: normalizeOptionalId(prediction.plot_id),
  crop_id: normalizeOptionalId(prediction.crop_id),
  plot: prediction.plot ?? null,
  crop: prediction.crop ?? null,
  farm_size_hectares: normalizeNumber(prediction.farm_size_hectares),
  days_planted: normalizeNumber(prediction.days_planted),
  predicted_yield_kg: normalizeNumber(prediction.predicted_yield_kg),
  actual_yield_kg: normalizeOptionalNumber(prediction.actual_yield_kg),
  confidence_score: normalizeOptionalNumber(prediction.confidence_score),
});

export const listYieldPredictions = async (
  filters: YieldPredictionFilters = {}
): Promise<YieldPrediction[]> => {
  const response = await api.get<YieldPredictionResponse[]>("/yield-predictions", {
    params: filters,
  });

  return response.data.map(normalizeYieldPrediction);
};

export const createYieldPrediction = async (
  payload: YieldPredictionPayload
): Promise<YieldPrediction> => {
  const response = await api.post<YieldPredictionResponse>("/yield-predictions", payload);
  return normalizeYieldPrediction(response.data);
};

export const updateYieldPrediction = async (
  id: number,
  payload: YieldPredictionUpdatePayload
): Promise<YieldPrediction> => {
  const response = await api.patch<YieldPredictionResponse>(`/yield-predictions/${id}`, payload);
  return normalizeYieldPrediction(response.data);
};

export const recordActualYield = async (
  id: number,
  payload: RecordActualYieldPayload
): Promise<YieldPrediction> => {
  const response = await api.post<YieldPredictionResponse>(
    `/yield-predictions/${id}/record-actual`,
    payload
  );

  return normalizeYieldPrediction(response.data);
};

export const deleteYieldPrediction = async (id: number): Promise<void> => {
  await api.delete(`/yield-predictions/${id}`);
};
