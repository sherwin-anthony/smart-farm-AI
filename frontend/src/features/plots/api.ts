import { api } from "../../api/client";
import type { Plot, PlotPayload } from "./types";

const normalizePlot = (plot: Plot): Plot => ({
  ...plot,
  area_hectares:
    plot.area_hectares === null || plot.area_hectares === undefined
      ? null
      : Number(plot.area_hectares),
});

// Purpose: authenticated plot API calls for the /plots module.
export const listPlots = async (): Promise<Plot[]> => {
  const response = await api.get<Plot[]>("/plots");
  return response.data.map(normalizePlot);
};

export const createPlot = async (payload: PlotPayload): Promise<Plot> => {
  const response = await api.post<Plot>("/plots", payload);
  return normalizePlot(response.data);
};

export const updatePlot = async (id: number, payload: PlotPayload): Promise<Plot> => {
  const response = await api.put<Plot>(`/plots/${id}`, payload);
  return normalizePlot(response.data);
};

export const deletePlot = async (id: number): Promise<void> => {
  await api.delete(`/plots/${id}`);
};
