import { createBrowserRouter } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import ProtectedRoute from "./ProtectedRoute";
import AssistantPage from "../pages/AssistantPage";
import CropsPage from "../pages/CropsPage";
import DashboardPage from "../pages/DashboardPage";
import FarmProfilePage from "../pages/FarmProfilePage";
import FarmsPage from "../pages/FarmsPage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import PlotsPage from "../pages/PlotsPage";
import RecommendationsPage from "../pages/RecommendationsPage";
import RegisterPage from "../pages/RegisterPage";
import TasksPage from "../pages/TasksPage";
import WeatherPage from "../pages/WeatherPage";
import YieldPredictionsPage from "../pages/YieldPredictionsPage";

// Frontend route map for the SmartFarm AI dashboard.
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "dashboard", element: <DashboardPage /> },
          { path: "profile", element: <FarmProfilePage /> },
          { path: "farm-profile", element: <FarmProfilePage /> },
          { path: "farms", element: <FarmsPage /> },
          { path: "plots", element: <PlotsPage /> },
          { path: "crops", element: <CropsPage /> },
          { path: "tasks", element: <TasksPage /> },
          { path: "weather", element: <WeatherPage /> },
          { path: "recommendations", element: <RecommendationsPage /> },
          { path: "yield-predictions", element: <YieldPredictionsPage /> },
          { path: "assistant", element: <AssistantPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
