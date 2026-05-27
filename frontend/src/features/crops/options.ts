// Purpose: shared select options for the Crop module lifecycle fields.
// Routing: used by crop create/edit components on /crops.

import type { CropGrowthStage, CropStatus } from "./types";

type CropOption<T extends string> = {
  value: T;
  label: string;
};

// Locked status options keep user input aligned with the agreed crop workflow.
export const CROP_STATUS_OPTIONS: CropOption<CropStatus>[] = [
  { value: "planned", label: "Planned" },
  { value: "planted", label: "Planted" },
  { value: "growing", label: "Growing" },
  { value: "ready", label: "Ready" },
  { value: "harvested", label: "Harvested" },
  { value: "failed", label: "Failed" },
];

// Locked growth-stage options keep crop progress updates readable and predictable.
export const CROP_GROWTH_STAGE_OPTIONS: CropOption<CropGrowthStage>[] = [
  { value: "seed", label: "Seed" },
  { value: "seedling", label: "Seedling" },
  { value: "vegetative", label: "Vegetative" },
  { value: "flowering", label: "Flowering" },
  { value: "fruiting", label: "Fruiting" },
  { value: "maturing", label: "Maturing" },
  { value: "harvest", label: "Harvest" },
];
