import {
  CheckCircle2,
  CircleDashed,
  ClipboardList,
  Leaf,
  TimerReset,
} from "lucide-react";
import type { Task } from "../types";

type TaskListProps = {
  tasks: Task[];
  completingId: number | null;
  onComplete: (task: Task) => Promise<void>;
};

const formatDate = (value: string | null) => {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString();
};

const isOverdue = (task: Task) => {
  if (!task.due_on || task.status === "completed") {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(task.due_on);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < today;
};

// Purpose: render operational crop tasks with quick completion controls.
export default function TaskList({ tasks, completingId, onComplete }: TaskListProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => {
        const completed = task.status === "completed";
        const overdue = isOverdue(task);
        const StatusIcon = completed ? CheckCircle2 : overdue ? TimerReset : CircleDashed;

        return (
          <article key={task.id} className="preview-card interactive-lift rounded-3xl p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <span className="card-icon card-icon-soft">
                  <StatusIcon size={18} strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-ink">{task.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">
                    {task.crop?.name ?? "Crop unavailable"} · {task.crop?.plot?.name ?? "Plot unavailable"}
                  </p>
                </div>
              </div>

              <span className="card-chip">
                {completed ? "Completed" : overdue ? "Overdue" : "Pending"}
              </span>
            </div>

            <div className="mb-4 grid gap-3">
              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <ClipboardList size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Task Type</strong>
                </div>
                <p className="mt-1 text-sm capitalize text-ink-muted">{task.task_type}</p>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <TimerReset size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Due Date</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">{formatDate(task.due_on)}</p>
              </div>

              <div className="rounded-2xl border border-surface-border bg-surface-soft p-4">
                <div className="flex items-center gap-2">
                  <span className="card-icon card-icon-soft">
                    <Leaf size={16} strokeWidth={2.2} />
                  </span>
                  <strong className="text-sm font-semibold text-ink">Notes</strong>
                </div>
                <p className="mt-1 text-sm text-ink-muted">
                  {task.notes ?? "No notes yet"}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={completed || completingId === task.id}
              onClick={() => onComplete(task)}
            >
              <CheckCircle2 size={16} strokeWidth={2.2} />
              {completed ? "Already Complete" : completingId === task.id ? "Completing..." : "Mark Complete"}
            </button>
          </article>
        );
      })}
    </div>
  );
}
