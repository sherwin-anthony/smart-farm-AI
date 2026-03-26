import {
  Activity,
  MapPinned,
  Ruler,
  ShieldAlert,
  Sprout,
} from "lucide-react";
import type { Plot } from "../types";

type PlotSummaryProps = {
  plots: Plot[];
};

// Purpose: quick overview metrics for the plots module.
// Routing: rendered by PlotsPage on /plots.
export default function PlotSummary({ plots }: PlotSummaryProps) {
  const totalPlots = plots.length;
  const activePlots = plots.filter((plot) => plot.status.toLowerCase() === "active").length;
  const vacantPlots = plots.filter((plot) => plot.status.toLowerCase() === "vacant").length;
  const attentionPlots = plots.filter((plot) => {
    const status = plot.status.toLowerCase();
    return status === "resting" || status === "maintenance";
  }).length;
  const totalArea = plots.reduce(
    (sum, plot) => sum + Number(plot.area_hectares ?? 0),
    0
  );

  const items = [
    {
      label: "Total plots",
      value: totalPlots,
      copy: "All mapped growing sections",
      icon: MapPinned,
    },
    {
      label: "Active plots",
      value: activePlots,
      copy: "Currently supporting active work",
      icon: Sprout,
      strong: true,
    },
    {
      label: "Vacant plots",
      value: vacantPlots,
      copy: "Ready for the next crop cycle",
      icon: Activity,
    },
    {
      label: "Needs attention",
      value: attentionPlots,
      copy: "Resting or maintenance areas",
      icon: ShieldAlert,
    },
    {
      label: "Total area",
      value: `${totalArea.toFixed(2)} ha`,
      copy: "Combined field size on record",
      icon: Ruler,
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
