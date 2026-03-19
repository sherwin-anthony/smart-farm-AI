import { api } from "../../api/client";
import type { DashboardOverview } from "./types";

export const getDashboardOverview = async (): Promise<DashboardOverview> => {
  const response = await api.get<DashboardOverview>("/dashboard/overview");
  return response.data;
};
