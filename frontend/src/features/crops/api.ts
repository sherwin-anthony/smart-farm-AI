import { api } from "../../api/client";
import type { Crop, CropPayload } from "./types";

type CropResponse = Omit<Crop, "plot_id" | "plot"> & {
  plot_id: number | string;
  plot?: Crop["plot"];
};

const normalizeCrop = (crop: CropResponse): Crop => ({
  ...crop,
  // Normalize ids and relations so the crop page can rely on one stable shape.
  plot_id: Number(crop.plot_id),
  plot: crop.plot ?? null,
});

// Purpose: authenticated crop API calls for the /crops module.
export const listCrops = async (): Promise<Crop[]> => {
  const response = await api.get<CropResponse[]>("/crops");
  return response.data.map(normalizeCrop);
};

// Purpose: fetch one crop for the full /crops/:id workspace.
export const getCrop = async (id: number): Promise<Crop> => {
  const response = await api.get<CropResponse>(`/crops/${id}`);
  return normalizeCrop(response.data);
};

// Purpose: create one crop inside the authenticated farm through a selected plot.
export const createCrop = async (payload: CropPayload): Promise<Crop> => {
  const response = await api.post<CropResponse>("/crops", payload);
  return normalizeCrop(response.data);
};

// Purpose: update one crop while keeping the response shape aligned with the active crop contract.
export const updateCrop = async (id: number, payload: CropPayload): Promise<Crop> => {
  const response = await api.put<CropResponse>(`/crops/${id}`, payload);
  return normalizeCrop(response.data);
};

// Purpose: remove one crop from the authenticated farm workspace.
export const deleteCrop = async (id: number): Promise<void> => {
  await api.delete(`/crops/${id}`);
};
