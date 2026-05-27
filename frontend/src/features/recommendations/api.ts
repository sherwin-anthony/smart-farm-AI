import { api } from "../../api/client";

export const getRecommendations = async () => {
  // Backend derives the farm from the authenticated session, so no farm_id is sent.
  const response = await api.get<{ recommendations: string[] }>("/recommendations");
  return response.data;
};
