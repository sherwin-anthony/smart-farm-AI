export type DashboardTone = "danger" | "warning" | "success" | "info" | "muted" | string;

export type DashboardFarm = {
  id: number;
  name: string;
  location: string | null;
  has_coordinates: boolean;
};

export type DashboardPriority = {
  title: string;
  message: string;
  tone: DashboardTone;
  source: string;
  action_label: string | null;
  action_href: string | null;
};

export type DashboardTaskItem = {
  id: number;
  title: string;
  priority: string;
  status: string;
  due_on: string | null;
  task_type: string;
  source: string;
  crop_name: string | null;
  plot_name: string | null;
};

export type DashboardCropItem = {
  id: number;
  name: string;
  status: string;
  growth_stage: string;
  expected_harvest_on: string | null;
  plot_name: string | null;
  href: string;
};

export type DashboardTaskSummary = {
  open: number;
  pending: number;
  in_progress: number;
  due_today: number;
  overdue: number;
  due_today_items: DashboardTaskItem[];
  overdue_items: DashboardTaskItem[];
  next_items: DashboardTaskItem[];
};

export type DashboardCropSummary = {
  growing: number;
  ready: number;
  near_harvest: number;
  ready_items: DashboardCropItem[];
  near_harvest_items: DashboardCropItem[];
};

export type DashboardWeatherSummary = {
  current_summary: string | null;
  current_temperature_c: number | null;
  impact_count: number;
  highest_severity: "low" | "medium" | "high" | null;
  headline: string;
  action: string;
  last_updated: string | null;
  action_href: string;
};

export type DashboardRecommendation = {
  key: string;
  title: string;
  message: string;
  source: string;
  priority: string;
  action_label: string | null;
  action_href: string | null;
  can_create_task: boolean;
};

export type DashboardYieldLatest = {
  id: number;
  crop_name: string | null;
  plot_name: string | null;
  predicted_yield_kg: number;
  actual_yield_kg: number | null;
  prediction_status: string;
  predicted_on: string | null;
  harvested_on: string | null;
};

export type DashboardYieldSummary = {
  record_count: number;
  harvested_count: number;
  predicted_total_kg: number;
  actual_total_kg: number;
  performance_label: string;
  latest: DashboardYieldLatest | null;
};

export type DashboardOverview = {
  farm: DashboardFarm;
  priority: DashboardPriority;
  total_crops: number;
  active_crops: number;
  ready_to_harvest: number;
  pending_tasks: number;
  due_today_tasks: number;
  overdue_tasks: number;
  latest_prediction: unknown;
  task_summary: DashboardTaskSummary;
  crop_summary: DashboardCropSummary;
  weather: DashboardWeatherSummary;
  recommendations: DashboardRecommendation[];
  yield: DashboardYieldSummary;
};
