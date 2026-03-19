export type Crop = {
  id: number;
  plot_id: number | null;
  name: string;
  variety: string | null;
  type: string | null;
  status: string;
  growth_stage: string;
  planted_on: string | null;
  expected_harvest_on: string | null;
  actual_harvest_on: string | null;
  created_at: string;
  updated_at: string;
};

export type CropPayload = Omit<Crop, "id" | "created_at" | "updated_at">;
