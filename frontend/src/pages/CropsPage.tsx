import { BarChart3, Leaf, ScanSearch, Sprout } from "lucide-react";
import ModulePreviewPage from "../components/ui/ModulePreviewPage";

export default function CropsPage() {
  return (
    <ModulePreviewPage
      title="Crops"
      description="Crop planning now sits inside the same malachite visual system, with stronger card contrast and clearer hierarchy."
      heroTitle="Plan crop cycles with a calmer, cleaner canvas"
      heroDescription="This module is still growing, but the shell is now ready for crop insights, seasonal plans, and health summaries."
      heroIcon={Sprout}
      heroBadge="Crop workspace"
      heroAction="Start planning"
      cards={[
        {
          title: "Seasonal planning",
          description: "Organize crop rotations, planting windows, and harvest timing inside interactive cards.",
          icon: Leaf,
        },
        {
          title: "Growth snapshots",
          description: "Highlight maturity stages and field performance in bold metric cards with readable contrast.",
          icon: BarChart3,
          strong: true,
          badge: "Best for overview",
        },
        {
          title: "Health signals",
          description: "Surface disease checks, nutrient notes, and action prompts without breaking the visual consistency.",
          icon: ScanSearch,
        },
      ]}
    />
  );
}
