import { api } from "../../api/client";
import type { Farm, FarmPayload } from "./types";

type FarmResponse = Omit<Farm, "latitude" | "longitude" | "size_hectares"> & {
  latitude?: number | string | null;
  longitude?: number | string | null;
  size_hectares?: number | string | null;
};

const normalizeNullableNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return Number(value);
};

const normalizeFarm = (farm: FarmResponse): Farm => ({
  ...farm,
  latitude: normalizeNullableNumber(farm.latitude),
  longitude: normalizeNullableNumber(farm.longitude),
  size_hectares: normalizeNullableNumber(farm.size_hectares),
});

// Purpose: farm API helpers for account settings and any legacy farm CRUD flows.
// Routing:
// getCurrentFarm   -> GET /api/farm
// updateCurrentFarm -> PUT /api/farm
export const listFarms = async (): Promise<Farm[]> => {
  const response = await api.get<FarmResponse[]>("/farms");
  return response.data.map(normalizeFarm);
};

export const createFarm = async (payload: FarmPayload): Promise<Farm> => {
  const response = await api.post<FarmResponse>("/farms", payload);
  return normalizeFarm(response.data);
};

export const updateFarm = async (id: number, payload: FarmPayload): Promise<Farm> => {
  const response = await api.put<FarmResponse>(`/farms/${id}`, payload);
  return normalizeFarm(response.data);
};

export const deleteFarm = async (id: number): Promise<void> => {
  await api.delete(`/farms/${id}`);
};

export const getCurrentFarm = async (): Promise<Farm> => {
  const response = await api.get<FarmResponse>("/farm");
  return normalizeFarm(response.data);
};

export const updateCurrentFarm = async (
  payload: Pick<FarmPayload, "location" | "latitude" | "longitude" | "size_hectares" | "notes">
): Promise<Farm> => {
  const response = await api.put<FarmResponse>("/farm", payload);
  return normalizeFarm(response.data);
};
