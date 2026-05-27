import axios from "axios";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  ClipboardList,
  Leaf,
  Sparkles,
  Wheat,
} from "lucide-react";
import { useEffect, useState } from "react";
import EmptyState from "../components/ui/EmptyState";
import Loader from "../components/ui/Loader";
import PageHeader from "../components/ui/PageHeader";
import StatCard from "../components/ui/StatCard";
import { getDashboardOverview } from "../features/dashboard/api";
import type { DashboardOverview } from "../features/dashboard/types";

const getErrorMessage = (value: unknown, fallback: string) => {
  // Surface Laravel messages when auth or farm setup blocks the dashboard.
  if (axios.isAxiosError(value)) {
    return value.response?.data?.message ?? fallback;
  }

  return fallback;
};

// Purpose: live dashboard overview connected to crop, task, and yield data.
export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOverview = async () => {
      try {
        setLoading(true);
        setError("");
        setOverview(await getDashboardOverview());
      } catch (loadError) {
        console.error(loadError);
        setError(getErrorMessage(loadError, "Could not load dashboard overview."));
      } finally {
        setLoading(false);
      }
    };

    loadOverview();
  }, []);

  const stats = overview
    ? [
        {
          label: "Total crops",
          value: overview.total_crops.toString(),
          note: "Crop records inside your authenticated farm.",
          icon: Leaf,
          strong: true,
        },
        {
          label: "Growing",
          value: overview.active_crops.toString(),
          note: "Crops currently marked as growing.",
          icon: Sparkles,
        },
        {
          label: "Ready",
          value: overview.ready_to_harvest.toString(),
          note: "Crops marked ready for harvest.",
          icon: Wheat,
        },
        {
          label: "Pending tasks",
          value: overview.pending_tasks.toString(),
          note: "Crop tasks still waiting for action.",
          icon: ClipboardList,
        },
      ]
    : [];

  return (
    <div className="stack">
      <PageHeader
        title="Dashboard"
        description="Live farm command center for crop progress, task pressure, and latest yield signals."
      />

      {loading ? <Loader /> : null}
      {error ? <p className="text-danger">{error}</p> : null}

      {!loading && !error && overview ? (
        <>
          <section className="module-hero">
            <div className="module-hero-copy">
              <span className="card-chip">Farm pulse</span>
              <span className="card-icon">
                <Bot size={24} strokeWidth={2.2} />
              </span>
              <div>
                <h2>Your crop system is connected</h2>
                <p>
                  Crops, tasks, and yield predictions now feed this overview from the backend.
                </p>
              </div>
            </div>
          </section>

          <section className="grid-cards">
            {stats.map((stat) => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                note={stat.note}
                icon={stat.icon}
                strong={stat.strong}
              />
            ))}
          </section>

          <section className="module-grid">
            <article className="feature-card feature-card-strong">
              <span className="card-icon">
                <CheckCircle2 size={18} strokeWidth={2.2} />
              </span>
              <h3 className="card-title">Operational Status</h3>
              <p className="card-copy">
                {overview.pending_tasks > 0
                  ? `${overview.pending_tasks} task${overview.pending_tasks === 1 ? "" : "s"} need attention.`
                  : "No pending crop tasks right now."}
              </p>
            </article>

            <article className="feature-card">
              <span className="card-icon card-icon-soft">
                <BarChart3 size={18} strokeWidth={2.2} />
              </span>
              <h3 className="card-title">Latest Yield Signal</h3>
              <p className="card-copy">
                {overview.latest_prediction
                  ? "A recent yield prediction is available in the yield module."
                  : "No yield prediction has been saved yet."}
              </p>
            </article>
          </section>
        </>
      ) : null}

      {!loading && !error && !overview ? (
        <EmptyState title="No dashboard data" description="Create crops and tasks to build the farm overview." />
      ) : null}
    </div>
  );
}
