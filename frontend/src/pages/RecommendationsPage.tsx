import axios from "axios";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudSun,
  ClipboardList,
  Filter,
  Layers3,
  Lightbulb,
  ListTodo,
  MapPinned,
  ScanLine,
  Settings,
  Sprout,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { createRecommendationTask, getRecommendations } from "../features/recommendations/api";
import type { RecommendationItem } from "../features/recommendations/types";

type RecommendationFilters = {
  source: string;
  priority: string;
  category: string;
};

const getErrorMessage = (value: unknown, fallback: string) => {
  // Recommendation errors often come from missing farm/session setup.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

const fieldClassName =
  "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm";

const priorityClass: Record<string, string> = {
  urgent: "tone-danger",
  high: "tone-warning",
  medium: "tone-info",
  low: "tone-success",
};

const sourceIcon = (source: string): LucideIcon => {
  if (source === "weather") {
    return CloudSun;
  }

  if (source === "crop") {
    return Sprout;
  }

  if (source === "task") {
    return ClipboardList;
  }

  if (source === "plot") {
    return MapPinned;
  }

  if (source === "profile") {
    return Settings;
  }

  return ScanLine;
};

const uniqueOptions = (items: RecommendationItem[], getter: (item: RecommendationItem) => string) =>
  Array.from(new Set(items.map(getter).filter(Boolean))).sort();

const optionLabel = (value: string) => value.replaceAll("_", " ");

// Purpose: structured farm decision feed from weather, crop, task, and system rules.
export default function RecommendationsPage() {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [filters, setFilters] = useState<RecommendationFilters>({
    source: "all",
    priority: "all",
    category: "all",
  });
  const [loading, setLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState<string | null>(null);
  const [taskMessages, setTaskMessages] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await getRecommendations();
        setItems(response.items);
      } catch (loadError) {
        console.error(loadError);
        setError(getErrorMessage(loadError, "Could not load recommendations."));
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, []);

  const summary = useMemo(
    () => ({
      total: items.length,
      urgent: items.filter((item) => item.priority === "urgent" || item.priority === "high").length,
      weather: items.filter((item) => item.source === "weather").length,
      cropTask: items.filter((item) => item.source === "crop" || item.source === "task").length,
      plotProfile: items.filter((item) => item.source === "plot" || item.source === "profile").length,
    }),
    [items]
  );

  const filterOptions = useMemo(
    () => ({
      sources: uniqueOptions(items, (item) => item.source),
      priorities: uniqueOptions(items, (item) => item.priority),
      categories: uniqueOptions(items, (item) => item.category),
    }),
    [items]
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        if (filters.source !== "all" && item.source !== filters.source) {
          return false;
        }

        if (filters.priority !== "all" && item.priority !== filters.priority) {
          return false;
        }

        if (filters.category !== "all" && item.category !== filters.category) {
          return false;
        }

        return true;
      }),
    [filters, items]
  );

  const clearFilters = () => {
    setFilters({
      source: "all",
      priority: "all",
      category: "all",
    });
  };

  const handleCreateTask = async (item: RecommendationItem) => {
    try {
      setCreatingKey(item.key);
      setError("");
      const response = await createRecommendationTask(item.key);
      setTaskMessages((messages) => ({
        ...messages,
        [item.key]: response.message,
      }));
    } catch (createError) {
      console.error(createError);
      setError(getErrorMessage(createError, "Could not create recommendation task."));
    } finally {
      setCreatingKey(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Recommendations"
        description="Farm advice based on your authenticated farm, crop state, tasks, and latest weather signal."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Decision support</span>
          <span className="card-icon">
            <Lightbulb size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Actionable farm guidance</h2>
            <p>Recommendations now include source, priority, related records, and next actions.</p>
          </div>
        </div>
      </section>

      {loading ? <Loader /> : null}
      {error ? <p className="text-danger">{error}</p> : null}

      {!loading && !error && items.length > 0 ? (
        <>
          <section className="grid-cards">
            <StatCard
              label="Total"
              value={summary.total.toString()}
              note="Generated from current farm data."
              icon={Layers3}
              strong
            />
            <StatCard
              label="High Priority"
              value={summary.urgent.toString()}
              note="Urgent and high priority items."
              icon={AlertTriangle}
            />
            <StatCard
              label="Weather"
              value={summary.weather.toString()}
              note="Forecast-driven recommendations."
              icon={CloudSun}
            />
            <StatCard
              label="Crop & Task"
              value={summary.cropTask.toString()}
              note="Crop stage and task pressure signals."
              icon={Sprout}
            />
            <StatCard
              label="Plot & Profile"
              value={summary.plotProfile.toString()}
              note="Setup and planting opportunity signals."
              icon={MapPinned}
            />
          </section>

          <section className="preview-card rounded-3xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="card-icon card-icon-soft">
                  <Filter size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">Filters</h3>
                  <p className="text-sm text-ink-muted">
                    Showing {filteredItems.length} of {items.length} recommendations.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <select
                className={fieldClassName}
                value={filters.source}
                onChange={(event) => setFilters({ ...filters, source: event.target.value })}
              >
                <option value="all">All sources</option>
                {filterOptions.sources.map((source) => (
                  <option key={source} value={source}>
                    {optionLabel(source)}
                  </option>
                ))}
              </select>

              <select
                className={fieldClassName}
                value={filters.priority}
                onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
              >
                <option value="all">All priorities</option>
                {filterOptions.priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {optionLabel(priority)}
                  </option>
                ))}
              </select>

              <select
                className={fieldClassName}
                value={filters.category}
                onChange={(event) => setFilters({ ...filters, category: event.target.value })}
              >
                <option value="all">All categories</option>
                {filterOptions.categories.map((category) => (
                  <option key={category} value={category}>
                    {optionLabel(category)}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            {filteredItems.map((item, index) => {
              const Icon = sourceIcon(item.source);
              const tone = priorityClass[item.priority] ?? priorityClass.low;
              const strong = index === 0 && item.priority !== "low";

              return (
                <article
                  key={item.key}
                  className={strong ? "feature-card feature-card-strong" : "feature-card"}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className={strong ? "card-icon" : "card-icon card-icon-soft"}>
                        <Icon size={18} strokeWidth={2.2} />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 opacity-90">{item.message}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${tone}`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="card-chip mt-0 capitalize">Source: {item.source}</span>
                    <span className="card-chip mt-0 capitalize">{item.category.replaceAll("_", " ")}</span>
                    {item.related_label ? (
                      <span className="card-chip mt-0">{item.related_label}</span>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.action_href && item.action_label ? (
                      <Link
                        className={
                          strong
                            ? "inline-flex items-center justify-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:-translate-y-0.5"
                            : "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500"
                        }
                        to={item.action_href}
                      >
                        {item.action_label}
                        <ArrowRight size={16} strokeWidth={2.2} />
                      </Link>
                    ) : null}

                    {item.can_create_task ? (
                      <button
                        type="button"
                        className={
                          strong
                            ? "inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70"
                            : "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-progress disabled:opacity-70"
                        }
                        disabled={creatingKey === item.key}
                        onClick={() => handleCreateTask(item)}
                      >
                        <ListTodo size={16} strokeWidth={2.2} />
                        {creatingKey === item.key ? "Creating..." : "Create Task"}
                      </button>
                    ) : null}
                  </div>

                  {taskMessages[item.key] ? (
                    <p className="mt-3 text-sm font-medium opacity-90">{taskMessages[item.key]}</p>
                  ) : null}
                </article>
              );
            })}
          </section>

          {filteredItems.length === 0 ? (
            <EmptyState
              title="No matching recommendations"
              description="Clear filters or choose a different source, priority, or category."
            />
          ) : null}
        </>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <EmptyState
          title="No recommendations yet"
          description="Sync weather or add crops to create better recommendation signals."
        />
      ) : null}

      {!loading && !error && items.length === 1 && items[0]?.priority === "low" ? (
        <section className="panel-card">
          <div className="inline-icon-row">
            <span className="card-icon card-icon-soft">
              <CheckCircle2 size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-ink">No urgent action</h3>
              <p className="card-copy">Your current farm signals do not require immediate changes.</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
