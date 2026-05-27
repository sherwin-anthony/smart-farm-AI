import axios from "axios";
import {
  BarChart3,
  Calculator,
  CheckCircle2,
  Filter,
  LineChart,
  Radar,
  Save,
  Target,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { listCrops } from "../features/crops/api";
import type { Crop } from "../features/crops/types";
import {
  createYieldPrediction,
  deleteYieldPrediction,
  listYieldPredictions,
  recordActualYield,
} from "../features/yield/api";
import type { YieldPrediction } from "../features/yield/types";

type YieldFilters = {
  status: string;
  crop_id: string;
};

type ActualDraft = {
  actual_yield_kg: string;
  harvested_on: string;
  notes: string;
};

const fieldClassName =
  "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm";

const statusClass: Record<string, string> = {
  predicted: "border-sky-200 bg-sky-50 text-sky-700",
  updated: "border-amber-200 bg-amber-50 text-amber-700",
  harvested: "border-emerald-200 bg-emerald-50 text-emerald-700",
  cancelled: "border-slate-200 bg-slate-50 text-slate-600",
};

const getErrorMessage = (value: unknown, fallback: string) => {
  // Keep backend validation and ownership errors visible on the page.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const getDaysPlanted = (crop: Crop) => {
  if (!crop.planted_on) {
    return 0;
  }

  const planted = new Date(crop.planted_on);
  const today = new Date();

  return Math.max(
    0,
    Math.floor((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24))
  );
};

const formatKg = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return `${Math.round(value).toLocaleString()} kg`;
};

const formatPercent = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "Not set";
  }

  return `${Math.round(value)}%`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const recordDifference = (prediction: YieldPrediction) => {
  if (prediction.actual_yield_kg === null || prediction.predicted_yield_kg <= 0) {
    return null;
  }

  const difference = prediction.actual_yield_kg - prediction.predicted_yield_kg;
  const percent = (difference / prediction.predicted_yield_kg) * 100;

  return {
    difference,
    percent,
    label: difference >= 0 ? "Above prediction" : "Below prediction",
    Icon: difference >= 0 ? TrendingUp : TrendingDown,
    className:
      difference >= 0
        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
        : "border-amber-200 bg-amber-50 text-amber-700",
  };
};

const averageAccuracy = (predictions: YieldPrediction[]) => {
  const scored = predictions
    .filter((prediction) => prediction.actual_yield_kg !== null && prediction.predicted_yield_kg > 0)
    .map((prediction) => {
      const errorRate =
        Math.abs((prediction.actual_yield_kg ?? 0) - prediction.predicted_yield_kg) /
        prediction.predicted_yield_kg;

      return Math.max(0, 100 - errorRate * 100);
    });

  if (scored.length === 0) {
    return null;
  }

  return scored.reduce((total, value) => total + value, 0) / scored.length;
};

