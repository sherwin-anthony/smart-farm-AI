export type Plot = {
  id: number;
  farm_id: number;
  name: string;
  area_hectares: number | null;
  soil_type: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlotPayload = Omit<Plot, "id" | "created_at" | "updated_at">;
