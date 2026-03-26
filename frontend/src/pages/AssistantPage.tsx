import { Bot, MessageSquareText, ScanSearch, WandSparkles } from "lucide-react";
import ModulePreviewPage from "../components/ui/ModulePreviewPage";

export default function AssistantPage() {
  return (
    <ModulePreviewPage
      title="Assistant"
      description="The assistant space now inherits the same malachite palette and card energy, so it feels like part of the platform instead of a detached tool."
      heroTitle="Give the farm assistant a place with real presence"
      heroDescription="Conversation, quick prompts, and agronomy follow-ups can live in a layout that already feels polished and ready for interaction."
      heroIcon={Bot}
      heroBadge="AI workspace"
      heroAction="Start conversation"
      cards={[
        {
          title: "Prompt starters",
          description: "Offer common farm questions inside lifted cards with clear icon anchors and stronger visual rhythm.",
          icon: MessageSquareText,
        },
        {
          title: "Field analysis",
          description: "Keep AI-generated checks and summaries grounded in the same readable black-and-white text system.",
          icon: ScanSearch,
          strong: true,
          badge: "Best for guidance",
        },
        {
          title: "Smart suggestions",
          description: "Surface follow-up actions and next questions in cards that feel lively without distracting from the content.",
          icon: WandSparkles,
        },
      ]}
    />
  );
}
