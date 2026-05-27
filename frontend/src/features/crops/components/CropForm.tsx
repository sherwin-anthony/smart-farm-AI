import { PenSquare, Sprout, X } from "lucide-react";
import { useState } from "react";
import type { Plot } from "../../plots/types";
import {
  CROP_GROWTH_STAGE_OPTIONS,
  CROP_STATUS_OPTIONS,
} from "../options";
import type { CropGrowthStage, CropPayload, CropStatus } from "../types";

type CropFormProps = {
  plots: Plot[];
  onSubmit: (payload: CropPayload) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
};

type CropFormState = {
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

// Purpose: create a new crop record for the authenticated farm using a selected plot.
// Routing: rendered by CropsPage on /crops.
export default function CropForm({
  plots,
  onSubmit,
  onCancel,
  submitting,
}: CropFormProps) {
  const fieldClassName =
    "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";
  const primaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";
  const secondaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70";

  const createInitialForm = (): CropFormState => ({
    plot_id: plots[0]?.id.toString() ?? "",
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

  const [form, setForm] = useState(createInitialForm);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const plotId = form.plot_id || plots[0]?.id.toString() || "";

    // Normalize optional inputs to null so the backend receives a clean crop payload.
    await onSubmit({
      plot_id: Number(plotId),
      name: form.name.trim(),
      type: form.type.trim() ? form.type.trim() : null,
      variety: form.variety.trim() ? form.variety.trim() : null,
      status: form.status,
      growth_stage: form.growth_stage,
      planted_on: form.planted_on.trim() ? form.planted_on : null,
      expected_harvest_on: form.expected_harvest_on.trim()
        ? form.expected_harvest_on
        : null,
      actual_harvest_on: form.actual_harvest_on.trim()
        ? form.actual_harvest_on
        : null,
      notes: form.notes.trim() ? form.notes.trim() : null,
    });

    setForm(createInitialForm());
  };

  return (
    <section className="preview-card interactive-lift rounded-3xl p-5 sm:p-6">
      <div className="mb-5">
        <div className="flex items-start gap-3">
          <span className="card-icon">
            <Sprout size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-ink">Create Crop</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Add a planting record with its plot, lifecycle stage, timing, and notes.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="crop-plot" className="text-sm font-medium text-ink">
            Plot
          </label>
          <select
            className={fieldClassName}
            id="crop-plot"
            value={form.plot_id || plots[0]?.id.toString() || ""}
            onChange={(event) => setForm({ ...form, plot_id: event.target.value })}
            required
          >
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="crop-name" className="text-sm font-medium text-ink">
            Crop Name
          </label>
          <input
            className={fieldClassName}
            id="crop-name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            placeholder="e.g. Rice"
            required
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="crop-type" className="text-sm font-medium text-ink">
            Crop Type
          </label>
          <input
            className={fieldClassName}
            id="crop-type"
            value={form.type}
            onChange={(event) => setForm({ ...form, type: event.target.value })}
            placeholder="e.g. Grain"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="crop-variety" className="text-sm font-medium text-ink">
            Variety
          </label>
          <input
            className={fieldClassName}
            id="crop-variety"
            value={form.variety}
            onChange={(event) => setForm({ ...form, variety: event.target.value })}
            placeholder="e.g. RC64"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="crop-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            className={fieldClassName}
            id="crop-status"
            value={form.status}
            onChange={(event) =>
              // Narrow select values back to the locked crop status union used across the app.
              setForm({
                ...form,
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

        <div className="grid gap-1.5">
          <label htmlFor="crop-growth-stage" className="text-sm font-medium text-ink">
            Growth Stage
          </label>
          <select
            className={fieldClassName}
            id="crop-growth-stage"
            value={form.growth_stage}
            onChange={(event) =>
              // Narrow select values back to the locked crop stage union used across the app.
              setForm({
                ...form,
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

        <div className="grid gap-1.5">
          <label htmlFor="crop-planted-on" className="text-sm font-medium text-ink">
            Planted On
          </label>
          <input
            className={fieldClassName}
            id="crop-planted-on"
            type="date"
            value={form.planted_on}
            onChange={(event) => setForm({ ...form, planted_on: event.target.value })}
          />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="crop-expected-harvest-on"
            className="text-sm font-medium text-ink"
          >
            Expected Harvest
          </label>
          <input
            className={fieldClassName}
            id="crop-expected-harvest-on"
            type="date"
            value={form.expected_harvest_on}
            onChange={(event) =>
              setForm({ ...form, expected_harvest_on: event.target.value })
            }
          />
        </div>

        <div className="grid gap-1.5">
          <label
            htmlFor="crop-actual-harvest-on"
            className="text-sm font-medium text-ink"
          >
            Actual Harvest
          </label>
          <input
            className={fieldClassName}
            id="crop-actual-harvest-on"
            type="date"
            value={form.actual_harvest_on}
            onChange={(event) =>
              setForm({ ...form, actual_harvest_on: event.target.value })
            }
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="crop-notes" className="text-sm font-medium text-ink">
            Notes
          </label>
          <textarea
            className={fieldClassName}
            id="crop-notes"
            rows={4}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Useful crop notes..."
          />
        </div>

        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
          <button type="submit" className={primaryButtonClassName} disabled={submitting}>
            <PenSquare size={16} strokeWidth={2.2} />
            {submitting ? "Saving..." : "Create Crop"}
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
