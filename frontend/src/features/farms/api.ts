import { api } from "../../api/client";
import type { Farm, FarmPayload } from "./types";

// Purpose: farm API helpers for account settings and any legacy farm CRUD flows.
// Routing:
// getCurrentFarm   -> GET /api/farm
// updateCurrentFarm -> PUT /api/farm
export const listFarms = async (): Promise<Farm[]> => {
  const response = await api.get<Farm[]>("/farms");
  return response.data;
};

export const createFarm = async (payload: FarmPayload): Promise<Farm> => {
  const response = await api.post<Farm>("/farms", payload);
  return response.data;
};

export const updateFarm = async (id: number, payload: FarmPayload): Promise<Farm> => {
  const response = await api.put<Farm>(`/farms/${id}`, payload);
  return response.data;
};

export const deleteFarm = async (id: number): Promise<void> => {
  await api.delete(`/farms/${id}`);
};

export const getCurrentFarm = async (): Promise<Farm> => {
  const response = await api.get<Farm>("/farm");
  return response.data;
};

export const updateCurrentFarm = async (
  payload: Pick<FarmPayload, "location" | "size_hectares" | "notes">
): Promise<Farm> => {
  const response = await api.put<Farm>("/farm", payload);
  return response.data;
};
