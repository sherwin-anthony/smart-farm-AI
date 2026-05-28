import {
  ArrowRight,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  ListTodo,
  Sprout,
  Thermometer,
  Wind,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { WeatherImpact, WeatherImpactSeverity } from "../types";

type WeatherImpactPanelProps = {
  impacts: WeatherImpact[];
  creatingTasks?: boolean;
  canCreateTasks?: boolean;
  taskMessage?: string;
  tasksHref?: string;
  onCreateTasks?: () => void;
};

const severityClass: Record<WeatherImpactSeverity, string> = {
  high: "tone-danger",
  medium: "tone-warning",
  low: "tone-success",
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "Forecast window";
  }

  return new Date(value).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const impactIcon = (impact: WeatherImpact): LucideIcon => {
  const text = `${impact.title} ${impact.message}`.toLowerCase();

  if (impact.source === "crop" || text.includes("harvest")) {
    return Sprout;
  }

  if (text.includes("wind")) {
    return Wind;
  }

  if (text.includes("heat")) {
    return Thermometer;
  }

  if (text.includes("rain")) {
    return CloudRain;
  }

  if (impact.severity === "low") {
    return CheckCircle2;
  }

  return AlertTriangle;
};

export default function WeatherImpactPanel({
  impacts,
  creatingTasks = false,
  canCreateTasks = false,
  taskMessage = "",
  tasksHref,
  onCreateTasks,
}: WeatherImpactPanelProps) {
  if (impacts.length === 0) {
    return null;
  }

  return (
    <section className="stack">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="card-chip">Farm Impact</span>
          <h2 className="mt-3 text-xl font-bold text-ink">Weather Decisions</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {onCreateTasks ? (
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={!canCreateTasks || creatingTasks}
              onClick={onCreateTasks}
            >
              <ListTodo size={16} strokeWidth={2.2} />
              {creatingTasks ? "Creating..." : "Create Tasks"}
            </button>
          ) : null}

          {tasksHref ? (
            <Link
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500"
              to={tasksHref}
            >
              View Tasks
              <ArrowRight size={16} strokeWidth={2.2} />
            </Link>
          ) : null}
        </div>
      </div>
      {taskMessage ? <p className="text-sm font-medium text-ink-muted">{taskMessage}</p> : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {impacts.map((impact) => {
          const ImpactIcon = impactIcon(impact);
          const tone = severityClass[impact.severity] ?? severityClass.low;

          return (
            <article key={impact.key} className="preview-card interactive-lift rounded-3xl p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <span className="card-icon card-icon-soft">
                    <ImpactIcon size={18} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">{impact.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-ink-muted">{impact.message}</p>
                  </div>
                </div>

                <span
                  className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${tone}`}
                >
                  {impact.severity}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <p className="rounded-2xl border border-surface-border bg-surface-soft p-4 text-sm font-medium text-ink">
                  {impact.action}
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted">
                  <CalendarDays size={16} strokeWidth={2.2} />
                  {formatDate(impact.forecast_date)}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
