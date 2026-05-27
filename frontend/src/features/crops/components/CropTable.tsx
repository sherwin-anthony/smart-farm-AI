import {
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Eye,
  Flower2,
  Leaf,
  MapPinned,
  PenSquare,
  Sprout,
  Trash2,
  TimerReset,
  Wheat,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import type { Plot } from "../../plots/types";
import type { Task } from "../../tasks/types";
import { CROP_GROWTH_STAGE_OPTIONS, CROP_STATUS_OPTIONS } from "../options";
import type { Crop, CropGrowthStage, CropPayload, CropStatus } from "../types";

type CropTableProps = {
  crops: Crop[];
  plots: Plot[];
  updatingId: number | null;
  deletingId: number | null;
  tasks: Task[];
  onUpdate: (id: number, payload: CropPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

type CropDraft = {
  plot_id: string;
  name: string;
  type: string;
  variety: string;
  status: CropStatus;
  growth_stage: CropGrowthStage;
  planted_on: string;
  expected_harvest_on: string;
  actual_harvest_on: string;
  notes: string;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "Not set";
  }

  return new Date(value).toLocaleDateString();
};

const getStatusMeta = (status: CropStatus) => {
  // Keep the card badge labels tied to the same status options used by the form.
  const label = CROP_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

  if (status === "planned") {
    return { icon: CircleDashed, label };
  }

  if (status === "planted") {
    return { icon: Sprout, label };
  }

  if (status === "growing") {
    return { icon: Leaf, label };
  }

  if (status === "ready") {
    return { icon: Wheat, label };
  }

  if (status === "harvested") {
    return { icon: CheckCircle2, label };
  }

  return { icon: XCircle, label };
};

const getGrowthStageLabel = (stage: CropGrowthStage) =>
  CROP_GROWTH_STAGE_OPTIONS.find((option) => option.value === stage)?.label ?? stage;

const getDayDifference = (value: string | null) => {
  if (!value) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const targetDate = new Date(value);
  targetDate.setHours(0, 0, 0, 0);

  return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const getCropInsight = (crop: Crop) => {
  const daysUntilHarvest = getDayDifference(crop.expected_harvest_on);

  if (crop.status === "harvested") {
    return "Harvest completed";
  }

  if (daysUntilHarvest !== null) {
    if (daysUntilHarvest < 0) {
      return `${Math.abs(daysUntilHarvest)} day${Math.abs(daysUntilHarvest) === 1 ? "" : "s"} overdue`;
    }

    if (daysUntilHarvest === 0) {
      return "Harvest due today";
    }

    return `${daysUntilHarvest} day${daysUntilHarvest === 1 ? "" : "s"} to harvest`;
  }

  const daysSincePlanting = getDayDifference(crop.planted_on);

  if (daysSincePlanting !== null) {
    const elapsedDays = Math.abs(daysSincePlanting);
    return `${elapsedDays} day${elapsedDays === 1 ? "" : "s"} since planting`;
  }

  return "Timeline not set";
};

const getNextTask = (crop: Crop, tasks: Task[]) => {
  // The next-task preview answers "what should happen next?" directly on each crop card.
  return tasks
    .filter((task) => task.crop_id === crop.id && task.status !== "completed")
    .sort((first, second) => (first.due_on ?? "").localeCompare(second.due_on ?? ""))[0];
};

// Purpose: render crop records as operational cards for the authenticated farm workspace.
// Routing: rendered by CropsPage on /crops after records are loaded.
export default function CropTable({
  crops,
  plots,
  updatingId,
  deletingId,
  tasks,
  onUpdate,
  onDelete,
}: CropTableProps) {
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<CropDraft>({
    plot_id: "",
    name: "",
    type: "",
    variety: "",
    status: "planned",
    growth_stage: "seed",
    planted_on: "",
    expected_harvest_on: "",
    actual_harvest_on: "",
    notes: "",
  });

  const detailPanelClassName =
    "rounded-2xl border border-surface-border bg-surface-soft p-4";
  const detailBadgeClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-primary-100 px-3 py-1 text-xs font-semibold tracking-wide text-ink";
  const fieldClassName =
    "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";
  const primaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";
  const secondaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-4 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70";
  const darkButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70";
  const selectedStatusMeta = selectedCrop ? getStatusMeta(selectedCrop.status) : null;
  const SelectedStatusIcon = selectedStatusMeta?.icon;

  const startEdit = (crop: Crop) => {
    setEditingId(crop.id);
    setDraft({
      plot_id: crop.plot_id.toString(),
      name: crop.name,
      type: crop.type ?? "",
      variety: crop.variety ?? "",
      status: crop.status,
      growth_stage: crop.growth_stage,
      planted_on: crop.planted_on ?? "",
      expected_harvest_on: crop.expected_harvest_on ?? "",
      actual_harvest_on: crop.actual_harvest_on ?? "",
      notes: crop.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({
      plot_id: "",
      name: "",
      type: "",
      variety: "",
      status: "planned",
      growth_stage: "seed",
      planted_on: "",
      expected_harvest_on: "",
      actual_harvest_on: "",
      notes: "",
    });
  };

  const saveEdit = async () => {
    if (editingId === null) {
      return;
    }

    // Normalize optional draft fields to null so update payloads match create payloads.
    await onUpdate(editingId, {
      plot_id: Number(draft.plot_id),
      name: draft.name.trim(),
      type: draft.type.trim() ? draft.type.trim() : null,
      variety: draft.variety.trim() ? draft.variety.trim() : null,
      status: draft.status,
      growth_stage: draft.growth_stage,
      planted_on: draft.planted_on.trim() ? draft.planted_on : null,
      expected_harvest_on: draft.expected_harvest_on.trim()
        ? draft.expected_harvest_on
        : null,
      actual_harvest_on: draft.actual_harvest_on.trim()
        ? draft.actual_harvest_on
        : null,
      notes: draft.notes.trim() ? draft.notes.trim() : null,
    });

    cancelEdit();
  };

  const confirmDelete = async (crop: Crop) => {
    // Ask for explicit confirmation before removing a crop record from the farm workspace.
    const confirmed = window.confirm(`Delete ${crop.name}? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    await onDelete(crop.id);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {crops.map((crop) => {
        const statusMeta = getStatusMeta(crop.status);
        const StatusIcon = statusMeta.icon;
        const nextTask = getNextTask(crop, tasks);

        return (
          <article
            key={crop.id}
            className="preview-card interactive-lift rounded-3xl p-5"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="card-icon card-icon-soft">
                  <StatusIcon size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{crop.name}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {crop.variety ?? crop.type ?? "Crop details not set"}
                  </p>
                </div>
              </div>

              <span className={detailBadgeClassName}>
                <StatusIcon size={14} strokeWidth={2.2} />
                {statusMeta.label}
              </span>
            </div>

            {editingId === crop.id ? (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Crop Name</strong>
                  <input
                    className={fieldClassName}
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                    required
                  />
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Plot</strong>
                  <select
                    className={fieldClassName}
                    value={draft.plot_id}
                    onChange={(event) => setDraft({ ...draft, plot_id: event.target.value })}
                    required
                  >
                    {plots.map((plot) => (
                      <option key={plot.id} value={plot.id}>
                        {plot.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Crop Type</strong>
                  <input
                    className={fieldClassName}
                    value={draft.type}
                    onChange={(event) => setDraft({ ...draft, type: event.target.value })}
                  />
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Variety</strong>
                  <input
                    className={fieldClassName}
                    value={draft.variety}
                    onChange={(event) => setDraft({ ...draft, variety: event.target.value })}
                  />
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Status</strong>
                  <select
                    className={fieldClassName}
                    value={draft.status}
                    onChange={(event) =>
                      // Narrow select values to the locked crop status union.
                      setDraft({
                        ...draft,
                        status: event.target.value as CropStatus,
                      })
                    }
                  >
                    {CROP_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Growth Stage</strong>
                  <select
                    className={fieldClassName}
                    value={draft.growth_stage}
                    onChange={(event) =>
                      // Narrow select values to the locked crop growth-stage union.
                      setDraft({
                        ...draft,
                        growth_stage: event.target.value as CropGrowthStage,
                      })
                    }
                  >
                    {CROP_GROWTH_STAGE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Planted On</strong>
                  <input
                    className={fieldClassName}
                    type="date"
                    value={draft.planted_on}
                    onChange={(event) =>
                      setDraft({ ...draft, planted_on: event.target.value })
                    }
                  />
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Expected Harvest</strong>
                  <input
                    className={fieldClassName}
                    type="date"
                    value={draft.expected_harvest_on}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        expected_harvest_on: event.target.value,
                      })
                    }
                  />
                </div>

                <div className={detailPanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Actual Harvest</strong>
                  <input
                    className={fieldClassName}
                    type="date"
                    value={draft.actual_harvest_on}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        actual_harvest_on: event.target.value,
                      })
                    }
                  />
                </div>

                <div className={`${detailPanelClassName} sm:col-span-2`}>
                  <strong className="text-sm font-semibold text-ink">Notes</strong>
                  <textarea
                    className={fieldClassName}
                    rows={3}
                    value={draft.notes}
                    onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div className={detailPanelClassName}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <MapPinned size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Plot</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {crop.plot?.name ?? "Plot unavailable"}
                </p>
              </div>

              <div className={detailPanelClassName}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Flower2 size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Growth Stage</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {getGrowthStageLabel(crop.growth_stage)}
                </p>
              </div>

              <div className={detailPanelClassName}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <CalendarDays size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Planted</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(crop.planted_on)}
                </p>
              </div>

              <div className={detailPanelClassName}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Wheat size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Expected Harvest</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(crop.expected_harvest_on)}
                </p>
              </div>

              <div className={`${detailPanelClassName} sm:col-span-2`}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <TimerReset size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Next Signal</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{getCropInsight(crop)}</p>
              </div>

              <div className={`${detailPanelClassName} sm:col-span-2`}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <ClipboardList size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Next Task</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {nextTask
                    ? `${nextTask.title}${nextTask.due_on ? ` · ${formatDate(nextTask.due_on)}` : ""}`
                    : "No pending task"}
                </p>
              </div>

              <div className={`${detailPanelClassName} sm:col-span-2`}>
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <ClipboardList size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Notes</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {crop.notes ?? "No notes yet"}
                </p>
              </div>
              </div>
            )}

            <div className={editingId === crop.id ? "grid gap-2 sm:grid-cols-2" : "grid gap-2 sm:grid-cols-3"}>
              {editingId === crop.id ? (
                <>
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    onClick={saveEdit}
                    disabled={updatingId === crop.id}
                  >
                    <PenSquare size={16} strokeWidth={2.2} />
                    {updatingId === crop.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={cancelEdit}
                    disabled={updatingId === crop.id}
                  >
                    <X size={16} strokeWidth={2.2} />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    onClick={() => setSelectedCrop(crop)}
                  >
                    <Eye size={16} strokeWidth={2.2} />
                    Details
                  </button>
                  <Link
                    className={secondaryButtonClassName}
                    to={`/crops/${crop.id}`}
                  >
                    <ClipboardList size={16} strokeWidth={2.2} />
                    Workspace
                  </Link>
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    onClick={() => startEdit(crop)}
                  >
                    <PenSquare size={16} strokeWidth={2.2} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={darkButtonClassName}
                    onClick={() => confirmDelete(crop)}
                    disabled={deletingId === crop.id}
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                    {deletingId === crop.id ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}

      {selectedCrop ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedCrop(null)}
        >
          <section
            className="modal-card rounded-3xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="crop-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="card-icon">
                  {SelectedStatusIcon ? (
                    <SelectedStatusIcon size={18} strokeWidth={2.2} />
                  ) : null}
                </span>
                <div>
                  <h3 id="crop-detail-title" className="text-lg font-semibold text-ink">
                    {selectedCrop.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {selectedCrop.variety ?? selectedCrop.type ?? "Detailed crop summary"}
                  </p>
                </div>
              </div>

              <span className={detailBadgeClassName}>
                {SelectedStatusIcon ? (
                  <SelectedStatusIcon size={14} strokeWidth={2.2} />
                ) : null}
                {selectedStatusMeta?.label}
              </span>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Plot</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {selectedCrop.plot?.name ?? "Plot unavailable"}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Growth Stage</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {getGrowthStageLabel(selectedCrop.growth_stage)}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Crop Type</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {selectedCrop.type ?? "Not set"}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Variety</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {selectedCrop.variety ?? "Not set"}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Planted On</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(selectedCrop.planted_on)}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Expected Harvest</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(selectedCrop.expected_harvest_on)}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Actual Harvest</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(selectedCrop.actual_harvest_on)}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Next Signal</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {getCropInsight(selectedCrop)}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Next Task</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {getNextTask(selectedCrop, tasks)?.title ?? "No pending task"}
                </p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Created</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {formatDate(selectedCrop.created_at)}
                </p>
              </div>
              <div className={`${detailPanelClassName} sm:col-span-2`}>
                <strong className="text-sm font-semibold text-ink">Notes</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {selectedCrop.notes ?? "No notes yet"}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-1">
              <button
                type="button"
                className={primaryButtonClassName}
                onClick={() => setSelectedCrop(null)}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
