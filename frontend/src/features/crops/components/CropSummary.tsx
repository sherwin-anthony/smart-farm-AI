import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Leaf,
  Sprout,
} from "lucide-react";
import type { Crop } from "../types";

type CropSummaryProps = {
  crops: Crop[];
};

const isNearHarvest = (value: string | null) => {
  if (!value) {
    return false;
  }

  const today = new Date();
  const harvestDate = new Date(value);
  const diffDays = Math.ceil(
    (harvestDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return diffDays >= 0 && diffDays <= 14;
};

// Purpose: quick overview metrics for the crop module workspace.
// Routing: rendered by CropsPage on /crops.
export default function CropSummary({ crops }: CropSummaryProps) {
  const totalCrops = crops.length;
  const growingCrops = crops.filter((crop) => crop.status === "growing").length;
  const readyCrops = crops.filter((crop) => crop.status === "ready").length;
  const harvestedCrops = crops.filter((crop) => crop.status === "harvested").length;
  const nearHarvestCrops = crops.filter((crop) =>
    isNearHarvest(crop.expected_harvest_on)
  ).length;

  const items = [
    {
      label: "Total crops",
      value: totalCrops,
      copy: "All crop records in this farm",
      icon: Sprout,
    },
    {
      label: "Growing",
      value: growingCrops,
      copy: "Actively developing crops",
      icon: Leaf,
      strong: true,
    },
    {
      label: "Ready",
      value: readyCrops,
      copy: "Marked ready for harvest",
      icon: Activity,
    },
    {
      label: "Harvested",
      value: harvestedCrops,
      copy: "Completed crop cycles",
      icon: CheckCircle2,
    },
    {
      label: "Near harvest",
      value: nearHarvestCrops,
      copy: "Expected within 14 days",
      icon: CalendarClock,
    },
  ];

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <article
            key={item.label}
            className={item.strong ? "summary-card summary-card-strong" : "summary-card"}
          >
            <span className={item.strong ? "card-icon" : "card-icon card-icon-soft"}>
              <Icon size={18} strokeWidth={2.2} />
            </span>
            <p className="card-title">{item.label}</p>
            <p className="summary-card-value">{item.value}</p>
            <p className="card-copy">{item.copy}</p>
          </article>
        );
      })}
    </section>
  );
}
