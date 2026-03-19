export type YieldPrediction = {
  id: number;
  farm_id: number | null;
  crop_id: number | null;
  farm_size_hectares: number;
  days_planted: number;
  predicted_yield_kg: number;
  confidence_score: number | null;
  model_name: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type YieldPredictionPayload = {
  farm_id?: number | null;
  crop_id?: number | null;
  crop_type: string;
  farm_size_hectares: number;
  days_planted: number;
};
