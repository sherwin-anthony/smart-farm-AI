import { api } from "../../api/client";

export const getRecommendations = async (farmId: number) => {
  const response = await api.get<{ recommendations: string[] }>("/recommendations", {
    params: { farm_id: farmId },
  });
  return response.data;
};
