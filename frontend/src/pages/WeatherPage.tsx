import { CloudRain, CloudSun, Gauge, Wind } from "lucide-react";
import ModulePreviewPage from "../components/ui/ModulePreviewPage";

export default function WeatherPage() {
  return (
    <ModulePreviewPage
      title="Weather"
      description="Forecast cards inherit the same mint surfaces, accent icons, and hover polish so they feel native to the rest of SmartFarm."
      heroTitle="Read conditions without fighting the interface"
      heroDescription="Upcoming weather summaries, risk windows, and sync tools can now plug into a consistent card layout built for quick scanning."
      heroIcon={CloudSun}
      heroBadge="Forecast center"
      heroAction="Sync forecast"
      cards={[
        {
          title: "Rain readiness",
          description: "Spot watering windows, storm warnings, and field delays inside lightweight cards with high readability.",
          icon: CloudRain,
        },
        {
          title: "Wind and exposure",
          description: "Track spray conditions and airflow risk using a calmer malachite accent instead of scattered status colors.",
          icon: Wind,
          strong: true,
          badge: "Visual focus",
        },
        {
          title: "Field metrics",
          description: "Present humidity, pressure, and temperature in summary blocks that share the same hover rhythm as the rest of the app.",
          icon: Gauge,
        },
      ]}
    />
  );
}
