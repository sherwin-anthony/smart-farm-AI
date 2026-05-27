import { CalendarDays, Flag, Sprout, TimerReset, Wheat } from "lucide-react";
import type { Task } from "../../tasks/types";
import type { Crop } from "../types";

type CropTimelineProps = {
  crops: Crop[];
  tasks?: Task[];
};

type TimelineItem = {
  id: string;
  date: string;
  title: string;
  meta: string;
  kind: "planted" | "today" | "harvest" | "task";
};

const formatDate = (value: string) => new Date(value).toLocaleDateString();

const getIcon = (kind: TimelineItem["kind"]) => {
  if (kind === "planted") {
    return Sprout;
  }

  if (kind === "harvest") {
    return Wheat;
  }

  if (kind === "task") {
    return TimerReset;
  }

  return Flag;
};

// Purpose: combine crop dates and crop task dates into one lightweight operational timeline.
export default function CropTimeline({ crops, tasks = [] }: CropTimelineProps) {
  const today = new Date().toISOString().slice(0, 10);

  const cropItems = crops.flatMap<TimelineItem>((crop) => {
    const items: TimelineItem[] = [];

    if (crop.planted_on) {
      items.push({
        id: `crop-${crop.id}-planted`,
        date: crop.planted_on,
        title: `${crop.name} planted`,
        meta: crop.plot?.name ?? "Plot unavailable",
        kind: "planted",
      });
    }

    if (crop.expected_harvest_on) {
      items.push({
        id: `crop-${crop.id}-harvest`,
        date: crop.expected_harvest_on,
        title: `${crop.name} expected harvest`,
        meta: crop.status === "harvested" ? "Harvested" : "Upcoming harvest window",
        kind: "harvest",
      });
    }

    return items;
  });

  const taskItems = tasks
    .filter((task) => task.due_on)
    .map<TimelineItem>((task) => ({
      id: `task-${task.id}`,
      date: task.due_on ?? today,
      title: task.title,
      meta: task.crop?.name ?? "Crop task",
      kind: "task",
    }));

  const items = [
    ...cropItems,
    ...taskItems,
    {
      id: "today",
      date: today,
      title: "Today",
      meta: "Current farm checkpoint",
      kind: "today" as const,
    },
  ]
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(0, 12);

  return (
    <section className="panel-card">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="card-chip">Timeline</span>
          <h3 className="mt-2 text-xl font-semibold text-ink">Crop Calendar</h3>
          <p className="card-copy">
            Planted dates, harvest windows, and crop tasks in one scan.
          </p>
        </div>
        <span className="card-icon">
          <CalendarDays size={20} strokeWidth={2.2} />
        </span>
      </div>

      <div className="grid gap-3">
        {items.map((item) => {
          const Icon = getIcon(item.kind);

          return (
            <article
              key={item.id}
              className="rounded-2xl border border-surface-border bg-surface-soft p-4"
            >
              <div className="flex items-start gap-3">
                <span className="card-icon card-icon-soft">
                  <Icon size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <strong className="text-sm font-semibold text-ink">
                    {item.title}
                  </strong>
                  <p className="mt-1 text-sm text-ink-muted">
                    {formatDate(item.date)} · {item.meta}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
