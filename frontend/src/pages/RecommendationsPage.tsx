import { Lightbulb, ScanLine, ShieldCheck, Sparkles } from "lucide-react";
import ModulePreviewPage from "../components/ui/ModulePreviewPage";

export default function RecommendationsPage() {
  return (
    <ModulePreviewPage
      title="Recommendations"
      description="Recommendation cards now fit the rest of the system, with black text on light surfaces and white text on stronger green accents."
      heroTitle="Deliver advice in a way that feels actionable"
      heroDescription="This screen is ready for smarter agronomy suggestions, AI summaries, and next-step recommendations without visual clutter."
      heroIcon={Lightbulb}
      heroBadge="Decision support"
      heroAction="Review insights"
      cards={[
        {
          title: "Actionable insights",
          description: "Frame suggestions as bold cards with clear icons so users can scan advice quickly and trust what matters most.",
          icon: Sparkles,
          strong: true,
          badge: "Best for AI tips",
        },
        {
          title: "Risk checks",
          description: "Package pest, moisture, and nutrient suggestions into one consistent structure instead of mixed visual treatments.",
          icon: ShieldCheck,
        },
        {
          title: "Traceable reasoning",
          description: "Show supporting signals and confidence levels in supportive secondary cards that feel part of the same design system.",
          icon: ScanLine,
        },
      ]}
    />
  );
}
