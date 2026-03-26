import {
  Eye,
  MapPinned,
  Pause,
  PenSquare,
  Ruler,
  Sprout,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { useState } from "react";
import { PLOT_STATUS_OPTIONS, SOIL_TYPE_OPTIONS } from "../options";
import type { Plot, PlotPayload } from "../types";

type PlotListProps = {
  plots: Plot[];
  updatingId: number | null;
  deletingId: number | null;
  onUpdate: (id: number, payload: PlotPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

const getStatusPill = (status: string) => {
  const normalized = status.toLowerCase();

  if (normalized === "active") {
    return {
      icon: Sprout,
      label: "Active",
    };
  }

  if (normalized === "vacant") {
    return {
      icon: MapPinned,
      label: "Vacant",
    };
  }

  if (normalized === "resting") {
    return {
      icon: Pause,
      label: "Resting",
    };
  }

  if (normalized === "maintenance") {
    return {
      icon: Wrench,
      label: "Maintenance",
    };
  }

  return { icon: MapPinned, label: status };
};

// Purpose: render plot cards with inline edit and delete actions.
// Routing: rendered by PlotsPage on /plots.
export default function PlotList({
  plots,
  updatingId,
  deletingId,
  onUpdate,
  onDelete,
}: PlotListProps) {
  const fieldClassName =
    "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";
  const primaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";
  const secondaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-4 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70";
  const darkButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70";
  const detailPanelClassName =
    "rounded-2xl border border-surface-border bg-surface-soft p-4";
  const detailBadgeClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-primary-100 px-3 py-1 text-xs font-semibold tracking-wide text-ink";
  const inlinePanelClassName =
    "grid gap-1.5 rounded-2xl border border-surface-border bg-surface-soft p-4";
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [draft, setDraft] = useState({
    name: "",
    area_hectares: "",
    soil_type: "",
    status: "active",
    notes: "",
  });
  const selectedStatus = selectedPlot ? getStatusPill(selectedPlot.status) : null;
  const SelectedStatusIcon = selectedStatus?.icon;

  const startEdit = (plot: Plot) => {
    setEditingId(plot.id);
    setDraft({
      name: plot.name,
      area_hectares: plot.area_hectares?.toString() ?? "",
      soil_type: plot.soil_type ?? "",
      status: plot.status,
      notes: plot.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({
      name: "",
      area_hectares: "",
      soil_type: "",
      status: "active",
      notes: "",
    });
  };

  const saveEdit = async () => {
    if (editingId === null) {
      return;
    }

    await onUpdate(editingId, {
      name: draft.name,
      area_hectares: draft.area_hectares.trim() ? Number(draft.area_hectares) : null,
      soil_type: draft.soil_type.trim() ? draft.soil_type : null,
      status: draft.status,
      notes: draft.notes.trim() ? draft.notes : null,
    });

    cancelEdit();
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {plots.map((plot) => {
        const pill = getStatusPill(plot.status);
        const StatusIcon = pill.icon;

        return (
          <article
            key={plot.id}
            className="preview-card interactive-lift rounded-3xl p-5"
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="card-icon card-icon-soft">
                  <StatusIcon size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">
                    {editingId === plot.id ? "Edit Plot" : plot.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {plot.soil_type ?? "Soil type not set"}
                  </p>
                </div>
              </div>

              <span className={detailBadgeClassName}>
                <StatusIcon size={14} strokeWidth={2.2} />
                {pill.label}
              </span>
            </div>

            {editingId === plot.id ? (
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <div className={inlinePanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Name</strong>
                  <input
                    className={fieldClassName}
                    value={draft.name}
                    onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  />
                </div>
                <div className={inlinePanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Area</strong>
                  <input
                    className={fieldClassName}
                    type="number"
                    step="0.01"
                    value={draft.area_hectares}
                    onChange={(event) =>
                      setDraft({ ...draft, area_hectares: event.target.value })
                    }
                  />
                </div>
                <div className={inlinePanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Soil Type</strong>
                  <select
                    className={fieldClassName}
                    value={draft.soil_type}
                    onChange={(event) => setDraft({ ...draft, soil_type: event.target.value })}
                  >
                    {SOIL_TYPE_OPTIONS.map((option) => (
                      <option key={option.value || "empty"} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={inlinePanelClassName}>
                  <strong className="text-sm font-semibold text-ink">Status</strong>
                  <select
                    className={fieldClassName}
                    value={draft.status}
                    onChange={(event) => setDraft({ ...draft, status: event.target.value })}
                  >
                    {PLOT_STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`${inlinePanelClassName} sm:col-span-2`}>
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
                <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                  <div className="flex items-center gap-2">
                    <span className="card-icon card-icon-soft">
                      <Ruler size={16} strokeWidth={2.2} />
                    </span>
                    <strong className="text-sm font-semibold text-ink">Area</strong>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {plot.area_hectares ?? "N/A"} hectares
                  </p>
                </div>
                <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                  <strong className="text-sm font-semibold text-ink">Notes</strong>
                  <p className="mt-1 text-sm text-ink-muted">{plot.notes ?? "No notes yet"}</p>
                </div>
              </div>
            )}

            <div className={editingId === plot.id ? "grid gap-2 sm:grid-cols-2" : "grid gap-2 sm:grid-cols-3"}>
              {editingId === plot.id ? (
                <>
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    onClick={saveEdit}
                    disabled={updatingId === plot.id}
                  >
                    <PenSquare size={16} strokeWidth={2.2} />
                    {updatingId === plot.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={cancelEdit}
                    disabled={updatingId === plot.id}
                  >
                    <X size={16} strokeWidth={2.2} />
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => setSelectedPlot(plot)}
                  >
                    <Eye size={16} strokeWidth={2.2} />
                    View Details
                  </button>
                  <button type="button" className={primaryButtonClassName} onClick={() => startEdit(plot)}>
                    <PenSquare size={16} strokeWidth={2.2} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={darkButtonClassName}
                    onClick={() => onDelete(plot.id)}
                    disabled={deletingId === plot.id}
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                    {deletingId === plot.id ? "Deleting..." : "Delete"}
                  </button>
                </>
              )}
            </div>
          </article>
        );
      })}

      {selectedPlot ? (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => setSelectedPlot(null)}
        >
          <section
            className="modal-card rounded-3xl sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="plot-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <span className="card-icon">
                  {SelectedStatusIcon ? <SelectedStatusIcon size={18} strokeWidth={2.2} /> : null}
                </span>
                <div>
                  <h3 id="plot-detail-title" className="text-lg font-semibold text-ink">
                    {selectedPlot.name}
                  </h3>
                  <p className="mt-1 text-sm text-ink-muted">Detailed plot summary</p>
                </div>
              </div>

              <span className={detailBadgeClassName}>
                {SelectedStatusIcon ? <SelectedStatusIcon size={14} strokeWidth={2.2} /> : null}
                {selectedStatus?.label}
              </span>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-2">
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Area</strong>
                <p className="mt-1 text-sm text-ink-muted">{selectedPlot.area_hectares ?? "N/A"} ha</p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Soil Type</strong>
                <p className="mt-1 text-sm text-ink-muted">{selectedPlot.soil_type ?? "Not set"}</p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Status</strong>
                <p className="mt-1 text-sm text-ink-muted">{selectedStatus?.label}</p>
              </div>
              <div className={detailPanelClassName}>
                <strong className="text-sm font-semibold text-ink">Created</strong>
                <p className="mt-1 text-sm text-ink-muted">
                  {new Date(selectedPlot.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className={`${detailPanelClassName} sm:col-span-2`}>
                <strong className="text-sm font-semibold text-ink">Notes</strong>
                <p className="mt-1 text-sm text-ink-muted">{selectedPlot.notes ?? "No notes yet"}</p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-1">
              <button type="button" className={primaryButtonClassName} onClick={() => setSelectedPlot(null)}>
                Close
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
