import type { Crop } from "../crops/types";

// Purpose: task records are crop-owned work items shown in /tasks and crop details.
export type Task = {
  id: number;
  crop_id: number;
  crop?: Crop | null;
  title: string;
  task_type: string;
  due_on: string | null;
  status: "pending" | "completed" | string;
  source: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

// Purpose: manual task creation/editing only sends the writable fields to Laravel.
export type TaskPayload = {
  crop_id: number;
  title: string;
  task_type: string;
  due_on?: string | null;
  status?: string;
  source?: string;
  notes?: string | null;
  completed_at?: string | null;
};
