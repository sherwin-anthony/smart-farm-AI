import { api } from "../../api/client";
import type { Plot, PlotPayload } from "./types";

export const listPlots = async (): Promise<Plot[]> => {
  const response = await api.get<Plot[]>("/plots");
  return response.data;
};

export const createPlot = async (payload: PlotPayload): Promise<Plot> => {
  const response = await api.post<Plot>("/plots", payload);
  return response.data;
};
