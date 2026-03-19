import { api } from "../../api/client";
import type { Crop, CropPayload } from "./types";

export const listCrops = async (): Promise<Crop[]> => {
  const response = await api.get<Crop[]>("/crops");
  return response.data;
};

export const createCrop = async (payload: CropPayload): Promise<Crop> => {
  const response = await api.post<Crop>("/crops", payload);
  return response.data;
};
