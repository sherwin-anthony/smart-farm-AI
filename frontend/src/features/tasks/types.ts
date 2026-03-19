export type Task = {
  id: number;
  crop_id: number;
  title: string;
  task_type: string;
  due_on: string | null;
  status: string;
  source: string;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskPayload = Omit<Task, "id" | "created_at" | "updated_at">;
