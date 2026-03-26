import { CheckCircle2, ClipboardList, TimerReset, Zap } from "lucide-react";
import ModulePreviewPage from "../components/ui/ModulePreviewPage";

export default function TasksPage() {
  return (
    <ModulePreviewPage
      title="Tasks"
      description="Task cards now match the rest of the system with expressive icons, stronger hover states, and simplified text contrast."
      heroTitle="Turn field work into a crisp daily board"
      heroDescription="The task experience is set up for routines, deadlines, and quick status reviews with the same card language used everywhere else."
      heroIcon={ClipboardList}
      heroBadge="Operations flow"
      heroAction="Create routine"
      cards={[
        {
          title: "Priority queues",
          description: "Group irrigation, fertilizing, and harvesting work into sections that feel active without becoming cluttered.",
          icon: Zap,
          strong: true,
          badge: "High focus",
        },
        {
          title: "Completion tracking",
          description: "Use black-and-white text on mint surfaces so every action remains readable at a glance.",
          icon: CheckCircle2,
        },
        {
          title: "Time windows",
          description: "Keep schedules, reminders, and follow-up work visible inside lifted cards with softer motion.",
          icon: TimerReset,
        },
      ]}
    />
  );
}
