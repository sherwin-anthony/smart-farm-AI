export type RecommendationPriority = "low" | "medium" | "high" | "urgent";

export type RecommendationItem = {
  key: string;
  title: string;
  message: string;
  source: "weather" | "crop" | "task" | "plot" | "profile" | "system" | string;
  priority: RecommendationPriority | string;
  category: string;
  related_type: "farm" | "crop" | "plot" | "task" | string;
  related_id: number | null;
  related_label: string | null;
  action_label: string | null;
  action_href: string | null;
  can_create_task: boolean;
};

export type RecommendationsResponse = {
  recommendations: string[];
  items: RecommendationItem[];
};

export type RecommendationTaskResponse = {
  created: boolean;
  message: string;
  task: unknown | null;
};
