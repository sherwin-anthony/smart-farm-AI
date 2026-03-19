import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import AssistantPage from "../pages/AssistantPage";
import CropsPage from "../pages/CropsPage";
import DashboardPage from "../pages/DashboardPage";
import FarmsPage from "../pages/FarmsPage";
import NotFoundPage from "../pages/NotFoundPage";
import PlotsPage from "../pages/PlotsPage";
import RecommendationsPage from "../pages/RecommendationsPage";
import TasksPage from "../pages/TasksPage";
import WeatherPage from "../pages/WeatherPage";
import YieldPredictionsPage from "../pages/YieldPredictionsPage";

// Frontend route map for the SmartFarm AI dashboard.
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "farms", element: <FarmsPage /> },
      { path: "plots", element: <PlotsPage /> },
      { path: "crops", element: <CropsPage /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "weather", element: <WeatherPage /> },
      { path: "recommendations", element: <RecommendationsPage /> },
      { path: "yield-predictions", element: <YieldPredictionsPage /> },
      { path: "assistant", element: <AssistantPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
