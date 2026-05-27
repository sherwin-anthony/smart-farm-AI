import { ClipboardPlus, PenSquare, X } from "lucide-react";
import type { FormEvent } from "react";
import { useState } from "react";
import type { Crop } from "../../crops/types";
import type { Plot } from "../../plots/types";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_SOURCE_OPTIONS,
  TASK_STATUS_OPTIONS,
  TASK_TYPE_OPTIONS,
} from "../options";
import type { TaskPayload, TaskPriority, TaskSource, TaskStatus, TaskType } from "../types";

type TaskFormProps = {
  plots: Plot[];
  crops: Crop[];
  onSubmit: (payload: TaskPayload) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
};

type TaskScope = "farm" | "plot" | "crop";

type TaskFormState = {
  scope: TaskScope;
  plot_id: string;
  crop_id: string;
  title: string;
  description: string;
  task_type: TaskType;
  priority: TaskPriority;
  status: TaskStatus;
  source: TaskSource;
  due_on: string;
  notes: string;
};

const createInitialForm = (plots: Plot[], crops: Crop[]): TaskFormState => ({
  scope: "farm",
  plot_id: plots[0]?.id.toString() ?? "",
  crop_id: crops[0]?.id.toString() ?? "",
  title: "",
  description: "",
  task_type: "monitoring",
  priority: "medium",
  status: "pending",
  source: "manual",
  due_on: "",
  notes: "",
});

// Purpose: create farm-wide, plot-specific, or crop-specific work for the active farm.
export default function TaskForm({
  plots,
  crops,
  onSubmit,
  onCancel,
  submitting,
}: TaskFormProps) {
  const fieldClassName =
    "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";
  const primaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";
  const secondaryButtonClassName =
    "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70";

  const [form, setForm] = useState<TaskFormState>(() => createInitialForm(plots, crops));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const plotId = form.plot_id || plots[0]?.id.toString() || "";
    const cropId = form.crop_id || crops[0]?.id.toString() || "";
    const selectedCrop = crops.find((crop) => crop.id.toString() === cropId);

    await onSubmit({
      plot_id:
        form.scope === "plot"
          ? Number(plotId)
          : form.scope === "crop"
            ? selectedCrop?.plot_id ?? null
            : null,
      crop_id: form.scope === "crop" ? Number(cropId) : null,
      title: form.title.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      task_type: form.task_type,
      priority: form.priority,
      status: form.status,
      source: form.source,
      due_on: form.due_on.trim() ? form.due_on : null,
      notes: form.notes.trim() ? form.notes.trim() : null,
    });

    setForm(createInitialForm(plots, crops));
  };

  return (
    <section className="preview-card interactive-lift rounded-3xl p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="card-icon">
          <ClipboardPlus size={18} strokeWidth={2.2} />
        </span>
        <div>
          <h3 className="text-lg font-semibold text-ink">Create Task</h3>
          <p className="mt-1 text-sm text-ink-muted">
            Add field work for the whole farm, one plot, or one crop.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="task-scope" className="text-sm font-medium text-ink">
            Scope
          </label>
          <select
            id="task-scope"
            className={fieldClassName}
            value={form.scope}
            onChange={(event) =>
              setForm({
                ...form,
                scope: event.target.value as TaskScope,
                plot_id: form.plot_id || plots[0]?.id.toString() || "",
                crop_id: form.crop_id || crops[0]?.id.toString() || "",
              })
            }
          >
            <option value="farm">Farm-wide</option>
            <option value="plot" disabled={plots.length === 0}>
              Plot
            </option>
            <option value="crop" disabled={crops.length === 0}>
              Crop
            </option>
          </select>
        </div>

        {form.scope === "plot" ? (
          <div className="grid gap-1.5">
            <label htmlFor="task-plot" className="text-sm font-medium text-ink">
              Plot
            </label>
            <select
              id="task-plot"
              className={fieldClassName}
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
        ) : null}

        {form.scope === "crop" ? (
          <div className="grid gap-1.5">
            <label htmlFor="task-crop" className="text-sm font-medium text-ink">
              Crop
            </label>
            <select
              id="task-crop"
              className={fieldClassName}
              value={form.crop_id || crops[0]?.id.toString() || ""}
              onChange={(event) => setForm({ ...form, crop_id: event.target.value })}
              required
            >
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="task-title" className="text-sm font-medium text-ink">
            Title
          </label>
          <input
            id="task-title"
            className={fieldClassName}
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Inspect irrigation"
            required
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="task-description" className="text-sm font-medium text-ink">
            Description
          </label>
          <textarea
            id="task-description"
            className={fieldClassName}
            rows={3}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Short task context..."
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="task-type" className="text-sm font-medium text-ink">
            Type
          </label>
          <select
            id="task-type"
            className={fieldClassName}
            value={form.task_type}
            onChange={(event) => setForm({ ...form, task_type: event.target.value as TaskType })}
          >
            {TASK_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="task-priority" className="text-sm font-medium text-ink">
            Priority
          </label>
          <select
            id="task-priority"
            className={fieldClassName}
            value={form.priority}
            onChange={(event) =>
              setForm({ ...form, priority: event.target.value as TaskPriority })
            }
          >
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="task-status" className="text-sm font-medium text-ink">
            Status
          </label>
          <select
            id="task-status"
            className={fieldClassName}
            value={form.status}
            onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="task-source" className="text-sm font-medium text-ink">
            Source
          </label>
          <select
            id="task-source"
            className={fieldClassName}
            value={form.source}
            onChange={(event) => setForm({ ...form, source: event.target.value as TaskSource })}
          >
            {TASK_SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="task-due-on" className="text-sm font-medium text-ink">
            Due Date
          </label>
          <input
            id="task-due-on"
            className={fieldClassName}
            type="date"
            value={form.due_on}
            onChange={(event) => setForm({ ...form, due_on: event.target.value })}
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2">
          <label htmlFor="task-notes" className="text-sm font-medium text-ink">
            Notes
          </label>
          <textarea
            id="task-notes"
            className={fieldClassName}
            rows={3}
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Operational notes..."
          />
        </div>

        <div className="grid gap-2 sm:col-span-2 sm:grid-cols-2">
          <button type="submit" className={primaryButtonClassName} disabled={submitting}>
            <PenSquare size={16} strokeWidth={2.2} />
            {submitting ? "Saving..." : "Create Task"}
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
