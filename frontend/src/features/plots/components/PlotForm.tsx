import { MapPinned, PenSquare, X } from "lucide-react";
import { useState } from "react";
import { PLOT_STATUS_OPTIONS, SOIL_TYPE_OPTIONS } from "../options";
import type { PlotPayload } from "../types";

type PlotFormProps = {
  onSubmit: (payload: PlotPayload) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
};

// Purpose: create a new plot for the authenticated farm.
// Routing: rendered by PlotsPage on /plots.
export default function PlotForm({ onSubmit, onCancel, submitting }: PlotFormProps) {
  const fieldClassName =
    "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";
  const primaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";
  const secondaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70";

  const [form, setForm] = useState({
    name: "",
    area_hectares: "",
    soil_type: "",
    status: "active",
    notes: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    await onSubmit({
      name: form.name,
      area_hectares: form.area_hectares.trim() ? Number(form.area_hectares) : null,
      soil_type: form.soil_type.trim() ? form.soil_type : null,
      status: form.status,
      notes: form.notes.trim() ? form.notes : null,
    });

    setForm({
      name: "",
      area_hectares: "",
      soil_type: "",
      status: "active",
      notes: "",
    });
  };

  return (
    <section className="preview-card interactive-lift rounded-3xl p-5 sm:p-6">
      <div className="mb-5">
        <div className="flex items-start gap-3">
          <span className="card-icon">
            <MapPinned size={18} strokeWidth={2.2} />
          </span>
          <div>
          <h3 className="text-lg font-semibold text-ink">Create Plot</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Add a new farm section with its area, soil, and current status.
          </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="plot-name" className="text-sm font-medium text-ink">
            Plot Name
          </label>
          <input
            className={fieldClassName}
            id="plot-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. North Rice Block"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="plot-area" className="text-sm font-medium text-ink">
            Area (hectares)
          </label>
          <input
            className={fieldClassName}
            id="plot-area"
            type="number"
            step="0.01"
            value={form.area_hectares}
            onChange={(event) => setForm({ ...form, area_hectares: event.target.value })}
            placeholder="e.g. 1.25"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="plot-soil" className="text-sm font-medium text-ink">
            Soil Type
          </label>
          <select
            className={fieldClassName}
            id="plot-soil"
            value={form.soil_type}
            onChange={(event) => setForm({ ...form, soil_type: event.target.value })}
          >
            {SOIL_TYPE_OPTIONS.map((option) => (
              <option key={option.value || "empty"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="plot-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            className={fieldClassName}
            id="plot-status"
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          >
            {PLOT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="plot-notes" className="text-sm font-medium text-ink">
            Notes
          </label>
          <textarea
            className={fieldClassName}
            id="plot-notes"
            rows={4}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Useful plot notes..."
          />
        </div>

        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
          <button type="submit" className={primaryButtonClassName} disabled={submitting}>
            <PenSquare size={16} strokeWidth={2.2} />
            {submitting ? "Saving..." : "Create Plot"}
          </button>
          <button
            type="button"
            className={secondaryButtonClassName}
            onClick={onCancel}
            disabled={submitting}
          >
            <X size={16} strokeWidth={2.2} />
            Cancel
          </button>
        </div>
      </form>
    </section>
  );
}
