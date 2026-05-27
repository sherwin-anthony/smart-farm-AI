import axios from "axios";
import {
  AlertTriangle,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  ClipboardPlus,
  Filter,
  TimerReset,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { listCrops } from "../features/crops/api";
import type { Crop } from "../features/crops/types";
import { listPlots } from "../features/plots/api";
import type { Plot } from "../features/plots/types";
import { createTask, deleteTask, listTasks, updateTask } from "../features/tasks/api";
import TaskForm from "../features/tasks/components/TaskForm";
import TaskList from "../features/tasks/components/TaskList";
import {
  TASK_PRIORITY_OPTIONS,
  TASK_SOURCE_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "../features/tasks/options";
import type { Task, TaskPayload } from "../features/tasks/types";

type DueFilter = "all" | "today" | "overdue";

type TaskFilters = {
  status: string;
  priority: string;
  source: string;
  plot_id: string;
  crop_id: string;
  due: DueFilter;
};

const getErrorMessage = (value: unknown, fallback: string) => {
  // Normalize API errors so backend validation messages can surface in the UI.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

const isClosed = (task: Task) => task.status === "completed" || task.status === "cancelled";

const getStartOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const isDueToday = (task: Task) => {
  if (!task.due_on || isClosed(task)) {
    return false;
  }

  const dueDate = new Date(task.due_on);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate.getTime() === getStartOfToday().getTime();
};

const isOverdue = (task: Task) => {
  if (!task.due_on || isClosed(task)) {
    return false;
  }

  const dueDate = new Date(task.due_on);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate < getStartOfToday();
};

const sortTasks = (tasks: Task[]) => {
  const statusRank = (task: Task) => {
    if (isOverdue(task)) {
      return 0;
    }

    if (isDueToday(task)) {
      return 1;
    }

    if (task.status === "pending" || task.status === "in_progress") {
      return 2;
    }

    return 3;
  };

  return [...tasks].sort((first, second) => {
    const statusDifference = statusRank(first) - statusRank(second);

    if (statusDifference !== 0) {
      return statusDifference;
    }

    return (first.due_on ?? "9999-12-31").localeCompare(second.due_on ?? "9999-12-31");
  });
};

// Purpose: execution layer for farm-wide, plot-specific, and crop-specific tasks.
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [plots, setPlots] = useState<Plot[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [completingId, setCompletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<TaskFilters>({
    status: "all",
    priority: "all",
    source: "all",
    plot_id: "all",
    crop_id: "all",
    due: "all",
  });

  const loadTaskWorkspace = async () => {
    try {
      setLoading(true);
      setError("");

      const [taskResponse, plotResponse, cropResponse] = await Promise.all([
        listTasks(),
        listPlots(),
        listCrops(),
      ]);

      setTasks(taskResponse);
      setPlots(plotResponse);
      setCrops(cropResponse);
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Could not load task workspace."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTaskWorkspace();
  }, []);

  const summary = useMemo(
    () => ({
      pending: tasks.filter((task) => task.status === "pending" || task.status === "in_progress").length,
      dueToday: tasks.filter(isDueToday).length,
      overdue: tasks.filter(isOverdue).length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const filtered = tasks.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status) {
        return false;
      }

      if (filters.priority !== "all" && task.priority !== filters.priority) {
        return false;
      }

      if (filters.source !== "all" && task.source !== filters.source) {
        return false;
      }

      if (filters.plot_id !== "all" && task.plot_id !== Number(filters.plot_id)) {
        return false;
      }

      if (filters.crop_id !== "all" && task.crop_id !== Number(filters.crop_id)) {
        return false;
      }

      if (filters.due === "today" && !isDueToday(task)) {
        return false;
      }

      if (filters.due === "overdue" && !isOverdue(task)) {
        return false;
      }

      return true;
    });

    return sortTasks(filtered);
  }, [filters, tasks]);

  const clearFilters = () => {
    setFilters({
      status: "all",
      priority: "all",
      source: "all",
      plot_id: "all",
      crop_id: "all",
      due: "all",
    });
  };

  const handleCreate = async (payload: TaskPayload) => {
    try {
      setSubmitting(true);
      setError("");
      await createTask(payload);
      setShowCreateForm(false);
      await loadTaskWorkspace();
    } catch (createError) {
      console.error(createError);
      setError(getErrorMessage(createError, "Could not create task."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: number, payload: TaskPayload) => {
    try {
      setUpdatingId(id);
      setError("");
      await updateTask(id, payload);
      await loadTaskWorkspace();
    } catch (updateError) {
      console.error(updateError);
      setError(getErrorMessage(updateError, "Could not update task."));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      setError("");
      await deleteTask(id);
      await loadTaskWorkspace();
    } catch (deleteError) {
      console.error(deleteError);
      setError(getErrorMessage(deleteError, "Could not delete task."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleComplete = async (task: Task) => {
    try {
      setCompletingId(task.id);
      setError("");
      await updateTask(task.id, {
        status: "completed",
      });
      await loadTaskWorkspace();
    } catch (completeError) {
      console.error(completeError);
      setError(getErrorMessage(completeError, "Could not complete task."));
    } finally {
      setCompletingId(null);
    }
  };

  return (
    <div className="stack">
      <PageHeader
        title="Tasks"
        description="Manage farm-wide, plot-specific, and crop-specific work from one operational queue."
      />

      {error ? <p className="text-danger">{error}</p> : null}

      <section className="grid-cards">
        <StatCard
          label="Pending"
          value={summary.pending}
          note="Open task pressure."
          icon={ClipboardList}
          strong
        />
        <StatCard label="Due today" value={summary.dueToday} note="Needs action now." icon={CalendarCheck2} />
        <StatCard label="Overdue" value={summary.overdue} note="Past due and open." icon={AlertTriangle} />
        <StatCard label="Completed" value={summary.completed} note="Finished work." icon={CheckCircle2} />
      </section>

      {!showCreateForm ? (
        <div className="flex items-center justify-start">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-primary-500"
            onClick={() => setShowCreateForm(true)}
          >
            <ClipboardPlus size={18} strokeWidth={2.2} />
            Create Task
          </button>
        </div>
      ) : (
        <TaskForm
          plots={plots}
          crops={crops}
          onSubmit={handleCreate}
          onCancel={() => setShowCreateForm(false)}
          submitting={submitting}
        />
      )}

      <section className="preview-card rounded-3xl p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="card-icon card-icon-soft">
            <Filter size={18} strokeWidth={2.2} />
          </span>
          <h3 className="text-lg font-semibold text-ink">Filters</h3>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <select
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm"
            value={filters.status}
            onChange={(event) => setFilters({ ...filters, status: event.target.value })}
          >
            <option value="all">All status</option>
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm"
            value={filters.priority}
            onChange={(event) => setFilters({ ...filters, priority: event.target.value })}
          >
            <option value="all">All priority</option>
            {TASK_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm"
            value={filters.due}
            onChange={(event) => setFilters({ ...filters, due: event.target.value as DueFilter })}
          >
            <option value="all">All due dates</option>
            <option value="today">Due today</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm"
            value={filters.source}
            onChange={(event) => setFilters({ ...filters, source: event.target.value })}
          >
            <option value="all">All sources</option>
            {TASK_SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm"
            value={filters.plot_id}
            onChange={(event) => setFilters({ ...filters, plot_id: event.target.value })}
          >
            <option value="all">All plots</option>
            {plots.map((plot) => (
              <option key={plot.id} value={plot.id}>
                {plot.name}
              </option>
            ))}
          </select>

          <select
            className="w-full rounded-2xl border border-surface-border bg-surface-card px-4 py-3 text-sm text-ink shadow-sm"
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

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-border bg-surface-card px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:bg-primary-50"
            onClick={clearFilters}
          >
            <TimerReset size={16} strokeWidth={2.2} />
            Clear Filters
          </button>
        </div>
      </section>

      {loading ? (
        <Loader />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create the first farm, plot, or crop task to start the execution queue."
        />
      ) : filteredTasks.length === 0 ? (
        <EmptyState title="No matching tasks" description="Adjust filters to bring tasks back into view." />
      ) : (
        <TaskList
          tasks={filteredTasks}
          plots={plots}
          crops={crops}
          completingId={completingId}
          updatingId={updatingId}
          deletingId={deletingId}
          onComplete={handleComplete}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
