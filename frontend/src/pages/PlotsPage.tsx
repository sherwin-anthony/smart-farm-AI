import axios from "axios";
import { useEffect, useState } from "react";
import { MapPlus } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import {
  createPlot,
  deletePlot,
  listPlots,
  updatePlot,
} from "../features/plots/api";
import PlotForm from "../features/plots/components/PlotForm";
import PlotList from "../features/plots/components/PlotList";
import PlotSummary from "../features/plots/components/PlotSummary";
import type { Plot, PlotPayload } from "../features/plots/types";

// Purpose: plots page container for authenticated plot management.
// Routing: /plots -> renders inside app-main.
export default function PlotsPage() {
  const [plots, setPlots] = useState<Plot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  const getErrorMessage = (value: unknown, fallback: string) => {
    if (axios.isAxiosError(value)) {
      return value.response?.data?.message ?? fallback;
    }

    return fallback;
  };

  const loadPlots = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await listPlots();
      setPlots(response);
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Could not load plots."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlots();
  }, []);

  const handleCreate = async (payload: PlotPayload) => {
    try {
      setSubmitting(true);
      setError("");
      await createPlot(payload);
      setShowCreateForm(false);
      await loadPlots();
    } catch (createError) {
      console.error(createError);
      setError(getErrorMessage(createError, "Could not create plot."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, payload: PlotPayload) => {
    try {
      setUpdatingId(id);
      setError("");
      await updatePlot(id, payload);
      await loadPlots();
    } catch (updateError) {
      console.error(updateError);
      setError(getErrorMessage(updateError, "Could not update plot."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setError("");
      await deletePlot(id);
      await loadPlots();
    } catch (deleteError) {
      console.error(deleteError);
      setError(getErrorMessage(deleteError, "Could not delete plot."));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Plots"
        description="Manage field sections inside the refreshed malachite theme, with cleaner contrast, stronger cards, and softer hover motion."
      />

      {error ? <p className="text-danger">{error}</p> : null}

      {!showCreateForm ? (
        <div className="flex items-center justify-start">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500"
            onClick={() => setShowCreateForm(true)}
          >
            <MapPlus size={18} strokeWidth={2.2} />
            Create Plot
          </button>
        </div>
      ) : (
        <PlotForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          submitting={submitting}
        />
      )}

      <PlotSummary plots={plots} />

      {loading ? (
        <Loader />
      ) : plots.length === 0 ? (
        <EmptyState
          title="No plots yet"
          description="Create your first plot so crops can be assigned to a real farm section."
        />
      ) : (
        <PlotList
          plots={plots}
          updatingId={updatingId}
          deletingId={deletingId}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
