import type { Crop } from "../crops/types";
import type { Plot } from "../plots/types";

export type YieldPredictionStatus = "predicted" | "updated" | "harvested" | "cancelled";

// Purpose: saved yield records connect predictions, actual harvests, crops, and plots.
export type YieldPrediction = {
  id: number;
  farm_id: number | null;
  plot_id: number | null;
  crop_id: number | null;
  plot?: Plot | null;
  crop?: Crop | null;
  farm_size_hectares: number;
  days_planted: number;
  predicted_yield_kg: number;
  actual_yield_kg: number | null;
  confidence_score: number | null;
  model_name: string | null;
  prediction_status: YieldPredictionStatus | string;
  predicted_on: string | null;
  harvested_on: string | null;
  input_payload?: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type YieldPredictionFilters = {
  crop_id?: number;
  status?: string;
};

// Purpose: frontend payload for backend farm-scoped yield prediction creation and updates.
export type YieldPredictionPayload = {
  crop_id: number;
  plot_id?: number | null;
  crop_type?: string | null;
  farm_size_hectares?: number | null;
  days_planted?: number | null;
  predicted_yield_kg?: number | null;
  confidence_score?: number | null;
  prediction_status?: YieldPredictionStatus | string;
  predicted_on?: string | null;
  notes?: string | null;
};

export type YieldPredictionUpdatePayload = Partial<
  Pick<
    YieldPrediction,
    | "predicted_yield_kg"
    | "actual_yield_kg"
    | "confidence_score"
    | "prediction_status"
    | "predicted_on"
    | "harvested_on"
    | "notes"
  >
>;

export type RecordActualYieldPayload = {
  actual_yield_kg: number;
  harvested_on?: string | null;
  notes?: string | null;
};
