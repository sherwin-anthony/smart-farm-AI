import axios from "axios";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Lightbulb,
  MapPinned,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import { getCrop } from "../features/crops/api";
import CropTimeline from "../features/crops/components/CropTimeline";
import type { Crop } from "../features/crops/types";
import { getRecommendations } from "../features/recommendations/api";
import { listTasks } from "../features/tasks/api";
import type { Task } from "../features/tasks/types";
import { listYieldPredictions } from "../features/yield/api";
import type { YieldPrediction } from "../features/yield/types";

const formatDate = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
};

const getErrorMessage = (value: unknown, fallback: string) => {
  // Keep crop workspace failures readable when the backend returns validation/session messages.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

// Purpose: full crop workspace for one crop, connected to tasks, recommendations, and yield records.
export default function CropDetailPage() {
  const { id } = useParams();
  const cropId = Number(id);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [predictions, setPredictions] = useState<YieldPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadWorkspace = async () => {
      try {
        setLoading(true);
        setError("");

        // Load related modules together so the crop detail page feels like one workspace.
        const [cropResponse, taskResponse, recommendationResponse, predictionResponse] =
          await Promise.all([
            getCrop(cropId),
            listTasks(),
            getRecommendations(),
            listYieldPredictions(),
          ]);

        setCrop(cropResponse);
        setTasks(taskResponse.filter((task) => task.crop_id === cropId));
        setRecommendations(recommendationResponse.recommendations);
        setPredictions(
          predictionResponse.filter((prediction) => prediction.crop_id === cropId)
        );
      } catch (loadError) {
        console.error(loadError);
        setError(getErrorMessage(loadError, "Could not load crop workspace."));
      } finally {
        setLoading(false);
      }
    };

    if (Number.isFinite(cropId)) {
      loadWorkspace();
    }
  }, [cropId]);

  if (!Number.isFinite(cropId)) {
    return (
      <EmptyState
        title="Invalid crop"
        description="The crop route does not include a valid crop id."
      />
    );
  }

  return (
    <div className="stack">
      <Link
        to="/crops"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-surface-border bg-surface-card px-4 py-2 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50"
      >
        <ArrowLeft size={16} strokeWidth={2.2} />
        Back to Crops
      </Link>

      {loading ? <Loader /> : null}
      {error ? <p className="text-danger">{error}</p> : null}

      {!loading && !error && crop ? (
        <>
          <PageHeader
            title={crop.name}
            description="Crop workspace with field details, tasks, calendar, recommendations, and yield history."
          />

          <section className="module-hero">
            <div className="module-hero-copy">
              <span className="card-chip">{crop.status}</span>
              <span className="card-icon">
                <Sprout size={24} strokeWidth={2.2} />
              </span>
              <div>
                <h2>{crop.variety ?? crop.type ?? "Crop details"}</h2>
                <p>
                  Planted {formatDate(crop.planted_on)} · Expected harvest{" "}
                  {formatDate(crop.expected_harvest_on)}
                </p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <article className="panel-card">
              <span className="card-icon card-icon-soft">
                <MapPinned size={18} strokeWidth={2.2} />
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">Location</h3>
              <p className="card-copy">{crop.plot?.name ?? "Plot unavailable"}</p>
            </article>

            <article className="panel-card">
              <span className="card-icon card-icon-soft">
                <CalendarDays size={18} strokeWidth={2.2} />
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">Growth Stage</h3>
              <p className="card-copy">{crop.growth_stage}</p>
            </article>

            <article className="panel-card">
              <span className="card-icon card-icon-soft">
                <ClipboardList size={18} strokeWidth={2.2} />
              </span>
              <h3 className="mt-3 text-lg font-semibold text-ink">Open Tasks</h3>
              <p className="card-copy">
                {tasks.filter((task) => task.status !== "completed").length} pending
              </p>
            </article>
          </section>

          <CropTimeline crops={[crop]} tasks={tasks} />

          <section className="grid gap-4 lg:grid-cols-2">
            <article className="panel-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="card-icon card-icon-soft">
                  <ClipboardList size={18} strokeWidth={2.2} />
                </span>
                <h3 className="text-lg font-semibold text-ink">Crop Tasks</h3>
              </div>
              <div className="grid gap-3">
                {tasks.length === 0 ? (
                  <p className="card-copy">No tasks attached to this crop yet.</p>
                ) : (
                  tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-2xl border border-surface-border bg-surface-soft p-4"
                    >
                      <strong className="text-sm font-semibold text-ink">
                        {task.title}
                      </strong>
                      <p className="mt-1 text-sm text-ink-muted">
                        {formatDate(task.due_on)} · {task.status}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className="panel-card">
              <div className="mb-4 flex items-center gap-2">
                <span className="card-icon card-icon-soft">
                  <Lightbulb size={18} strokeWidth={2.2} />
                </span>
                <h3 className="text-lg font-semibold text-ink">Recommendations</h3>
              </div>
              <div className="grid gap-3">
                {recommendations.map((recommendation) => (
                  <p
                    key={recommendation}
                    className="rounded-2xl border border-surface-border bg-surface-soft p-4 text-sm text-ink-muted"
                  >
                    {recommendation}
                  </p>
                ))}
              </div>
            </article>
          </section>

          <section className="panel-card">
            <div className="mb-4 flex items-center gap-2">
              <span className="card-icon card-icon-soft">
                <BarChart3 size={18} strokeWidth={2.2} />
              </span>
              <h3 className="text-lg font-semibold text-ink">Yield Predictions</h3>
            </div>
            {predictions.length === 0 ? (
              <p className="card-copy">No yield prediction saved for this crop yet.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {predictions.map((prediction) => (
                  <article
                    key={prediction.id}
                    className="rounded-2xl border border-surface-border bg-surface-soft p-4"
                  >
                    <strong className="text-sm font-semibold text-ink">
                      {prediction.predicted_yield_kg.toLocaleString()} kg
                    </strong>
                    <p className="mt-1 text-sm text-ink-muted">
                      {prediction.model_name} · {formatDate(prediction.created_at)}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
