// Purpose: lock the shared Crop module data contract in one active file.
// Routing: used by /crops page state, crop API helpers, and crop UI components.

import type { Plot } from "../plots/types";

// Locked lifecycle values keep the crop module, dashboard, and future insights consistent.
export type CropStatus =
  | "planned"
  | "planted"
  | "growing"
  | "ready"
  | "harvested"
  | "failed";

// Locked stage values keep manual updates and future automation on the same vocabulary.
export type CropGrowthStage =
  | "seed"
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "maturing"
  | "harvest";

// Purpose: expose the linked plot record so crop cards can show where each planting lives.
export type Crop = {
  id: number;
  plot_id: number;
  plot: Plot | null;
  name: string;
  variety: string | null;
  type: string | null;
  status: CropStatus;
  growth_stage: CropGrowthStage;
  planted_on: string | null;
  expected_harvest_on: string | null;
  actual_harvest_on: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Purpose: keep the create/update payload explicit instead of inheriting every response field.
export type CropPayload = {
  plot_id: number;
  name: string;
  variety?: string | null;
  type?: string | null;
  status?: CropStatus;
  growth_stage?: CropGrowthStage;
  planted_on?: string | null;
  expected_harvest_on?: string | null;
  actual_harvest_on?: string | null;
  notes?: string | null;
};
