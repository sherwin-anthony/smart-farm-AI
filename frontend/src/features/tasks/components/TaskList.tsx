import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Leaf,
  PenSquare,
  Trash2,
  X,
} from "lucide-react";
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
import type {
  Task,
  TaskPayload,
  TaskPriority,
  TaskSource,
  TaskStatus,
  TaskType,
} from "../types";

type TaskListProps = {
  tasks: Task[];
  plots: Plot[];
  crops: Crop[];
  completingId: number | null;
  updatingId: number | null;
  deletingId: number | null;
  onComplete: (task: Task) => Promise<void>;
  onUpdate: (id: number, payload: TaskPayload) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
};

type TaskScope = "farm" | "plot" | "crop";

type TaskDraft = {
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

const fieldClassName =
  "w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm transition focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-200/70";
const primaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-progress disabled:opacity-70";
const secondaryButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-4 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-70";
const darkButtonClassName =
  "inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70";
const detailBadgeClassName =
  "inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-primary-100 px-3 py-1 text-xs font-semibold tracking-wide text-ink";
const detailPanelClassName =
  "rounded-2xl border border-surface-border bg-surface-soft p-4";

const formatDate = (value: string | null) => {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString();
};

const toInputDate = (value: string | null) => (value ? value.slice(0, 10) : "");

const optionLabel = (options: { value: string; label: string }[], value: string) =>
  options.find((option) => option.value === value)?.label ?? value.replaceAll("_", " ");

const isOverdue = (task: Task) => {
  if (!task.due_on || task.status === "completed" || task.status === "cancelled") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.due_on);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

const getLocationText = (task: Task) => {
  if (task.crop) {
    const plotName = task.plot?.name ?? task.crop.plot?.name ?? "Plot not set";
    return `${task.crop.name} - ${plotName}`;
  }

  if (task.plot) {
    return `Plot: ${task.plot.name}`;
  }

  return "Farm-wide";
};

const getScope = (task: Task): TaskScope => {
  if (task.crop_id) {
    return "crop";
  }

  if (task.plot_id) {
    return "plot";
  }

  return "farm";
};

const normalizeType = (value: string): TaskType =>
  TASK_TYPE_OPTIONS.some((option) => option.value === value) ? (value as TaskType) : "custom";

const normalizePriority = (value: string): TaskPriority =>
  TASK_PRIORITY_OPTIONS.some((option) => option.value === value) ? (value as TaskPriority) : "medium";

const normalizeStatus = (value: string): TaskStatus =>
  TASK_STATUS_OPTIONS.some((option) => option.value === value) ? (value as TaskStatus) : "pending";

const normalizeSource = (value: string): TaskSource =>
  TASK_SOURCE_OPTIONS.some((option) => option.value === value) ? (value as TaskSource) : "manual";

// Purpose: render task rows with inline edit, completion, and delete controls.
export default function TaskList({
  tasks,
  plots,
  crops,
  completingId,
  updatingId,
  deletingId,
  onComplete,
  onUpdate,
  onDelete,
}: TaskListProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<TaskDraft>({
    scope: "farm",
    plot_id: "",
    crop_id: "",
    title: "",
    description: "",
    task_type: "monitoring",
    priority: "medium",
    status: "pending",
    source: "manual",
    due_on: "",
    notes: "",
  });

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setDraft({
      scope: getScope(task),
      plot_id: task.plot_id?.toString() ?? plots[0]?.id.toString() ?? "",
      crop_id: task.crop_id?.toString() ?? crops[0]?.id.toString() ?? "",
      title: task.title,
      description: task.description ?? "",
      task_type: normalizeType(task.task_type),
      priority: normalizePriority(task.priority),
      status: normalizeStatus(task.status),
      source: normalizeSource(task.source),
      due_on: toInputDate(task.due_on),
      notes: task.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({
      scope: "farm",
      plot_id: "",
      crop_id: "",
      title: "",
      description: "",
      task_type: "monitoring",
      priority: "medium",
      status: "pending",
      source: "manual",
      due_on: "",
      notes: "",
    });
  };

  const saveEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingId === null) {
      return;
    }

    const selectedCrop = crops.find((crop) => crop.id.toString() === draft.crop_id);

    await onUpdate(editingId, {
      plot_id:
        draft.scope === "plot"
          ? Number(draft.plot_id)
          : draft.scope === "crop"
            ? selectedCrop?.plot_id ?? null
            : null,
      crop_id: draft.scope === "crop" ? Number(draft.crop_id) : null,
      title: draft.title.trim(),
      description: draft.description.trim() ? draft.description.trim() : null,
      task_type: draft.task_type,
      priority: draft.priority,
      status: draft.status,
      source: draft.source,
      due_on: draft.due_on.trim() ? draft.due_on : null,
      notes: draft.notes.trim() ? draft.notes.trim() : null,
    });

    cancelEdit();
  };

  return (
    <div className="grid gap-3">
      {tasks.map((task) => {
        const completed = task.status === "completed";
        const cancelled = task.status === "cancelled";
        const overdue = isOverdue(task);
        const StatusIcon = completed ? CheckCircle2 : overdue ? CircleDashed : ClipboardList;

        return (
          <article key={task.id} className="preview-card interactive-lift rounded-3xl p-5">
            {editingId === task.id ? (
              <form onSubmit={saveEdit} className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <label htmlFor={`task-scope-${task.id}`} className="text-sm font-medium text-ink">
                      Scope
                    </label>
                    <select
                      id={`task-scope-${task.id}`}
                      className={fieldClassName}
                      value={draft.scope}
                      onChange={(event) =>
                        setDraft({ ...draft, scope: event.target.value as TaskScope })
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

                  {draft.scope === "plot" ? (
                    <div className="grid gap-1.5 sm:col-span-2">
                      <label htmlFor={`task-plot-${task.id}`} className="text-sm font-medium text-ink">
                        Plot
                      </label>
                      <select
                        id={`task-plot-${task.id}`}
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
                  ) : null}

                  {draft.scope === "crop" ? (
                    <div className="grid gap-1.5 sm:col-span-2">
                      <label htmlFor={`task-crop-${task.id}`} className="text-sm font-medium text-ink">
                        Crop
                      </label>
                      <select
                        id={`task-crop-${task.id}`}
                        className={fieldClassName}
                        value={draft.crop_id}
                        onChange={(event) => setDraft({ ...draft, crop_id: event.target.value })}
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
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid gap-1.5 sm:col-span-2">
                    <label htmlFor={`task-title-${task.id}`} className="text-sm font-medium text-ink">
                      Title
                    </label>
                    <input
                      id={`task-title-${task.id}`}
                      className={fieldClassName}
                      value={draft.title}
                      onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-1.5 sm:col-span-2">
                    <label
                      htmlFor={`task-description-${task.id}`}
                      className="text-sm font-medium text-ink"
                    >
                      Description
                    </label>
                    <textarea
                      id={`task-description-${task.id}`}
                      className={fieldClassName}
                      rows={3}
                      value={draft.description}
                      onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                    />
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor={`task-type-${task.id}`} className="text-sm font-medium text-ink">
                      Type
                    </label>
                    <select
                      id={`task-type-${task.id}`}
                      className={fieldClassName}
                      value={draft.task_type}
                      onChange={(event) =>
                        setDraft({ ...draft, task_type: event.target.value as TaskType })
                      }
                    >
                      {TASK_TYPE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label
                      htmlFor={`task-priority-${task.id}`}
                      className="text-sm font-medium text-ink"
                    >
                      Priority
                    </label>
                    <select
                      id={`task-priority-${task.id}`}
                      className={fieldClassName}
                      value={draft.priority}
                      onChange={(event) =>
                        setDraft({ ...draft, priority: event.target.value as TaskPriority })
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
                    <label htmlFor={`task-status-${task.id}`} className="text-sm font-medium text-ink">
                      Status
                    </label>
                    <select
                      id={`task-status-${task.id}`}
                      className={fieldClassName}
                      value={draft.status}
                      onChange={(event) =>
                        setDraft({ ...draft, status: event.target.value as TaskStatus })
                      }
                    >
                      {TASK_STATUS_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor={`task-source-${task.id}`} className="text-sm font-medium text-ink">
                      Source
                    </label>
                    <select
                      id={`task-source-${task.id}`}
                      className={fieldClassName}
                      value={draft.source}
                      onChange={(event) =>
                        setDraft({ ...draft, source: event.target.value as TaskSource })
                      }
                    >
                      {TASK_SOURCE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-1.5">
                    <label htmlFor={`task-due-${task.id}`} className="text-sm font-medium text-ink">
                      Due Date
                    </label>
                    <input
                      id={`task-due-${task.id}`}
                      className={fieldClassName}
                      type="date"
                      value={draft.due_on}
                      onChange={(event) => setDraft({ ...draft, due_on: event.target.value })}
                    />
                  </div>

                  <div className="grid gap-1.5 sm:col-span-2">
                    <label htmlFor={`task-notes-${task.id}`} className="text-sm font-medium text-ink">
                      Notes
                    </label>
                    <textarea
                      id={`task-notes-${task.id}`}
                      className={fieldClassName}
                      rows={3}
                      value={draft.notes}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="submit"
                    className={primaryButtonClassName}
                    disabled={updatingId === task.id}
                  >
                    <PenSquare size={16} strokeWidth={2.2} />
                    {updatingId === task.id ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={cancelEdit}
                    disabled={updatingId === task.id}
                  >
                    <X size={16} strokeWidth={2.2} />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.15fr_1.35fr_auto] lg:items-center">
                <div className="flex items-start gap-3">
                  <span className="card-icon card-icon-soft">
                    <StatusIcon size={18} strokeWidth={2.2} />
                  </span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-ink">{task.title}</h3>
                      <span className={detailBadgeClassName}>
                        {overdue ? "Overdue" : optionLabel(TASK_STATUS_OPTIONS, task.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{getLocationText(task)}</p>
                    {task.description ? (
                      <p className="mt-2 text-sm text-ink-muted">{task.description}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className={detailPanelClassName}>
                    <strong className="text-sm font-semibold text-ink">Type</strong>
                    <p className="mt-1 text-sm capitalize text-ink-muted">
                      {optionLabel(TASK_TYPE_OPTIONS, task.task_type)}
                    </p>
                  </div>
                  <div className={detailPanelClassName}>
                    <strong className="text-sm font-semibold text-ink">Priority</strong>
                    <p className="mt-1 text-sm capitalize text-ink-muted">
                      {optionLabel(TASK_PRIORITY_OPTIONS, task.priority)}
                    </p>
                  </div>
                  <div className={detailPanelClassName}>
                    <strong className="text-sm font-semibold text-ink">Due</strong>
                    <p className="mt-1 text-sm text-ink-muted">{formatDate(task.due_on)}</p>
                  </div>
                  <div className={detailPanelClassName}>
                    <strong className="text-sm font-semibold text-ink">Source</strong>
                    <p className="mt-1 text-sm capitalize text-ink-muted">
                      {optionLabel(TASK_SOURCE_OPTIONS, task.source)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[20rem]">
                  <button
                    type="button"
                    className={primaryButtonClassName}
                    disabled={completed || cancelled || completingId === task.id}
                    onClick={() => onComplete(task)}
                  >
                    <CheckCircle2 size={16} strokeWidth={2.2} />
                    {completed ? "Complete" : completingId === task.id ? "Saving..." : "Done"}
                  </button>
                  <button
                    type="button"
                    className={secondaryButtonClassName}
                    onClick={() => startEdit(task)}
                    disabled={deletingId === task.id}
                  >
                    <PenSquare size={16} strokeWidth={2.2} />
                    Edit
                  </button>
                  <button
                    type="button"
                    className={darkButtonClassName}
                    onClick={() => onDelete(task.id)}
                    disabled={deletingId === task.id}
                  >
                    <Trash2 size={16} strokeWidth={2.2} />
                    {deletingId === task.id ? "Deleting..." : "Delete"}
                  </button>
                </div>

                {task.notes ? (
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-surface-border bg-surface-soft p-4">
                      <span className="card-icon card-icon-soft">
                        <Leaf size={16} strokeWidth={2.2} />
                      </span>
                      <p className="text-sm text-ink-muted">{task.notes}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}