// Purpose: farm performance layer for predicted yield, actual harvests, and comparison.
export default function YieldPredictionsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [predictions, setPredictions] = useState<YieldPrediction[]>([]);
  const [selectedCropId, setSelectedCropId] = useState("");
  const [areaHectares, setAreaHectares] = useState("1");
  const [predictionNotes, setPredictionNotes] = useState("");
  const [filters, setFilters] = useState<YieldFilters>({
    status: "all",
    crop_id: "all",
  });
  const [actualDrafts, setActualDrafts] = useState<Record<number, ActualDraft>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recordingId, setRecordingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const selectedCrop = useMemo(
    () => crops.find((crop) => crop.id === Number(selectedCropId)) ?? null,
    [crops, selectedCropId]
  );

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

  useEffect(() => {
    if (selectedCrop?.plot?.area_hectares) {
      setAreaHectares(String(selectedCrop.plot.area_hectares));
    }
  }, [selectedCrop?.id, selectedCrop?.plot?.area_hectares]);

  const summary = useMemo(() => {
    const actualAccuracy = averageAccuracy(predictions);

    return {
      predictedTotal: predictions
        .filter((prediction) => prediction.prediction_status !== "cancelled")
        .reduce((total, prediction) => total + prediction.predicted_yield_kg, 0),
      actualTotal: predictions.reduce(
        (total, prediction) => total + (prediction.actual_yield_kg ?? 0),
        0
      ),
      active: predictions.filter((prediction) =>
        ["predicted", "updated"].includes(prediction.prediction_status)
      ).length,
      harvested: predictions.filter(
        (prediction) =>
          prediction.prediction_status === "harvested" || prediction.actual_yield_kg !== null
      ).length,
      accuracy: actualAccuracy,
    };
  }, [predictions]);

  const filteredPredictions = useMemo(
    () =>
      predictions.filter((prediction) => {
        if (filters.status !== "all" && prediction.prediction_status !== filters.status) {
          return false;
        }

        if (filters.crop_id !== "all" && prediction.crop_id !== Number(filters.crop_id)) {
          return false;
        }

        return true;
      }),
    [filters, predictions]
  );

  const clearFilters = () => {
    setFilters({
      status: "all",
      crop_id: "all",
    });
  };

  const handlePredict = async () => {
    if (!selectedCrop) {
      setError("Select a crop before running a yield prediction.");
      return;
    }

    const parsedArea = Number(areaHectares);

    if (!Number.isFinite(parsedArea) || parsedArea <= 0) {
      setError("Enter a valid plot area before running a prediction.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createYieldPrediction({
        crop_id: selectedCrop.id,
        plot_id: selectedCrop.plot_id,
        crop_type: selectedCrop.type ?? selectedCrop.name,
        farm_size_hectares: parsedArea,
        days_planted: getDaysPlanted(selectedCrop),
        notes: predictionNotes.trim() || null,
      });
      setPredictionNotes("");
      await loadWorkspace();
    } catch (submitError) {
      console.error(submitError);
      setError(getErrorMessage(submitError, "Could not create yield prediction."));
    } finally {
      setSubmitting(false);
    }
  };

  const updateDraft = (predictionId: number, patch: Partial<ActualDraft>) => {
    setActualDrafts((drafts) => ({
      ...drafts,
      [predictionId]: {
        actual_yield_kg: drafts[predictionId]?.actual_yield_kg ?? "",
        harvested_on: drafts[predictionId]?.harvested_on ?? todayInputValue(),
        notes: drafts[predictionId]?.notes ?? "",
        ...patch,
      },
    }));
  };

  const handleRecordActual = async (prediction: YieldPrediction) => {
    const draft = actualDrafts[prediction.id] ?? {
      actual_yield_kg: "",
      harvested_on: todayInputValue(),
      notes: "",
    };
    const actualYield = Number(draft.actual_yield_kg);

    if (!Number.isFinite(actualYield) || actualYield < 0) {
      setError("Enter a valid actual yield before saving.");
      return;
    }

    try {
      setRecordingId(prediction.id);
      setError("");
      await recordActualYield(prediction.id, {
        actual_yield_kg: actualYield,
        harvested_on: draft.harvested_on || null,
        notes: draft.notes.trim() || null,
      });
      setActualDrafts((drafts) => {
        const nextDrafts = { ...drafts };
        delete nextDrafts[prediction.id];
        return nextDrafts;
      });
      await loadWorkspace();
    } catch (recordError) {
      console.error(recordError);
      setError(getErrorMessage(recordError, "Could not record actual yield."));
    } finally {
      setRecordingId(null);
    }
  };

  const handleDelete = async (prediction: YieldPrediction) => {
    if (!window.confirm("Delete this yield record?")) {
      return;
    }

    try {
      setDeletingId(prediction.id);
      setError("");
      await deleteYieldPrediction(prediction.id);
      await loadWorkspace();
    } catch (deleteError) {
      console.error(deleteError);
      setError(getErrorMessage(deleteError, "Could not delete yield record."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Yield"
        description="Estimate harvest output, record actual yield, and compare farm performance."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Performance layer</span>
          <span className="card-icon">
            <BarChart3 size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Predicted versus actual harvest</h2>
            <p>Use crop and plot data to estimate output, then close the loop after harvest.</p>
          </div>
        </div>
      </section>

      {error ? <p className="text-danger">{error}</p> : null}

      <section className="grid-cards">
        <StatCard
          label="Predicted Total"
          value={formatKg(summary.predictedTotal)}
          note="Open and completed estimates."
          icon={Target}
          strong
        />
        <StatCard
          label="Actual Total"
          value={formatKg(summary.actualTotal)}
          note="Recorded harvest weight."
          icon={CheckCircle2}
        />
        <StatCard label="Active" value={summary.active} note="Predicted or updated." icon={Radar} />
        <StatCard
          label="Avg Accuracy"
          value={summary.accuracy === null ? "Pending" : formatPercent(summary.accuracy)}
          note={`${summary.harvested} harvested records.`}
          icon={LineChart}
        />
      </section>

      {loading ? <Loader /> : null}

      {!loading ? (
        <section className="preview-card rounded-3xl p-5">
          <div className="mb-4 flex items-center gap-3">
            <span className="card-icon card-icon-soft">
              <Calculator size={18} strokeWidth={2.2} />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-ink">Create Prediction</h3>
              <p className="text-sm text-ink-muted">
                {selectedCrop
                  ? `${selectedCrop.name} uses ${getDaysPlanted(selectedCrop)} planted days.`
                  : "Select a crop to start."}
              </p>
            </div>
          </div>

          {crops.length === 0 ? (
            <EmptyState title="No crops available" description="Create a crop before estimating yield." />
          ) : (
            <div className="grid gap-3 lg:grid-cols-[1fr_160px_1fr_auto] lg:items-end">
              <label className="grid gap-2 text-sm font-semibold text-ink">
                Crop
                <select
                  className={fieldClassName}
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
                  className={fieldClassName}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={areaHectares}
                  onChange={(event) => setAreaHectares(event.target.value)}
                />
              </label>

              <label className="grid gap-2 text-sm font-semibold text-ink">
                Notes
                <input
                  className={fieldClassName}
                  value={predictionNotes}
                  onChange={(event) => setPredictionNotes(event.target.value)}
                  placeholder="Optional field observation"
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

      {!loading && predictions.length > 0 ? (
        <section className="preview-card rounded-3xl p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="card-icon card-icon-soft">
                <Filter size={18} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-lg font-semibold text-ink">Filters</h3>
                <p className="text-sm text-ink-muted">
                  Showing {filteredPredictions.length} of {predictions.length} records.
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

          <div className="grid gap-3 md:grid-cols-2">
            <select
              className={fieldClassName}
              value={filters.status}
              onChange={(event) => setFilters({ ...filters, status: event.target.value })}
            >
              <option value="all">All status</option>
              <option value="predicted">Predicted</option>
              <option value="updated">Updated</option>
              <option value="harvested">Harvested</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <select
              className={fieldClassName}
              value={filters.crop_id}
              onChange={(event) => setFilters({ ...filters, crop_id: event.target.value })}
            >
              <option value="all">All crops</option>
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
        </section>
      ) : null}

      {!loading && predictions.length === 0 ? (
        <EmptyState
          title="No yield records yet"
          description="Create the first prediction from an active crop."
        />
      ) : null}

      {!loading && predictions.length > 0 && filteredPredictions.length === 0 ? (
        <EmptyState title="No matching yield records" description="Clear filters to see every record." />
      ) : null}

      {!loading && filteredPredictions.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {filteredPredictions.map((prediction) => {
            const draft = actualDrafts[prediction.id] ?? {
              actual_yield_kg: "",
              harvested_on: todayInputValue(),
              notes: "",
            };
            const difference = recordDifference(prediction);
            const DifferenceIcon = difference?.Icon;
            const badgeClass =
              statusClass[prediction.prediction_status] ?? statusClass.predicted;

            return (
              <article key={prediction.id} className="preview-card interactive-lift rounded-3xl p-5">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="card-icon card-icon-soft">
                      <BarChart3 size={18} strokeWidth={2.2} />
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold text-ink">
                        {prediction.crop?.name ?? "Farm yield record"}
                      </h3>
                      <p className="mt-1 text-sm text-ink-muted">
                        {prediction.plot?.name ?? prediction.crop?.plot?.name ?? "Farm-wide"}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${badgeClass}`}
                  >
                    {prediction.prediction_status}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                    <p className="text-xs font-bold uppercase text-ink-muted">Predicted</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatKg(prediction.predicted_yield_kg)}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatDate(prediction.predicted_on)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                    <p className="text-xs font-bold uppercase text-ink-muted">Actual</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {formatKg(prediction.actual_yield_kg)}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {formatDate(prediction.harvested_on)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid gap-3">
                  <p className="rounded-2xl border border-surface-border bg-surface-card p-4 text-sm text-ink-muted">
                    Confidence: {formatPercent(prediction.confidence_score)} | Area:{" "}
                    {prediction.farm_size_hectares.toLocaleString()} ha | Days:{" "}
                    {prediction.days_planted.toLocaleString()}
                  </p>

                  {difference && DifferenceIcon ? (
                    <div className={`rounded-2xl border p-4 text-sm font-semibold ${difference.className}`}>
                      <div className="flex items-center gap-2">
                        <DifferenceIcon size={16} strokeWidth={2.2} />
                        <span>{difference.label}</span>
                      </div>
                      <p className="mt-1 text-xs font-medium">
                        {formatKg(Math.abs(difference.difference))} |{" "}
                        {Math.abs(difference.percent).toFixed(1)}%
                      </p>
                    </div>
                  ) : null}

                  <p className="rounded-2xl border border-surface-border bg-surface-card p-4 text-sm text-ink-muted">
                    {prediction.notes ?? prediction.model_name ?? "Rule-based estimate"}
                  </p>
                </div>

                {prediction.actual_yield_kg === null &&
                prediction.prediction_status !== "cancelled" ? (
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        Actual kg
                        <input
                          className={fieldClassName}
                          type="number"
                          min="0"
                          step="0.01"
                          value={draft.actual_yield_kg}
                          onChange={(event) =>
                            updateDraft(prediction.id, {
                              actual_yield_kg: event.target.value,
                            })
                          }
                        />
                      </label>

                      <label className="grid gap-2 text-sm font-semibold text-ink">
                        Harvested on
                        <input
                          className={fieldClassName}
                          type="date"
                          value={draft.harvested_on}
                          onChange={(event) =>
                            updateDraft(prediction.id, {
                              harvested_on: event.target.value,
                            })
                          }
                        />
                      </label>
                    </div>

                    <input
                      className={fieldClassName}
                      value={draft.notes}
                      onChange={(event) =>
                        updateDraft(prediction.id, {
                          notes: event.target.value,
                        })
                      }
                      placeholder="Actual harvest note"
                    />

                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70"
                      disabled={recordingId === prediction.id}
                      onClick={() => handleRecordActual(prediction)}
                    >
                      <Save size={16} strokeWidth={2.2} />
                      {recordingId === prediction.id ? "Saving..." : "Record Actual"}
                    </button>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-none transition hover:-translate-y-0.5 disabled:cursor-progress disabled:opacity-70"
                    disabled={deletingId === prediction.id}
                    onClick={() => handleDelete(prediction)}
                  >
                    <Trash2 size={15} strokeWidth={2.2} />
                    {deletingId === prediction.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : null}
    </div>
  );
}
