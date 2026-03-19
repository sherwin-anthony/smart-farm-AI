import api from "./axios";
import type { Crop, CreateCropPayload } from "../types/crop";

// Get all crops from Laravel.
export const getCrops = async (): Promise<Crop[]> => {
  const response = await api.get<Crop[]>("/crops");
  return response.data;
};

// Create one crop in Laravel.
export const createCrop = async (
  payload: CreateCropPayload
): Promise<Crop> => {
  const response = await api.post<Crop>("/crops", payload);
  return response.data;
};
