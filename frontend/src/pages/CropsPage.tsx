import axios from "axios";
import { Sprout } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import {
  createCrop,
  deleteCrop,
  listCrops,
  updateCrop,
} from "../features/crops/api";
import CropForm from "../features/crops/components/CropForm";
import CropSummary from "../features/crops/components/CropSummary";
import CropTable from "../features/crops/components/CropTable";
import CropTimeline from "../features/crops/components/CropTimeline";
import type { Crop, CropPayload } from "../features/crops/types";
import { listPlots } from "../features/plots/api";
import type { Plot } from "../features/plots/types";
import { listTasks } from "../features/tasks/api";
import type { Task } from "../features/tasks/types";

// Purpose: crops page container for authenticated crop management inside the active farm workspace.
// Routing: /crops -> renders inside app-main after login.
export default function CropsPage() {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);

  const getErrorMessage = (value: unknown, fallback: string) => {
    // Normalize axios failures so the page can show backend messages when available.
    if (axios.isAxiosError(value)) {
      return value.response?.data?.message ?? fallback;
    }

    return fallback;
  };

  const loadCropWorkspace = async () => {
    try {
      setLoading(true);
      setError("");
      setLoadFailed(false);

      // Load crops and plots together because the crop workspace depends on both datasets.
      const [cropResponse, plotResponse, taskResponse] = await Promise.all([
        listCrops(),
        listPlots(),
        listTasks(),
      ]);

      setCrops(cropResponse);
      setPlots(plotResponse);
      setTasks(taskResponse);
    } catch (loadError) {
      console.error(loadError);
      setLoadFailed(true);
      setError(getErrorMessage(loadError, "Could not load the crop workspace."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCropWorkspace();
  }, []);

  const handleCreate = async (payload: CropPayload) => {
    try {
      setSubmitting(true);
      setError("");
      await createCrop(payload);
      setShowCreateForm(false);
      await loadCropWorkspace();
    } catch (createError) {
      console.error(createError);
      setError(getErrorMessage(createError, "Could not create crop."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, payload: CropPayload) => {
    try {
      setUpdatingId(id);
      setError("");
      await updateCrop(id, payload);
      await loadCropWorkspace();
    } catch (updateError) {
      console.error(updateError);
      setError(getErrorMessage(updateError, "Could not update crop."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setError("");
      await deleteCrop(id);
      await loadCropWorkspace();
    } catch (deleteError) {
      console.error(deleteError);
      setError(getErrorMessage(deleteError, "Could not delete crop."));
    } finally {
      setDeletingId(null);
    }
  };

  const hasPlots = plots.length > 0;

  return (
    <div className="stack">
      <PageHeader
        title="Crops"
        description="Track what is planted in each plot, how far it has progressed, and what needs attention next."
      />

      {error ? <p className="text-danger">{error}</p> : null}

      {hasPlots && !showCreateForm ? (
        <div className="flex items-center justify-start">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500"
            onClick={() => setShowCreateForm(true)}
          >
            <Sprout size={18} strokeWidth={2.2} />
            Create Crop
          </button>
        </div>
      ) : null}

      {showCreateForm ? (
        <CropForm
          plots={plots}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          submitting={submitting}
        />
      ) : null}

      {!loading && !loadFailed && hasPlots ? <CropSummary crops={crops} /> : null}

      {!loading && !loadFailed && crops.length > 0 ? (
        <CropTimeline crops={crops} tasks={tasks} />
      ) : null}

      {loading ? (
        <Loader />
      ) : loadFailed ? (
        <EmptyState
          title="Crop workspace unavailable"
          description="The crop data could not be loaded right now. Check the backend database connection, then refresh this page."
        />
      ) : !hasPlots ? (
        <EmptyState
          title="No plots yet"
          description="Create a plot first so every crop can be assigned to a real farm section."
        />
      ) : crops.length === 0 ? (
        <EmptyState
          title="No crops yet"
          description="Your crop workspace is ready. Add the first crop record to start tracking the season."
        />
      ) : (
        <CropTable
          crops={crops}
          plots={plots}
          updatingId={updatingId}
          deletingId={deletingId}
          tasks={tasks}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
