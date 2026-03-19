import { api } from "../../api/client";
import type { Task, TaskPayload } from "./types";

export const listTasks = async (): Promise<Task[]> => {
  const response = await api.get<Task[]>("/tasks");
  return response.data;
};

export const createTask = async (payload: TaskPayload): Promise<Task> => {
  const response = await api.post<Task>("/tasks", payload);
  return response.data;
};
