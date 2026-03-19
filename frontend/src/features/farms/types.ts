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

export type FarmPayload = Omit<Farm, "id" | "created_at" | "updated_at">;
