// Purpose: type definitions for the authenticated Plot module.
// Routing: used by /plots page and plot API helpers.
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

// Purpose: payload sent from the frontend. The backend derives farm_id from auth.
export type PlotPayload = {
  name: string;
  area_hectares?: number | null;
  soil_type?: string | null;
  status?: string;
  notes?: string | null;
};
