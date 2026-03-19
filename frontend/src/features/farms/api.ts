import { api } from "../../api/client";
import type { Farm, FarmPayload } from "./types";

export const listFarms = async (): Promise<Farm[]> => {
  const response = await api.get<Farm[]>("/farms");
  return response.data;
};

export const createFarm = async (payload: FarmPayload): Promise<Farm> => {
  const response = await api.post<Farm>("/farms", payload);
  return response.data;
};
