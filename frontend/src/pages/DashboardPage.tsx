import axios from "axios";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CalendarClock,
  CheckCircle2,
  CloudSun,
  ClipboardList,
  ClipboardPlus,
  Leaf,
  MapPin,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Sprout,
  Wheat,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { getDashboardOverview } from "../features/dashboard/api";
import type {
  DashboardCropItem,
  DashboardOverview,
  DashboardRecommendation,
  DashboardTaskItem,
  DashboardTone,
} from "../features/dashboard/types";

const getErrorMessage = (value: unknown, fallback: string) => {
  // Surface Laravel messages when auth or farm setup blocks the dashboard.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

const primaryActionClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500";

const secondaryActionClass =
  "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50";

const toneClass = (tone: DashboardTone) => {
  if (tone === "danger" || tone === "urgent" || tone === "high") {
    return "tone-danger";
  }

  if (tone === "warning" || tone === "medium") {
    return "tone-warning";
  }

  if (tone === "success" || tone === "low") {
    return "tone-success";
  }

  if (tone === "info") {
    return "tone-info";
  }

  return "tone-muted";
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};

const formatKg = (value: number | null | undefined) =>
  typeof value === "number" ? `${value.toLocaleString()} kg` : "Not recorded";

const relatedLabel = (task: DashboardTaskItem) =>
  task.crop_name ?? task.plot_name ?? "Farm-wide";

function TaskRows({ items, empty }: { items: DashboardTaskItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{empty}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((task) => (
        <div
          key={task.id}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3 last:border-b-0 last:pb-0"
        >
          <div>
            <p className="text-sm font-semibold text-ink">{task.title}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {relatedLabel(task)} - {formatDate(task.due_on)}
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${toneClass(task.priority)}`}>
            {task.priority}
          </span>
        </div>
      ))}
    </div>
  );
}

function CropRows({ items, empty }: { items: DashboardCropItem[]; empty: string }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">{empty}</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((crop) => (
        <Link
          key={crop.id}
          className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-border pb-3 transition hover:text-primary-700 last:border-b-0 last:pb-0"
          to={crop.href}
        >
          <div>
            <p className="text-sm font-semibold text-ink">{crop.name}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {crop.plot_name ?? "No plot"} - {crop.growth_stage.replaceAll("_", " ")}
            </p>
          </div>
          <span className="text-xs font-semibold text-primary-700">
            {formatDate(crop.expected_harvest_on)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function RecommendationRows({ items }: { items: DashboardRecommendation[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-ink-muted">No recommendations are active.</p>;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.key} className="border-b border-surface-border pb-3 last:border-b-0 last:pb-0">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm leading-5 text-ink-muted">{item.message}</p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${toneClass(item.priority)}`}>
              {item.priority}
            </span>
          </div>
          {item.action_href && item.action_label ? (
            <Link className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary-700" to={item.action_href}>
              {item.action_label}
              <ArrowRight size={14} strokeWidth={2.2} />
            </Link>
          ) : null}
        </div>
      ))}
    </div>
  );
}

