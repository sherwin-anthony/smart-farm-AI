// One crop record returned by Laravel.
export type Crop = {
  id: number;
  name: string;
  type: string | null;
  status: string;
  planted_on: string | null;
  harvest_on: string | null;
  created_at: string;
  updated_at: string;
};

// Data sent from React when creating a crop.
export type CreateCropPayload = {
  name: string;
  type?: string;
  status?: string;
  planted_on?: string | null;
  harvest_on?: string | null;
};
