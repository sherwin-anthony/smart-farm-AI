import { api } from "../../api/client";
import type { Task, TaskPayload } from "./types";

type TaskResponse = Omit<Task, "farm_id" | "plot_id" | "crop_id"> & {
  farm_id?: number | string | null;
  plot_id?: number | string | null;
  crop_id?: number | string | null;
};

const normalizeOptionalId = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
};

const normalizeTask = (task: TaskResponse): Task => ({
  ...task,
  farm_id: normalizeOptionalId(task.farm_id),
  plot_id: normalizeOptionalId(task.plot_id),
  crop_id: normalizeOptionalId(task.crop_id),
  plot: task.plot ?? null,
  crop: task.crop ?? null,
});

export const listTasks = async (): Promise<Task[]> => {
  const response = await api.get<TaskResponse[]>("/tasks");
  return response.data.map(normalizeTask);
};

export const createTask = async (payload: TaskPayload): Promise<Task> => {
  const response = await api.post<TaskResponse>("/tasks", payload);
  return normalizeTask(response.data);
};

export const updateTask = async (
  id: number,
  payload: Partial<TaskPayload>
): Promise<Task> => {
  // Route: PATCH /tasks/{id}; used for quick completion and lightweight edits.
  const response = await api.patch<TaskResponse>(`/tasks/${id}`, payload);
  return normalizeTask(response.data);
};

export const deleteTask = async (id: number): Promise<void> => {
  await api.delete(`/tasks/${id}`);
};
