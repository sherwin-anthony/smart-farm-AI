import { api } from "../../api/client";
import type {
  RecommendationItem,
  RecommendationsResponse,
  RecommendationTaskResponse,
} from "./types";

type LegacyRecommendationsResponse = {
  recommendations?: string[];
  items?: RecommendationItem[];
};

const itemFromMessage = (message: string, index: number): RecommendationItem => ({
  key: `legacy.${index}.${message}`,
  title: `Recommendation ${index + 1}`,
  message,
  source: "system",
  priority: index === 0 ? "medium" : "low",
  category: "general",
  related_type: "farm",
  related_id: null,
  related_label: null,
  action_label: null,
  action_href: null,
  can_create_task: false,
});

export const getRecommendations = async (): Promise<RecommendationsResponse> => {
  // Backend derives the farm from the authenticated session, so no farm_id is sent.
  const response = await api.get<LegacyRecommendationsResponse>("/recommendations");
  const recommendations = response.data.recommendations ?? [];

  return {
    recommendations,
    items: response.data.items?.length
      ? response.data.items
      : recommendations.map(itemFromMessage),
  };
};

export const createRecommendationTask = async (
  key: string
): Promise<RecommendationTaskResponse> => {
  const response = await api.post<RecommendationTaskResponse>("/recommendations/tasks", { key });
  return response.data;
};