// Purpose: action-first farm command center connected to crop, task, weather, recommendations, and yield data.
export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError("");
        setOverview(await getDashboardOverview());
      } catch (loadError) {
        console.error(loadError);
        setError(getErrorMessage(loadError, "Could not load dashboard overview."));
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const stats = useMemo(
    () =>
      overview
        ? [
            {
              label: "Active crops",
              value: overview.active_crops.toString(),
              note: `${overview.crop_summary.near_harvest} near harvest.`,
              icon: Leaf,
              strong: true,
            },
            {
              label: "Due today",
              value: overview.due_today_tasks.toString(),
              note: "Tasks scheduled for today.",
              icon: CalendarClock,
            },
            {
              label: "Overdue",
              value: overview.overdue_tasks.toString(),
              note: "Open tasks past due date.",
              icon: AlertTriangle,
            },
            {
              label: "Weather risks",
              value: overview.weather.impact_count.toString(),
              note: overview.weather.headline,
              icon: CloudSun,
            },
            {
              label: "Yield records",
              value: overview.yield.record_count.toString(),
              note: overview.yield.performance_label,
              icon: BarChart3,
            },
          ]
        : [],
    [overview]
  );

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        description="Live farm command center for today's work, weather pressure, crop progress, and latest yield signals."
      />

      {loading ? <Loader /> : null}
      {error ? <p className="text-danger">{error}</p> : null}

      {!loading && !error && overview ? (
        <>
          <section className="module-hero">
            <div className="module-hero-copy">
              <span className="card-chip">Farm command center</span>
              <span className="card-icon">
                <Bot size={24} strokeWidth={2.2} />
              </span>
              <div>
                <h2>{overview.farm.name}</h2>
                <p>
                  {overview.farm.location ? `${overview.farm.location} - ` : ""}
                  {overview.weather.current_summary
                    ? `${overview.weather.current_summary}${overview.weather.current_temperature_c !== null ? `, ${overview.weather.current_temperature_c} C` : ""}`
                    : "Weather is waiting for sync."}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Link className={primaryActionClass} to="/tasks">
              <ClipboardPlus size={16} strokeWidth={2.2} />
              Create Task
            </Link>
            <Link className={secondaryActionClass} to="/weather">
              <RefreshCw size={16} strokeWidth={2.2} />
              Sync Weather
            </Link>
            <Link className={secondaryActionClass} to="/assistant">
              <MessageSquareText size={16} strokeWidth={2.2} />
              Ask Assistant
            </Link>
            <Link className={secondaryActionClass} to="/crops">
              <Sprout size={16} strokeWidth={2.2} />
              Add Crop
            </Link>
          </section>

          <section className="feature-card feature-card-strong">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="card-icon">
                  <Sparkles size={20} strokeWidth={2.2} />
                </span>
                <div>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${toneClass(overview.priority.tone)}`}>
                    {overview.priority.source}
                  </span>
                  <h3 className="mt-3 text-2xl font-bold">{overview.priority.title}</h3>
                  <p className="mt-2 max-w-3xl text-sm leading-6 opacity-90">{overview.priority.message}</p>
                </div>
              </div>

              {overview.priority.action_href && overview.priority.action_label ? (
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
                  to={overview.priority.action_href}
                >
                  {overview.priority.action_label}
                  <ArrowRight size={16} strokeWidth={2.2} />
                </Link>
              ) : null}
            </div>
          </section>

          <section className="grid-cards">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                note={stat.note}
                icon={stat.icon}
                strong={stat.strong}
              />
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <article className="panel-card">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="inline-icon-row">
                  <span className="card-icon card-icon-soft">
                    <ClipboardList size={18} strokeWidth={2.2} />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-ink">Today's Work</h3>
                    <p className="card-copy">
                      {overview.task_summary.overdue} overdue - {overview.task_summary.due_today} due today
                    </p>
                  </div>
                </div>
                <Link className={secondaryActionClass} to="/tasks?due=today">
                  Open Tasks
                  <ArrowRight size={15} strokeWidth={2.2} />
                </Link>
              </div>

              {overview.task_summary.overdue_items.length > 0 ? (
                <div className="mb-5">
                  <h4 className="mb-3 text-sm font-bold text-danger">Overdue</h4>
                  <TaskRows items={overview.task_summary.overdue_items} empty="No overdue tasks." />
                </div>
              ) : null}

              <div>
                <h4 className="mb-3 text-sm font-bold text-ink">Due Today</h4>
                <TaskRows
                  items={overview.task_summary.due_today_items}
                  empty="No tasks are due today."
                />
              </div>
            </article>

            <article className="panel-card">
              <div className="mb-4 inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <CloudSun size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Weather Impact</h3>
                  <p className="card-copy">{overview.weather.headline}</p>
                </div>
              </div>
              <p className="text-sm leading-6 text-ink-muted">{overview.weather.action}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ${toneClass(overview.weather.highest_severity ?? "muted")}`}>
                  {overview.weather.highest_severity ?? "no risk"}
                </span>
                <span className="card-chip mt-0">
                  {overview.weather.last_updated
                    ? `Updated ${formatDate(overview.weather.last_updated)}`
                    : "Not synced"}
                </span>
              </div>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700" to="/weather">
                Open Weather
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </article>
          </section>

          <section className="grid gap-4 xl:grid-cols-3">
            <article className="panel-card">
              <div className="mb-4 inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <Wheat size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Crop Status</h3>
                  <p className="card-copy">
                    {overview.crop_summary.ready} ready - {overview.crop_summary.near_harvest} near harvest
                  </p>
                </div>
              </div>
              <CropRows
                items={
                  overview.crop_summary.ready_items.length > 0
                    ? overview.crop_summary.ready_items
                    : overview.crop_summary.near_harvest_items
                }
                empty="No crops are near harvest."
              />
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700" to="/crops">
                Open Crops
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </article>

            <article className="panel-card">
              <div className="mb-4 inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <CheckCircle2 size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">AI Recommendations</h3>
                  <p className="card-copy">Top guidance from farm rules.</p>
                </div>
              </div>
              <RecommendationRows items={overview.recommendations} />
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700" to="/recommendations">
                View All
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </article>

            <article className="panel-card">
              <div className="mb-4 inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <BarChart3 size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Yield Snapshot</h3>
                  <p className="card-copy">{overview.yield.performance_label}</p>
                </div>
              </div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-3">
                  <span className="text-sm text-ink-muted">Predicted total</span>
                  <strong className="text-sm text-ink">{formatKg(overview.yield.predicted_total_kg)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-surface-border pb-3">
                  <span className="text-sm text-ink-muted">Actual total</span>
                  <strong className="text-sm text-ink">{formatKg(overview.yield.actual_total_kg)}</strong>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {overview.yield.latest?.crop_name ?? "No latest yield record"}
                  </p>
                  <p className="mt-1 text-sm text-ink-muted">
                    {overview.yield.latest
                      ? `${overview.yield.latest.prediction_status} - ${formatKg(overview.yield.latest.predicted_yield_kg)} predicted`
                      : "Create a yield prediction to start performance tracking."}
                  </p>
                </div>
              </div>
              <Link className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary-700" to="/yield-predictions">
                Open Yield
                <ArrowRight size={14} strokeWidth={2.2} />
              </Link>
            </article>
          </section>

          <section className="panel-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="inline-icon-row">
                <span className="card-icon card-icon-soft">
                  <MapPin size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Farm Setup</h3>
                  <p className="card-copy">
                    {overview.farm.has_coordinates
                      ? "Farm location is pinned for weather and assistant context."
                      : "Farm location is missing. Weather accuracy will be limited."}
                  </p>
                </div>
              </div>
              <Link className={secondaryActionClass} to="/farm-profile">
                Open Profile
                <ArrowRight size={15} strokeWidth={2.2} />
              </Link>
            </div>
          </section>
        </>
      ) : null}

      {!loading && !error && !overview ? (
        <EmptyState title="No dashboard data" description="Create crops and tasks to build the farm overview." />
      ) : null}
    </div>
  );
}
