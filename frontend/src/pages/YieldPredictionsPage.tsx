import axios from "axios";
import { BarChart3, Calculator, LineChart, Radar } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import { listCrops } from "../features/crops/api";
import type { Crop } from "../features/crops/types";
import { createYieldPrediction, listYieldPredictions } from "../features/yield/api";
import type { YieldPrediction } from "../features/yield/types";

const getDaysPlanted = (crop: Crop) => {
  if (!crop.planted_on) {
    return 0;
  }

  const planted = new Date(crop.planted_on);
  const today = new Date();

  // Use whole days so the backend prediction input is stable and easy to explain.
  return Math.max(
    0,
    Math.floor((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24))
  );
};

const getErrorMessage = (value: unknown, fallback: string) => {
  // Keep prediction validation and session errors visible to the user.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

// Purpose: connected yield prediction page that can create predictions from real crops.
export default function YieldPredictionsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [predictions, setPredictions] = useState<YieldPrediction[]>([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [farmSize, setFarmSize] = useState("1");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadWorkspace = async () => {
    try {
      setLoading(true);
      setError("");
      const [cropResponse, predictionResponse] = await Promise.all([
        listCrops(),
        listYieldPredictions(),
      ]);

      setCrops(cropResponse);
      setPredictions(predictionResponse);
      setSelectedCropId((current) => current || cropResponse[0]?.id.toString() || "");
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Could not load yield workspace."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const handlePredict = async () => {
    const crop = crops.find((item) => item.id === Number(selectedCropId));

    if (!crop) {
      setError("Select a crop before running a prediction.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createYieldPrediction({
        crop_id: crop.id,
        crop_type: crop.type ?? crop.name,
        farm_size_hectares: Number(farmSize),
        days_planted: getDaysPlanted(crop),
      });
      await loadWorkspace();
    } catch (submitError) {
      console.error(submitError);
      setError(getErrorMessage(submitError, "Could not create yield prediction."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Yield Predictions"
        description="Run simple yield forecasts from real crop records and save the result to the farm."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Forecast lab</span>
          <span className="card-icon">
            <BarChart3 size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Predict from crop state</h2>
            <p>
              Select a crop, use its planted date for days planted, and save the prediction back to the crop.
            </p>
          </div>
        </div>
      </section>

      {loading ? <Loader /> : null}
      {error ? <p className="text-danger">{error}</p> : null}

      {!loading ? (
        <section className="panel-card">
          <div className="mb-4 flex items-center gap-2">
            <span className="card-icon card-icon-soft">
              <Calculator size={18} strokeWidth={2.2} />
            </span>
            <h3 className="text-lg font-semibold text-ink">Run Prediction</h3>
          </div>

          {crops.length === 0 ? (
            <EmptyState
              title="No crops available"
              description="Create a crop before running yield predictions."
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Crop
                <select
                  className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70"
                  value={selectedCropId}
                  onChange={(event) => setSelectedCropId(event.target.value)}
                >
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Area ha
                <input
                  className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={farmSize}
                  onChange={(event) => setFarmSize(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70"
                disabled={submitting}
                onClick={handlePredict}
              >
                <Radar size={16} strokeWidth={2.2} />
                {submitting ? "Predicting..." : "Predict Yield"}
              </button>
            </div>
          )}
        </section>
      ) : null}

      {!loading && predictions.length === 0 ? (
        <EmptyState
          title="No predictions yet"
          description="Run a prediction from a crop to start building yield history."
        />
      ) : null}

      {!loading && predictions.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {predictions.map((prediction) => (
            <article key={prediction.id} className="preview-card interactive-lift rounded-3xl p-5">
              <div className="mb-4 flex items-start gap-3">
                <span className="card-icon card-icon-soft">
                  <LineChart size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {prediction.predicted_yield_kg.toLocaleString()} kg
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {prediction.crop?.name ?? "Farm prediction"}
                  </p>
                </div>
              </div>

              <div className="grid gap-3">
                <p className="rounded-2xl border border-surface-border bg-surface-soft p-4 text-sm text-ink-muted">
                  Confidence:{" "}
                  {prediction.confidence_score
                    ? `${Math.round(prediction.confidence_score)}%`
                    : "Not set"}
                </p>
                <p className="rounded-2xl border border-surface-border bg-surface-soft p-4 text-sm text-ink-muted">
                  {prediction.notes ?? prediction.model_name}
                </p>
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}
