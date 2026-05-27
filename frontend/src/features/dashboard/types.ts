export type DashboardWeatherSummary = {
  current_summary: string | null;
  current_temperature_c: number | null;
  impact_count: number;
  highest_severity: "low" | "medium" | "high" | null;
  headline: string;
  action: string;
  last_updated: string | null;
};

export type DashboardOverview = {
  total_crops: number;
  active_crops: number;
  ready_to_harvest: number;
  pending_tasks: number;
  latest_prediction: unknown;
  weather: DashboardWeatherSummary;
};
