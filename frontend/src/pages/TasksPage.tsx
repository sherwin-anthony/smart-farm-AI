import axios from "axios";
import { ClipboardList } from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import { listTasks, updateTask } from "../features/tasks/api";
import TaskList from "../features/tasks/components/TaskList";
import type { Task } from "../features/tasks/types";

const getErrorMessage = (value: unknown, fallback: string) => {
  // Normalize API errors so backend validation messages can surface in the UI.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

// Purpose: real task board for crop-generated and manual farm work.
export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completingId, setCompletingId] = useState<number | null>(null);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");
      setTasks(await listTasks());
    } catch (loadError) {
      console.error(loadError);
      setError(getErrorMessage(loadError, "Could not load tasks."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (task: Task) => {
    try {
      setCompletingId(task.id);
      setError("");
      await updateTask(task.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
      await loadTasks();
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
        description="Review crop work, auto-generated reminders, and field actions that need attention."
      />

      <section className="module-hero">
        <div className="module-hero-copy">
          <span className="card-chip">Crop operations</span>
          <span className="card-icon">
            <ClipboardList size={24} strokeWidth={2.2} />
          </span>
          <div>
            <h2>Daily work generated from your crops</h2>
            <p>
              New crop records can now create monitoring, watering, fertilizer, and harvest tasks automatically.
            </p>
          </div>
        </div>
      </section>

      {error ? <p className="text-danger">{error}</p> : null}

      {loading ? (
        <Loader />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          description="Create a crop to generate starter tasks, or add manual task creation in the next operations pass."
        />
      ) : (
        <TaskList tasks={tasks} completingId={completingId} onComplete={handleComplete} />
      )}
    </div>
  );
}
