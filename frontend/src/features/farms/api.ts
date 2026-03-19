import { api } from "../../api/client";
import type { Farm, FarmPayload } from "./types";

// Purpose: Farms module API calls.
// Routing:
// listFarms   -> GET    /api/farms
// createFarm  -> POST   /api/farms
// deleteFarm  -> DELETE /api/farms/{id}
export const listFarms = async (): Promise<Farm[]> => {
  const response = await api.get<Farm[]>("/farms");
  return response.data;
};

export const createFarm = async (payload: FarmPayload): Promise<Farm> => {
  const response = await api.post<Farm>("/farms", payload);
  return response.data;
};

export const deleteFarm = async (id: number): Promise<void> => {
  await api.delete(`/farms/${id}`);
};
