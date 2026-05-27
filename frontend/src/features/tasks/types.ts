import type { Crop } from "../crops/types";
import type { Plot } from "../plots/types";

export type TaskType =
  | "monitoring"
  | "watering"
  | "fertilizing"
  | "spraying"
  | "weeding"
  | "harvesting"
  | "harvest"
  | "irrigation_check"
  | "soil_check"
  | "pest_control"
  | "scouting"
  | "maintenance"
  | "custom";

export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskSource = "manual" | "system" | "weather" | "ai" | "auto_crop";

// Purpose: task records are crop-owned work items shown in /tasks and crop details.
export type Task = {
  id: number;
  farm_id: number | null;
  plot_id: number | null;
  crop_id: number | null;
  plot?: Plot | null;
  crop?: Crop | null;
  title: string;
  description: string | null;
  task_type: TaskType | string;
  priority: TaskPriority | string;
  due_on: string | null;
  status: TaskStatus | string;
  source: TaskSource | string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Purpose: manual task creation/editing only sends the writable fields to Laravel.
export type TaskPayload = {
  plot_id?: number | null;
  crop_id?: number | null;
  title: string;
  description?: string | null;
  task_type: TaskType | string;
  priority?: TaskPriority | string;
  due_on?: string | null;
  status?: TaskStatus | string;
  source?: TaskSource | string;
  notes?: string | null;
  completed_at?: string | null;
};
