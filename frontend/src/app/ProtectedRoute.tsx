import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "../components/ui/Loader";
import { useAuth } from "../features/auth/AuthContext";

// Purpose: protect private pages like dashboard and farm profile.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
