import type { TaskPriority, TaskSource, TaskStatus, TaskType } from "./types";

type TaskOption<T extends string> = {
  value: T;
  label: string;
};

// Shared task workflow values used by the task form, list editor, and board filters.
export const TASK_TYPE_OPTIONS: TaskOption<TaskType>[] = [
  { value: "monitoring", label: "Monitoring" },
  { value: "watering", label: "Watering" },
  { value: "fertilizing", label: "Fertilizing" },
  { value: "spraying", label: "Spraying" },
  { value: "weeding", label: "Weeding" },
  { value: "harvesting", label: "Harvesting" },
  { value: "harvest", label: "Harvest" },
  { value: "irrigation_check", label: "Irrigation Check" },
  { value: "soil_check", label: "Soil Check" },
  { value: "pest_control", label: "Pest Control" },
  { value: "scouting", label: "Scouting" },
  { value: "maintenance", label: "Maintenance" },
  { value: "custom", label: "Custom" },
];

export const TASK_STATUS_OPTIONS: TaskOption<TaskStatus>[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const TASK_PRIORITY_OPTIONS: TaskOption<TaskPriority>[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const TASK_SOURCE_OPTIONS: TaskOption<TaskSource>[] = [
  { value: "manual", label: "Manual" },
  { value: "system", label: "System" },
  { value: "weather", label: "Weather" },
  { value: "ai", label: "AI" },
  { value: "auto_crop", label: "Auto Crop" },
];
