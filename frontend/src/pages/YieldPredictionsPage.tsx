import { BarChart3, Calculator, LineChart, Radar } from "lucide-react";
import ModulePreviewPage from "../components/ui/ModulePreviewPage";

export default function YieldPredictionsPage() {
  return (
    <ModulePreviewPage
      title="Yield Predictions"
      description="Prediction cards and data summaries now follow the same green-forward palette, readable text rules, and hover behavior."
      heroTitle="Make forecast data feel clear instead of cold"
      heroDescription="Projected yield, confidence bands, and scenario comparisons can now live inside cards that feel modern and easy to trust."
      heroIcon={BarChart3}
      heroBadge="Forecast lab"
      heroAction="Run prediction"
      cards={[
        {
          title: "Scenario modeling",
          description: "Compare irrigation, weather, and crop choices in cards that stay easy to read across dense information.",
          icon: Calculator,
        },
        {
          title: "Trend visibility",
          description: "Lift key numbers into stronger highlight cards so the most important forecast signals stand out immediately.",
          icon: LineChart,
          strong: true,
          badge: "Best for metrics",
        },
        {
          title: "Confidence layers",
          description: "Explain yield ranges and uncertainty with clean supporting visuals that match the rest of the workspace.",
          icon: Radar,
        },
      ]}
    />
  );
}
