// Purpose: frontend TypeScript types for the Farms module.
// Routing: used by FarmsPage, FarmForm, FarmList, and farms/api.ts.

export type Farm = {
  id: number;
  name: string;
  owner_name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  size_hectares: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};



export type FarmPayload = {
  name: string;
  owner_name?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  size_hectares?: number | null;
  notes?: string | null;
};
